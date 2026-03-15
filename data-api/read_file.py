import sys
import json
import os
import numpy as np
from scipy import stats

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return float(obj) if isinstance(obj, (np.float64, np.float32)) else obj

def read_mat(file_path):
    try:
        from scipy.io import loadmat
        mat_data = loadmat(file_path)
        
        # Target the 'Signal' variable
        if 'Signal' not in mat_data:
            return {"RMS": "Error: 'Signal' not found", "Kurtosis": 0, "Skewness": 0, "Peak_Amplitude": 0, "Temperature": 0}

        raw_data = mat_data['Signal']
        
        # If Signal is 2D (rows and columns), we need to pick the right data
        if len(raw_data.shape) > 1 and raw_data.shape[1] > 1:
            # Let's try to use the first column (index 0)
            # Many datasets put Vibration in Col 0 and Acoustic in Col 1
            sig = raw_data[:, 0].flatten()
        else:
            sig = raw_data.flatten()

        # Check if the signal is actually populated
        if np.all(sig == 0):
            return {"RMS": "Error: Signal is all zeros", "Kurtosis": 0, "Skewness": 0, "Peak_Amplitude": 0, "Temperature": 0}

        return {
            "RMS": float(np.sqrt(np.mean(sig**2))),
            "Kurtosis": float(stats.kurtosis(sig)),
            "Skewness": float(stats.skew(sig)),
            "Peak_Amplitude": float(np.max(np.abs(sig))),
            "Temperature": float(np.mean(raw_data[:, -1])) if raw_data.ndim > 1 else 25.0
        }
            
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    result = read_mat(file_path)
    print(json.dumps(result, cls=NumpyEncoder))

if __name__ == "__main__":
    main()