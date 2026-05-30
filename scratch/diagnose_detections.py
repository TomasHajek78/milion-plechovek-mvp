# -*- coding: utf-8 -*-
# Skript pro analýzu a diagnostiku problémů s AI detekcí plechovek
# Spuštění: python3 scratch/diagnose_detections.py

import os
import requests
import json

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://dxlyjugmeucevosmhage.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'sb_publishable_CR-YuABHB1SvPK6b6sz-WQ_Q6y_8iKx')

def main():
    print("🔍 Spouštím diagnostiku přesnosti AI detekcí (Python)...")
    
    query_url = f"{SUPABASE_URL}/rest/v1/pickups?is_analyzed=eq.true&photo_url=not.is.null&select=id,photo_url,count,nickname,analysis_json"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f"Bearer {SUPABASE_KEY}"
    }
    
    try:
        response = requests.get(query_url, headers=headers)
        if response.status_code != 200:
            print(f"❌ Chyba dotazu do Supabase: Status {response.status_code}")
            return
            
        pickups = response.json()
        print(f"📋 Celkem nalezeno {len(pickups)} analyzovaných záznamů s fotografií.")
        
        reports = []
        total_cans = 0
        total_unrecognized = 0
        
        for p in pickups:
            analysis_json = p.get('analysis_json', [])
            if not isinstance(analysis_json, list):
                analysis_json = []
                
            user_count = p.get('count', 0)
            
            # Spočítej nerozpoznané (brand 'Nerozpoznáno', 'Unknown', 'Neznámá')
            unrecognized = sum(1 for c in analysis_json if c.get('brand') in ['Nerozpoznáno', 'Unknown', 'Neznámá'])
            total_cans += len(analysis_json)
            total_unrecognized += unrecognized
            
            if unrecognized > 0 or len(analysis_json) != user_count:
                issues = [c.get('detection_issue') for c in analysis_json if c.get('detection_issue')]
                reports.append({
                    'id': p.get('id'),
                    'nickname': p.get('nickname'),
                    'userCount': user_count,
                    'aiCount': len(analysis_json),
                    'unrecognizedCount': unrecognized,
                    'percentUnrecognized': round((unrecognized / max(len(analysis_json), 1)) * 100),
                    'photoUrl': p.get('photo_url'),
                    'brands': ", ".join([c.get('brand', 'Neznámá') for c in analysis_json]),
                    'issues': ", ".join(issues) if issues else None
                })
                
        # Seřazení podle počtu nerozpoznaných
        reports.sort(key=lambda x: x['unrecognizedCount'], reverse=True)
        
        print("\n=================== STATISTIKA PŘESNOSTI ===================")
        print(f"Celkem analyzovaných plechovek: {total_cans} ks")
        print(f"Celkem nerozpoznaných (Unknown): {total_unrecognized} ks ({round((total_unrecognized / max(total_cans, 1)) * 100)} %)")
        print(f"Záznamy s detekčními problémy: {len(reports)} z {len(pickups)}")
        print("============================================================\n")
        
        if len(reports) == 0:
            print("✅ Žádné problémy s detekcí nebyly nalezeny. AI rozpoznala všechny značky dokonale!")
            return
            
        print("Seznam problematických úlovků (seřazeno podle chybovosti):")
        for r in reports:
            print(f"\n📦 Záznam ID: {r['id']} | Sběrač: {r['nickname']}")
            print(f"   - Uživatel nahlásil: {r['userCount']} ks | AI detekovala: {r['aiCount']} ks")
            print(f"   - Nerozpoznané značky: {r['unrecognizedCount']} ks ({r['percentUnrecognized']} %)")
            print(f"   - Detekované značky: [ {r['brands']} ]")
            if r['issues']:
                print(f"   - ⚠️ Důvod nedetekování (z AI): {r['issues']}")
            print(f"   - 📸 Odkaz na fotku: {r['photoUrl']}")
            
    except Exception as e:
        print(f"❌ Kritická chyba při provádění diagnostiky: {str(e)}")

if __name__ == '__main__':
    main()
