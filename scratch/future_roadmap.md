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
*   **Vlastní vizuální identita a ikony (Branded Custom Icons):**
    *   *Nahrazení emoji prvků:* Systémové emotikony (`🏠`, `📍`, `🏆`, `🥫`, `♻️`) nahradíme vlastními 2D vektorovými ikonami (SVG) navrženými v barvách a stylu loga *Milion plechovek*. Tím aplikace získá profesionální, jednotný design (iOS, Android a Windows zobrazují emoji rozdílně).
    *   *Značkové konfety:* Při úspěšném odeslání budou po obrazovce létat zmenšené vektorové plechovky vycházející přímo z tvaru loga.
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

---

## 6. Odhad nákladů při plném měřítku (1 000 000 plechovek)

Při dosažení cíle 1 000 000 nasbíraných plechovek (předpokládáme 1 000 000 odeslaných fotek) budou provozní náklady velmi nízké, pokud se provede optimalizace (komprimace) na straně klienta.

### A. Náklady na diskové úložiště (Supabase Storage)

Uvažujeme Supabase tarif **Pro ($25/měsíc)**, který obsahuje 8 GB Storage zdarma. Nadlimitní úložiště stojí **$0.021 / GB / měsíc**.

*   **Varianta 1: Nekomprimované fotky (běžný stav z mobilu ~3 MB / fotka)**
    *   *Celkový objem dat:* 1 000 000 × 3 MB = **3 000 GB (3 TB)**
    *   *Úložiště nad limit:* 3 000 GB - 8 GB = 2 992 GB
    *   *Měsíční poplatek za storage:* 2 992 × $0.021 = **$62.83 / měsíc** (cca 1 500 Kč)
    *   *Celkové měsíční náklady:* **$87.83 / měsíc** (cca 2 100 Kč včetně základního Pro tarifu)
*   **Varianta 2: Automaticky komprimované fotky (šířka 1000px, JPG ~70 KB / fotka) - DOPORUČENO**
    *   *Celkový objem dat:* 1 000 000 × 70 KB = **70 GB**
    *   *Úložiště nad limit:* 70 GB - 8 GB = 62 GB
    *   *Měsíční poplatek za storage:* 62 × $0.021 = **$1.30 / měsíc** (cca 30 Kč)
    *   *Celkové měsíční náklady:* **$26.30 / měsíc** (cca 620 Kč včetně základního Pro tarifu)

*Poznámka:* Pokud by byl spuštěn archivační Python skript na externí disk a fotky z cloudu se mazaly, náklady na storage budou **$0** (stále se vejdeme do 8 GB limitu).

### B. Náklady na AI rozpoznávání (Vision API)

Uvažujeme analýzu 1 000 000 fotek pomocí API. Porovnání dvou nejlepších modelů na trhu:

*   **Google Gemini 1.5 Flash (Doporučeno: nejrychlejší, nejlevnější)**
    *   *Ceník:* $0.075 / 1M input tokenů, $0.30 / 1M output tokenů. Obrázek stojí fixně 258 tokenů.
    *   *Průměrný dotaz:* 400 input tokenů (obrázek + textový prompt), 100 output tokenů.
    *   *Cena za 1 analýzu:* $0.000060 (cca 0.0014 Kč)
    *   *Celková cena za 1 000 000 analýz:* **$60.00** (cca 1 400 Kč) – jednorázový náklad rozložený v čase podle toho, jak lidé sbírají.
*   **OpenAI GPT-4o-mini**
    *   *Ceník:* $0.150 / 1M input tokenů, $0.600 / 1M output tokenů. Obrázek (high-detail 1000px) stojí ~170 tokenů.
    *   *Průměrný dotaz:* 320 input tokenů (obrázek + prompt), 100 output tokenů.
    *   *Cena za 1 analýzu:* $0.000108 (cca 0.0025 Kč)
    *   *Celková cena za 1 000 000 analýz:* **$108.00** (cca 2 500 Kč)

### Shrnutí pro sponzora
Celý provoz milionového projektu z pohledu cloudu a AI rozpoznávání značek vyjde na cca **620 Kč měsíčně** (s komprimací) + jednorázový náklad cca **1 400 Kč** za zpracování všech 1 000 000 fotek pomocí umělé inteligence Gemini. Pro sponzora je to zanedbatelná částka s obrovskou marketingovou hodnotou.

---

## 7. Fázovaný rollout a spuštění ostrého provozu

Než se projekt otevře široké veřejnosti, je nutné projít fázemi uzavřeného testování pro ověření stability systému, přesnosti dat a chování uživatelů.

### A. Fáze testovacího provozu
1.  **Fáze 1 (10 lidí):** Interní testování s rodinou a nejbližmi přáteli (stávající stav). Ověření přesnosti zápisů, GPS lokalizace a stability PWA na iOS/Android.
2.  **Fáze 2 (50 lidí):** Rozšíření na širší okruh známých a komunitu sběračů. Testování rychlosti nahrávání fotek a prvotní analýza vytížení databáze.
3.  **Fáze 3 (100 lidí):** Poslední zátěžový test před veřejným spuštěním. Sledování limitů bezplatného cloudu a testování chování mapy při větším množství bodů.

### B. Výpočet počáteční hodnoty odpočtu (Ostré spuštění)
Při testovacím provozu je na počítadle nastaven plný cíl **1 000 000** plechovek. Při přechodu na ostrý (veřejný) provoz se výchozí hodnota v aplikaci upraví (sníží) o historické nálezy a testovací data tak, aby odpočet odpovídal absolutní realitě.

*   **Položky k odečtení ze startovní sumy:**
    1.  **Historický sběr Tomáše:** Plechovky nasbírané Tomášem osobně od **září 2025** do dne ostrého startu.
    2.  **Testovací sběr:** Všechny plechovky nasbírané a zapsané uživateli během Fází 1, 2 a 3.
*   **Vzorec pro výpočet výchozího stavu v kódu:**
    `Počáteční_stav_počítadla = 1 000 000 - (Plechovky_Tomáš_od_09_2025 + Plechovky_zapsané_v_testu)`
*   *Příklad:* Pokud Tomáš od září 2025 nasbíral 35 000 plechovek a testeři nasbírají 5 000 plechovek, aplikace bude pro veřejnost startovat na hodnotě **960 000** zbývajících plechovek.

### C. Uchování alternativních variant pro budoucí rozhodnutí
Dokument záměrně uchovává a nesmazává obě zvažované varianty u klíčových technických řešení. Rozhodnutí o finální volbě padne až po vyhodnocení zkušebního provozu:
*   **AI Rozpoznávání:** Real-time analýza při nahrání (rychlé, ochrana proti spamu) VS. dávková analýza na pozadí (levnější, bez dopadu na rychlost odeslání).
*   **Správa úložiště fotek:** Lokální automatická archivace na externí disk LaCie (nulové finanční náklady) VS. navýšení cloudového limitu placené sponzorem (nulová technická údržba).

---

## 8. Analýza rizik a jejich řešení (Risk Management)

Každý komunitní a crowdsourcingový projekt s sebou nese rizika zneužití nebo technických bariér. Zde je přehled rizik a jak je řešit:

### A. Riziko: Podvody a spam (Cheatování)
*   **Kdy hrozí:** Ihned při spuštění pro širší veřejnost. Sběrači mohou zkoušet nahrávat fejkové úlovky kvůli postupu v žebříčku nebo získání sponzorských cen (např. focení plechovek v regálech obchodů, nahrávání cizích fotek z internetu, zadávání nereálných počtů).
*   **Řešení:**
    1.  **AI verifikace fotky:** Vision AI zkontroluje, zda fotka obsahuje zmačkanou plechovku v terénu (tráva, hlína, les), nikoliv v regálu obchodu.
    2.  **GPS a časový limit (Cooldown):** Zamezení odesílání více záznamů z jedné GPS souřadnice v krátkém čase od jednoho uživatele.
    3.  **Administrátorské schvalování:** Podezřelé nálezy (např. nad 15 plechovek najednou nebo ty označené AI) spadnou do fronty ke schválení moderátorem.

### B. Riziko: Výpadek cloudu při přetížení (Supabase limity)
*   **Kdy hrozí:** Během Fáze 2 a 3 (50 až 100+ aktivních uživatelů).
*   **Řešení:**
    1.  Zavedení povinné klientské komprese fotek před nahráním (max. 1000px, JPG ~70 KB).
    2.  Včasný přechod na tarif Pro (25 $/měsíc) financovaný oficiálním sponzorem.

### C. Riziko: Ztráta motivace uživatelů v offline oblastech (bez signálu)
*   **Kdy hrozí:** Při sběru v lesích, horách a údolích. Pokud se nahrávání kvůli chybějícímu signálu zasekne, uživatel aplikaci zavře.
*   **Řešení:**
    1.  Implementace offline fronty (IndexedDB / Cache) – aplikace uloží nález s GPS a fotkou do lokální paměti telefonu a odešle jej automaticky na pozadí, jakmile telefon chytí stabilní datové připojení.

---

## 9. Co se stane po dosažení milionu? (The End Game)

Dosažení milionu plechovek je obrovský milník, který by neměl být koncem, ale vyvrcholením projektu s velkým mediálním zásahem:

*   **A. Fyzický památník / Umělecké dílo (Art Installation):**
    *   Ve spolupráci s recyklační firmou nebo městem se část nasbíraného hliníku roztaví a vytvoří se z něj trvalá socha / památník čisté přírody v Brně (či jiném městě). To má obří potenciál pro PR a televizní reportáže.
*   **B. Nový, ambicióznější milník:**
    *   Expanze projektu na další cíle: „Milion kilogramů odpadu“ nebo zaměření na čištění specifických chráněných oblastí (KRNAP, Šumava).
*   **C. Přerod na stálou ekologickou platformu:**
    *   Aplikace se transformuje na rozhraní pro různé ekologické výzvy sponzorované firmami (např. sázení stromů, sběr plastů, čištění řek).

---

## 10. Význam projektu v zemích se zálohovým systémem

Slovensko zálohy má, Česká republika je aktuálně připravuje. Má v takovém prostředí projekt smysl? **Ano, a možná ještě větší!**

*   **Lovci pokladů (Reálný zisk pro lidi):**
    *   Pokud bude mít plechovka zálohu (např. 4 Kč), stává se aplikace doslova detektorem peněz v trávě. Lidé budou mít dvojí motivaci: body v žebříčku aplikace + reálné peníze za vrácení plechovky do automatu.
*   **Edukace k vracení:**
    *   Aplikace může uživatele navigovat: „Vyfoť plechovku v lese (vyčisti přírodu) -> získej odznáček -> odnes ji do nejbližšího automatu a peníze si nechej nebo je jedním klikem v aplikaci daruj na charitu.“
*   **Cenná geodata pro stát a obce:**
    *   Data o tom, kde se plechovky stále povalují (i přes zálohový systém), jsou nesmírně cenná. Ukazují slabá místa infrastruktury (např. chybějící sběrná místa na turistických stezkách, cyklotrasách či festivalech).

---

## 11. Architektura pro škálování (Až na 500 000 uživatelů)

Abychom mohli bezpečně obsloužit statisíce uživatelů bez výpadků a s rozumnými náklady, je třeba architekturu postupně posouvat k následujícím standardům:

### A. Globální CDN a Statický hosting (Vercel)
*   Stávající hosting na Vercelu je pro statické soubory (HTML, CSS, JS) ideální. Vercel automaticky distribuuje aplikaci do globální sítě serverů (CDN). Zde je kapacita pro 500 000 uživatelů prakticky neomezená a bezplatný/základní tarif to bez problémů zvládne.

### B. Optimalizace PostgreSQL Databáze (Supabase)
*   **Databázové indexy (Indexing):** Zavedení indexů na nejčastěji dotazovaná pole (`nickname`, `created_at`).
*   **Prostorová databáze (PostGIS):** Pro vykreslování statisíců bodů na mapě nelze stahovat všechny body naráz do prohlížeče (telefon by se zasekal). Použijeme PostGIS extension v Postgresu pro „shlukování“ (clustering) bodů na serveru podle aktuálního přiblížení mapy.
*   **Škálování výkonu (Compute scaling):** Supabase umožňuje plynule navyšovat výkon databázového serveru (RAM/CPU) podle zatížení bez nutnosti měnit kód aplikace.

### C. CDN pro fotografie (Storage)
*   S miliony fotek vzrostou nároky na rychlost načítání mapy a historie.
*   Před Supabase Storage předřadíme globální CDN (např. Cloudflare) pro kešování obrázků, což zrychlí načítání na mobilech a radikálně sníží síťové náklady (egress).

### D. Pokročilá offline synchronizace
*   Při statisících uživatelů se zvýší riziko přetížení mobilních sítí (např. na hudebních festivalech).
*   Použijeme robustní synchronizační knihovnu (např. Workbox Background Sync nebo Dexie.js), která zajistí spolehlivé odesílání dat na pozadí, i když je aplikace zavřená a uživatel má nestabilní 3G/4G připojení.

---

## 12. Identifikace uživatelů a doručování výher (GDPR & Identita)

V MVP verzi aplikace sběrači nezadávají e-maily ani hesla (jen přezdívku), což extrémně snižuje bariéru pro stažení (žádná registrace). Pokud ale chceme uživateli za přezdívkou (např. `Pepa_sbira`) poslat výhru, musíme vyřešit jeho kontaktování a ověření identity.

Zde jsou 4 cesty, jak to vyřešit, od nejjednodušší po nejrobustnější:

### Varianta 1: Sociální sítě jako přezdívka (Instagram handle) - DOPORUČENO PRO START
*   **Jak to funguje:** Při prvním spuštění aplikace uživatele vyzve, aby jako přezdívku zadal svůj Instagramový nebo TikTokový handle (např. `@pepa_sbira`).
*   **Předání výhry:** Správce projektu (Tomáš) napíše Pepovi přímo na Instagramu: *„Ahoj Pepo, vyhrál jsi týdenní výzvu Milion plechovek! Pošli nám sem do zpráv doručovací adresu a screenshot svého profilu z aplikace pro ověření.“*
*   **Výhody:** Nulová technická náročnost, obří marketingový přínos (lidé přirozeně sdílí projekt na sociálních sítích, sponzor je může označovat ve Stories).
*   **Nevýhody:** Někteří uživatelé (např. starší lidé nebo velmi malé děti) nemusí mít sociální sítě.

### Varianta 2: Formulář pro uplatnění výhry (Claim Form)
*   **Jak to funguje:** Jakmile uživatel splní výzvu nebo vyhraje v žebříčku, v aplikaci se mu zobrazí tlačítko *„Vyhrál jsi! Klikni sem pro odeslání adresy“*. Odkaz ho navede na jednoduchý zabezpečený formulář (např. Google Forms / Typeform), kde vyplní své jméno, e-mail a adresu a odešle je.
*   **Výhody:** Velmi čisté z pohledu **GDPR** – osobní údaje (adresu, e-mail) sbíráte pouze od skutečných výherců, kteří je dobrovolně poskytnou za účelem doručení ceny, nikoliv od všech 500 000 uživatelů. Aplikace jako taková zůstává anonymní.
*   **Nevýhody:** Sběrač musí sám aktivně kliknout a výhru si nárokovat.

### Varianta 3: Nepovinný e-mail při registraci (Lightweight onboarding)
*   **Jak to funguje:** Při prvním otevření aplikace uživatel zadá přezdívku a *nepovinně* e-mailovou adresu. E-mail se uloží do databáze k jeho profilu.
*   **Výhody:** Přímý komunikační kanál na uživatele ihned od začátku.
*   **Nevýhody:** Aplikace již oficiálně sbírá osobní údaje (PII). Projekt musí mít zpracované Podmínky ochrany osobních údajů (GDPR), vyřešené zabezpečení databáze proti úniku e-mailů a hrozí, že uživatelé budou zadávat neexistující e-maily (pokud nezavedeme ověřovací e-maily).

### Varianta 4: Plná registrace uživatelů (Supabase Auth)
*   **Jak to funguje:** Uživatel se musí přihlásit (např. jedním kliknutím přes Google, Apple ID nebo zasláním přihlašovacího odkazu na e-mail).
*   **Výhody:** 100% jistota identity, ochrana proti krádežím přezdívek, možnost detailní správy uživatelských profilů.
*   **Nevýhody:** Vysoké tření při prvním spuštění – nutnost registrace může odradit až 50 % potenciálních uživatelů, kteří si chtějí aplikaci jen vyzkoušet v lese.

---

## 13. Časový harmonogram rozvoje (Timeline 2026)

Pro zajištění stability a hladkého vývoje navrhujeme tento harmonogram rozvoje aplikace a komunity:

### Fáze 1: Červen 2026 – Testování v úzkém kruhu (10 lidí)
*   **Technický cíl:** Oprava nalezených chyb z testování, odladění GPS přesnosti a zavedení **automatické komprimace fotek v telefonu** před nahráním (úspora storage).
*   **Komunitní cíl:** Tomáš a rodina sbírají data, testují mapu a ověřují celkovou stabilitu PWA cache na různých iPhonech a Androidech.

### Fáze 2: Červenec 2026 – Komunitní test (50 lidí)
*   **Technický cíl:** Vytvoření administrátorského dashboardu pro schvalování fotek. Implementace jednoduchého generátoru grafiky pro sdílení na Instagram Stories přímo z úspěšné obrazovky.
*   **Komunitní cíl:** Zapojení širšího okruhu známých. Začátek sdílení prvních testovacích příspěvků na sociálních sítích s odkazem na projekt.

### Fáze 3: Srpen 2026 – Generální zkouška (100 lidí)
*   **Technický cíl:** Nahrazení systémových emoji vlastním grafickým designem a SVG ikonami v barvách a stylu loga. Příprava formuláře na uplatnění výher (Claim Form).
*   **Komunitní cíl:** Poslední zátěžový test. Hledání sponzora (výrobce nápojů/recyklační firma) na financování Pro verze Supabase a cen pro sběrače.

### Fáze 4: Září 2026 – Veřejné spuštění (Ostrý start)
*   **Technický cíl:** Kalibrace počítadla (odečtení historických sběrů Tomáše od září 2025 a testovacích dat). Spuštění Týdenních a Víkendových výzev.
*   **Komunitní cíl:** Veřejný PR start (videa na IG, FB, tisková zpráva). Zapojení prvních škol a zájmových organizací.

### Fáze 5: Podzim / Zima 2026 – AI a expanze
*   **Technický cíl:** Propojení Gemini Vision API pro automatickou detekci značek, kategorií a objemů plechovek. Vykreslování heatmap značek.
*   **Komunitní cíl:** První plně sponzorované výzvy (např. „Týden s Kofolou“), spuštění prodejů prémiového recyklovaného merche.

---

## 14. Strategie růstu sociálních sítí (IG & FB Viralita)

Aplikace sama o sobě musí sloužit jako hlavní motor pro růst followerů na Instagramu a Facebooku. Zde jsou virální mechanismy, které do ní integrujeme:

### A. Virální smyčka „Sdílení úspěchu“ (IG Stories Share)
*   Po odeslání úlovku se zobrazí obrazovka s konfetami a velké tlačítko **„Sdílet na IG Stories“**.
*   Aplikace vygeneruje vizuálně atraktivní grafickou kartu (např. *„Právě jsem vyčistil park od 12 plechovek! Sleduj @milionplechovek a pomoz nám nasbírat milion.“*).
*   Pro uživatele je to sociální status („udělal jsem dobrý skutek“), který velmi rádi sdílí se svými přáteli.

### B. Propojení přezdívky s IG Profilem (Social Handles)
*   V žebříčku a historii budeme aktivně zobrazovat instagramové přezdívky (např. `@pepa_sbira`).
*   Při týdenním vyhlášení TOP sběračů na vašem IG/FB profilu tyto uživatele označíte (otagujete). Výherci budou tyto posty nadšeně přezdílet na své profily, čímž přivedou své followery k vám.

### C. Komunitní UGC (User Generated Content) kampaně
*   **Výzva „Plechovkový archeolog“:** Uživatelé budou na sítě dávat fotky nejstarších nebo nejkurióznějších plechovek, které v lese vykopali, s označením `#milionplechovek` a `@milionplechovek`. Tyto příspěvky budete sdílet a komentovat, což vytvoří silnou komunitu.
*   **Festivalový hon na plechovky:** Během letních festivalů vyhlásíte výzvu: *„Kdo vyfotí nejkreativnější fotku u koše Milion plechovek a označí nás, vyhrává karton nápojů.“*

### D. Tvorba obsahu z dat aplikace (Data-driven content)
*   Tomáš může tvořit extrémně zajímavá a sdílená videa (Reels/Shorts) přímo na základě dat z mapy:
    *   *„Dnes se podíváme na heatmapu Brna – kde se vypilo nejvíc energy drinků a kde piv? Výsledky vás překvapí!“*
    *   *„Představujeme TOP 3 nálezy tohoto týdne z naší mapy. Tenhle kousek ležel v lese od roku 1998!“*
*   Data a vizualizace přitahují pozornost a lidi baví sledovat, jak se mapa Česka postupně čistí.
