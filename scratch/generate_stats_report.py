# -*- coding: utf-8 -*-
import os
import sys
import json
import random
import requests

# Skript pro výpočet statistik, tvorbu HTML reportu s grafy a generování "Víte, že..." zajímavostí (Python verze)
# Spuštění: GEMINI_API_KEY="váš_klíč_zde" python3 scratch/generate_stats_report.py

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://dxlyjugmeucevosmhage.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'sb_publishable_CR-YuABHB1SvPK6b6sz-WQ_Q6y_8iKx')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("⚠️ Upozornění: Chybí GEMINI_API_KEY. Skript vygeneruje HTML report s grafy, ale přeskočí AI texty pro sítě.")

# 30 ověřených faktů o plechovkách (integrovaných přímo ve skriptu)
VERIFIED_FACTS = [
    {"cat": "Ekologie", "txt": "Hliníková plechovka se v přírodě rozkládá až 500 let."},
    {"cat": "Ekologie", "txt": "Odhozené plechovky v přírodě fungují jako smrtící past pro drobný hmyz a ještěrky, kteří vlezou dovnitř za zbytkem sladkého pití a už nedokážou vylézt ven."},
    {"cat": "Ekologie", "txt": "Pohozená plechovka v trávě může při sečení luk rozsekat zemědělskou techniku a její ostré střepy pak v krmivu usmrtit dobytek (vnitřní krvácení)."},
    {"cat": "Ekologie", "txt": "Hliník se sice v přírodě nerozpustí, ale lak a barvy z pohozené plechovky se postupně loupou a kontaminují mikročásticemi půdu."},
    {"cat": "Ekologie", "txt": "Volně pohozené plechovky s ostrými hranami jsou v lesích jednou z nejčastějších příčin řezných poranění divoké zvěře."},
    {"cat": "Ekologie", "txt": "Výroba hliníku z panenské suroviny (bauxitu) extrémně devastuje deštné pralesy, kde se tato ruda nejčastěji těží (Austrálie, Brazílie, Guinea)."},
    {"cat": "Ekologie", "txt": "Pohozená plechovka na přímém slunci dokáže fungovat jako lupa a může odrazem paprsků způsobit lesní požár."},
    {"cat": "Ekologie", "txt": "Lidstvo ročně vyhodí na skládky a do přírody tolik hliníku, že by to stačilo na obnovu celého světového leteckého parku."},
    {"cat": "Ekologie", "txt": "Hliník je sice třetím nejrozšířenějším prvkem v zemské kůře, ale v čisté formě se v přírodě vůbec nevyskytuje a jeho výroba je extrémně náročná."},
    {"cat": "Ekologie", "txt": "Sesbíráním plechovek z přírody nezachraňujeme jen vzhled lesa, ale vracíme do oběhu cennou surovinu, kvůli které se nemusí drancovat planeta."},
    
    {"cat": "Recyklace", "txt": "Hliník je stoprocentně a nekonečně recyklovatelný, aniž by při tom ztratil cokoli ze své kvality."},
    {"cat": "Recyklace", "txt": "Recyklace hliníkové plechovky ušetří až 95 % energie ve srovnání s výrobou nové plechovky z bauxitu."},
    {"cat": "Recyklace", "txt": "Energie ušetřená recyklací jediné plechovky dokáže pohánět běžnou televizi až po dobu tří hodin."},
    {"cat": "Recyklace", "txt": "Zrecyklovaná plechovka se dokáže vrátit zpět do regálu obchodu jako úplně nová už za pouhých 60 dní."},
    {"cat": "Recyklace", "txt": "Recyklace hliníku vyprodukuje o 95 % méně emisí CO2 než jeho primární výroba."},
    {"cat": "Recyklace", "txt": "Přibližně 75 % veškerého hliníku, který byl kdy na světě vyroben, se díky recyklaci používá dodnes."},
    {"cat": "Recyklace", "txt": "Energie ušetřená recyklací jedné plechovky dokáže udržet v chodu průměrný notebook déle než tři hodiny."},
    {"cat": "Recyklace", "txt": "Vytěžit tunu hliníku vyžaduje zhruba čtyřikrát více energie než vytěžit tunu mědi."},
    {"cat": "Recyklace", "txt": "Recyklace jedné tuny hliníku ušetří víc než 4 tuny bauxitové rudy a tuny chemických látek."},
    {"cat": "Recyklace", "txt": "Recyklací pouhých deseti plechovek ušetříte tolik energie, kolik spotřebuje moderní LED žárovka za stovky hodin svícení."},
    
    {"cat": "Historie", "txt": "Úplně první plechovky na potraviny (z oceli) byly tak masivní, že návod doporučoval otevírat je dlátem a kladivem."},
    {"cat": "Historie", "txt": "Mechanický otvírák na plechovky byl vynalezen až skoro 50 let po samotné plechovce."},
    {"cat": "Historie", "txt": "První celohliníková nápojová plechovka byla vyrobena až v roce 1958 společností Primo Beer."},
    {"cat": "Historie", "txt": "Dnešní hliníkové plechovky jsou díky technologickému pokroku o více než 30 % lehčí než před třicet lety."},
    {"cat": "Historie", "txt": "Stěna moderní hliníkové plechovky je tenčí než lidský vlas (kolem 0,09 mm), a přesto bezpečně udrží tlak syceného nápoje."},
    {"cat": "Historie", "txt": "V 19. století byl čistý hliník tak vzácný a drahý, že z něj francouzský císař Napoleon III. nechal vyrobit příbory pro nejvzácnější hosty, zatímco ostatní jedli na zlatě."},
    {"cat": "Historie", "txt": "Integrované otevírací očko (které z plechovky neodpadne) bylo vynalezeno až v roce 1989, aby se zabránilo zbytečnému pohození malých ostrých plíšků."},
    {"cat": "Historie", "txt": "První nápojové plechovky měly ploché vršky a lidé do nich museli prorážet dvě díry speciálním propichovátkem, aby se z nich dalo pít."},
    {"cat": "Historie", "txt": "Na světě se každou minutu spotřebuje a vyhodí zhruba 400 000 nápojových plechovek."},
    {"cat": "Historie", "txt": "Při posbírání 1 000 000 plechovek zachráníme zhruba 16 tun čistého hliníku, který může znovu sloužit."}
]

def generate_fun_facts(stats_summary):
    # V roce 2026 používáme kombinaci modelů pro obcházení limitů bezplatného účtu
    models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash"]
    
    # Vybereme náhodně 5 ověřených faktů pro AI
    shuffled_facts = random.sample(VERIFIED_FACTS, 5)
    
    notebook_hours = round(stats_summary['overall']['total_energy_saved_kwh'] / 0.03)
    most_common_brand = stats_summary['brands_breakdown'][0]['name'] if stats_summary['brands_breakdown'] else 'Neznámá'
    most_common_brand_count = stats_summary['brands_breakdown'][0]['count'] if stats_summary['brands_breakdown'] else 0

    facts_prompt_list = []
    for i, f in enumerate(shuffled_facts):
        facts_prompt_list.append(f"{i+1}. [{f['cat']}] {f['txt']}")
    facts_prompt_str = "\n".join(facts_prompt_list)

    prompt = f"""Jsi kreativní copywriter pro ekologický a komunitní projekt "Milion Plechovek". 
Tvým úkolem je vytvořit 5 velmi zajímavých a chytlavých příspěvků (nebo scénářů pro krátká videa) na sociální sítě.

U každého příspěvku musíš SPOJIT reálná statistická data našeho projektu s obecnými ověřenými fakty o recyklaci/ekologii. 

Zde jsou reálná data z naší databáze:
- Celkem nasbíraných plechovek: {stats_summary['overall']['total_cans_collected']} ks
- Celková váha hliníku: {stats_summary['overall']['total_weight_kg']} kg
- Celkem ušetřeno energie: {stats_summary['overall']['total_energy_saved_kwh']} kWh (což odpovídá {notebook_hours} hodinám chodu notebooku nebo svícení LED žárovky)
- Celkem ušetřeno peněz (hodnota kovu): {stats_summary['overall']['total_money_saved_czk']} Kč
- Celkem ušetřeno emisí CO2: {stats_summary['overall']['total_co2_saved_kg']} kg
- Nejčastější značka: {most_common_brand} (celkem {most_common_brand_count} ks)

Zde je 5 vybraných ověřených faktů, které použij jako inspiraci k propojení s našimi čísly:
{facts_prompt_str}

Požadavky:
- Používej silné české hooky na začátku (např. "Nikdy bych nevěřil...", "Tipnuli byste si...", "Netušil jsem...").
- Propoj teorii (např. recyklace ušetří 95 % energie) s naší praxí (např. našich nasbíraných X plechovek ušetřilo Y kWh, což by pohánělo televizi po dobu Z let).
- U každého příspěvku uveď krátký "Vizuální tip" pro video.
- Výstup napiš česky a strukturovaně."""

    request_body = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    for model in models:
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        
        try:
            response = requests.post(endpoint, json=request_body, headers={'Content-Type': 'application/json'}, timeout=60)
            
            if response.status_code == 429 and ("limit: 0" in response.text or "limit: 0.0" in response.text):
                print(f"  ⚠️ Model {model} má limit 0. Přepínám na další model pro generování Reels textů...")
                continue
                
            if response.status_code != 200:
                print(f"  ⚠️ Volání modelu {model} selhalo (status {response.status_code}). Zkouším další...")
                continue
                
            result = response.json()
            return result['candidates'][0]['content']['parts'][0]['text']
        except Exception as e:
            print(f"  ❌ Chyba při volání modelu {model}: {str(e)}")
            continue

    raise Exception("Všechny modely Gemini selhaly při generování Reels textů.")

def aggregate_data(pickups):
    total_cans = 0
    analyzed_cans_count = 0
    total_weight_g = 0.0
    total_energy_kwh = 0.0
    total_money_czk = 0.0
    total_co2_kg = 0.0
    
    brands = {}
    volumes = {}
    teams = {}
    timeline = {}
    user_sums = {}

    for p in pickups:
        count = p.get('count') or 1
        total_cans += count

        # Uživatelé
        nick = p.get('nickname') or 'Anonymní Sběrač'
        user_sums[nick] = user_sums.get(nick, 0) + count

        # Vytvoření časové osy (YYYY-MM)
        if p.get('created_at'):
            date_str = p['created_at'][:7]
            timeline[date_str] = timeline.get(date_str, 0) + count

        if p.get('is_analyzed'):
            analyzed_cans_count += count
            total_weight_g += float(p.get('aluminum_weight_g') or 0)
            total_energy_kwh += float(p.get('energy_saved_kwh') or 0)
            total_money_czk += float(p.get('money_saved_czk') or 0)
            total_co2_kg += float(p.get('co2_saved_kg') or 0)

            cans_array = p.get('analysis_json') or []
            for can in cans_array:
                brand = can.get('brand') or 'Nerozpoznáno'
                if brand in ['Unknown', 'unknown', '']:
                    brand = 'Nerozpoznáno'
                vol = can.get('volume_liters') or 'Unknown'

                brands[brand] = brands.get(brand, 0) + 1
                volumes[vol] = volumes.get(vol, 0) + 1

        if p.get('team_code'):
            team = p['team_code']
            teams[team] = teams.get(team, 0) + count

    # Seskupení drobností
    raw_brands = [{'name': name, 'count': count} for name, count in brands.items()]
    raw_brands.sort(key=lambda x: x['count'], reverse=True)

    top_brands = []
    other_count = 0
    
    for index, b in enumerate(raw_brands):
        if index < 15 and b['count'] >= 2:
            top_brands.append({
                'name': b['name'],
                'count': b['count'],
                'percentage': round((b['count'] / (analyzed_cans_count or 1)) * 100, 1)
            })
        else:
            other_count += b['count']

    if other_count > 0:
        top_brands.append({
            'name': "Ostatní značky",
            'count': other_count,
            'percentage': round((other_count / (analyzed_cans_count or 1)) * 100, 1)
        })

    full_brands_list = []
    for index, b in enumerate(raw_brands):
        full_brands_list.append({
            'name': b['name'],
            'count': b['count'],
            'percentage': round((b['count'] / (analyzed_cans_count or 1)) * 100, 1)
        })

    # Objem
    sorted_volumes = []
    for size, count in volumes.items():
        size_str = 'Neznámý' if size == 'Unknown' else f"{size} L"
        sorted_volumes.append({'size': size_str, 'count': count})
    # Třídíme tak, aby Neznámý byl vždy na konci, a ostatní podle count sestupně
    sorted_volumes.sort(key=lambda x: (x['size'] == 'Neznámý', -x['count']))

    # Týmy
    sorted_teams = [{'code': code, 'count': count} for code, count in teams.items()]
    sorted_teams.sort(key=lambda x: x['count'], reverse=True)

    # Uživatelé - oprava ReferenceError: sortedUsers
    sorted_users = [{'nick': nick, 'count': count} for nick, count in user_sums.items()]
    sorted_users.sort(key=lambda x: x['count'], reverse=True)

    # Časová osa
    sorted_timeline = [{'date': date, 'count': count} for date, count in timeline.items()]
    sorted_timeline.sort(key=lambda x: x['date'])

    return {
        'overall': {
            'total_cans_collected': total_cans,
            'analyzed_cans_count': analyzed_cans_count,
            'total_weight_kg': round(total_weight_g / 1000.0, 2),
            'total_energy_saved_kwh': round(total_energy_kwh, 1),
            'total_money_saved_czk': round(total_money_czk, 0),
            'total_co2_saved_kg': round(total_co2_kg, 1)
        },
        'brands_breakdown': top_brands,
        'all_brands': full_brands_list,
        'raw_brands_count': len(raw_brands),
        'volumes_breakdown': sorted_volumes,
        'teams_leaderboard': sorted_teams,
        'users_leaderboard': sorted_users,
        'timeline': sorted_timeline
    }

def generate_html_report(stats, output_path):
    html_content = f"""<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report - Milion Plechovek</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800;900&display=swap" rel="stylesheet">
    <style>
        body {{ font-family: 'Montserrat', sans-serif; background-color: #0f172a; color: #f8fafc; }}
        .glass-card {{ background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); }}
    </style>
</head>
<body class="p-6 md:p-12">
    <div class="max-w-6xl mx-auto">
        <!-- Hlavička -->
        <header class="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-slate-800 gap-4">
            <div class="text-center md:text-left">
                <h1 class="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400">MILION PLECHOVEK</h1>
                <p class="text-slate-400 text-sm mt-1">Kompletní statistický report projektu a dopadu na životní prostředí</p>
            </div>
            <div class="glass-card px-6 py-3 rounded-2xl text-center">
                <span class="text-slate-400 text-xs font-bold block uppercase tracking-wider">Celkem nasbíráno</span>
                <span class="text-3xl font-black text-emerald-400">{stats['overall']['total_cans_collected']:,} ks</span>
            </div>
        </header>

        <!-- Ekologické karty -->
        <section class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <div class="glass-card p-5 rounded-2xl relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 text-7xl opacity-5 select-none">⚖️</div>
                <h3 class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Hmotnost hliníku</h3>
                <p class="text-3xl font-extrabold mt-2 text-emerald-400">{stats['overall']['total_weight_kg']} kg</p>
                <p class="text-slate-400 text-[10px] mt-1">zachráněného z přírody</p>
            </div>
            <div class="glass-card p-5 rounded-2xl relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 text-7xl opacity-5 select-none">⚡</div>
                <h3 class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Ušetřená energie</h3>
                <p class="text-3xl font-extrabold mt-2 text-teal-400">{stats['overall']['total_energy_saved_kwh']:,} kWh</p>
                <p class="text-slate-400 text-[10px] mt-1">odpovídá {round(stats['overall']['total_energy_saved_kwh'] / 0.03):,} hod. notebooku</p>
            </div>
            <div class="glass-card p-5 rounded-2xl relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 text-7xl opacity-5 select-none">🌱</div>
                <h3 class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Ušetřeno CO₂ emisí</h3>
                <p class="text-3xl font-extrabold mt-2 text-indigo-400">{stats['overall']['total_co2_saved_kg']:,} kg</p>
                <p class="text-slate-400 text-[10px] mt-1">uhlíková stopa, která nevznikla</p>
            </div>
            <div class="glass-card p-5 rounded-2xl relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 text-7xl opacity-5 select-none">💰</div>
                <h3 class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Hodnota ve sběrně</h3>
                <p class="text-3xl font-extrabold mt-2 text-sky-400">{stats['overall']['total_money_saved_czk']:,} Kč</p>
                <p class="text-slate-400 text-[10px] mt-1">odhad (20 Kč/kg)</p>
            </div>
        </section>

        <!-- Grafy -->
        <section class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <!-- Graf značek -->
            <div class="glass-card p-6 rounded-2xl">
                <h3 class="text-lg font-bold mb-4 text-slate-300">Zastoupení značek plechovek</h3>
                <div class="relative w-full aspect-square max-h-[360px] mx-auto">
                    <canvas id="brandsChart"></canvas>
                </div>
            </div>
            
            <!-- Graf velikostí -->
            <div class="glass-card p-6 rounded-2xl flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-bold mb-4 text-slate-300">Distribuce objemu (velikosti)</h3>
                    <div class="relative w-full aspect-video max-h-[260px] mx-auto">
                        <canvas id="volumesChart"></canvas>
                    </div>
                </div>
                <!-- Doplňkové info -->
                <div class="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4 text-center">
                    <div class="p-3 bg-slate-800/40 rounded-xl">
                        <span class="text-slate-400 text-xs">Počet unikátních značek</span>
                        <span class="text-2xl font-bold block text-emerald-400">{stats['raw_brands_count']}</span>
                    </div>
                    <div class="p-3 bg-slate-800/40 rounded-xl">
                        <span class="text-slate-400 text-xs">Analyzováno AI</span>
                        <span class="text-2xl font-bold block text-teal-400">{stats['overall']['analyzed_cans_count']} ks</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Spodní sekce (Vývoj v čase) -->
        <section class="glass-card p-6 rounded-2xl mb-8">
            <h3 class="text-lg font-bold mb-4 text-slate-300">Historie sběrů (po měsících)</h3>
            <div class="relative w-full aspect-auto h-[260px]">
                <canvas id="timelineChart"></canvas>
            </div>
        </section>

        <!-- Žebříčky (Týmy & Jednotlivci) -->
        <section class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Tabulka Týmů -->
            <div class="glass-card p-6 rounded-2xl">
                <h3 class="text-lg font-bold mb-4 text-slate-300">Žebříček Tříd / Týmů (TOP 10)</h3>
                <ul class="space-y-2">
                    {"".join([f'''
                        <li class="flex justify-between items-center bg-slate-800/30 px-4 py-2 rounded-xl border border-slate-700/30">
                            <span class="flex items-center gap-2">
                                <span class="text-xs text-slate-500 font-bold w-4">{idx + 1}.</span>
                                <span class="font-semibold text-slate-300">{team['code']}</span>
                            </span>
                            <span class="text-emerald-400 font-extrabold text-sm">{team['count']} ks</span>
                        </li>
                    ''' for idx, team in enumerate(stats['teams_leaderboard'][:10])])}
                    {'''<li class="text-slate-500 text-sm text-center py-6">Zatím žádné týmy.</li>''' if not stats['teams_leaderboard'] else ''}
                </ul>
            </div>

            <!-- Tabulka Jednotlivců -->
            <div class="glass-card p-6 rounded-2xl">
                <h3 class="text-lg font-bold mb-4 text-slate-300">Žebříček Jednotlivců (TOP 10)</h3>
                <ul class="space-y-2">
                    {"".join([f'''
                        <li class="flex justify-between items-center bg-slate-800/30 px-4 py-2 rounded-xl border border-slate-700/30">
                            <span class="flex items-center gap-2">
                                <span class="text-xs text-slate-500 font-bold w-4">{idx + 1}.</span>
                                <span class="font-semibold text-slate-300">{user['nick']}</span>
                            </span>
                            <span class="text-emerald-400 font-extrabold text-sm">{user['count']} ks</span>
                        </li>
                    ''' for idx, user in enumerate(stats['users_leaderboard'][:10])])}
                    {'''<li class="text-slate-500 text-sm text-center py-6">Zatím žádní sběratelé.</li>''' if not stats['users_leaderboard'] else ''}
                </ul>
            </div>
        </section>
        
        <!-- Kompletní seznam značek -->
        <section class="glass-card p-6 rounded-2xl mt-8">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-bold text-slate-300">Kompletní adresář značek plechovek</h3>
                <span class="text-xs text-slate-400 font-semibold bg-slate-800 px-3 py-1 rounded-full">{len(stats['all_brands'])} unikátních typů</span>
            </div>
            <div class="max-h-[300px] overflow-y-auto pr-2">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                            <th class="py-2.5 w-16">Pořadí</th>
                            <th class="py-2.5">Značka</th>
                            <th class="py-2.5 text-right w-24">Počet (ks)</th>
                            <th class="py-2.5 text-right w-24">Podíl</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm text-slate-300">
                        {"".join([f'''
                            <tr class="border-b border-slate-800/40 hover:bg-slate-800/20">
                                <td class="py-2 font-mono text-slate-500">{idx + 1}.</td>
                                <td class="py-2 font-semibold text-slate-200">{brand['name']}</td>
                                <td class="py-2 text-right font-bold text-emerald-400">{brand['count']} ks</td>
                                <td class="py-2 text-right text-slate-400">{brand['percentage']} %</td>
                            </tr>
                        ''' for idx, brand in enumerate(stats['all_brands'])])}
                    </tbody>
                </table>
            </div>
        </section>
        
        <footer class="text-center text-slate-600 text-xs mt-12 pt-6 border-t border-slate-900">
            Projekt Milion Plechovek | Automaticky vygenerovaný report
        </footer>
    </div>

    <!-- Skripty pro inicializaci grafů -->
    <script>
        // Graf značek (Doughnut)
        const brandsCtx = document.getElementById('brandsChart').getContext('2d');
        const brandsData = {json.dumps(stats['brands_breakdown'])};
        new Chart(brandsCtx, {{
            type: 'doughnut',
            data: {{
                labels: brandsData.map(b => b.name),
                datasets: [{{
                    data: brandsData.map(b => b.count),
                    backgroundColor: [
                        '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', 
                        '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', 
                        '#f43f5e', '#f97316', '#eab308', '#84cc16', '#64748b'
                    ],
                    borderWidth: 2,
                    borderColor: '#1e293b'
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {{
                    legend: {{
                        position: 'right',
                        labels: {{ color: '#94a3b8', font: {{ family: 'Montserrat', size: 10, weight: 600 }} }}
                    }}
                }}
            }}
        }});

        // Graf velikostí (Bar)
        const volumesCtx = document.getElementById('volumesChart').getContext('2d');
        const volumesData = {json.dumps(stats['volumes_breakdown'])};
        new Chart(volumesCtx, {{
            type: 'bar',
            data: {{
                labels: volumesData.map(v => v.size),
                datasets: [{{
                    label: 'Počet kusů',
                    data: volumesData.map(v => v.count),
                    backgroundColor: '#14b8a6',
                    borderRadius: 8
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                scales: {{
                    x: {{ ticks: {{ color: '#94a3b8' }}, grid: {{ display: false }} }},
                    y: {{ ticks: {{ color: '#94a3b8' }}, grid: {{ color: '#334155' }} }}
                }},
                plugins: {{
                    legend: {{ display: false }}
                }}
            }}
        }});

        // Graf časové osy (Line)
        const timelineCtx = document.getElementById('timelineChart').getContext('2d');
        const timelineData = {json.dumps(stats['timeline'])};
        new Chart(timelineCtx, {{
            type: 'line',
            data: {{
                labels: timelineData.map(t => t.date),
                datasets: [{{
                    label: 'Nasbíráno plechovek',
                    data: timelineData.map(t => t.count),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 3
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                scales: {{
                    x: {{ ticks: {{ color: '#94a3b8' }}, grid: {{ display: false }} }},
                    y: {{ ticks: {{ color: '#94a3b8' }}, grid: {{ color: '#334155' }} }}
                }},
                plugins: {{
                    legend: {{ display: false }}
                }}
            }}
        }});
    </script>
</body>
</html>"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

def main():
    print("🚀 Spouštím generování statistik...")
    
    try:
        query_url = f"{SUPABASE_URL}/rest/v1/pickups?select=count,is_analyzed,analysis_json,aluminum_weight_g,energy_saved_kwh,money_saved_czk,co2_saved_kg,team_code,nickname,created_at"
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f"Bearer {SUPABASE_KEY}"
        }
        
        response = requests.get(query_url, headers=headers, timeout=30)
        if response.status_code != 200:
            raise Exception(f"Supabase query failed: Status {response.status_code}")

        pickups = response.json()
        print(f"📊 Staženo {len(pickups)} záznamů o sběrech.")

        if len(pickups) == 0:
            print("⚠️ Databáze je prázdná. Report nelze generovat.")
            return

        stats = aggregate_data(pickups)
        
        # Cesta pro uložení HTML reportu
        script_dir = os.path.dirname(os.path.abspath(__file__))
        report_path = os.path.join(script_dir, 'report.html')
        generate_html_report(stats, report_path)
        print(f"\n📈 Nádherný HTML report s interaktivními grafy byl uložen do:")
        print(f"   👉 file://{report_path}")
        print("   (Stačí na soubor dvakrát kliknout na vašem Macu a otevře se v Safari/Chrome)")

        print(f"\n==================================================")
        print(f"🧠 GENERUJI PŘÍSPĚVKY NA SOCIÁLNÍ SÍTĚ POMOCÍ AI...")
        print(f"==================================================\n")

        if GEMINI_API_KEY:
            try:
                facts_text = generate_fun_facts(stats)
                print(facts_text)
            except Exception as ai_err:
                print(f"⚠️ Nepodařilo se vygenerovat AI příspěvky na sociální sítě kvůli dočasnému limitu API (429).")
                print(f"   (HTML report s grafy byl ale úspěšně vygenerován!)")
                print(f"   Tip: Zkuste skript spustit znovu za 1 minutu, až se uvolní kvóta.")
        else:
            print("ℹ️ Generování Reels/Instagram textů přeskočeno (chybí GEMINI_API_KEY).")

        print(f"\n==================================================")
        print(f"✅ Skript úspěšně dokončen.")

    except Exception as e:
        print("❌ Kritická chyba skriptu:", str(e))

if __name__ == '__main__':
    main()
