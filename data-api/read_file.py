import sys
import json
import os
import numpy as np
from scipy import stats

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.int64, np.int32, np.int16)):
            return int(obj)
        if isinstance(obj, (np.float64, np.float32)):
            return float(obj)
        return super(NumpyEncoder, self).default(obj)

def calculate_metrics(data_array):
    # Ensure it's a flat numpy array for calculation
    sig = np.array(data_array).flatten()
    if sig.size == 0:
        return {"RMS": 0, "Kurtosis": 0, "Skewness": 0, "Peak": 0}
    
    return {
        "RMS": float(np.sqrt(np.mean(sig**2))),
        "Kurtosis": float(stats.kurtosis(sig)),
        "Skewness": float(stats.skew(sig)),
        "Peak_Amplitude": float(np.max(np.abs(sig)))
    }

def read_mat(file_path):
    try:
        from scipy.io import loadmat
        mat_data = loadmat(file_path)
        
        # We now know your data is stored under the key 'Signal'
        if 'Signal' in mat_data:
            raw_signal = mat_data['Signal']
            metrics = calculate_metrics(raw_signal)
            
            # If the Signal array also contains temperature (e.g. at the end), 
            # we'd extract it here. For now, we'll set a placeholder or 
            # use a value from the signal if it looks like a temp reading.
            metrics["Temperature"] = 25.0 # Default if temp isn't a separate key
            return metrics
        else:
            return {"error": "Variable 'Signal' not found in .mat file"}
            
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    result = read_mat(file_path)
    print(json.dumps(result, cls=NumpyEncoder))

if __name__ == "__main__":
    main()