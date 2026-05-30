import os

history_file = "/Users/haak78/.zsh_history"

if not os.path.exists(history_file):
    print("zsh history file does not exist")
else:
    try:
        cmds = []
        with open(history_file, 'rb') as f:
            for line in f:
                try:
                    decoded = line.decode('utf-8', errors='ignore')
                    parts = decoded.split(';', 1)
                    cmd = parts[1] if len(parts) > 1 else decoded
                    cmds.append(cmd.strip())
                except Exception:
                    pass
        print(f"Last 100 command lines in history:")
        for cmd in cmds[-100:]:
            print(cmd)
    except Exception as e:
        print(f"Error reading history: {e}")
