# read_file.py
import sys
import json
import os

def read_mat(file_path):
    try:
        from scipy.io import loadmat
        mat_data = loadmat(file_path)
        # Convert numpy arrays to lists; ignore MATLAB internal metadata
        data_clean = {
            k: v.tolist() if hasattr(v, "tolist") else v 
            for k, v in mat_data.items() if not k.startswith('__')
        }
        return data_clean
    except ImportError:
        return {"error": "Library 'scipy' not found in venv. Run: pip install scipy"}
    except Exception as e:
        return {"error": f"Failed to parse .mat file: {str(e)}"}

def read_tdms(file_path):
    try:
        from nptdms import TdmsFile
        tdms_data = {}
        tdms_file = TdmsFile.read(file_path)
        for group in tdms_file.groups():
            for channel in group.channels():
                key = f"{group.name}_{channel.name}"
                tdms_data[key] = channel[:].tolist()
        return tdms_data
    except ImportError:
        return {"error": "Library 'nptdms' not found in venv. Run: pip install nptdms"}
    except Exception as e:
        return {"error": f"Failed to parse .tdms file: {str(e)}"}

def main():
    # Ensure we always output valid JSON to stdout
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No file path provided to Python script"}))
            return

        file_path = sys.argv[1]
        if not os.path.exists(file_path):
            print(json.dumps({"error": f"Temp file not found at {file_path}"}))
            return

        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".mat":
            result = read_mat(file_path)
        elif ext == ".tdms":
            result = read_tdms(file_path)
        else:
            result = {"error": f"Unsupported file extension: {ext}"}
        
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": f"Python Main Error: {str(e)}"}))

if __name__ == "__main__":
    main()