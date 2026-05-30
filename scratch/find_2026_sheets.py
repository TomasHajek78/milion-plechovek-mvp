import os

path = "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/5_KURZY A ŠKOLENÍ 🎥🗞️🤖🎨/1. Kurzy Hájek&Kavka 2026"
print("Searching for xlsx/csv/txt in 1. Kurzy Hájek&Kavka 2026:")
if os.path.exists(path):
    for root, dirs, files in os.walk(path):
        for f in files:
            if f.endswith(('.xlsx', '.csv', '.txt')) and not f.startswith('.'):
                print(f"File: {f} | Path: {os.path.join(root, f)}")
else:
    print("Path does not exist")
