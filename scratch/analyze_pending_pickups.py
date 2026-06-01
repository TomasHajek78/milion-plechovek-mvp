# -*- coding: utf-8 -*-
import os
import sys
import json
import base64
import time
import requests

# Skript pro automatickou analýzu fotek plechovek na pozadí pomocí Gemini Vision API (Python verze)
# Spuštění: GEMINI_API_KEY="váš_klíč" python3 scratch/analyze_pending_pickups.py

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://dxlyjugmeucevosmhage.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'sb_publishable_CR-YuABHB1SvPK6b6sz-WQ_Q6y_8iKx')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ ERROR: Chybí GEMINI_API_KEY v environment proměnných!")
    sys.exit(1)

# Konfigurace průměrných vah a ekologických úspor
CAN_WEIGHTS = {
    0.5: 16.0,       # 0.5 l = 16.0g
    0.33: 13.5,      # 0.33 l = 13.5g
    0.25: 10.0,      # 0.25 l = 10.0g
    0.2: 8.0,        # 0.2 l / 0.15 l = 8.0g
    'Unknown': 14.0  # Neznámá/ostatní = průměr 14.0g
}

ENERGY_SAVED_KWH_PER_KG = 14  # Ušetřených 14 kWh na 1 kg hliníku
SCRAP_VALUE_CZK_PER_KG = 20    # Výkupní hodnota 20 Kč na 1 kg hliníku
CO2_SAVED_KG_PER_KG = 6.2      # Ušetřených 6.2 kg CO2 na 1 kg hliníku (Evropský průměr)

def get_base64_image(url):
    try:
        response = requests.get(url, timeout=30)
        if response.status_code != 200:
            raise Exception(f"Status {response.status_code}")
        mime_type = response.headers.get('content-type', 'image/jpeg')
        base64_data = base64.b64encode(response.content).decode('utf-8')
        return base64_data, mime_type
    except Exception as e:
        print(f"  ⚠️ Chyba stahování obrázku z {url}: {str(e)}")
        return None

def analyze_image_with_gemini(base64_data, mime_type):
    # V roce 2026 používáme kombinaci modelů pro rozložení denního limitu (každý model má 20 RPD, dohromady 80 RPD)
    models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash"]
    
    prompt = """Analyze this photo of discarded beverage cans. Identify all aluminum cans. For each, determine:
1. Brand (e.g. Monster, Coca-Cola, Pilsner Urquell, Birell, Staropramen, Radegast, Kofola, Starobrno, Red Bull, Tiger, Heineken, Pepsi, or 'Unknown').
2. Volume in liters (0.5, 0.33, 0.25, 0.2, or 'Unknown').
3. detection_issue: If the brand or volume is 'Unknown', write a brief explanation in Czech explaining why (e.g. "plechovka je příliš zmačkaná a logo je skryté", "fotka je rozmazaná a text nečitelný", "je vidět pouze stříbrná spodní část", "plechovka je špinavá nebo zrezivělá"). Otherwise, set it to null.

CRITICAL: Czech brands cheat sheet:
- Birell: green cans with 'BIRELL' in white/green oval. Yellow-green is 'Pomelo & Grep'.
- Staropramen: green cans with large 'S' logo.
- Pilsner Urquell: green cans with red wax seal logo.
- Radegast: green or blue cans with pagan god symbol.
- Kofola: brown/beige/black cans with yellow flower logo.

Respond ONLY with a JSON array of objects with keys 'brand', 'volume_liters', and 'detection_issue'. Example output: [{"brand": "Monster", "volume_liters": 0.5, "detection_issue": null}, {"brand": "Unknown", "volume_liters": "Unknown", "detection_issue": "plechovka je příliš zmačkaná a logo je skryté"}]"""

    for model in models:
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        
        request_body = {
            "contents": [
                {
                    "parts": [
                        { "text": prompt },
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": base64_data
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        print(f"  🧠 Volám Gemini API s modelem {model}...")
        
        max_retries = 10
        for attempt in range(max_retries):
            try:
                response = requests.post(endpoint, json=request_body, headers={'Content-Type': 'application/json'}, timeout=60)
            except Exception as e:
                print(f"  ❌ Chyba připojení k API při pokusu o model {model}: {str(e)}")
                break

            # Ošetření chyby 429 - Překročení kvóty (Rate Limit)
            if response.status_code == 429:
                err_text = response.text
                print(f"  ⚠️ Detaily chyby 429: {err_text}")
                if "limit: 0" in err_text or "limit: 0.0" in err_text or "GenerateRequestsPerDay" in err_text:
                    print(f"  ⚠️ Model {model} má vyčerpanou denní kvótu (limit) nebo nulovou kvótu. Přeskakuji na další model.")
                    break # Vyskakuje ze smyčky pokusů a jde na další model v seznamu 'models'
                
                wait_time = 60.0
                try:
                    err_data = response.json()
                    details = err_data.get('error', {}).get('details', [])
                    for detail in details:
                        if 'retryDelay' in detail.get('retryInfo', {}):
                            retry_delay_str = detail['retryInfo']['retryDelay']
                            wait_time = float(retry_delay_str.replace('s', '')) + 5.0
                            break
                        elif detail.get('@type') == 'type.googleapis.com/google.rpc.RetryInfo':
                            retry_delay_str = detail.get('retryInfo', {}).get('retryDelay', '60s')
                            wait_time = float(retry_delay_str.replace('s', '')) + 5.0
                            break
                except Exception:
                    pass
                
                print(f"  ⚠️ Překročen limit požadavků API (429) pro {model}. Čekám {wait_time} sekund před dalším pokusem (pokus {attempt + 1}/{max_retries})...")
                time.sleep(wait_time)
                continue

            if response.status_code != 200:
                print(f"  ❌ Selhání modelu {model} (status {response.status_code}): {response.text}")
                break

            result = response.json()
            try:
                json_text = result['candidates'][0]['content']['parts'][0]['text']
                return json.loads(json_text.strip())
            except Exception as e:
                print(f"  ⚠️ Chyba parsování odpovědi pro model {model}:", result)
                break

    raise Exception("Všechny dostupné modely Gemini (2.0-flash, gemini-flash-latest) selhaly nebo mají nulovou kvótu.")

def calculate_environmental_stats(cans, user_reported_count):
    adjusted_cans = list(cans)
    
    # Pokud AI detekovala méně plechovek než nahlásil uživatel, doplníme "Unknown" plechovky
    if len(adjusted_cans) < user_reported_count:
        diff = user_reported_count - len(adjusted_cans)
        for _ in range(diff):
            adjusted_cans.append({ 'brand': 'Nerozpoznáno', 'volume_liters': 'Unknown' })
    # Pokud AI detekovala více plechovek a uživatel nahlásil menší počet, omezíme pole na počet nahlášený uživatelem
    elif len(adjusted_cans) > user_reported_count and user_reported_count > 0:
        adjusted_cans = adjusted_cans[:user_reported_count]

    total_weight_g = 0.0
    for can in adjusted_cans:
        vol = can.get('volume_liters', 'Unknown')
        
        # Ošetření typů (může přijít jako číslo i řetězec)
        try:
            if isinstance(vol, (int, float)):
                vol_val = float(vol)
            else:
                vol_val = float(vol) if vol != 'Unknown' else 'Unknown'
        except ValueError:
            vol_val = 'Unknown'
            
        weight = CAN_WEIGHTS.get(vol_val, CAN_WEIGHTS['Unknown'])
        total_weight_g += weight

    weight_kg = total_weight_g / 1000.0
    energy_saved_kwh = weight_kg * ENERGY_SAVED_KWH_PER_KG
    money_saved_czk = weight_kg * SCRAP_VALUE_CZK_PER_KG
    co2_saved_kg = weight_kg * CO2_SAVED_KG_PER_KG

    return {
        'cansList': adjusted_cans,
        'weightG': round(total_weight_g, 2),
        'energySavedKwh': round(energy_saved_kwh, 3),
        'moneySavedCzk': round(money_saved_czk, 2),
        'co2SavedKg': round(co2_saved_kg, 2)
    }

def main():
    print("🚀 Spouštím analýzu neanalyzovaných plechovek ze Supabase...")
    
    try:
        # 1. Načtení neanalyzovaných řádků, které obsahují URL fotky
        query_url = f"{SUPABASE_URL}/rest/v1/pickups?is_analyzed=eq.false&photo_url=not.is.null&select=id,photo_url,count,nickname"
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f"Bearer {SUPABASE_KEY}"
        }
        
        response = requests.get(query_url, headers=headers, timeout=30)
        if response.status_code != 200:
            raise Exception(f"Supabase query failed: Status {response.status_code}")

        pending_pickups = response.json()
        print(f"🔍 Nalezeno {len(pending_pickups)} neanalyzovaných sběrů s fotografií.")

        if len(pending_pickups) == 0:
            print("✅ Všechny záznamy jsou analyzovány. Končím.")
            return

        # 2. Zpracování jednotlivých záznamů
        for index, pickup in enumerate(pending_pickups):
            print(f"\n--------------------------------------------")
            print(f"📦 Zpracovávám záznam {index + 1}/{len(pending_pickups)} (ID {pickup['id']}, Uživatel: {pickup['nickname']}, Nahlášeno: {pickup['count']} ks)...")
            print(f"🔗 URL fotky: {pickup['photo_url']}")

            img_data = get_base64_image(pickup['photo_url'])
            if not img_data:
                print(f"  ❌ Přeskakuji záznam ID {pickup['id']} kvůli chybě načítání obrázku.")
                continue

            base64_data, mime_type = img_data
            
            detected_cans = []
            try:
                detected_cans = analyze_image_with_gemini(base64_data, mime_type)
                if not detected_cans or not isinstance(detected_cans, list):
                    print("  ⚠️ Gemini nevrátila validní seznam plechovek. Nastavuji jako prázdné.")
                    detected_cans = []
            except Exception as gemini_error:
                print("  ❌ Selhání při komunikaci s Gemini API:", str(gemini_error))
                print("  🕒 Preventivní pauza 60 sekund kvůli selhání (ochrana před kaskádovým přetížením)...")
                time.sleep(60)
                continue

            print(f"  🔍 Gemini detekovala plechovky: {json.dumps(detected_cans)}")

            # Výpočet statistik
            stats = calculate_environmental_stats(detected_cans, pickup['count'])
            print(f"  ⚖️ Výpočty:")
            print(f"    - Detekováno celkem: {len(stats['cansList'])} ks (přizpůsobeno nahlášenému počtu)")
            print(f"    - Váha hliníku: {stats['weightG']} g")
            print(f"    - Ušetřená energie: {stats['energySavedKwh']} kWh")
            print(f"    - Výkupní hodnota: {stats['moneySavedCzk']} Kč")
            print(f"    - Ušetřeno CO2: {stats['co2SavedKg']} kg")

            # 3. Update řádku v Supabase
            print(f"  💾 Ukládám analýzu do databáze...")
            update_url = f"{SUPABASE_URL}/rest/v1/pickups?id=eq.{pickup['id']}"
            update_headers = {
                'apikey': SUPABASE_KEY,
                'Authorization': f"Bearer {SUPABASE_KEY}",
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
            
            update_payload = {
                'is_analyzed': True,
                'analysis_json': stats['cansList'],
                'aluminum_weight_g': stats['weightG'],
                'energy_saved_kwh': stats['energySavedKwh'],
                'money_saved_czk': stats['moneySavedCzk'],
                'co2_saved_kg': stats['co2SavedKg']
            }
            
            update_response = requests.patch(update_url, json=update_payload, headers=update_headers, timeout=30)
            if update_response.status_code in (200, 201, 204):
                print(f"  ✅ Záznam ID {pickup['id']} úspěšně aktualizován!")
            else:
                print(f"  ❌ Chyba aktualizace záznamu ID {pickup['id']} v Supabase: {update_response.text}")
                
            # Preventivní spánek 4 vteřiny, abychom zbytečně nenaráželi na limit požadavků zdarma (15 RPM)
            if index < len(pending_pickups) - 1:
                print("  🕒 Preventivní pauza 4 sekundy pro ochranu API kvóty...")
                time.sleep(4)
        
        print(f"\n🎉 Analýza dokončena.")
        
        # Odeslání notifikace / emailu
        print("🔍 Kontroluji, zda nezůstaly fotky k ruční korekci...")
        query_unverified = f"{SUPABASE_URL}/rest/v1/pickups?is_analyzed=eq.true&is_verified=eq.false&select=id,analysis_json"
        res_unver = requests.get(query_unverified, headers=headers, timeout=30)
        
        if res_unver.status_code == 200:
            unverified_pickups = res_unver.json()
            needs_review_count = 0
            for p in unverified_pickups:
                ajson = p.get('analysis_json')
                if isinstance(ajson, list):
                    if any(c.get('brand') in ['Nerozpoznáno', 'Unknown'] for c in ajson):
                        needs_review_count += 1
            
            if needs_review_count > 0:
                print(f"⚠️ Nalezeno {needs_review_count} fotek vyžadujících ruční korekci. Odesílám upozornění.")
                
                # 1. Zobrazení notifikace v macOS
                os.system(f"osascript -e 'display notification \"V administraci je {needs_review_count} fotek k ruční kontrole.\" with title \"Milion plechovek\" subtitle \"Čeká na schválení\"'")
                
                # 2. Odeslání tichého e-mailu přes Apple Mail
                # UPOZORNĚNÍ: E-mailovou adresu "tvuj_email@seznam.cz" níže prosím přepiš na svůj skutečný e-mail!
                target_email = "tvuj_email@seznam.cz"
                
                applescript = f"""
tell application "Mail"
    set theMessage to make new outgoing message with properties {{subject:"Milion plechovek - Fotky ke schválení", content:"Ahoj,\\n\\nv administraci aplikace Milion plechovek čeká {needs_review_count} fotek na tvou ruční kontrolu.\\n\\nPřihlaste se a upravte je v sekci Administrace dat.", visible:false}}
    tell theMessage
        make new to recipient at end of to recipients with properties {{address:"{target_email}"}}
        send
    end tell
end tell
"""
                with open("/tmp/send_mail.scpt", "w") as f:
                    f.write(applescript)
                
                os.system("osascript /tmp/send_mail.scpt")
                print("📩 Tichý e-mail přes aplikaci Mail byl odeslán.")


    except Exception as e:
        print("❌ Kritická chyba skriptu:", str(e))

if __name__ == '__main__':
    main()
