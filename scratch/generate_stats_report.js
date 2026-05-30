// Skript pro výpočet statistik, tvorbu HTML reportu s grafy a generování "Víte, že..." zajímavostí
// Spuštění: GEMINI_API_KEY="váš_klíč_zde" node scratch/generate_stats_report.js

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dxlyjugmeucevosmhage.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_CR-YuABHB1SvPK6b6sz-WQ_Q6y_8iKx';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ ERROR: Chybí GEMINI_API_KEY v environment proměnných!");
    process.exit(1);
}

// 30 ověřených faktů o plechovkách (integrovaných přímo ve skriptu pro bezchybné spouštění)
const VERIFIED_FACTS = [
    { cat: "Ekologie", txt: "Hliníková plechovka se v přírodě rozkládá až 500 let." },
    { cat: "Ekologie", txt: "Odhozené plechovky v přírodě fungují jako smrtící past pro drobný hmyz a ještěrky, kteří vlezou dovnitř za zbytkem sladkého pití a už nedokážou vylézt ven." },
    { cat: "Ekologie", txt: "Pohozená plechovka v trávě může při sečení luk rozsekat zemědělskou techniku a její ostré střepy pak v krmivu usmrtit dobytek (vnitřní krvácení)." },
    { cat: "Ekologie", txt: "Hliník se sice v přírodě nerozpustí, ale lak a barvy z pohozené plechovky se postupně loupou a kontaminují mikročásticemi půdu." },
    { cat: "Ekologie", txt: "Volně pohozené plechovky s ostrými hranami jsou v lesích jednou z nejčastějších příčin řezných poranění divoké zvěře." },
    { cat: "Ekologie", txt: "Výroba hliníku z panenské suroviny (bauxitu) extrémně devastuje deštné pralesy, kde se tato ruda nejčastěji těží (Austrálie, Brazílie, Guinea)." },
    { cat: "Ekologie", txt: "Pohozená plechovka na přímém slunci dokáže fungovat jako lupa a může odrazem paprsků způsobit lesní požár." },
    { cat: "Ekologie", txt: "Lidstvo ročně vyhodí na skládky a do přírody tolik hliníku, že by to stačilo na obnovu celého světového leteckého parku." },
    { cat: "Ekologie", txt: "Hliník je sice třetím nejrozšířenějším prvkem v zemské kůře, ale v čisté formě se v přírodě vůbec nevyskytuje a jeho výroba je extrémně náročná." },
    { cat: "Ekologie", txt: "Sesbíráním plechovek z přírody nezachraňujeme jen vzhled lesa, ale vracíme do oběhu cennou surovinu, kvůli které se nemusí drancovat planeta." },
    
    { cat: "Recyklace", txt: "Hliník je stoprocentně a nekonečně recyklovatelný, aniž by při tom ztratil cokoli ze své kvality." },
    { cat: "Recyklace", txt: "Recyklace hliníkové plechovky ušetří až 95 % energie ve srovnání s výrobou nové plechovky z bauxitu." },
    { cat: "Recyklace", txt: "Energie ušetřená recyklací jediné plechovky dokáže pohánět běžnou televizi až po dobu tří hodin." },
    { cat: "Recyklace", txt: "Zrecyklovaná plechovka se dokáže vrátit zpět do regálu obchodu jako úplně nová už za pouhých 60 dní." },
    { cat: "Recyklace", txt: "Recyklace hliníku vyprodukuje o 95 % méně emisí CO2 než jeho primární výroba." },
    { cat: "Recyklace", txt: "Přibližně 75 % veškerého hliníku, který byl kdy na světě vyroben, se díky recyklaci používá dodnes." },
    { cat: "Recyklace", txt: "Energie ušetřená recyklací jedné plechovky dokáže udržet v chodu průměrný notebook déle než tři hodiny." },
    { cat: "Recyklace", txt: "Vytěžit tunu hliníku vyžaduje zhruba čtyřikrát více energie než vytěžit tunu mědi." },
    { cat: "Recyklace", txt: "Recyklace jedné tuny hliníku ušetří víc než 4 tuny bauxitové rudy a tuny chemických látek." },
    { cat: "Recyklace", txt: "Recyklací pouhých deseti plechovek ušetříte tolik energie, kolik spotřebuje moderní LED žárovka za stovky hodin svícení." },
    
    { cat: "Historie", txt: "Úplně první plechovky na potraviny (z oceli) byly tak masivní, že návod doporučoval otevírat je dlátem a kladivem." },
    { cat: "Historie", txt: "Mechanický otvírák na plechovky byl vynalezen až skoro 50 let po samotné plechovce." },
    { cat: "Historie", txt: "První celohliníková nápojová plechovka byla vyrobena až v roce 1958 společností Primo Beer." },
    { cat: "Historie", txt: "Dnešní hliníkové plechovky jsou díky technologickému pokroku o více než 30 % lehčí než před třiceti lety." },
    { cat: "Historie", txt: "Stěna moderní hliníkové plechovky je tenčí než lidský vlas (kolem 0,09 mm), a přesto bezpečně udrží tlak syceného nápoje." },
    { cat: "Historie", txt: "V 19. století byl čistý hliník tak vzácný a drahý, že z něj francouzský císař Napoleon III. nechal vyrobit příbory pro nejvzácnější hosty, zatímco ostatní jedli na zlatě." },
    { cat: "Historie", txt: "Integrované otevírací očko (které z plechovky neodpadne) bylo vynalezeno až v roce 1989, aby se zabránilo zbytečnému pohození malých ostrých plíšků." },
    { cat: "Historie", txt: "První nápojové plechovky měly ploché vršky a lidé do nich museli prorážet dvě díry speciálním propichovátkem, aby se z nich dalo pít." },
    { cat: "Historie", txt: "Na světě se každou minutu spotřebuje a vyhodí zhruba 400 000 nápojových plechovek." },
    { cat: "Historie", txt: "Při posbírání 1 000 000 plechovek zachráníme zhruba 16 tun čistého hliníku, který může znovu sloužit." }
];

// Volání Gemini API pro textovou generaci zajímavostí
async function generateFunFacts(statsSummary) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Vybereme náhodně 5 ověřených faktů, které AI předložíme jako podklad pro spojení s reálnými čísly
    const shuffledFacts = [...VERIFIED_FACTS].sort(() => 0.5 - Math.random()).slice(0, 5);

    const prompt = `Jsi kreativní copywriter pro ekologický a komunitní projekt "Milion Plechovek". 
Tvým úkolem je vytvořit 5 velmi zajímavých a chytlavých příspěvků (nebo scénářů pro krátká videa) na sociální sítě.

U každého příspěvku musíš SPOJIT reálná statistická data našeho projektu s obecnými ověřenými fakty o recyklaci/ekologii. 

Zde jsou reálná data z naší databáze:
- Celkem nasbíraných plechovek: ${statsSummary.overall.total_cans_collected} ks
- Celková váha hliníku: ${statsSummary.overall.total_weight_kg} kg
- Celkem ušetřeno energie: ${statsSummary.overall.total_energy_saved_kwh} kWh (což odpovídá ${Math.round(statsSummary.overall.total_energy_saved_kwh / 0.03)} hodinám chodu notebooku nebo svícení LED žárovky)
- Celkem ušetřeno peněz (hodnota kovu): ${statsSummary.overall.total_money_saved_czk} Kč
- Celkem ušetřeno emisí CO2: ${statsSummary.overall.total_co2_saved_kg} kg
- Nejčastější značka: ${statsSummary.brands_breakdown[0] ? statsSummary.brands_breakdown[0].name : 'Neznámá'} (celkem ${statsSummary.brands_breakdown[0] ? statsSummary.brands_breakdown[0].count : 0} ks)

Zde je 5 vybraných ověřených faktů, které použij jako inspiraci k propojení s našimi čísly:
${shuffledFacts.map((f, i) => `${i+1}. [${f.cat}] ${f.txt}`).join('\n')}

Požadavky:
- Používej silné české hooky na začátku (např. "Nikdy bych nevěřil...", "Tipnuli byste si...", "Netušil jsem...").
- Propoj teorii (např. recyklace ušetří 95 % energie) s naší praxí (např. našich nasbíraných X plechovek ušetřilo Y kWh, což by pohánělo televizi po dobu Z let).
- U každého příspěvku uveď krátký "Vizuální tip" pro video.
- Výstup napiš česky a strukturovaně.`;

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`Gemini API Error: Status ${response.status}`);
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
}

// Výpočet a agregace dat
function aggregateData(pickups) {
    let totalCans = 0;
    let analyzedCansCount = 0;
    let totalWeightG = 0;
    let totalEnergyKwh = 0;
    let totalMoneyCzk = 0;
    let totalCo2Kg = 0;
    
    const brands = {};
    const volumes = {};
    const teams = {};
    const timeline = {};

    pickups.forEach(p => {
        const count = p.count || 1;
        totalCans += count;

        // Vytvoření časové osy (podle měsíců pro graf)
        if (p.created_at) {
            const dateStr = p.created_at.substring(0, 7); // YYYY-MM
            timeline[dateStr] = (timeline[dateStr] || 0) + count;
        }

        if (p.is_analyzed) {
            analyzedCansCount += count;
            totalWeightG += Number(p.aluminum_weight_g) || 0;
            totalEnergyKwh += Number(p.energy_saved_kwh) || 0;
            totalMoneyCzk += Number(p.money_saved_czk) || 0;
            totalCo2Kg += Number(p.co2_saved_kg) || 0;

            const cansArray = p.analysis_json || [];
            cansArray.forEach(can => {
                let brand = can.brand || 'Nerozpoznáno';
                if (brand === 'Unknown' || brand === 'unknown') {
                    brand = 'Nerozpoznáno';
                }
                const vol = can.volume_liters || 'Unknown';

                if (brand !== 'Nerozpoznáno') {
                    brands[brand] = (brands[brand] || 0) + 1;
                }
                volumes[vol] = (volumes[vol] || 0) + 1;
            });
        }

        if (p.team_code) {
            teams[p.team_code] = (teams[p.team_code] || 0) + count;
        }
    });

    // --- CHYTRÉ SESKUPENÍ DROBNÝCH ZNAČEK DO "OSTATNÍ" PRO GRAFY ---
    const rawBrands = Object.entries(brands).map(([name, count]) => ({ name, count }));
    rawBrands.sort((a, b) => b.count - a.count);

    const topBrands = [];
    let otherCount = 0;
    
    // Značky s malým podílem (např. mimo TOP 15 nebo ty, co mají méně než 2 kusy) seskupíme
    rawBrands.forEach((b, index) => {
        if (index < 15 && b.count >= 2) {
            topBrands.push({
                name: b.name,
                count: b.count,
                percentage: parseFloat(((b.count / analyzedCansCount) * 100).toFixed(1))
            });
        } else {
            otherCount += b.count;
        }
    });

    if (otherCount > 0) {
        topBrands.push({
            name: "Ostatní značky",
            count: otherCount,
            percentage: parseFloat(((otherCount / analyzedCansCount) * 100).toFixed(1))
        });
    }

    const fullBrandsList = rawBrands.map(b => ({
        name: b.name,
        count: b.count,
        percentage: parseFloat(((b.count / analyzedCansCount) * 100).toFixed(1))
    }));

    const sortedVolumes = Object.entries(volumes)
        .map(([size, count]) => ({ size: size === 'Unknown' ? 'Neznámý' : size + ' L', count }))
        .sort((a, b) => {
            if (a.size === 'Neznámý') return 1;
            if (b.size === 'Neznámý') return -1;
            return b.count - a.count;
        });

    const sortedTeams = Object.entries(teams)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count);

    const sortedTimeline = Object.entries(timeline)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        overall: {
            total_cans_collected: totalCans,
            analyzed_cans_count: analyzedCansCount,
            total_weight_kg: parseFloat((totalWeightG / 1000).toFixed(2)),
            total_energy_saved_kwh: parseFloat(totalEnergyKwh.toFixed(1)),
            total_money_saved_czk: parseFloat(totalMoneyCzk.toFixed(0)),
            total_co2_saved_kg: parseFloat(totalCo2Kg.toFixed(1))
        },
        brands_breakdown: topBrands,
        all_brands: fullBrandsList,
        raw_brands_count: rawBrands.length,
        volumes_breakdown: sortedVolumes,
        teams_leaderboard: sortedTeams,
        users_leaderboard: sortedUsers,
        timeline: sortedTimeline
    };
}

// Generování nádherného HTML reportu s interaktivními grafy přes Chart.js
function generateHtmlReport(stats, outputPath) {
    const htmlContent = `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report - Milion Plechovek</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Montserrat', sans-serif; background-color: #0f172a; color: #f8fafc; }
        .glass-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); }
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
                <span class="text-3xl font-black text-emerald-400">${stats.overall.total_cans_collected.toLocaleString('cs-CZ')} ks</span>
            </div>
        </header>

        <!-- Ekologické karty -->
        <section class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <div class="glass-card p-5 rounded-2xl relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 text-7xl opacity-5 select-none">⚖️</div>
                <h3 class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Hmotnost hliníku</h3>
                <p class="text-3xl font-extrabold mt-2 text-emerald-400">${stats.overall.total_weight_kg} kg</p>
                <p class="text-slate-400 text-[10px] mt-1">zachráněného z přírody</p>
            </div>
            <div class="glass-card p-5 rounded-2xl relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 text-7xl opacity-5 select-none">⚡</div>
                <h3 class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Ušetřená energie</h3>
                <p class="text-3xl font-extrabold mt-2 text-teal-400">${stats.overall.total_energy_saved_kwh.toLocaleString('cs-CZ')} kWh</p>
                <p class="text-slate-400 text-[10px] mt-1">odpovídá ${Math.round(stats.overall.total_energy_saved_kwh / 0.03).toLocaleString('cs-CZ')} hod. notebooku</p>
            </div>
            <div class="glass-card p-5 rounded-2xl relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 text-7xl opacity-5 select-none">🌱</div>
                <h3 class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Ušetřeno CO₂ emisí</h3>
                <p class="text-3xl font-extrabold mt-2 text-indigo-400">${stats.overall.total_co2_saved_kg.toLocaleString('cs-CZ')} kg</p>
                <p class="text-slate-400 text-[10px] mt-1">uhlíková stopa, která nevznikla</p>
            </div>
            <div class="glass-card p-5 rounded-2xl relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 text-7xl opacity-5 select-none">💰</div>
                <h3 class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Hodnota ve sběrně</h3>
                <p class="text-3xl font-extrabold mt-2 text-sky-400">${stats.overall.total_money_saved_czk.toLocaleString('cs-CZ')} Kč</p>
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
                        <span class="text-2xl font-bold block text-emerald-400">${stats.raw_brands_count}</span>
                    </div>
                    <div class="p-3 bg-slate-800/40 rounded-xl">
                        <span class="text-slate-400 text-xs">Analyzováno AI</span>
                        <span class="text-2xl font-bold block text-teal-400">${stats.overall.analyzed_cans_count} ks</span>
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
                    ${stats.teams_leaderboard.slice(0, 10).map((team, index) => `
                        <li class="flex justify-between items-center bg-slate-800/30 px-4 py-2 rounded-xl border border-slate-700/30">
                            <span class="flex items-center gap-2">
                                <span class="text-xs text-slate-500 font-bold w-4">${index + 1}.</span>
                                <span class="font-semibold text-slate-300">${team.code}</span>
                            </span>
                            <span class="text-emerald-400 font-extrabold text-sm">${team.count} ks</span>
                        </li>
                    `).join('')}
                    ${stats.teams_leaderboard.length === 0 ? `<li class="text-slate-500 text-sm text-center py-6">Zatím žádné týmy.</li>` : ''}
                </ul>
            </div>

            <!-- Tabulka Jednotlivců -->
            <div class="glass-card p-6 rounded-2xl">
                <h3 class="text-lg font-bold mb-4 text-slate-300">Žebříček Jednotlivců (TOP 10)</h3>
                <ul class="space-y-2">
                    ${stats.users_leaderboard.slice(0, 10).map((user, index) => `
                        <li class="flex justify-between items-center bg-slate-800/30 px-4 py-2 rounded-xl border border-slate-700/30">
                            <span class="flex items-center gap-2">
                                <span class="text-xs text-slate-500 font-bold w-4">${index + 1}.</span>
                                <span class="font-semibold text-slate-300">${user.nick}</span>
                            </span>
                            <span class="text-emerald-400 font-extrabold text-sm">${user.count} ks</span>
                        </li>
                    `).join('')}
                    ${stats.users_leaderboard.length === 0 ? `<li class="text-slate-500 text-sm text-center py-6">Zatím žádní sběratelé.</li>` : ''}
                </ul>
            </div>
        </section>
        
        <!-- Kompletní seznam značek -->
        <section class="glass-card p-6 rounded-2xl mt-8">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-bold text-slate-300">Kompletní adresář značek plechovek</h3>
                <span class="text-xs text-slate-400 font-semibold bg-slate-800 px-3 py-1 rounded-full">${stats.all_brands.length} unikátních typů</span>
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
                        ${stats.all_brands.map((brand, index) => `
                            <tr class="border-b border-slate-800/40 hover:bg-slate-800/20">
                                <td class="py-2 font-mono text-slate-500">${index + 1}.</td>
                                <td class="py-2 font-semibold text-slate-200">${brand.name}</td>
                                <td class="py-2 text-right font-bold text-emerald-400">${brand.count} ks</td>
                                <td class="py-2 text-right text-slate-400">${brand.percentage} %</td>
                            </tr>
                        `).join('')}
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
        const brandsData = ${JSON.stringify(stats.brands_breakdown)};
        new Chart(brandsCtx, {
            type: 'doughnut',
            data: {
                labels: brandsData.map(b => b.name),
                datasets: [{
                    data: brandsData.map(b => b.count),
                    backgroundColor: [
                        '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', 
                        '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', 
                        '#f43f5e', '#f97316', '#eab308', '#84cc16', '#64748b'
                    ],
                    borderWidth: 2,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#94a3b8', font: { family: 'Montserrat', size: 10, weight: 600 } }
                    }
                }
            }
        });

        // Graf velikostí (Bar)
        const volumesCtx = document.getElementById('volumesChart').getContext('2d');
        const volumesData = ${JSON.stringify(stats.volumes_breakdown)};
        new Chart(volumesCtx, {
            type: 'bar',
            data: {
                labels: volumesData.map(v => v.size),
                datasets: [{
                    label: 'Počet kusů',
                    data: volumesData.map(v => v.count),
                    backgroundColor: '#14b8a6',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // Graf časové osy (Line)
        const timelineCtx = document.getElementById('timelineChart').getContext('2d');
        const timelineData = ${JSON.stringify(stats.timeline)};
        new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: timelineData.map(t => t.date),
                datasets: [{
                    label: 'Nasbíráno plechovek',
                    data: timelineData.map(t => t.count),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    </script>
</body>
</html>`;
    
    fs.writeFileSync(outputPath, htmlContent, 'utf-8');
}

// Hlavní spouštěcí funkce
async function main() {
    console.log("🚀 Spouštím generování statistik...");
    
    try {
        const queryUrl = `${SUPABASE_URL}/rest/v1/pickups?select=count,is_analyzed,analysis_json,aluminum_weight_g,energy_saved_kwh,money_saved_czk,co2_saved_kg,team_code,nickname,created_at`;
        const response = await fetch(queryUrl, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Supabase query failed: Status ${response.status}`);
        }

        const pickups = await response.json();
        console.log(`📊 Staženo ${pickups.length} záznamů o sběrech.`);

        if (pickups.length === 0) {
            console.log("⚠️ Databáze je prázdná. Report nelze generovat.");
            return;
        }

        const stats = aggregateData(pickups);
        
        // Cesta pro uložení HTML reportu
        const reportPath = path.join(__dirname, 'report.html');
        generateHtmlReport(stats, reportPath);
        console.log(`\n📈 Nádherný HTML report s interaktivními grafy byl uložen do:`);
        console.log(`   👉 file://${reportPath}`);
        console.log(`   (Stačí na soubor dvakrát kliknout na vašem Macu a otevře se v Safari/Chrome)`);

        console.log(`\n==================================================`);
        console.log(`🧠 GENERUJI PŘÍSPĚVKY NA SOCIÁLNÍ SÍTĚ POMOCÍ AI...`);
        console.log(`==================================================\n`);

        const factsText = await generateFunFacts(stats);
        console.log(factsText);

        console.log(`\n==================================================`);
        console.log(`✅ Skript úspěšně dokončen.`);

    } catch (e) {
        console.error("❌ Kritická chyba skriptu:", e);
    }
}

main();
