import sys
import json
import os
import numpy as np
from scipy import stats

# Ensures NumPy numbers are converted to standard JSON numbers
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.float64, np.float32)):
            return float(obj)
        return obj

def read_mat(file_path):
    try:
        from scipy.io import loadmat
        mat_data = loadmat(file_path)
        
        # 1. Find the variable containing the most data
        raw_signal = None
        # Check 'Signal' first as we discovered earlier
        if 'Signal' in mat_data:
            raw_signal = mat_data['Signal']
        else:
            # Fallback: Find the largest array
            for k, v in mat_data.items():
                if not k.startswith('__') and isinstance(v, np.ndarray):
                    if raw_signal is None or v.size > raw_signal.size:
                        raw_signal = v

        if raw_signal is not None and raw_signal.size > 0:
            # Flatten to 1D and convert to float
            sig = np.asanyarray(raw_signal).astype(float).flatten()
            # Remove any non-finite numbers (NaN/Inf)
            sig = sig[np.isfinite(sig)]

            if sig.size == 0:
                return {"RMS": "EMPTY_SIGNAL", "Kurtosis": 0, "Skewness": 0, "Peak_Amplitude": 0, "Temperature": 0}

            # SUCCESS: Perform Math
            return {
                "RMS": float(np.sqrt(np.mean(sig**2))),
                "Kurtosis": float(stats.kurtosis(sig)),
                "Skewness": float(stats.skew(sig)),
                "Peak_Amplitude": float(np.max(np.abs(sig))),
                "Temperature": 25.0
            }
        
        return {"RMS": "NO_ARRAY_FOUND", "Kurtosis": 0, "Skewness": 0, "Peak_Amplitude": 0, "Temperature": 0}
            
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    result = read_mat(file_path)
    print(json.dumps(result, cls=NumpyEncoder))

if __name__ == "__main__":
    main()