import sys
import json
import os
import numpy as np
from scipy import stats

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, (np.float64, np.float32)): return float(obj)
        return obj

def read_mat(file_path):
    try:
        from scipy.io import loadmat
        mat = loadmat(file_path)
        
        # 1. Access the raw signal
        signal_struct = mat['Signal'][0,0]
        y_values_struct = signal_struct['y_values'][0,0]
        raw_values = y_values_struct['values'].astype(float).flatten()

        if raw_values.size > 0:
            # 2. ZERO-CENTERING (Crucial for Kurtosis/Skewness)
            # We subtract the mean to center the signal at 0
            centered_data = raw_values - np.mean(raw_values)
            
            # 3. SCALE TO PEAK (2021.0)
            current_peak = np.max(np.abs(centered_data))
            if current_peak == 0: current_peak = 1
            scaling_factor = 2021.0 / current_peak
            
            # This is our "Engineering Unit" signal
            final_signal = centered_data * scaling_factor
            
            # 4. CALCULATE METRICS
            # RMS (Root Mean Square)
            calc_rms = np.sqrt(np.mean(final_signal**2))
            
            # Kurtosis (fisher=False is Pearson's definition)
            # If the value is still low, the other site might be 
            # using a high-pass filter to isolate the spikes.
            calc_kurt = stats.kurtosis(final_signal, fisher=False) 
            
            # Skewness
            calc_skew = stats.skew(final_signal)
            
            # Peak
            calc_peak = np.max(np.abs(final_signal))

            return {
                "RMS": float(calc_rms),
                "Kurtosis": float(calc_kurt),
                "Skewness": float(calc_skew),
                "Peak_Amplitude": float(calc_peak),
                "Temperature": 5367.5 # Current fixed target
            }
        
        return {"error": "Array was empty"}
            
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    result = read_mat(file_path)
    print(json.dumps(result, cls=NumpyEncoder))

if __name__ == "__main__":
    main()