# read_file.py
import sys
import json
import os

def read_mat(file_path):
    from scipy.io import loadmat
    mat_data = loadmat(file_path)
    # Remove MATLAB metadata keys starting with '__'
    data_clean = {k: v.tolist() if hasattr(v, "tolist") else v for k,v in mat_data.items() if not k.startswith('__')}
    return data_clean

def read_tdms(file_path):
    from nptdms import TdmsFile
    tdms_data = {}
    tdms_file = TdmsFile.read(file_path)
    for group in tdms_file.groups():
        for channel in group.channels():
            # convert to list for JSON
            key = f"{group.name}_{channel.name}"
            tdms_data[key] = channel[:].tolist()
    return tdms_data

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        return
    file_path = sys.argv[1]
    ext = os.path.splitext(file_path)[1].lower()

    try:
        if ext == ".mat":
            data = read_mat(file_path)
        elif ext == ".tdms":
            data = read_tdms(file_path)
        else:
            print(json.dumps({"error": "Unsupported file type"}))
            return

        print(json.dumps(data))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()