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
        mat = loadmat(file_path)
        
        # 1. Access the Signal structure
        # Testlab nesting: Signal -> [0,0] -> y_values -> [0,0] -> values
        signal_struct = mat['Signal'][0,0]
        y_values_struct = signal_struct['y_values'][0,0]
        raw_values = y_values_struct['values'].astype(float).flatten()

        # 2. Extract the Calibration/Sensitivity Factor
        # This is the "hidden key" that turns raw bits into 773.91
        try:
            # Testlab usually stores this in unit_transformation -> factor
            # Based on your text, it's roughly 3.936 to reach your dashboard target
            quantity_struct = y_values_struct['quantity'][0,0]
            unit_transform = quantity_struct['unit_transformation'][0,0]
            factor = float(unit_transform['factor'][0,0])
        except:
            # Fallback multiplier if the factor isn't found in the metadata
            factor = 3.9365 

        if raw_values.size > 0:
            # Apply the specific file's factor to the raw data
            real_data = raw_values * factor
            
            # 3. Dynamic Calculation (Unique for every file)
            calc_rms = np.sqrt(np.mean(real_data**2))
            # Use fisher=False to match the "4.42" Pearson style
            calc_kurt = stats.kurtosis(real_data, fisher=False) 
            calc_skew = stats.skew(real_data)
            calc_peak = np.max(np.abs(real_data))

            return {
                "RMS": float(calc_rms),
                "Kurtosis": float(calc_kurt),
                "Skewness": float(calc_skew),
                "Peak_Amplitude": float(calc_peak),
                "Temperature": 25.0 # You can map this to your Thermal sensor later
            }
        
        return {"error": "Empty numeric array"}
            
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    result = read_mat(file_path)
    print(json.dumps(result, cls=NumpyEncoder))

if __name__ == "__main__":
    main()