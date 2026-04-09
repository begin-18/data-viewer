from nptdms import TdmsFile

# Replace with your actual filename
file_path = '0Nm_Misalign_01.tdms'

try:
    tdms_file = TdmsFile.read(file_path)
    print("\n--- TDMS STRUCTURE FOUND ---")
    
    for group in tdms_file.groups():
        print(f"\nGroup Name: {group.name}")
        print("Channels (Variables):")
        for channel in group.channels():
            print(f"  - {channel.name}")
            
except Exception as e:
    print(f"Error reading file: {e}")