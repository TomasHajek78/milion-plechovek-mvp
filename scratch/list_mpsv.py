import os

base_dir = "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/5_KURZY A ŠKOLENÍ 🎥🗞️🤖🎨/4. MPSV  kurzy moje"

if not os.path.exists(base_dir):
    print("Base dir does not exist")
else:
    for item in sorted(os.listdir(base_dir)):
        item_path = os.path.join(base_dir, item)
        if os.path.isdir(item_path):
            print(f"[D] {item}")
            # print items inside
            for subitem in sorted(os.listdir(item_path)):
                subitem_path = os.path.join(item_path, subitem)
                if os.path.isdir(subitem_path):
                    print(f"  [D] {subitem}")
                else:
                    print(f"  [F] {subitem}")
        else:
            print(f"[F] {item}")
