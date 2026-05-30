import os
import json

base_dir = "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/5_KURZY A ŠKOLENÍ 🎥🗞️🤖🎨/1. Kurzy Hájek&Kavka 2026"

if not os.path.exists(base_dir):
    print("Base dir does not exist")
else:
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith('.gdoc') or f.endswith('.gsheet'):
                path = os.path.join(root, f)
                try:
                    with open(path, 'r', encoding='utf-8') as file_obj:
                        content = file_obj.read()
                        print(f"File: {f}")
                        print(f"Path: {path}")
                        print(f"Content: {content}")
                        print("-" * 50)
                except Exception as e:
                    print(f"Error reading {f}: {e}")
