import os

history_file = "/Users/haak78/.zsh_history"

if not os.path.exists(history_file):
    print("zsh history file does not exist")
else:
    print("Reading zsh history...")
    keywords = ["milion", "plechov", "million", "can", "cd ", "npm ", "git ", "python"]
    matches = []
    try:
        # Read raw lines, handle decoding errors since zsh history contains binary metadata
        with open(history_file, 'rb') as f:
            for line in f:
                try:
                    decoded = line.decode('utf-8', errors='ignore')
                    # Zsh history format is usually: : 1612345678:0;command
                    parts = decoded.split(';', 1)
                    cmd = parts[1] if len(parts) > 1 else decoded
                    
                    matched = False
                    for kw in keywords[:3]: # check milion/plechov first
                        if kw in cmd.lower():
                            matched = True
                            break
                    if matched:
                        matches.append(cmd.strip())
                except Exception:
                    pass
        print(f"Found {len(matches)} matching commands in history:")
        for m in matches[-50:]:
            print(m)
    except Exception as e:
        print(f"Error reading history: {e}")
