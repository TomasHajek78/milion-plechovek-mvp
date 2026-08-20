# Milion Plechovek - AI Paměť Projektu

Tento soubor slouží jako přenositelná "paměť" pro umělou inteligenci. Ať už připojíte disk k jakémukoliv počítači, stačí AI asistentovi říct: **"Přečti si soubor AI_Project_Context.md"** a asistent okamžitě pochopí, v jakém stavu projekt je a co se dělalo naposledy.

## Architektura a Technologie
* **Aplikace:** Vanilla JS, HTML, CSS (Tailwind přes CDN). PWA (Progressive Web App).
* **Databáze:** Supabase (PostgreSQL). Tabulka `pickups`.
* **Klíčové knihovny:** Chart.js pro grafy, Tailwind CSS pro stylování, Lucide ikony.
* **AI Analýza:** Využíváme Gemini 2.0 Flash (OpenAI Vision dříve testováno) pro rozpoznávání značek a stavu plechovek z fotek. Analýza může běžet asynchronně přes cron job.

## Pravidla a Mantinely
1. **Synchronizace Administrace:** Uživatel provádí 90 % správy a korekce záznamů z klidu počítače pomocí vygenerovaného souboru `report.html`. Mobilní administrace slouží jen jako nouzovka do terénu. **Pokud vytváříme novou funkci pro úpravu/mazání v mobilní aplikaci (`app.js`), MUSÍME ji vždy paralelně zrcadlit a naimplementovat i do skriptu `generate_stats_report.py`**, aby se propisovala do vygenerovaných HTML reportů.

## Co jsme naposledy řešili (20. Srpen 2026)
1. **Navrácení na záchytný bod (Checkpoint 17:52 - Commit `749d676`):**
   - Na základě přání Tomáše je aplikace **naživo vrácena do bezpečného záchytného bodu ze 17:52**.
   - Foťák a galerie jsou pro všechny sběrače zcela otevřené (bez zamknutí).
   - V `authModal` v `app.html` je E-mailové přihlášení umístěno na samém vrcholu v zeleném boxu s odznáčkem **`⭐ DOPORUČENÉ`** a textem **`Přihlášení bez hesla (Magic Link)`**.
2. **Přihlášení & E-mailové odesílání (Plán pro zítřek):**
   - V Supabase nastaveno přesměrování přímo na PWA aplikaci `https://milion-plechovek-mvp.vercel.app/app.html`.
   - V `app.js` naimplementován automatický lapač tokenu (`#access_token`), který uživatele po prokliku z e-mailu ihned trvale přihlásí a zobrazí přivítání.
   - **Zítřejší úkol:** Zprovoznit bezplatnou službu **Resend.com** (nebo Brevo.com) pro doručování e-mailů, čímž okamžitě odpadne hodinový limit 2 mailů ze základní Supabase i problémy s WEDOS SMTP.
3. **Přejmenování značky `Targa` -> `Targa Florio`:**
   - Proveden update všech starých záznamů v databázi Supabase na `Targa Florio` a přidána pravidla v `scratch/generate_stats_report.py` a `scratch/unify_new_brands.py`.
4. **Pravidlo Max 20 plechovek na fotku:**
   - Naimplementována striktní validace vstupu max 20 ks na fotku s hláškou `⚠️ Maximální počet plechovek na jedné fotce je 20. Prosím rozdělte váš velký úlovek na více fotek.`
5. **Gamifikace (15 Odznaků & Mapa Notifikací):**
   - Schválen kompletní systém 15 automatických odznaků (První zářez, Nováček 10ks, Rytíř 100ks, Ochránce přírody 500ks, Zlatý 1000ks, Hliníkový král 5000ks, Hrdina Milionu 10000ks, Energy Master, Pivní štamgast, Retro limonádník, Lokal patriot, Městská elektrárna, OG Sběrač 2026).
   - Vygenerován první smaltovaný retro odznak `OG Sběrač 2026` (`odznak_og_sberac_2026.jpg`).
   - Definována mapa 4 push notifikací (3 dny neaktivity, 20 ks do odznaku, 10 ks do 100 kWh elektrárny, komunitní úspěchy v obci).

## Důležité soubory
* `app.html` & `app.js`: PWA Aplikace pro sběrače.
* `scratch/report.html`: Hlavní dashboard a administrace (obsahuje v sobě CSS, JS i grafy). 
* `scratch/generate_stats_report.py`: Skript pro prvotní vygenerování HTML dashboardu na základě aktuálních dat.
* `scratch/analyze_pending_pickups.py` (a `.js` verze): Skripty pro dávkové zpracování neanalyzovaných fotek pomocí AI.
* `scratch/Spustit_Dashboard.command`: Zástupce pro uživatele Macu (dvojklik) pro spuštění lokálního serveru a otevření dashboardu, čímž se obchází ochrana prohlížeče proti CORS.
* `Business_Vize_a_Rizika.md`: Shromážděné byznysové nápady pro B2B model (obce, školy), monetizaci a analýzu budoucích rizik (např. zavedení zálohového systému v ČR).

## Plány do budoucna (Roadmapa verze 2.0)
* **Bezheslové přihlašování přes Resend.com (Plán na zítra):** Zprovoznit Resend.com pro bleskové odesílání přihlašovacích odkazů (300 mailů/den zdarma) bez limitů.
* **Plná registrace & Zámek foťáku:** Po otestování s Tomášem aktivovat zamknutí foťáku s hláškou `🔑 Pro uložení úlovku a započítání do žebříčku se prosím přihlas do aplikace.`
* **Staging prostředí:** Založení izolovaného projektu na Supabase (`milion-plechovek-staging`) pro bezpečné penetrační testování s lidmi z komunity před vydáním na produkci.

### Přístupové údaje a Hesla
- **Heslo do administrace v aplikaci:** `milion2026`
- **Heslo pro smazání/korekci záznamu v databázi (RPC heslo):** `tomasadmin123` (lokálně uložené v `sessionStorage` administrátora po prvním zadání)
* Sledování a pročištění `analysis_json` objektů (aby neobsahovaly zbytečná data jako neexistující `is_verified` atributy).
