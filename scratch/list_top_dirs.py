import os

paths = ["/Users/haak78/Desktop", "/Users/haak78/Documents"]
for path in paths:
    if os.path.exists(path):
        print(f"Top-level items in {path}:")
        for item in sorted(os.listdir(path)):
            if not item.startswith('.'):
                item_path = os.path.join(path, item)
                is_dir = os.path.isdir(item_path)
                print(f"[{'D' if is_dir else 'F'}] {item}")
        print("="*40)
