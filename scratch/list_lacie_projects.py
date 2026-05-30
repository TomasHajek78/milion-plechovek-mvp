import os

path = "/Volumes/LaCie 2025/PROJEKTY VAJB"
if os.path.exists(path):
    print(f"Listing directories in {path}:")
    try:
        for item in sorted(os.listdir(path)):
            item_path = os.path.join(path, item)
            is_dir = os.path.isdir(item_path)
            print(f"[{'D' if is_dir else 'F'}] {item}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print(f"Path does not exist: {path}")

# Also check just "/Volumes/LaCie 2025" if it exists
lacie = "/Volumes/LaCie 2025"
if os.path.exists(lacie):
    print(f"\nListing directories in {lacie}:")
    try:
        for item in sorted(os.listdir(lacie)):
            item_path = os.path.join(lacie, item)
            is_dir = os.path.isdir(item_path)
            print(f"[{'D' if is_dir else 'F'}] {item}")
    except Exception as e:
        print(f"Error: {e}")
