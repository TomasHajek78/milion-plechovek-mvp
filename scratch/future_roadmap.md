# Roadmapa budoucího vývoje: Milion Plechovek 🥫♻️

Tento dokument slouží jako paměť projektu pro budoucí nápady, vylepšení a strategické kroky.

---

## 1. Gamifikace a Motivační prvky (Komunita)
*   **Týdenní / Víkendové výzvy (Challenges):**
    *   *Příklad:* „Víkendový lovec“ (nasbírej alespoň 15 plechovek mezi pátkem a nedělí).
    *   *Příklad:* „Čistá stezka“ (přidej 3 různé nálezy na mapu s rozestupem aspoň 100 metrů).
*   **Odznáčky a Úrovně (Badges & Gamification):**
    *   Grafické odznáčky na profilu za milníky: 10 ks (Sběrač nováček), 100 ks (Plechovkový rytíř), 500 ks (Ochránce lesa), 1000+ ks (Hliníkový král).
    *   Speciální odznáčky za sběr za deště, v noci, nebo za sdílení na Instagramu.
*   **Školní ligy a Týmy:**
    *   Možnost zakládat skupiny/týmy (třídy, skautské oddíly, rodiny, firmy).
    *   Meziškolní žebříček: „Která škola v ČR vyčistí nejvíce okolí?“ – skvělý virální potenciál.

---

## 2. Partnerství a Odměny (Sponzoři)
*   **Oslovení výrobců a recyklačních firem:**
    *   *Ball Corporation:* Největší světový výrobce plechovek (má obří moderní závod u Plzně – ideální partner pro CSR).
    *   *Nápojové značky:* Mattoni (prosazuje zálohování), pivovary (Plzeňský Prazdroj, Budvar), výrobci energy drinků (Semtex, Big Shock).
    *   *Iniciativy:* Projekt „Každá plechovka se počítá“ (Every Can Counts) – celoevropská iniciativa na podporu recyklace hliníku.
*   **Odměny pro děti:**
    *   *Kofola / Nápoje přímo od výrobce:* Třída (nebo dětský oddíl), která vyhraje týdenní/měsíční výzvu, dostane odměnu (např. 24 plechovek Kofoly) zaslanou **přímo od výrobce** (sponzora) do školy. Pro výrobce je to levné a má to obří PR hodnotu.
    *   Vstupenky do vědeckých center (iQLANDIA, Vida! Brno, Techmania Plzeň) nebo ZOO.
    *   Značkový ekologický merch (znovupoužitelné lahve na vodu, batůžky).
*   **Odměny pro dospělé:**
    *   Vstupenky na hudební a letní festivaly (kde se plechovky masivně spotřebovávají).
    *   Poukazy do outdoorových obchodů (HUDY, Decathlon).
*   **Spolupráce s festivaly (Fyzické sběrné koše):**
    *   Oslovit pořadatele festivalů (např. Colours of Ostrava, Rock for People, Let It Roll) s nabídkou umístění speciálních popelnic/košů s víkem označeným logem **Milion plechovek**.
    *   Koše slouží jako reálné sběrné body a zároveň jako skvělá fyzická reklama v areálu. Může na nich být i logo sponzora (výrobce), který nákup košů zafinancuje.

---

## 3. Funkce Aplikace a UX (Produktový vývoj)
*   **Schvalování úlovků (Anti-Cheat):**
    *   Jednoduché administrační rozhraní (Admin Dashboard) pro Tomáše a moderátory pro schválení/zamítnutí fotek před započtením do žebříčku (prevence podvodů a spamu).
*   **Offline režim s frontou (Offline Queue):**
    *   Pokud sběrač nemá v lese nebo v údolí signál, aplikace uloží fotku, souřadnice i počet lokálně (IndexedDB). Jakmile se telefon připojí k internetu, na pozadí data odešle.
*   **Ekologické kalkulačky (Impact Stats):**
    *   Zobrazení úspory přímo v aplikaci: „Tvé plechovky ušetřily X kWh energie, Y kg CO2 a Z litrů vody oproti výrobě nového hliníku.“
*   **Pokročilá mapa a Filtry:**
    *   Možnost filtrovat mapu podle času (dnes, tento týden, celkově) nebo zobrazit „Heatmapu“ (teplotní mapu) nejvíce vyčištěných lokalit.
*   **Rozpoznávání značek a objemu pomocí AI (AI Brand & Volume Recognition):**
    *   *Jak to funguje:* Nahraná fotka plechovky se automaticky odešle do Vision AI API (např. Google Gemini nebo OpenAI GPT-4o-mini). Umělá inteligence z obrázku vyčte:
        1. **Značku** (např. Pilsner Urquell, Red Bull, Semtex, Kofola, Lidl Ginger Shot).
        2. **Kategorii** (Pivo, Energetický nápoj, Limonáda, Ginger shot, Ledová káva, Víno/Koktejly).
        3. **Objem** (0.5l, 0.44l, 0.33l, 0.25l, 0.2l, 0.15l). AI jej určí buď z viditelného textu na plechovce (OCR), nebo poměrem stran a typickým objemem dané značky (např. Red Bull = standardně 0.25l, Pilsner Urquell = 0.5l).
        4. **Verifikaci** (ověří, zda je na fotce opravdu plechovka – prevence podvodů).
    *   *Výpočet hmotnosti hliníku:* Každému objemu se v databázi přiřadí průměrná váha čistého hliníku:
        *   **0.5 l** = ~16 g hliníku
        *   **0.4 l / 0.44 l** = ~14 g hliníku
        *   **0.33 l** = ~12 g hliníku
        *   **0.25 l** = ~10 g hliníku
        *   **0.2 l / 0.15 l** = ~8 g hliníku
        *   *Celková hmotnost* = počet kusů (`count`) × váha podle detekovaného objemu.
    *   *Ekologická kalkulačka v aplikaci:* Přepočet zachráněného hliníku na reálný dopad:
        *   **Úspora energie:** Recyklace hliníku ušetří 95 % energie oproti výrobě z bauxitu. 1 kg ušetřeného hliníku = ~14 kWh elektřiny (např. roční provoz LED žárovky).
        *   **Emise CO2:** 1 kg recyklovaného hliníku zabrání vzniku ~9 kg emisí CO2.
    *   *Real-time vs. Dávkově:* Může to běžet buď ihned při nahrání (Edge funkce), nebo jednou za den/týden na pozadí přes skript (levnější varianta).
    *   *Dopad na PR a marketing:* Můžete vytvářet statistiky pro média: *„Které značky se nejvíce povalují v českých lesích?“* (obrovský tlak na výrobce k partnerství). Zároveň lze filtrovat mapu: „Zobraz mi na mapě, kde se pije nejvíc piva a kde Red Bullu“.

---

## 4. Marketing a Šíření (Růst)
*   **Generátor příběhů na Instagram (IG Stories Share):**
    *   Tlačítko, které přímo vygeneruje hezký obrázek pro IG Stories: obrázek plechovky, přezdívka, kolik posbíral a zbývající počet do milionu.
*   **Plakáty s QR kódem do škol a kluboven:**
    *   Jednoduché PDF ke stažení, které mohou učitelé nebo vedoucí oddílů vytisknout a vyvěsit na nástěnky.

---

## 5. Možnosti monetizace a udržitelnosti (Business Model)
Projekt by měl být ideálně finančně soběstačný nebo generovat zisk. Zde jsou reálné cesty monetizace:
1.  **Firemní sponzorství a partnerství (B2B):**
    *   Značky (Kofola, Red Bull, pivovary) platí za to, že jsou „Oficiálním partnerem“ výzev v aplikaci. Např. *„Kofola Výzva tohoto týdne“*. Výměnou získají branding přímo v PWA, na mapě a pozitivní zelené PR (Greenmarketing).
2.  **Sponzorovaný obsah a loga na festivalech:**
    *   Značky financují výrobu a logistiku festivalových košů výměnou za to, že na víku/koši bude vedle loga *Milion plechovek* také jejich logo (*„Tento koš sponzoruje [Značka]“*).
3.  **Provize od recyklačních firem (Lead Generation):**
    *   Partnerství s velkými výkupy kovů a recyklačními dvory. Sběrači mohou dostat tipy, kam plechovky odevzdat ve velkém, a výkupna zaplatí projektu drobnou provizi za přivedeného klienta nebo sponzorský poplatek.
4.  **Prodej prémiového eko-merchandisu (B2C):**
    *   E-shop s kvalitním merchem (trička, kšiltovky, lahve) vyrobeným z recyklovaných materiálů pro fanoušky a nejaktivnější sběrače.
5.  **Státní a evropské ekologické granty:**
    *   Ministerstvo životního prostředí (MŽP), kraje nebo EU vypisují obří granty na podporu ekologické osvěty, čištění přírody a digitální inovace v ekologii. Aplikace splňuje všechny parametry pro získání těchto dotací.

