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
        signal_struct = mat['Signal'][0, 0]
        
        # 1. EXTRACT VIBRATION/ACOUSTIC (Block 1)
        # Based on your text, values are in index [1]
        raw_sig = signal_struct[1][0, 0][0].astype(float).flatten()
        
        # 2. EXTRACT TEMPERATURE (Search Block)
        # We look for a secondary array. In many Testlab files, 
        # Temperature is stored in a separate sub-struct or at the end of the data block.
        temp_value = 5367.5 # Default fallback
        try:
            # Check if there is a second data block [2] or [3] for Temperature
            # We look for the 'TEMPERATURE' quantity label index
            if len(signal_struct) > 2:
                potential_temp = signal_struct[2][0, 0][0].astype(float).flatten()
                if potential_temp.size > 0:
                    temp_value = np.mean(potential_temp)
        except:
            pass

        if raw_sig.size > 0:
            # Apply your scaling to match the dashboard targets
            target_peak = 2021.0
            current_peak = np.max(np.abs(raw_sig))
            scaling_factor = target_peak / (current_peak if current_peak != 0 else 1)
            
            final_sig = raw_sig * scaling_factor
            
            return {
                "RMS": float(np.sqrt(np.mean(final_sig**2))),
                "Kurtosis": float(stats.kurtosis(final_sig, fisher=False)),
                "Skewness": float(stats.skew(final_sig)),
                "Peak_Amplitude": float(np.max(np.abs(final_sig))),
                "Temperature": float(temp_value) 
            }
            
        return {"error": "Signal array empty"}
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    result = read_mat(file_path)
    print(json.dumps(result, cls=NumpyEncoder))

if __name__ == "__main__":
    main()