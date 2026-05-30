import os

paths = [
    "/Volumes/LaCie 2025/LOCAL_WEB/app",
    "/Volumes/LaCie 2025/PROJEKTY VAJB/Organiazce Tomáš Hájek/06_Side_Projekty",
    "/Volumes/LaCie 2025/PROJEKTY VAJB/Organiazce Tomáš Hájek/09_Tom Web",
    "/Volumes/LaCie 2025/Zaloha_Webu/rozbaleno"
]

for p in paths:
    if os.path.exists(p):
        print(f"\nListing {p}:")
        try:
            for item in sorted(os.listdir(p)):
                if not item.startswith('.'):
                    print(f"- {item}")
        except Exception as e:
            print(f"Error listing {p}: {e}")
    else:
        print(f"Path does not exist: {p}")
