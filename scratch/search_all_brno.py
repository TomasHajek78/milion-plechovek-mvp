import os
import re

search_dir = "/Volumes/LaCie 2025/PROJEKTY VAJB/Organiazce Tomáš Hájek"
patterns = [
    re.compile(r"brno-střed", re.IGNORECASE),
    re.compile(r"kubíkov", re.IGNORECASE)
]

print(f"Searching in {search_dir}...")
for root, dirs, files in os.walk(search_dir):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('Library', 'Cache', 'node_modules', 'Trash', 'System Volume Information')]
    for f in files:
        if f.endswith(('.txt', '.md', '.csv')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as file_obj:
                    for l_idx, line in enumerate(file_obj):
                        for pat in patterns:
                            if pat.search(line):
                                print(f"[Match] {f} | Line {l_idx+1}: {line.strip()}")
                                break
            except Exception:
                pass
print("Search finished.")
