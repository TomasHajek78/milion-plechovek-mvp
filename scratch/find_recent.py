import os
import datetime

search_dirs = [
    "/Users/haak78/Desktop",
    "/Users/haak78/Documents",
    "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk"
]

cutoff_date = datetime.datetime(2026, 4, 1)

print("Searching for files modified since 2026-04-01...")
recent_files = []
for sdir in search_dirs:
    if not os.path.exists(sdir):
        print(f"Directory does not exist: {sdir}")
        continue
    for root, dirs, files in os.walk(sdir):
        for f in files:
            path = os.path.join(root, f)
            try:
                mtime = os.path.getmtime(path)
                mdate = datetime.datetime.fromtimestamp(mtime)
                if mdate >= cutoff_date:
                    # Ignore .DS_Store, temporary or cache files
                    if f.startswith('.') or 'tmp' in f.lower() or 'cache' in f.lower():
                        continue
                    recent_files.append((mdate, path))
            except Exception:
                pass

recent_files.sort(reverse=True)
print(f"Found {len(recent_files)} files:")
for mdate, path in recent_files[:50]:
    print(f"{mdate.strftime('%Y-%m-%d %H:%M:%S')} | {path}")
