import sys
import json
import os

def read_mat(file_path):
    try:
        from scipy.io import loadmat
        mat_data = loadmat(file_path)
        # Convert numpy arrays to lists and filter out MATLAB metadata
        data_clean = {k: v.tolist() if hasattr(v, "tolist") else v 
                      for k, v in mat_data.items() if not k.startswith('__')}
        return data_clean
    except ImportError:
        return {"error": "Scipy not found in the virtual environment."}
    except Exception as e:
        return {"error": f"MAT processing error: {str(e)}"}

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
        return {"error": "nptdms not found in the virtual environment."}
    except Exception as e:
        return {"error": f"TDMS processing error: {str(e)}"}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided to Python script"}))
        return

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"Path not found: {file_path}"}))
        return

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".mat":
        result = read_mat(file_path)
    elif ext == ".tdms":
        result = read_tdms(file_path)
    else:
        result = {"error": f"Unsupported extension: {ext}"}

    print(json.dumps(result))

if __name__ == "__main__":
    main()