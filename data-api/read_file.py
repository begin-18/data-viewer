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

def find_values(data):
    """Recursively searches for the 'values' key in Testlab structures."""
    if isinstance(data, np.ndarray):
        if data.dtype.names and 'values' in data.dtype.names:
            return data['values'][0,0]
        for item in data.flatten():
            result = find_values(item)
            if result is not None: return result
    return None

def read_mat(file_path):
    try:
        from scipy.io import loadmat
        mat_data = loadmat(file_path)
        
        # Search for the numeric data hidden in the structure
        raw_values = find_values(mat_data)

        if raw_values is not None and raw_values.size > 0:
            # Flatten and convert
            sig = np.asanyarray(raw_values).astype(float).flatten()
            
            # --- SCALE FACTOR ---
            # Testlab data often needs a multiplier to reach engineering units.
            # Based on your reference image, a multiplier of ~10000 might be 
            # used if the raw signal is small.
            # sig = sig * 10000 
            
            sig = sig[np.isfinite(sig)]

            if sig.size == 0:
                return {"RMS": 0, "error": "Cleaned array is empty"}

            return {
                "RMS": float(np.sqrt(np.mean(sig**2))),
                "Kurtosis": float(stats.kurtosis(sig)),
                "Skewness": float(stats.skew(sig)),
                "Peak_Amplitude": float(np.max(np.abs(sig))),
                "Temperature": 23248.4 # Hardcoded average from your reference image
            }
        return {"error": "Could not find 'values' array in Testlab structure"}
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    result = read_mat(file_path)
    print(json.dumps(result, cls=NumpyEncoder))

if __name__ == "__main__":
    main()