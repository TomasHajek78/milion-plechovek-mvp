// Skript pro lokální zálohu všech fotek z databáze Supabase na váš pevný disk
// Spuštění: node scratch/backup_gallery.js

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dxlyjugmeucevosmhage.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_CR-YuABHB1SvPK6b6sz-WQ_Q6y_8iKx';

// Složka pro uložení fotek (vytvoří se v rootu projektu)
const BACKUP_DIR = path.join(__dirname, '..', 'backup_photos');

// Vytvoření složky, pokud neexistuje
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Funkce pro bezpečné stažení a uložení jednoho obrázku
async function downloadImage(url, localFilePath) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(localFilePath, Buffer.from(buffer));
        return true;
    } catch (e) {
        console.error(`  ❌ Selhalo stahování fotky z ${url}:`, e.message);
        return false;
    }
}

async function main() {
    console.log("🚀 Spouštím lokální zálohování galerie fotek ze Supabase...");
    console.log(`📂 Fotky se uloží do: ${BACKUP_DIR}\n`);

    try {
        // 1. Načtení všech záznamů, které mají fotku
        const queryUrl = `${SUPABASE_URL}/rest/v1/pickups?photo_url=not.is.null&select=id,photo_url,nickname,count,created_at`;
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
        console.log(`🔍 Nalezeno celkem ${pickups.length} úlovků s fotografií.`);

        if (pickups.length === 0) {
            console.log("✅ Žádné fotky k zálohování.");
            return;
        }

        let downloadedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        // 2. Procházení a stahování
        for (const pickup of pickups) {
            const url = pickup.photo_url;
            
            // Extrakce přípony souboru z URL (výchozí jpg)
            const ext = url.split('.').pop().split('?')[0] || 'jpg';
            
            // Vyčištění přezdívky pro název souboru
            const cleanNick = (pickup.nickname || 'anonym').replace(/[^a-zA-Z0-9]/g, '_');
            
            // Naformátování data (např. 2026-05-29)
            const dateStr = pickup.created_at ? pickup.created_at.substring(0, 10) : 'unknown_date';
            
            // Strukturovaný název souboru: DATUM_PREZDIVKA_KUSY_ID.PRIPONA
            const filename = `${dateStr}_${cleanNick}_${pickup.count}ks_id${pickup.id}.${ext}`;
            const localFilePath = path.join(BACKUP_DIR, filename);

            // Pokud soubor už lokálně existuje, přeskočíme ho (šetříme čas a přenosy!)
            if (fs.existsSync(localFilePath)) {
                skippedCount++;
                continue;
            }

            console.log(`📥 Stahuji: ${filename}...`);
            const success = await downloadImage(url, localFilePath);
            if (success) {
                downloadedCount++;
            } else {
                failedCount++;
            }
        }

        console.log(`\n==================================================`);
        console.log(`🎉 ZÁLOHA GALERIE DOKONČENA`);
        console.log(`==================================================`);
        console.log(`📥 Staženo nových fotek:   ${downloadedCount} ks`);
        console.log(`⏭️ Již existujících (přeskočeno): ${skippedCount} ks`);
        console.log(`❌ Selhalo stahování:      ${failedCount} ks`);
        console.log(`📂 Celkový počet fotek v backup_photos: ${fs.readdirSync(BACKUP_DIR).length} ks`);
        console.log(`==================================================\n`);

    } catch (e) {
        console.error("❌ Kritická chyba zálohovacího skriptu:", e);
    }
}

main();
