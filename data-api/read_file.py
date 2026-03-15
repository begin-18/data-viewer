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
        mat_data = loadmat(file_path)
        
        # Look for 'Signal' or the largest array
        raw_signal = None
        if 'Signal' in mat_data:
            raw_signal = mat_data['Signal']
        else:
            for k, v in mat_data.items():
                if not k.startswith('__') and isinstance(v, np.ndarray):
                    if raw_signal is None or v.size > raw_signal.size:
                        raw_signal = v

        if raw_signal is not None and raw_signal.size > 0:
            sig = np.asanyarray(raw_signal).astype(float).flatten()
            sig = sig[np.isfinite(sig)] # Clean data

            if sig.size == 0: return {"RMS": 0, "error": "Cleaned array is empty"}

            return {
                "RMS": float(np.sqrt(np.mean(sig**2))),
                "Kurtosis": float(stats.kurtosis(sig)),
                "Skewness": float(stats.skew(sig)),
                "Peak_Amplitude": float(np.max(np.abs(sig))),
                "Temperature": 25.0
            }
        return {"error": "No numeric data found"}
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    result = read_mat(file_path)
    print(json.dumps(result, cls=NumpyEncoder))

if __name__ == "__main__":
    main()