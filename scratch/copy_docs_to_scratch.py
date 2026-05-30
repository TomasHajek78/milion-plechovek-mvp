import os
import shutil

src_dir = "/Volumes/LaCie 2025/PROJEKTY VAJB/Organiazce Tomáš Hájek/06_Side_Projekty/Milion_plechovek"
dest_dir = "/Users/haak78/.gemini/antigravity/scratch/milion_plechovek"

os.makedirs(dest_dir, exist_ok=True)

# Copy all md files
for item in os.listdir(src_dir):
    if item.endswith('.md'):
        src_path = os.path.join(src_dir, item)
        dest_path = os.path.join(dest_dir, item)
        shutil.copy2(src_path, dest_path)
        print(f"Copied: {item}")

# Copy MVP_Aplikace files
src_app = os.path.join(src_dir, 'MVP_Aplikace')
dest_app = os.path.join(dest_dir, 'MVP_Aplikace')
os.makedirs(dest_app, exist_ok=True)
for item in os.listdir(src_app):
    if item.endswith(('.html', '.css', '.js', '.json')):
        src_path = os.path.join(src_app, item)
        dest_path = os.path.join(dest_app, item)
        shutil.copy2(src_path, dest_path)
        print(f"Copied app file: {item}")

print("Done copying.")
