import os

base_dir = "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/5_KURZY A ŠKOLENÍ 🎥🗞️🤖🎨"

if not os.path.exists(base_dir):
    print("Base dir does not exist")
else:
    for root, dirs, files in os.walk(base_dir):
        # We only want to list up to maxdepth 3 to not get overwhelmed
        depth = root.replace(base_dir, '').count(os.sep)
        if depth > 3:
            continue
        indent = '  ' * depth
        print(f"{indent}[D] {os.path.basename(root)}")
        for f in files:
            print(f"{indent}  [F] {f}")
