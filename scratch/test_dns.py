import socket

base = "idxlyjugmeueoxmhaga"
chars = "abcdefghijklmnopqrstuvwxyz0123456789"

print("Starting DNS resolution checks...")
found = []
for c in chars:
    domain = f"{base}{c}.supabase.co"
    try:
        ip = socket.gethostbyname(domain)
        print(f"FOUND: {domain} -> {ip}")
        found.append((domain, ip))
    except socket.gaierror:
        pass

# Also try inserting or prepending just in case
for i in range(len(base) + 1):
    for c in chars:
        domain = f"{base[:i]}{c}{base[i:]}.supabase.co"
        try:
            ip = socket.gethostbyname(domain)
            print(f"FOUND: {domain} -> {ip}")
            found.append((domain, ip))
        except socket.gaierror:
            pass

print("Finished checks. Found domains:", found)
