import os

search_dirs = [
    "/Users/haak78/Desktop",
    "/Users/haak78/Documents",
    "/Users/haak78/.gemini/antigravity/scratch"
]

print("Searching for 'plechov'...")
for sdir in search_dirs:
    if os.path.exists(sdir):
        for root, dirs, files in os.walk(sdir):
            for d in dirs:
                if 'plechov' in d.lower():
                    print(f"[D] {os.path.join(root, d)}")
            for f in files:
                if 'plechov' in f.lower():
                    print(f"[F] {os.path.join(root, f)}")
