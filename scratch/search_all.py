import os

search_dirs = [
    "/Users/haak78/Desktop",
    "/Users/haak78/Documents",
    "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk",
    "/Users/haak78/.gemini/antigravity"
]

out_file = "/Users/haak78/.gemini/antigravity/scratch/search_results.txt"

with open(out_file, 'w', encoding='utf-8') as out:
    out.write("Search results for 'plechov' or 'milion':\n")
    for sdir in search_dirs:
        if not os.path.exists(sdir):
            out.write(f"Directory {sdir} does not exist.\n")
            continue
        out.write(f"Searching directory {sdir}...\n")
        for root, dirs, files in os.walk(sdir):
            # Prune directories that are hidden or huge
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', 'venv', 'env', 'Library', 'Cache')]
            for d in dirs:
                if 'plechov' in d.lower() or 'milion' in d.lower() or 'million' in d.lower():
                    path = os.path.join(root, d)
                    out.write(f"[DIR] {path}\n")
            for f in files:
                if 'plechov' in f.lower() or 'milion' in f.lower() or 'million' in f.lower():
                    path = os.path.join(root, f)
                    out.write(f"[FILE] {path}\n")
print("Done writing search_all.py")
