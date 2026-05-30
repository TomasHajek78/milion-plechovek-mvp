import os
import re

search_dir = "/Volumes/LaCie 2025/PROJEKTY VAJB"
patterns = [
    re.compile(r"kubík", re.IGNORECASE),
    re.compile(r"brno-střed", re.IGNORECASE),
    re.compile(r"potvrzení fotoprací", re.IGNORECASE)
]

print(f"Searching in {search_dir}...")
count = 0
for root, dirs, files in os.walk(search_dir):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('Library', 'Cache', 'node_modules', 'Trash', 'System Volume Information')]
    for f in files:
        if f.endswith(('.txt', '.md', '.csv', '.xlsx', '.docx')):
            path = os.path.join(root, f)
            matched = False
            for pat in patterns:
                if pat.search(f):
                    matched = True
                    break
            if matched:
                print(f"[Name Match] {path}")
            
            if f.endswith(('.txt', '.md', '.csv')):
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as file_obj:
                        for l_idx, line in enumerate(file_obj):
                            for pat in patterns:
                                if pat.search(line):
                                    print(f"[Content Match] {path} | Line {l_idx+1}: {line.strip()}")
                                    count += 1
                                    break
                            if count > 30:
                                break
                except Exception:
                    pass
            if count > 30:
                break
    if count > 30:
        break
print("Search finished.")
