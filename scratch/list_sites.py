import os

paths = ["/Users/haak78/Sites", "/Users/haak78/Local Sites"]
for p in paths:
    if os.path.exists(p):
        print(f"Listing directories in {p}:")
        for item in sorted(os.listdir(p)):
            if not item.startswith('.'):
                print(f"- {item}")
    else:
        print(f"Path does not exist: {p}")
