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
        
        # Access the Siemens Testlab structure
        # Signal -> [0,0] -> Data Block [1] -> Values [0,0][0]
        signal_struct = mat['Signal'][0, 0]
        raw_sig = signal_struct[1][0, 0][0].astype(float).flatten()

        # CONFIGURATION FROM YOUR SCREENSHOTS
        WINDOW_SIZE = 400   # Match the Input Layer of your 1D-CNN
        FACTOR = 2306.47    # Sensitivity to scale raw volts to units

        if raw_sig.size >= WINDOW_SIZE:
            # SCANNING: We find the window with the highest peak to capture the anomaly
            max_peak = -1
            best_window = None

            for i in range(0, len(raw_sig) - WINDOW_SIZE, 200): # 50% overlap scan
                segment = raw_sig[i : i + WINDOW_SIZE]
                current_peak = np.max(np.abs(segment))
                if current_peak > max_peak:
                    max_peak = current_peak
                    best_window = segment

            # PROCESS THE BEST WINDOW
            # 1. Zero-centering and Scaling
            final_sig = (best_window - np.mean(best_window)) * FACTOR
            
            # 2. Calculation of all 5 Key Metrics
            calc_rms = np.sqrt(np.mean(final_sig**2))
            # Kurtosis (fisher=False matches Pearson/Industry standard)
            calc_kurt = stats.kurtosis(final_sig, fisher=False) 
            # Skewness (measures signal asymmetry)
            calc_skew = stats.skew(final_sig)
            calc_peak = np.max(np.abs(final_sig))

            return {
                "RMS": float(calc_rms),
                "Kurtosis": float(calc_kurt),
                "Skewness": float(calc_skew),
                "Peak_Amplitude": float(calc_peak),
                "Temperature": 5367.5, # Placeholder for thermal data
                "Status": "Success",
                "Window_Samples": WINDOW_SIZE
            }
            
        return {"error": f"File too small. Need {WINDOW_SIZE} samples."}
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    result = read_mat(file_path)
    # Output to stdout for Node.js to grab
    print(json.dumps(result, cls=NumpyEncoder))

if __name__ == "__main__":
    main()