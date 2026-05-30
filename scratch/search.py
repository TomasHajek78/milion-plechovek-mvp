import os
import re

search_dirs = [
    "/Users/haak78/Desktop",
    "/Users/haak78/Documents",
    "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk"
]

patterns = [
    re.compile(r"pardubic", re.IGNORECASE),
    re.compile(r"martin", re.IGNORECASE),
    re.compile(r"newsletter", re.IGNORECASE),
    re.compile(r"školení", re.IGNORECASE),
    re.compile(r"skoleni", re.IGNORECASE),
    re.compile(r"kalend", re.IGNORECASE),
    re.compile(r"termín", re.IGNORECASE),
    re.compile(r"termin", re.IGNORECASE),
    re.compile(r"plán", re.IGNORECASE),
    re.compile(r"plan", re.IGNORECASE),
]

print("Starting search...")
found_files = []
for sdir in search_dirs:
    if not os.path.exists(sdir):
        print(f"Directory {sdir} does not exist.")
        continue
    for root, dirs, files in os.walk(sdir):
        for name in files:
            path = os.path.join(root, name)
            # check name
            matched = False
            for pat in patterns:
                if pat.search(name):
                    matched = True
                    break
            if matched:
                found_files.append(path)

print(f"Found {len(found_files)} matching files:")
for f in sorted(found_files):
    print(f)
