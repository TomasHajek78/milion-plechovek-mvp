import os

drive_path = "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/5_KURZY A ŠKOLENÍ 🎥🗞️🤖🎨"

print("Searching for xlsx and docx files in Google Drive:")
if os.path.exists(drive_path):
    for root, dirs, files in os.walk(drive_path):
        for f in files:
            if f.endswith(('.xlsx', '.docx', '.csv', '.txt')) and not f.startswith('.'):
                path = os.path.join(root, f)
                print(f"File: {f}")
                print(f"Path: {path}")
                print("-" * 30)
else:
    print("Drive path does not exist")
