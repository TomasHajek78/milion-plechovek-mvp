import os
import re

search_dir = "/Volumes/LaCie 2025/PROJEKTY VAJB"
pattern = re.compile(r"frog", re.IGNORECASE)

print(f"Searching for 'frog' in {search_dir}...")
count = 0
for root, dirs, files in os.walk(search_dir):
    # Skip hidden directories and build directories to speed it up
    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('Library', 'Cache', 'node_modules', 'Trash', 'System Volume Information')]
    for f in files:
        if f.endswith(('.txt', '.md', '.csv', '.json')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as file_obj:
                    for l_idx, line in enumerate(file_obj):
                        if pattern.search(line):
                            print(f"[Match] {path} | Line {l_idx+1}: {line.strip()}")
                            count += 1
                            if count > 50:
                                print("Too many matches, stopping.")
                                break
            except Exception:
                pass
            if count > 50:
                break
    if count > 50:
        break
print("Search finished.")
