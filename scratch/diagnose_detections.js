// Skript pro analýzu a diagnostiku problémů s AI detekcí plechovek
// Spuštění: node scratch/diagnose_detections.js

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dxlyjugmeucevosmhage.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_CR-YuABHB1SvPK6b6sz-WQ_Q6y_8iKx';

async function main() {
    console.log("🔍 Spouštím diagnostiku přesnosti AI detekcí...");
    
    try {
        const queryUrl = `${SUPABASE_URL}/rest/v1/pickups?is_analyzed=eq.true&photo_url=not.is.null&select=id,photo_url,count,nickname,analysis_json`;
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
        console.log(`📋 Celkem nalezeno ${pickups.length} analyzovaných záznamů s fotografií.`);

        const reports = [];
        let totalCans = 0;
        let totalUnrecognized = 0;

        for (const pickup of pickups) {
            const list = Array.isArray(pickup.analysis_json) ? pickup.analysis_json : [];
            const userCount = pickup.count || 0;
            
            // Spočítej nerozpoznané (brand === 'Nerozpoznáno' nebo brand === 'Unknown' nebo 'Neznámá')
            const unrecognized = list.filter(c => c.brand === 'Nerozpoznáno' || c.brand === 'Unknown' || c.brand === 'Neznámá').length;
            totalCans += list.length;
            totalUnrecognized += unrecognized;

            if (unrecognized > 0 || list.length !== userCount) {
                const issues = list.map(c => c.detection_issue).filter(Boolean);
                reports.push({
                    id: pickup.id,
                    nickname: pickup.nickname,
                    userCount: userCount,
                    aiCount: list.length,
                    unrecognizedCount: unrecognized,
                    percentUnrecognized: Math.round((unrecognized / (list.length || 1)) * 100),
                    photoUrl: pickup.photo_url,
                    brands: list.map(c => c.brand).join(', '),
                    issues: issues.length ? issues.join(', ') : null
                });
            }
        }

        // Seřazení podle počtu nerozpoznaných (nejhorší první)
        reports.sort((a, b) => b.unrecognizedCount - a.unrecognizedCount);

        console.log(`\n=================== STATISTIKA PŘESNOSTI ===================`);
        console.log(`Celkem analyzovaných plechovek: ${totalCans} ks`);
        console.log(`Celkem nerozpoznaných (Unknown): ${totalUnrecognized} ks (${Math.round((totalUnrecognized / (totalCans || 1)) * 100)} %)`);
        console.log(`Záznamy s detekčními problémy: ${reports.length} z ${pickups.length}`);
        console.log(`============================================================\n`);

        if (reports.length === 0) {
            console.log("✅ Žádné problémy s detekcí nebyly nalezeny. AI rozpoznala všechny značky dokonale!");
            return;
        }

        console.log("Seznam problematických úlovků (seřazeno podle chybovosti):");
        reports.forEach(r => {
            console.log(`\n📦 Záznam ID: ${r.id} | Sběrač: ${r.nickname}`);
            console.log(`   - Uživatel nahlásil: ${r.userCount} ks | AI detekovala: ${r.aiCount} ks`);
            console.log(`   - Nerozpoznané značky: ${r.unrecognizedCount} ks (${r.percentUnrecognized} %)`);
            console.log(`   - Detekované značky: [ ${r.brands} ]`);
            if (r.issues) {
                console.log(`   - ⚠️ Důvod nedetekování (z AI): ${r.issues}`);
            }
            console.log(`   - 📸 Odkaz na fotku: ${r.photoUrl}`);
        });

    } catch (e) {
        console.error("❌ Kritická chyba při provádění diagnostiky:", e.message);
    }
}

main();
