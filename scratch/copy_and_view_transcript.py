import shutil

src = "/Volumes/LaCie 2025/PROJEKTY VAJB/Organiazce Tomáš Hájek/Archiv_transcriptu/Bordel_na_stole_1-transcript.txt"
dest = "/Users/haak78/.gemini/antigravity/scratch/Bordel_na_stole_1-transcript.txt"

try:
    shutil.copy2(src, dest)
    print("Copied successfully.")
except Exception as e:
    print(f"Error copying: {e}")
