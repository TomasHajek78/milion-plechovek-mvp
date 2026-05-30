import os
import re

search_dirs = [
    "/Users/haak78/Desktop",
    "/Users/haak78/Documents",
    "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk"
]

patterns = [
    re.compile(r"cihal", re.IGNORECASE),
    re.compile(r"číhal", re.IGNORECASE),
    re.compile(r"ješk", re.IGNORECASE),
    re.compile(r"havlov", re.IGNORECASE),
    re.compile(r"feje", re.IGNORECASE),
    re.compile(r"fekete", re.IGNORECASE),
    re.compile(r"hrnč", re.IGNORECASE)
]

print("Searching for contacts in files...")
for sdir in search_dirs:
    if not os.path.exists(sdir):
        continue
    for root, dirs, files in os.walk(sdir):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('Library', 'Cache', 'node_modules')]
        for f in files:
            if f.endswith(('.txt', '.md', '.csv', '.xlsx', '.docx')):
                path = os.path.join(root, f)
                # check file name
                matched = False
                for pat in patterns:
                    if pat.search(f):
                        matched = True
                        break
                if matched:
                    print(f"[Name Match] {path}")
                
                # For small text/csv files, search content
                if f.endswith(('.txt', '.md', '.csv')):
                    try:
                        with open(path, 'r', encoding='utf-8', errors='ignore') as file_obj:
                            for l_idx, line in enumerate(file_obj):
                                for pat in patterns:
                                    if pat.search(line):
                                        print(f"[Content Match] {path} | Line {l_idx+1}: {line.strip()}")
                                        break
                    except Exception:
                        pass
print("Done search.")
