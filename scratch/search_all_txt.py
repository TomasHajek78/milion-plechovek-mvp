import os
import re

search_dirs = [
    "/Users/haak78/Desktop",
    "/Users/haak78/Documents",
    "/Volumes/LaCie 2025/PROJEKTY VAJB/Organiazce Tomáš Hájek"
]

patterns = [
    re.compile(r"25\.5", re.IGNORECASE),
    re.compile(r"26\.5", re.IGNORECASE),
    re.compile(r"27\.5", re.IGNORECASE),
    re.compile(r"28\.5", re.IGNORECASE),
    re.compile(r"29\.5", re.IGNORECASE),
    re.compile(r"květen", re.IGNORECASE),
    re.compile(r"červen", re.IGNORECASE)
]

print("Searching for next week dates in text/markdown/docx/xlsx files...")
for sdir in search_dirs:
    if not os.path.exists(sdir):
        continue
    for root, dirs, files in os.walk(sdir):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('Library', 'Cache', 'node_modules')]
        for f in files:
            if f.endswith(('.md', '.txt', '.docx', '.xlsx')):
                path = os.path.join(root, f)
                # check file name
                matched_name = False
                for pat in patterns:
                    if pat.search(f):
                        matched_name = True
                        break
                if matched_name:
                    print(f"[Match in Name] {path}")
                    
                # check contents for text files
                if f.endswith(('.md', '.txt')):
                    try:
                        with open(path, 'r', encoding='utf-8', errors='ignore') as file_obj:
                            content = file_obj.read()
                            for pat in patterns:
                                if pat.search(content):
                                    print(f"[Match in Content] {path}")
                                    break
                    except Exception:
                        pass
print("Done search.")
