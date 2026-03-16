import sys
import json
import os
import numpy as np

# --- EMERGENCY FIX FOR NUMPY 2.0 / PYTHON 3.14 ---
# This ensures nptdms doesn't crash on the latest Python versions
if not hasattr(np, 'bool8'):
    np.bool8 = np.bool_
# ------------------------------------------------

from scipy import stats
from scipy.io import loadmat
from nptdms import TdmsFile

class NumpyEncoder(json.JSONEncoder):
    """Custom encoder to handle NumPy types for JSON conversion"""
    def default(self, obj):
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, (np.float64, np.float32)): return float(obj)
        return obj

def process_tdms(file_path):
    """Processes NI FlexLogger TDMS files using dynamic channel searching"""
    tdms_file = TdmsFile.read(file_path)
    
    # FlexLogger typically uses 'Log' as the group name.
    # We try 'Log' first, but fall back to the first group if it's named differently.
    if 'Log' in tdms_file:
        group = tdms_file['Log']
    else:
        group = tdms_file.groups()[0]
    
    vibration_raw = None
    temp_raw = None

    # Search channels by suffix (ai0 for Vibration, ai1 for Temperature)
    # This avoids hardcoding cDAQ serial numbers like '1F486B5'
    for channel in group.channels():
        if channel.name.endswith('ai0'):
            vibration_raw = channel.data
        elif channel.name.endswith('ai1'):
            temp_raw = channel.data

    # Error handling if the specific sensors aren't found
    if vibration_raw is None or temp_raw is None:
        available = [c.name for c in group.channels()]
        raise Exception(f"Channels not found. Available in this file: {available}")
    
    # Return raw signal, mean temperature, and a conversion factor (1.0 for TDMS)
    return vibration_raw, np.mean(temp_raw), 1.0 

def process_mat(file_path):
    """Processes Siemens Simcenter .mat files"""
    mat = loadmat(file_path)
    signal_struct = mat['Signal'][0, 0]
    raw_values = signal_struct[1][0, 0][0].astype(float).flatten()
    
    try:
        temp_data = signal_struct[1][0, 0]
        actual_temp = np.mean(temp_data) if temp_data.size > 0 else 0.0
    except:
        actual_temp = 0.0
        
    # Standard conversion factor for your Siemens dataset
    return raw_values, actual_temp, 2306.47 

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    ext = os.path.splitext(file_path)[1].lower()

    try:
        if ext == '.tdms':
            raw_signal, temperature, factor = process_tdms(file_path)
        elif ext == '.mat':
            raw_signal, temperature, factor = process_mat(file_path)
        else:
            print(json.dumps({"error": f"Unsupported extension: {ext}"}))
            return

        # --- SIGNAL PROCESSING / WINDOWING ---
        WINDOW_SIZE = 400
        if raw_signal.size < WINDOW_SIZE:
            print(json.dumps({"error": "Data too short for processing"}))
            return

        # Find the window with the highest energy (peak amplitude)
        max_peak = -1
        best_window = raw_signal[0:WINDOW_SIZE]
        for i in range(0, len(raw_signal) - WINDOW_SIZE, WINDOW_SIZE):
            current_window = raw_signal[i : i + WINDOW_SIZE]
            peak = np.max(np.abs(current_window))
            if peak > max_peak:
                max_peak = peak
                best_window = current_window

        # Remove DC offset and apply scaling factor
        final_sig = (best_window - np.mean(best_window)) * factor

        # Feature Extraction
        calc_rms = np.sqrt(np.mean(final_sig**2))
        calc_kurt = stats.kurtosis(final_sig, fisher=False) 
        calc_skew = stats.skew(final_sig)
        calc_peak = np.max(np.abs(final_sig))

        # Simple Anomaly Logic for the demo
        status = 1 if (calc_kurt > 3.5 or abs(calc_skew) > 0.6) else 0

        # Output result as JSON for server.js to catch
        print(json.dumps({
            "RMS": float(calc_rms),
            "Kurtosis": float(calc_kurt),
            "Skewness": float(calc_skew),
            "Peak_Amplitude": float(calc_peak),
            "Temperature": float(temperature),
            "Status": int(status)
        }, cls=NumpyEncoder))

    except Exception as e:
        # If anything fails, return the error message
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()