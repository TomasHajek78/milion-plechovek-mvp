import os

project_path = "/Volumes/LaCie 2025/PROJEKTY VAJB/Organiazce Tomáš Hájek/06_Side_Projekty/Milion_plechovek"
out_file = "/Users/haak78/.gemini/antigravity/scratch/project_inspection.txt"

with open(out_file, 'w', encoding='utf-8') as out:
    if not os.path.exists(project_path):
        out.write(f"Project path does not exist: {project_path}\n")
    else:
        out.write(f"Inspecting Milion_plechovek project at: {project_path}\n\n")
        out.write("--- FILE STRUCTURE ---\n")
        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', 'venv', 'env', 'dist', 'build')]
            depth = root.replace(project_path, '').count(os.sep)
            indent = "  " * depth
            out.write(f"{indent}[D] {os.path.basename(root) or 'root'}\n")
            for f in files:
                if not f.startswith('.'):
                    filepath = os.path.join(root, f)
                    try:
                        size = os.path.getsize(filepath)
                        out.write(f"{indent}  [F] {f} ({size} bytes)\n")
                    except Exception:
                        out.write(f"{indent}  [F] {f}\n")
        
        # Read contents of important files
        important_files = ['package.json', 'README.md', 'index.html', 'vite.config.js', 'vite.config.ts']
        out.write("\n--- IMPORTANT FILE CONTENTS ---\n")
        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', 'venv', 'env', 'dist', 'build')]
            for f in files:
                if f in important_files:
                    filepath = os.path.join(root, f)
                    out.write(f"\n=== File: {filepath} ===\n")
                    try:
                        with open(filepath, 'r', encoding='utf-8') as file_obj:
                            out.write(file_obj.read())
                    except Exception as e:
                        out.write(f"Error reading file: {e}\n")
                    out.write("\n" + "="*40 + "\n")
print("Done writing inspect_project.py")
