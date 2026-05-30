import os
import re

search_dir = "/Volumes/LaCie 2025/PROJEKTY VAJB/Organiazce Tomáš Hájek"
patterns = [
    re.compile(r"brno-střed", re.IGNORECASE),
    re.compile(r"focen", re.IGNORECASE),
    re.compile(r"kubíková", re.IGNORECASE)
]

print(f"Searching in {search_dir}...")
count = 0
for root, dirs, files in os.walk(search_dir):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('Library', 'Cache', 'node_modules', 'Trash', 'System Volume Information')]
    for f in files:
        if f.endswith(('.txt', '.md')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as file_obj:
                    for l_idx, line in enumerate(file_obj):
                        # only matching lines containing both 'brno' and 'foc' or similar to filter relevance
                        if "brno" in line.lower() and ("foc" in line.lower() or "kubík" in line.lower() or "potvr" in line.lower()):
                            print(f"[Match] {path} | Line {l_idx+1}: {line.strip()}")
                            count += 1
            except Exception:
                pass
print("Search finished.")
