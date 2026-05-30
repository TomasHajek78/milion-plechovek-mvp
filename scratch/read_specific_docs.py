import os

files = [
    "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/5_KURZY A ŠKOLENÍ 🎥🗞️🤖🎨/1. Kurzy Hájek&Kavka 2026/1 TO DO LIST Hájek&Kavka.gdoc",
    "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/5_KURZY A ŠKOLENÍ 🎥🗞️🤖🎨/1. Kurzy Hájek&Kavka 2026/Kurzy Hájek&Kavka 2026 - plán.gdoc",
    "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/5_KURZY A ŠKOLENÍ 🎥🗞️🤖🎨/1. Kurzy Hájek&Kavka 2026/ROZJEDNANÉ KURZY (školení) - posouvej dál!.gdoc",
    "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/5_KURZY A ŠKOLENÍ 🎥🗞️🤖🎨/1. Kurzy Hájek&Kavka 2026/Nabídka kurzů/Termíny otevřených školení.gsheet"
]

for path in files:
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                print(f"FILE: {os.path.basename(path)}")
                print(f.read())
                print("="*40)
        except Exception as e:
            print(f"Error reading {path}: {e}")
    else:
        print(f"Does not exist: {path}")
