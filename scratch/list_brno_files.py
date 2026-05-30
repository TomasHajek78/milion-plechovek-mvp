import os

base_dir = "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/5_KURZY A ŠKOLENÍ 🎥🗞️🤖🎨/1. Kurzy Hájek&Kavka 2026/02 - Brněnsko - Brno květen 2026 TOM"

if not os.path.exists(base_dir):
    print("Base dir does not exist")
else:
    for root, dirs, files in os.walk(base_dir):
        print(f"[D] {root}")
        for f in files:
            print(f"  [F] {f}")
