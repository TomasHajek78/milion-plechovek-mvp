import os
import json

base_dir = "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/5_KURZY A ŠKOLENÍ 🎥🗞️🤖🎨/4. MPSV  kurzy moje"

gdocs = []
if os.path.exists(base_dir):
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith('.gdoc') or f.endswith('.gsheet'):
                gdocs.append(os.path.join(root, f))

for gd in sorted(gdocs):
    try:
        with open(gd, 'r', encoding='utf-8') as file_obj:
            content = file_obj.read()
            print(f"File: {gd}")
            print(f"Content: {content[:300]}")
            print("-" * 50)
    except Exception as e:
        print(f"Error reading {gd}: {e}")
