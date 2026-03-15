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

def get_metric(data, key, signal):
    if key in data:
        val = data[key]
        try:
            return float(val.flatten()[0]) if isinstance(val, np.ndarray) else float(val)
        except:
            pass
    
    if signal is not None and len(signal) > 0:
        try:
            if key == "RMS": return float(np.sqrt(np.mean(signal**2)))
            if key == "Kurtosis": return float(stats.kurtosis(signal))
            if key == "Skewness": return float(stats.skew(signal))
            if key == "Peak_Amplitude": return float(np.max(np.abs(signal)))
        except:
            return 0.0
    return 0.0

def read_mat(file_path):
    try:
        from scipy.io import loadmat
        mat_data = loadmat(file_path)
        clean = {k: v for k, v in mat_data.items() if not k.startswith('__')}
        
        main_signal = None
        for v in clean.values():
            if isinstance(v, np.ndarray) and v.size > 10:
                main_signal = v.flatten()
                break

        return {
            "RMS": get_metric(clean, "RMS", main_signal),
            "Kurtosis": get_metric(clean, "Kurtosis", main_signal),
            "Skewness": get_metric(clean, "Skewness", main_signal),
            "Peak_Amplitude": get_metric(clean, "Peak_Amplitude", main_signal),
            "Temperature": get_metric(clean, "Temperature", main_signal)
        }
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path"}))
        return

    file_path = sys.argv[1]
    ext = os.path.splitext(file_path)[1].lower()
    result = read_mat(file_path) if ext == ".mat" else {"error": "Unsupported file"}
    print(json.dumps(result, cls=NumpyEncoder))

if __name__ == "__main__":
    main()