import sys
import json
import numpy as np
from scipy import stats
from scipy.io import loadmat
from nptdms import TdmsFile  # ADDED for TDMS

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.ndarray, np.generic)): return obj.tolist()
        if isinstance(obj, (np.float64, np.float32)): return float(obj)
        return obj

def extract_nested_data(data):
    """Recursively finds the numeric array in nested MATLAB objects"""
    try:
        # Handles the 'values' structure seen in your error
        if hasattr(data, 'dtype') and data.dtype.names is not None:
            if 'values' in data.dtype.names: return extract_nested_data(data['values'][0, 0])
            if 'y_values' in data.dtype.names: return extract_nested_data(data['y_values'][0, 0])
        
        # Handles object arrays
        if isinstance(data, np.ndarray) and data.dtype == 'O':
            return extract_nested_data(data.flatten()[0])
            
        # Converts the final found data to a float array
        final_array = np.array(data).flatten().astype(float)
        if final_array.size > 0:
            return final_array
    except:
        pass
    return None

def process_mat(file_path):
    mat = loadmat(file_path)
    # Added: Search for temperature in .mat keys
    calc_temp = 27.5
    for key in mat:
        if 'temp' in key.lower():
            t_data = extract_nested_data(mat[key])
            if t_data is not None: calc_temp = np.mean(t_data)

    for key in mat:
        if not key.startswith('__'):
            signal = extract_nested_data(mat[key])
            if signal is not None and signal.size > 100:
                # Return both the signal and the temperature
                return signal[np.isfinite(signal)], calc_temp
    raise ValueError("Vibration data structure not recognized.")

def process_tdms(file_path):
    """SCANS TDMS channels and reports names if search fails"""
    tdms_file = TdmsFile.read(file_path)
    
    # Get all groups - hardware usually puts data in the first or second group
    all_groups = tdms_file.groups()
    if not all_groups:
        raise ValueError("The TDMS file is empty (no groups found).")

    vib_signal = None
    calc_temp = 27.5
    found_channel_names = []

    # Search through EVERY group and EVERY channel
    for group in all_groups:
        for channel in group.channels():
            name = channel.name.lower()
            found_channel_names.append(f"{group.name}/{channel.name}")
            
            # Look for Vibration: Module 2
            if 'mod2' in name and ('ai0' in name or 'ai2' in name):
                data = channel.data
                if data.size > 0:
                    vib_signal = data[np.isfinite(data)]
            
            # Look for Temp: Module 1
            elif 'mod1' in name and 'ai0' in name:
                temp_data = channel.data
                if temp_data.size > 0:
                    calc_temp = np.mean(temp_data)

    # If we still have nothing, let's see what the hardware actually named them
    if vib_signal is None:
        error_msg = f"No 'Mod2' data. Found channels: {', '.join(found_channel_names[:5])}"
        raise ValueError(error_msg)

    return vib_signal, calc_temp

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    try:
        # Step 1: Get raw signal and temp based on file type
        if file_path.lower().endswith('.tdms'):
            raw_sig, calc_temp = process_tdms(file_path)
        else:
            raw_sig, calc_temp = process_mat(file_path)

        # Step 2: Apply the 🚀 X1000 SCALE (Identical for both types)
        sig = raw_sig * 1000

        # Step 3: Mathematical Feature Extraction
        calc_rms = np.sqrt(np.mean(sig**2))
        calc_kurt = stats.kurtosis(sig, fisher=False)
        calc_skew = stats.skew(sig)
        calc_peak = np.max(np.abs(sig))

        # Step 4: Status Logic (Threshold 500)
        status = 1 if calc_rms > 500 else 0 

        output = {
            "RMS": round(calc_rms, 4),
            "Kurtosis": round(calc_kurt, 4),
            "Skewness": round(calc_skew, 4),
            "Peak_Amplitude": round(calc_peak, 4),
            "Temperature": round(calc_temp, 2), 
            "Status": status
        }
        print(json.dumps(output, cls=NumpyEncoder))
    except Exception as e:
        # This sends the error message back to your React DropZone
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()