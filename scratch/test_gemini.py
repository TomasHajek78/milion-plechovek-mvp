# -*- coding: utf-8 -*-
import os
import sys
import requests

# Skript pro rychlé otestování vašeho Gemini API klíče a zjištění podrobného stavu limitů (429)
# Spuštění: GEMINI_API_KEY="váš_klíč" python3 scratch/test_gemini.py

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ ERROR: Chybí GEMINI_API_KEY v environment proměnných!")
    sys.exit(1)

def test_api():
    model = "gemini-1.5-flash"
    endpoint = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={GEMINI_API_KEY}"
    
    request_body = {
        "contents": [{"parts": [{"text": "Hello, write 'OK' and nothing else."}]}]
    }

    print(f"Testing model {model}...")
    try:
        response = requests.post(endpoint, json=request_body, headers={'Content-Type': 'application/json'}, timeout=15)
        print(f"Status Code: {response.status_code}")
        print("Response Body:")
        print(response.text)
    except Exception as e:
        print(f"Connection failed: {str(e)}")

if __name__ == '__main__':
    test_api()
