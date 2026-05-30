import socket
import concurrent.futures

bases = [
    "idxlyjugmeueoxmhaga",
    "idxlyjugneueoxmhapa",
    "idxlyjugmeueoxmhage",
    "idxlyjugneueoxmhape"
]
chars = "abcdefghijklmnopqrstuvwxyz0123456789"

domains_to_test = set()

# 1. Insert 1 character at any position in the bases to make them 20 characters
for base in bases:
    for i in range(len(base) + 1):
        for c in chars:
            domain = f"{base[:i]}{c}{base[i:]}.supabase.co"
            domains_to_test.add(domain)

# 2. Just in case, let's also test substituting 1 character and keeping 19? 
# No, Supabase project ref is strictly 20 characters. Let's test substituting 1 character in the 20-char strings if we find nothing.

print(f"Generated {len(domains_to_test)} unique domains to test.")

found = []

def check_domain(domain):
    try:
        ip = socket.gethostbyname(domain)
        return (domain, ip)
    except socket.gaierror:
        return None

# Use thread pool to speed up DNS resolution
with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
    results = executor.map(check_domain, domains_to_test)
    for res in results:
        if res:
            print(f"FOUND: {res[0]} -> {res[1]}")
            found.append(res)

print("Broad DNS scan finished.")
print("Found domains:", found)
