# -*- coding: utf-8 -*-
import os
import sys
import requests

# Skript pro diagnostiku dostupných modelů a API verzí pro váš Gemini klíč
# Spuštění: python3 scratch/diagnose_gemini.py

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ ERROR: Chybí GEMINI_API_KEY v environment proměnných!")
    sys.exit(1)

def check_models(api_version):
    url = f"https://generativelanguage.googleapis.com/{api_version}/models?key={GEMINI_API_KEY}"
    print(f"\n🔍 Dotazuji modely pro verzi {api_version}...")
    try:
        response = requests.get(url, timeout=30)
        print(f"   Status code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            models = [m['name'] for m in data.get('models', [])]
            print(f"   ✅ Nalezeno {len(models)} modelů:")
            for m in sorted(models):
                print(f"      - {m}")
            return models
        else:
            print(f"   ❌ Chyba {response.status_code}: {response.text}")
    except Exception as e:
        print(f"   ❌ Selhalo spojení: {str(e)}")
    return None

def main():
    print("=== DIAGNOSTIKA GEMINI API KEY ===")
    
    # 1. Kontrola v1beta
    models_beta = check_models("v1beta")
    
    # 2. Kontrola v1
    models_v1 = check_models("v1")
    
    print("\n===============================")
    if not models_beta and not models_v1:
        print("❌ Obě API verze selhaly. Váš klíč je pravděpodobně neplatný, nebo má zablokovaný přístup.")
    else:
        print("✅ Diagnostika dokončena. Pokud vidíte seznam modelů, vyberte ten správný ze seznamu.")

if __name__ == '__main__':
    main()
