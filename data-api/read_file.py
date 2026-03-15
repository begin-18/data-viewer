import sys
import json
import os
import numpy as np

def read_mat(file_path):
    try:
        from scipy.io import loadmat
        mat_data = loadmat(file_path)
        
        # This gets every variable name inside the MATLAB file
        all_keys = [str(k) for k in mat_data.keys() if not k.startswith('__')]
        
        # We will put the list of names into the "RMS" column 
        # so you can read them in your Google Sheet
        return {
            "RMS": f"Keys found: {', '.join(all_keys)}",
            "Kurtosis": "Check Column B",
            "Skewness": 0,
            "Peak_Amplitude": 0,
            "Temperature": 0
        }
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) < 2: return
    file_path = sys.argv[1]
    result = read_mat(file_path)
    print(json.dumps(result))

if __name__ == "__main__":
    main()