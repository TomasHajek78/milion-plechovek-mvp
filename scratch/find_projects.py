import os

search_dir = "/Users/haak78"
out_file = "/Users/haak78/.gemini/antigravity/scratch/projects_found.txt"

with open(out_file, 'w', encoding='utf-8') as out:
    out.write("Coding projects found:\n")
    for root, dirs, files in os.walk(search_dir):
        # Prune hidden dirs and known massive dirs
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('Library', 'Applications', 'node_modules', 'venv', 'env', 'Cache', 'Pictures', 'Music', 'Movies', 'Downloads')]
        
        if 'package.json' in files:
            out.write(f"[JS/TS] {root}\n")
        if 'requirements.txt' in files or 'pyproject.toml' in files:
            out.write(f"[Python] {root}\n")
        if '.git' in dirs:
            out.write(f"[Git] {root}\n")
print("Done writing find_projects.py")
