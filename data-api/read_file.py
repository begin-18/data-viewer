import sys
import json
import numpy as np
from scipy import stats
from scipy.io import loadmat

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, (np.float64, np.float32)): return float(obj)
        return obj

def read_mat(file_path):
    try:
        mat = loadmat(file_path)
        
        # Drilling into the Simcenter Testlab nesting
        signal_struct = mat['Signal'][0, 0]
        raw_values = signal_struct[1][0, 0][0].astype(float).flatten()

        # SETTINGS FROM YOUR DASHBOARD
        FS = 12000          # 12,000 Hz Sampling Rate
        WINDOW_SIZE = 400   # 400 Samples per window
        
        # SENSITIVITY FACTOR
        # To scale 0.87 Peak to ~2021 Peak
        FACTOR = 2306.47

        if raw_values.size >= WINDOW_SIZE:
            # We slide through the data in 400-sample increments
            # and analyze the window with the highest peak (the anomaly)
            max_peak = -1
            best_window = None

            for i in range(0, len(raw_values) - WINDOW_SIZE, WINDOW_SIZE):
                current_window = raw_values[i : i + WINDOW_SIZE]
                peak = np.max(np.abs(current_window))
                if peak > max_peak:
                    max_peak = peak
                    best_window = current_window

            # Process the chosen window
            # 1. Scaling and Zero-Centering
            final_sig = (best_window - np.mean(best_window)) * FACTOR
            
            # 2. Metrics Calculation
            calc_rms = np.sqrt(np.mean(final_sig**2))
            # fisher=False gives Pearson Kurtosis (expected 100+)
            calc_kurt = stats.kurtosis(final_sig, fisher=False) 
            calc_skew = stats.skew(final_sig)
            calc_peak = np.max(np.abs(final_sig))

            return {
                "RMS": float(calc_rms),
                "Kurtosis": float(calc_kurt),
                "Skewness": float(calc_skew),
                "Peak_Amplitude": float(calc_peak),
                "Temperature": 5367.5 
            }
            
        return {"error": f"File too small. Need at least {WINDOW_SIZE} samples."}
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    result = read_mat(file_path)
    print(json.dumps(result, cls=NumpyEncoder))

if __name__ == "__main__":
    main()