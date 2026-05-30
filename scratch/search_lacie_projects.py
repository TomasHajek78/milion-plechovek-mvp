import os

paths = [
    "/Volumes/LaCie 2025/LOCAL_WEB",
    "/Volumes/LaCie 2025/Zaloha_Webu",
    "/Volumes/LaCie 2025/PROJEKTY VAJB/08_Nastroje",
    "/Volumes/LaCie 2025/PROJEKTY VAJB/Organiazce Tomáš Hájek"
]

for path in paths:
    if os.path.exists(path):
        print(f"\n========================================\nListing directories in {path}:")
        try:
            for item in sorted(os.listdir(path)):
                item_path = os.path.join(path, item)
                is_dir = os.path.isdir(item_path)
                print(f"[{'D' if is_dir else 'F'}] {item}")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print(f"Path does not exist: {path}")
