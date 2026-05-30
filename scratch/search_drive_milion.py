import os

drive_path = "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk"

print("Searching Google Drive for 'milion' or 'plechov'...")
found = []
if os.path.exists(drive_path):
    for root, dirs, files in os.walk(drive_path):
        # limit depth to 4 to speed up
        depth = root.replace(drive_path, '').count(os.sep)
        if depth > 4:
            dirs[:] = [] # prune
            continue
        
        for d in dirs:
            if 'milion' in d.lower() or 'plechov' in d.lower() or 'can' in d.lower() and 'million' in d.lower():
                path = os.path.join(root, d)
                print(f"[D] {path}")
                found.append(path)
        for f in files:
            if 'milion' in f.lower() or 'plechov' in f.lower() or 'can' in f.lower() and 'million' in f.lower():
                path = os.path.join(root, f)
                print(f"[F] {path}")
                found.append(path)
print("Done search.")
