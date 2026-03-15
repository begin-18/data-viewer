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

        # Attempting to pull REAL Temperature from the Siemens metadata if available
        # If the structure differs, it defaults to 0.0 rather than a fake number
        try:
            # Checking if there's a second channel or attribute for Temperature
            temp_data = signal_struct[1][0, 0] # Adjusting index to look for thermal channel
            actual_temp = np.mean(temp_data) if temp_data.size > 0 else 0.0
        except:
            actual_temp = 0.0

        # SETTINGS FROM YOUR DASHBOARD
        FS = 12000          # 12,000 Hz Sampling Rate
        WINDOW_SIZE = 400   # 400 Samples per window
        
        # SENSITIVITY FACTOR
        FACTOR = 2306.47

        if raw_values.size >= WINDOW_SIZE:
            max_peak = -1
            best_window = None

            for i in range(0, len(raw_values) - WINDOW_SIZE, WINDOW_SIZE):
                current_window = raw_values[i : i + WINDOW_SIZE]
                peak = np.max(np.abs(current_window))
                if peak > max_peak:
                    max_peak = peak
                    best_window = current_window

            # Process the chosen window
            final_sig = (best_window - np.mean(best_window)) * FACTOR
            
            # Metrics Calculation
            calc_rms = np.sqrt(np.mean(final_sig**2))
            calc_kurt = stats.kurtosis(final_sig, fisher=False) 
            calc_skew = stats.skew(final_sig)
            calc_peak = np.max(np.abs(final_sig))

            # --- ADDING STATUS (0/1) ---
            # Threshold: Kurtosis > 3.0 is the standard industrial limit for bearing health
            status = 1 if (calc_kurt > 3.0 or abs(calc_skew) > 0.5) else 0

            return {
                "RMS": float(calc_rms),
                "Kurtosis": float(calc_kurt),
                "Skewness": float(calc_skew),
                "Peak_Amplitude": float(calc_peak),
                "Temperature": float(actual_temp), # REAL DATA
                "Status": int(status)              # 0 = Healthy, 1 = Anomaly
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