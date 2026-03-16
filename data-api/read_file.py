import sys
import json
import os
import numpy as np

# --- EMERGENCY FIX FOR NUMPY 2.0 / PYTHON 3.14 ---
if not hasattr(np, 'bool8'):
    np.bool8 = np.bool_
# ------------------------------------------------

from scipy import stats
from scipy.io import loadmat
from nptdms import TdmsFile

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, (np.float64, np.float32)): return float(obj)
        return obj

def process_tdms(file_path):
    """Processes NI FlexLogger TDMS files"""
    tdms_file = TdmsFile.read(file_path)
    group = tdms_file['Log']
    
    # Updated to match your working Colab mapping
    vibration_raw = group['cDAQ9185-1F486B5Mod1/ai0'].data
    temp_raw = group['cDAQ9185-1F486B5Mod1/ai1'].data
    acoustic_raw = group['cDAQ9185-1F486B5Mod2/ai0'].data
    
    return vibration_raw, np.mean(temp_raw), 1.0, acoustic_raw

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
        
    return raw_values, actual_temp, 2306.47, raw_values 

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    ext = os.path.splitext(file_path)[1].lower()

    try:
        if ext == '.tdms':
            raw_signal, temperature, factor, secondary_signal = process_tdms(file_path)
        elif ext == '.mat':
            raw_signal, temperature, factor, secondary_signal = process_mat(file_path)
        else:
            print(json.dumps({"error": f"Unsupported extension: {ext}"}))
            return

        # --- WINDOWING LOGIC ---
        WINDOW_SIZE = 400
        if raw_signal.size < WINDOW_SIZE:
            print(json.dumps({"error": "Data too short"}))
            return

        # Find best window (highest peak)
        max_peak = -1
        best_window = raw_signal[0:WINDOW_SIZE]
        for i in range(0, len(raw_signal) - WINDOW_SIZE, WINDOW_SIZE):
            current_window = raw_signal[i : i + WINDOW_SIZE]
            peak = np.max(np.abs(current_window))
            if peak > max_peak:
                max_peak = peak
                best_window = current_window

        # Process chosen window
        final_sig = (best_window - np.mean(best_window)) * factor

        # Stats
        calc_rms = np.sqrt(np.mean(final_sig**2))
        calc_kurt = stats.kurtosis(final_sig, fisher=False) 
        calc_skew = stats.skew(final_sig)
        
        # Using the specific secondary signal (acoustic) for peak as per Colab
        calc_peak = np.max(np.abs(secondary_signal))

        # Status Logic (Updated to > 50 to match your Colab test)
        status = 1 if calc_rms > 50 else 0

        print(json.dumps({
            "RMS": float(calc_rms),
            "Kurtosis": float(calc_kurt),
            "Skewness": float(calc_skew),
            "Peak_Amplitude": float(calc_peak),
            "Temperature": float(temperature),
            "Status": int(status)
        }, cls=NumpyEncoder))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()