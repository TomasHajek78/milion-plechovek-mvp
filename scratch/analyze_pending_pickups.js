// Skript pro automatickou analýzu fotek plechovek na pozadí pomocí Gemini Vision API
// Spuštění: GEMINI_API_KEY="váš_klíč" node analyze_pending_pickups.js

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dxlyjugmeucevosmhage.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_CR-YuABHB1SvPK6b6sz-WQ_Q6y_8iKx';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ ERROR: Chybí GEMINI_API_KEY v environment proměnných!");
    process.exit(1);
}

// Konfigurace průměrných vah a ekologických úspor
const CAN_WEIGHTS = {
    0.5: 16.0,     // 0.5 l = 16.0g
    0.33: 13.5,    // 0.33 l = 13.5g
    0.25: 10.0,    // 0.25 l = 10.0g
    0.2: 8.0,      // 0.2 l / 0.15 l = 8.0g
    'Unknown': 14.0 // Neznámá/ostatní = průměr 14.0g
};

const ENERGY_SAVED_KWH_PER_KG = 14; // Ušetřených 14 kWh na 1 kg hliníku
const SCRAP_VALUE_CZK_PER_KG = 20;   // Výkupní hodnota 20 Kč na 1 kg hliníku
const CO2_SAVED_KG_PER_KG = 6.2;     // Ušetřených 6.2 kg CO2 na 1 kg hliníku (Evropský průměr)

// Pomocná funkce pro stažení obrázku a převod na Base64
async function getBase64Image(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const buffer = await response.arrayBuffer();
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        const base64 = Buffer.from(buffer).toString('base64');
        return { base64, mimeType };
    } catch (e) {
        console.error(`  ⚠️ Chyba stahování obrázku z ${url}:`, e.message);
        return null;
    }
}

// Volání Gemini API pro analýzu obrázku
async function analyzeImageWithGemini(base64Data, mimeType) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `Analyze this photo of discarded beverage cans. Identify all aluminum cans. For each, determine:
1. Brand (e.g. Monster, Coca-Cola, Pilsner Urquell, Birell, Staropramen, Radegast, Kofola, Starobrno, Red Bull, Tiger, Heineken, Pepsi, or 'Unknown').
2. Volume in liters (0.5, 0.33, 0.25, 0.2, or 'Unknown').
3. detection_issue: If the brand or volume is 'Unknown', write a brief explanation in Czech explaining why (e.g. "plechovka je příliš zmačkaná a logo je skryté", "fotka je rozmazaná a text nečitelný", "je vidět pouze stříbrná spodní část", "plechovka je špinavá nebo zrezivělá"). Otherwise, set it to null.

CRITICAL: Czech brands cheat sheet:
- Birell: green cans with 'BIRELL' in white/green oval. Yellow-green is 'Pomelo & Grep'.
- Staropramen: green cans with large 'S' logo.
- Pilsner Urquell: green cans with red wax seal logo.
- Radegast: green or blue cans with pagan god symbol.
- Kofola: brown/beige/black cans with yellow flower logo.

Respond ONLY with a JSON array of objects with keys 'brand', 'volume_liters', and 'detection_issue'. Example output: [{"brand": "Monster", "volume_liters": 0.5, "detection_issue": null}, {"brand": "Unknown", "volume_liters": "Unknown", "detection_issue": "plechovka je příliš zmačkaná a logo je skryté"}]`;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            responseMimeType: "application/json"
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error (status ${response.status}): ${errorText}`);
    }

    const result = await response.json();
    try {
        const jsonText = result.candidates[0].content.parts[0].text;
        return JSON.parse(jsonText.trim());
    } catch (e) {
        console.error("  ⚠️ Chyba parsování odpovědi od Gemini:", result);
        return null;
    }
}

// Výpočet váhy a ekologických úspor
function calculateEnvironmentalStats(cans, userReportedCount) {
    let adjustedCans = [...cans];
    
    // Pokud AI detekovala méně plechovek než nahlásil uživatel, doplníme "Unknown" plechovky
    if (adjustedCans.length < userReportedCount) {
        const diff = userReportedCount - adjustedCans.length;
        for (let i = 0; i < diff; i++) {
            adjustedCans.push({ brand: 'Nerozpoznáno', volume_liters: 'Unknown' });
        }
    } 
    // Pokud AI detekovala více plechovek a uživatel nahlásil menší počet, omezíme pole na počet nahlášený uživatelem
    else if (adjustedCans.length > userReportedCount && userReportedCount > 0) {
        adjustedCans = adjustedCans.slice(0, userReportedCount);
    }

    let totalWeightG = 0;
    adjustedCans.forEach(can => {
        const vol = can.volume_liters;
        const weight = CAN_WEIGHTS[vol] || CAN_WEIGHTS['Unknown'];
        totalWeightG += weight;
    });

    const weightKg = totalWeightG / 1000;
    const energySavedKwh = weightKg * ENERGY_SAVED_KWH_PER_KG;
    const moneySavedCzk = weightKg * SCRAP_VALUE_CZK_PER_KG;
    const co2SavedKg = weightKg * CO2_SAVED_KG_PER_KG;

    return {
        cansList: adjustedCans,
        weightG: parseFloat(totalWeightG.toFixed(2)),
        energySavedKwh: parseFloat(energySavedKwh.toFixed(3)),
        moneySavedCzk: parseFloat(moneySavedCzk.toFixed(2)),
        co2SavedKg: parseFloat(co2SavedKg.toFixed(2))
    };
}

// Hlavní spouštěcí funkce
async function main() {
    console.log("🚀 Spouštím analýzu neanalyzovaných plechovek ze Supabase...");
    
    try {
        // 1. Načtení neanalyzovaných řádků, které obsahují URL fotky
        const queryUrl = `${SUPABASE_URL}/rest/v1/pickups?is_analyzed=eq.false&photo_url=not.is.null&select=id,photo_url,count,nickname`;
        const response = await fetch(queryUrl, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Supabase query failed: Status ${response.status}`);
        }

        const pendingPickups = await response.json();
        console.log(`🔍 Nalezeno ${pendingPickups.length} neanalyzovaných sběrů s fotografií.`);

        if (pendingPickups.length === 0) {
            console.log("✅ Všechny záznamy jsou analyzovány. Končím.");
            return;
        }

        // 2. Zpracování jednotlivých záznamů
        for (const pickup of pendingPickups) {
            console.log(`\n--------------------------------------------`);
            console.log(`📦 Zpracovávám záznam ID ${pickup.id} (Uživatel: ${pickup.nickname}, Nahlášeno: ${pickup.count} ks)...`);
            console.log(`🔗 URL fotky: ${pickup.photo_url}`);

            const imgData = await getBase64Image(pickup.photo_url);
            if (!imgData) {
                console.log(`  ❌ Přeskakuji záznam ID ${pickup.id} kvůli chybě načítání obrázku.`);
                continue;
            }

            console.log(`  🧠 Odesílám obrázek do Gemini Vision API...`);
            let detectedCans = [];
            try {
                detectedCans = await analyzeImageWithGemini(imgData.base64, imgData.mimeType);
                if (!detectedCans || !Array.isArray(detectedCans)) {
                    console.log("  ⚠️ Gemini nevrátila validní seznam plechovek. Nastavuji jako prázdné.");
                    detectedCans = [];
                }
            } catch (geminiError) {
                console.error("  ❌ Selhání při komunikaci s Gemini API:", geminiError.message);
                continue; // Přeskočit na další při fatální chybě
            }

            console.log(`  🔍 Gemini detekovala plechovky:`, JSON.stringify(detectedCans));

            // Výpočet statistik
            const stats = calculateEnvironmentalStats(detectedCans, pickup.count);
            console.log(`  ⚖️ Výpočty:`);
            console.log(`    - Detekováno celkem: ${stats.cansList.length} ks (přizpůsobeno nahlášenému počtu)`);
            console.log(`    - Váha hliníku: ${stats.weightG} g`);
            console.log(`    - Ušetřená energie: ${stats.energySavedKwh} kWh`);
            console.log(`    - Výkupní hodnota: ${stats.moneySavedCzk} Kč`);
            console.log(`    - Ušetřeno CO2: ${stats.co2SavedKg} kg`);

            // 3. Update řádku v Supabase
            console.log(`  💾 Ukládám analýzu do databáze...`);
            const updateUrl = `${SUPABASE_URL}/rest/v1/pickups?id=eq.${pickup.id}`;
            const updateResponse = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    is_analyzed: true,
                    analysis_json: stats.cansList,
                    aluminum_weight_g: stats.weightG,
                    energy_saved_kwh: stats.energySavedKwh,
                    money_saved_czk: stats.moneySavedCzk,
                    co2_saved_kg: stats.co2SavedKg
                })
            });

            if (updateResponse.ok) {
                console.log(`  ✅ Záznam ID ${pickup.id} úspěšně aktualizován!`);
            } else {
                const errText = await updateResponse.text();
                console.error(`  ❌ Chyba aktualizace záznamu ID ${pickup.id} v Supabase:`, errText);
            }
        }
        
        console.log(`\n🎉 Analýza dokončena.`);

    } catch (e) {
        console.error("❌ Kritická chyba skriptu:", e);
    }
}

main();
