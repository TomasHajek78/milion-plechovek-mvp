import os

search_dirs = [
    "/Users/haak78",
]

print("Searching for 'milion' or 'plechov' in home directory...")
found = []
# We only walk depth 3 to avoid infinite loops and speed things up, or check directories.
for sdir in search_dirs:
    if os.path.exists(sdir):
        for root, dirs, files in os.walk(sdir):
            # check depth
            depth = root.replace(sdir, '').count(os.sep)
            if depth > 4:
                # prune dirs to speed up walk
                dirs[:] = []
                continue
            
            for d in dirs:
                if 'milion' in d.lower() or 'plechov' in d.lower():
                    path = os.path.join(root, d)
                    print(f"[D] {path}")
                    found.append(path)
            for f in files:
                if 'milion' in f.lower() or 'plechov' in f.lower():
                    path = os.path.join(root, f)
                    print(f"[F] {path}")
                    found.append(path)
print("Done search.")
