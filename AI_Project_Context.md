# Milion Plechovek - AI Paměť Projektu

Tento soubor slouží jako přenositelná "paměť" pro umělou inteligenci. Ať už připojíte disk k jakémukoliv počítači, stačí AI asistentovi říct: **"Přečti si soubor AI_Project_Context.md"** a asistent okamžitě pochopí, v jakém stavu projekt je a co se dělalo naposledy.

## Architektura a Technologie
* **Aplikace:** Vanilla JS, HTML, CSS (Tailwind přes CDN). PWA (Progressive Web App).
* **Databáze:** Supabase (PostgreSQL). Tabulka `pickups`.
* **Klíčové knihovny:** Chart.js pro grafy, Tailwind CSS pro stylování, Lucide ikony.
* **AI Analýza:** Využíváme Gemini 2.0 Flash (OpenAI Vision dříve testováno) pro rozpoznávání značek a stavu plechovek z fotek. Analýza může běžet asynchronně přes cron job.

## Pravidla a Mantinely
1. **Synchronizace Administrace:** Uživatel provádí 90 % správy a korekce záznamů z klidu počítače pomocí vygenerovaného souboru `report.html`. Mobilní administrace slouží jen jako nouzovka do terénu. **Pokud vytváříme novou funkci pro úpravu/mazání v mobilní aplikaci (`app.js`), MUSÍME ji vždy paralelně zrcadlit a naimplementovat i do skriptu `generate_stats_report.py`**, aby se propisovala do vygenerovaných HTML reportů.

## Co jsme naposledy řešili (Srpen 2026)
1. **PWA Registrace a Přihlašování:** V `app.html` a `app.js` zprovozněno bezheslové přihlašování přes Supabase Magic Link OTP e-mail. Na webu `index.html` tlačítka navádí s parametry `?signup=true` pro automatické otevření modal okna. Spodní navigační lišta vyladěna na 5 symetrických ikon (Domů, Mapa, Žebříček, Nastavení, Profil).
2. **Připravovaný úkol (Web index.html - Sekce Aplikace):** Vytvořit novou pod-rubriku pod sekcí Aplikace obsahující galerii 6 fotek "Jak fotky NEMĚLY vypadat" a edukativní text vysvětlující správné focení a datový/analytický rozměr projektu (mapování značek, znečištěných lokalit a komplexní monitorovací nástroj).


## Důležité soubory
* `scratch/report.html`: Hlavní dashboard a administrace (obsahuje v sobě CSS, JS i grafy). 
* `scratch/generate_stats_report.py`: Skript pro prvotní vygenerování HTML dashboardu na základě aktuálních dat.
* `scratch/analyze_pending_pickups.py` (a `.js` verze): Skripty pro dávkové zpracování neanalyzovaných fotek pomocí AI.
* `scratch/Spustit_Dashboard.command`: Zástupce pro uživatele Macu (dvojklik) pro spuštění lokálního serveru a otevření dashboardu, čímž se obchází ochrana prohlížeče proti CORS.
* `Business_Vize_a_Rizika.md`: Shromážděné byznysové nápady pro B2B model (obce, školy), monetizaci a analýzu budoucích rizik (např. zavedení zálohového systému v ČR).

## Plány do budoucna (Roadmapa verze 2.0)
* **Bezheslové přihlašování (Email OTP):** Společně s komunitou (Spiedy, Pavel) bylo schváleno nasazení přihlašování přes e-mail. Uživatel zadá přezdívku a e-mail, Supabase Auth pošle 6místný kód a uživatel je trvale přihlášen. To zabrání krádeži jmen boty a umožní synchronizaci dat napříč zařízeními.
* **Synchronní AI brána (Edge Functions):** Zápisy z mobilu do DB a Storage budou zcela zakázány. Vše půjde přes Edge Function, která nejdříve provede AI analýzu a kontrolu NSFW. Pokud AI fotku plechovky neschválí, záznam se vůbec neuloží. Tím udržíme databázi 100% čistou.
* **Robustní offline fronta:** Zápisy v IndexedDB v mobilu se vymažou pouze tehdy, když server potvrdí úspěšný zápis (HTTP 200) nebo AI fotku definitivně zamítne (HTTP 400). Při jakékoliv chybě sítě či serveru zůstane fotka bezpečně v mobilu.
* **Ochrana proti duplicitám:** Edge Function bude na základě hashe obrázků (perceptual hashing) blokovat nahrání shodné fotky vícekrát.
* **GDPR shoda:** V registračním okně přibude checkbox se souhlasem se zpracováním e-mailů a odkaz na [zasady_ochrany_soukromi.md](file:///Volumes/LaCie%202025/PROJEKTY%20VAJB/Organiazce%20Tom%C3%A1%C5%A1%20H%C3%A1jek/06_Side_Projekty/Milion_plechovek/MVP_Aplikace/zasady_ochrany_soukromi.md). V nastavení přibude tlačítko pro smazání účtu.
* **Staging prostředí:** Založení izolovaného projektu na Supabase (`milion-plechovek-staging`) pro bezpečné penetrační testování s lidmi z komunity před vydáním na produkci.

### Přístupové údaje a Hesla
- **Heslo do administrace v aplikaci:** `milion2026`
- **Heslo pro smazání/korekci záznamu v databázi (RPC heslo):** `tomasadmin123` (lokálně uložené v `sessionStorage` administrátora po prvním zadání)
* Případné rozšíření Gamifikace (odznaky, achievementy).
* Sledování a pročištění `analysis_json` objektů (aby neobsahovaly zbytečná data jako neexistující `is_verified` atributy).
