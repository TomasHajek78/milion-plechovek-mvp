import os

base_dir = "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/5_KURZY A ŠKOLENÍ 🎥🗞️🤖🎨/1. Kurzy Hájek&Kavka 2026"

if not os.path.exists(base_dir):
    print("Base dir does not exist")
else:
    for root, dirs, files in os.walk(base_dir):
        depth = root.replace(base_dir, '').count(os.sep)
        if depth > 2:
            continue
        indent = '  ' * depth
        print(f"{indent}[D] {os.path.basename(root)}")
        for f in files:
            if not f.startswith('.'):
                print(f"{indent}  [F] {f}")
