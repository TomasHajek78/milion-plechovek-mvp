import os

home = "/Users/haak78"
print(f"Listing directories in {home}:")
for name in sorted(os.listdir(home)):
    path = os.path.join(home, name)
    if os.path.isdir(path):
        print(f"[D] {name}")
    else:
        print(f"[F] {name}")
