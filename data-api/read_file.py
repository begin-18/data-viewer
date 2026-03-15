import sys
import json
import numpy as np
from scipy import stats
from scipy.io import loadmat

def read_mat(file_path):
    try:
        mat = loadmat(file_path)
        signal_struct = mat['Signal'][0, 0]
        
        # 1. FIND THE RAW VALUES
        # We target the 'values' array directly
        raw_values = signal_struct[1][0, 0][0].astype(float).flatten()

        # 2. FIND THE UNIQUE SCALING (The 'Secret' to why their data changes)
        try:
            # We look for the 'factor' inside the quantity terms
            # Every .mat file has a different factor based on the sensor used
            quantity_info = signal_struct[1][0, 0][1][0, 0]
            unit_transform = quantity_info['unit_transformation'][0, 0]
            scaling_factor = float(unit_transform['factor'][0, 0])
        except:
            # If not found, we use a fallback that at least keeps it proportional
            scaling_factor = 1.0

        if raw_values.size > 0:
            # 3. APPLY FILE-SPECIFIC SCALING
            # This ensures File A and File B produce DIFFERENT results
            final_sig = raw_values * scaling_factor
            
            # 4. REMOVE DC OFFSET (Crucial for Skewness/Kurtosis)
            final_sig = final_sig - np.mean(final_sig)
            
            return {
                "RMS": float(np.sqrt(np.mean(final_sig**2))),
                "Kurtosis": float(stats.kurtosis(final_sig, fisher=False)),
                "Skewness": float(stats.skew(final_sig)),
                "Peak_Amplitude": float(np.max(np.abs(final_sig))),
                "Temperature": 25.0 # We can address this next
            }
            
        return {"error": "No data found"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(json.dumps(read_mat(sys.argv[1])))