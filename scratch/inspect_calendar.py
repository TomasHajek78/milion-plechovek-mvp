import os
import sqlite3
import datetime

cal_path = "/Users/haak78/Library/Calendars"
if not os.path.exists(cal_path):
    print("Calendar path does not exist")
    exit()

print("Searching Calendars directory for SQLite databases...")
for root, dirs, files in os.walk(cal_path):
    for f in files:
        if "Cache" in f or f.endswith(".db") or f.endswith(".sqlite"):
            db_path = os.path.join(root, f)
            print(f"\nChecking database: {db_path}")
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                # List tables
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [row[0] for row in cursor.fetchall()]
                print("Tables:", tables)
                
                # Check for calendar items table. Often it is 'CalendarItem' or 'event'
                item_table = None
                for t in tables:
                    if t.lower() in ['calendaritem', 'event', 'zcalendaritem', 'zevent']:
                        item_table = t
                        break
                
                if item_table:
                    # Let's search columns
                    cursor.execute(f"PRAGMA table_info({item_table});")
                    cols = [row[1] for row in cursor.fetchall()]
                    print(f"Columns in {item_table}:", cols)
                    
                    # Search text columns for keyword
                    # Let's look for ZTITLE, ZSUMMARY, ZDESCRIPTION, summary, title, description, etc.
                    title_col = None
                    desc_col = None
                    start_col = None
                    for c in cols:
                        if c.lower() in ['ztitle', 'summary', 'title']:
                            title_col = c
                        if c.lower() in ['zdescription', 'description', 'notes', 'znotes']:
                            desc_col = c
                        if c.lower() in ['zstartdate', 'startdate', 'start']:
                            start_col = c
                    
                    if title_col:
                        # Print upcoming events (from today 2026-05-21 onwards) or general search
                        # macOS core data start date is often 2001-01-01 (978307200 absolute time) or unix timestamp
                        query = f"SELECT {title_col}"
                        if desc_col:
                            query += f", {desc_col}"
                        if start_col:
                            query += f", {start_col}"
                        query += f" FROM {item_table}"
                        
                        cursor.execute(query)
                        rows = cursor.fetchall()
                        print(f"Total items found: {len(rows)}")
                        
                        # Let's search for keywords
                        keywords = ["pardubic", "martin", "newsletter", "školení", "skoleni"]
                        for row in rows:
                            text_to_search = " ".join([str(val) for val in row if val]).lower()
                            # Check keywords
                            matched = False
                            for kw in keywords:
                                if kw in text_to_search:
                                    matched = True
                                    break
                            if matched:
                                print(f"MATCH: {row}")
                                
                            # Also print if it's next week
                            # Let's see if start date is near May 2026
                            # Next week is roughly May 24, 2026 to May 31, 2026
                            if start_col and len(row) > (2 if desc_col else 1):
                                val = row[-1]
                                if isinstance(val, (int, float)):
                                    # Convert CoreData timestamp to Unix timestamp (add 978307200)
                                    # or check if it's already Unix timestamp
                                    ts = val
                                    if ts < 2000000000: # CoreData timestamp
                                        ts += 978307200
                                    try:
                                        dt = datetime.datetime.fromtimestamp(ts)
                                        if datetime.datetime(2026, 5, 20) <= dt <= datetime.datetime(2026, 6, 5):
                                            print(f"EVENT IN RANGE: {dt} | {row}")
                                    except Exception:
                                        pass
            except Exception as e:
                print(f"Error checking {db_path}: {e}")
