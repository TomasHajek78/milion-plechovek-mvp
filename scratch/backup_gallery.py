# -*- coding: utf-8 -*-
import os
import re
import requests

# Skript pro lokální zálohu všech fotek z databáze Supabase na váš pevný disk (Python verze)
# Spuštění: python3 scratch/backup_gallery.py

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://dxlyjugmeucevosmhage.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'sb_publishable_CR-YuABHB1SvPK6b6sz-WQ_Q6y_8iKx')

# Složka pro uložení fotek (vytvoří se v rootu projektu)
script_dir = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = os.path.abspath(os.path.join(script_dir, '..', 'backup_photos'))

# Vytvoření složky, pokud neexistuje
if not os.path.exists(BACKUP_DIR):
    os.makedirs(BACKUP_DIR)

def download_image(url, local_file_path):
    try:
        response = requests.get(url, timeout=30)
        if response.status_code != 200:
            raise Exception(f"Status {response.status_code}")
        with open(local_file_path, 'wb') as f:
            f.write(response.content)
        return True
    except Exception as e:
        print(f"  ❌ Selhalo stahování fotky z {url}: {str(e)}")
        return False

def main():
    print("🚀 Spouštím lokální zálohování galerie fotek ze Supabase...")
    print(f"📂 Fotky se uloží do: {BACKUP_DIR}\n")

    try:
        # 1. Načtení všech záznamů, které mají fotku
        query_url = f"{SUPABASE_URL}/rest/v1/pickups?photo_url=not.is.null&select=id,photo_url,nickname,count,created_at"
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f"Bearer {SUPABASE_KEY}"
        }
        
        response = requests.get(query_url, headers=headers, timeout=30)
        if response.status_code != 200:
            raise Exception(f"Supabase query failed: Status {response.status_code}")

        pickups = response.json()
        print(f"🔍 Nalezeno celkem {len(pickups)} úlovků s fotografií.")

        if len(pickups) == 0:
            print("✅ Žádné fotky k zálohování.")
            return

        downloaded_count = 0
        skipped_count = 0
        failed_count = 0

        # 2. Procházení a stahování
        for pickup in pickups:
            url = pickup.get('photo_url')
            if not url:
                continue

            # Extrakce přípony souboru z URL (výchozí jpg)
            ext = url.split('.')[-1].split('?')[0] if '.' in url else 'jpg'
            if len(ext) > 4 or not ext.isalnum():
                ext = 'jpg'
            
            # Vyčištění přezdívky pro název souboru
            nick = pickup.get('nickname') or 'anonym'
            clean_nick = re.sub(r'[^a-zA-Z0-9]', '_', nick)
            
            # Naformátování data (např. 2026-05-29)
            created_at = pickup.get('created_at')
            date_str = created_at[:10] if created_at else 'unknown_date'
            
            # Strukturovaný název souboru: DATUM_PREZDIVKA_KUSY_ID.PRIPONA
            filename = f"{date_str}_{clean_nick}_{pickup.get('count', 1)}ks_id{pickup['id']}.{ext}"
            local_file_path = os.path.join(BACKUP_DIR, filename)

            # Pokud soubor už lokálně existuje, přeskočíme ho (šetříme čas a přenosy!)
            if os.path.exists(local_file_path):
                skipped_count += 1
                continue

            print(f"📥 Stahuji: {filename}...")
            success = download_image(url, local_file_path)
            if success:
                downloaded_count += 1
            else:
                failed_count += 1

        print(f"\n==================================================")
        print(f"🎉 ZÁLOHA GALERIE DOKONČENA")
        print(f"==================================================")
        print(f"📥 Staženo nových fotek:   {downloaded_count} ks")
        print(f"⏭️ Již existujících (přeskočeno): {skipped_count} ks")
        print(f"❌ Selhalo stahování:      {failed_count} ks")
        print(f"📂 Celkový počet fotek v backup_photos: {len(os.listdir(BACKUP_DIR))} ks")
        print(f"==================================================\n")

    except Exception as e:
        print("❌ Kritická chyba zálohovacího skriptu:", str(e))

if __name__ == '__main__':
    main()
