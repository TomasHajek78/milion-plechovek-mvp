// --- Registrace Service Workera pro PWA stabilitu ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker registrován'))
        .catch(err => console.log('Service Worker selhal', err));
}

// --- Konfigurace Supabase Databáze ---
const SUPABASE_URL = 'https://dxlyjugmeucevosmhage.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bHlqdWdtZXVjZXZvc21oYWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzIzOTUsImV4cCI6MjA5NTEwODM5NX0.cG-DVzuKL1VOj8pwQG_Uu_sS_lJ3Wx5L-QmRbrBxIWw';

document.addEventListener('DOMContentLoaded', () => {
    // --- Prvky UI ---
    const loginScreen = document.getElementById('loginScreen');
    const sections = {
        home: document.getElementById('homeSection'),
        map: document.getElementById('mapSection'),
        leaderboard: document.getElementById('leaderboardSection')
    };
    const navItems = document.querySelectorAll('.nav-item');
    const pickupForm = document.getElementById('pickupForm');
    const successScreen = document.getElementById('successScreen');
    
    // --- Tlačítka a inputy ---
    const nicknameInput = document.getElementById('nicknameInput');
    const saveNickBtn = document.getElementById('saveNickBtn');
    const userNickDisplay = document.getElementById('userNickDisplay');
    const myStatsCard = document.getElementById('myStatsCard');
    
    const cameraBtn = document.getElementById('cameraBtn');
    const galleryBtn = document.getElementById('galleryBtn');
    const cameraInput = document.getElementById('cameraInput');
    const galleryInput = document.getElementById('galleryInput');

    const photoPreview = document.getElementById('photoPreview');
    const gpsStatus = document.getElementById('gpsStatus');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const shareBtn = document.getElementById('shareBtn');
    const newPickupBtn = document.getElementById('newPickupBtn');
    const gpsToggle = document.getElementById('gpsToggle');
    
    const canCountInput = document.getElementById('canCount');
    const userVolumesContainer = document.getElementById('userVolumesContainer');
    const userVolumesGroup = document.getElementById('userVolumesGroup');
    const myTotalEl = document.getElementById('myTotal');
    const globalTotalEl = document.getElementById('globalTotal');
    const globalEnergyEl = document.getElementById('globalEnergy');
    
    const historyList = document.getElementById('historyList');
    const leaderboardList = document.getElementById('leaderboardList');
    const settingsNicknameInput = document.getElementById('settingsNickname');
    
    // --- Indikátor synchronizace ---
    const syncBanner = document.getElementById('syncBanner');
    const syncStatusText = document.getElementById('syncStatusText');

    // --- State Aplikace ---
    let myStats = parseInt(localStorage.getItem('milion_mystats')) || 0;
    let globalStats = parseInt(localStorage.getItem('milion_globalstats')) || 999171;
    let globalEnergy = parseFloat(localStorage.getItem('milion_globalenergy')) || 0;
    let myHistory = JSON.parse(localStorage.getItem('milion_history')) || [];
    const originalLength = myHistory.length;
    myHistory = myHistory.filter(item => item.status !== 'pending');
    if (myHistory.length < originalLength) {
        localStorage.setItem('milion_history', JSON.stringify(myHistory));
        console.log("Zaseklé položky byly úspěšně vymazány.");
    }
    // Podpora URL parametru ?nick=Tom pro obnovení přezdívky bez login screenu
    const _urlNick = new URLSearchParams(window.location.search).get('nick');
    if (_urlNick) {
        localStorage.setItem('milion_nickname', _urlNick);
        // Odstraň parametr z URL (čistší adresa)
        window.history.replaceState({}, '', window.location.pathname);
    }
    let userNick = localStorage.getItem('milion_nickname') || '';
    // UUID zařízení – jedinečný identifikátor zařízení, přežije změnu přezdívky
    let deviceId = localStorage.getItem('milion_device_id');
    if (!deviceId) {
        deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        localStorage.setItem('milion_device_id', deviceId);
    }
    let useGPS = localStorage.getItem('milion_use_gps') !== 'false';
    let currentCoords = null;
    let map, markersLayer;
    let selectedFile = null;
    let allPickups = []; // Globální pole pro uchování všech stažených úlovků pro galerii
    let activeDetailPickup = null;
    const likedPickups = new Set();
    let teamReportOpened = false;

    function updateTomFeaturesVisibility() {
        const cleanNick = userNick ? userNick.trim().toLowerCase() : '';
        const isTom = cleanNick === 'tom' || cleanNick === 'tomáš hájek' || cleanNick === 'tomas hajek' || cleanNick === 'tomashajek';
        
        const openWrappedBtn = document.getElementById('openWrappedBtn');
        if (openWrappedBtn) {
            openWrappedBtn.style.display = (isTom && myStats > 0) ? 'block' : 'none';
        }
        
        const myEnergyDisplay = document.getElementById('myEnergyDisplay');
        if (myEnergyDisplay) {
            myEnergyDisplay.style.display = isTom ? 'flex' : 'none';
        }
    }
    
    // --- IndexedDB Inicializace pro Offline úlovky ---
    let db = null;
    const dbRequest = indexedDB.open('MilionPlechovekDB', 1);
    dbRequest.onupgradeneeded = (e) => {
        const localDb = e.target.result;
        // Jednorázová čistička zablokovaných fotek v telefonu
        if (!localStorage.getItem('queue_cleared_v1')) {
            if (localDb.objectStoreNames.contains('pendingPickups')) {
                const tx = localDb.transaction(['pendingPickups'], 'readwrite');
                tx.objectStore('pendingPickups').clear();
                localStorage.setItem('queue_cleared_v1', 'true');
                console.log("Zaseklá fronta vymazána");
            }
        }

        if (!localDb.objectStoreNames.contains('pendingPickups')) {
            localDb.createObjectStore('pendingPickups', { keyPath: 'id', autoIncrement: true });
        }
    };
    dbRequest.onsuccess = (e) => {
        db = e.target.result;
        
        // Jednorázová čistička zablokovaných fotek v telefonu
        if (!localStorage.getItem('queue_cleared_v2')) {
            if (db.objectStoreNames.contains('pendingPickups')) {
                const tx = db.transaction(['pendingPickups'], 'readwrite');
                tx.objectStore('pendingPickups').clear();
                localStorage.setItem('queue_cleared_v2', 'true');
                console.log("Zaseklá fronta vymazána");
            }
        }
        
        // v3: Oprava upload smyčky – foto se nahrávalo stokrát (DB zápis selhal, IDB se nevymazalo)
        if (!localStorage.getItem('queue_cleared_v3')) {
            if (db.objectStoreNames.contains('pendingPickups')) {
                const tx = db.transaction(['pendingPickups'], 'readwrite');
                tx.objectStore('pendingPickups').clear();
                localStorage.setItem('queue_cleared_v3', 'true');
                console.log("Zaseklá fronta v3 vymazána – zastavení upload smyčky");
            }
        }
        
        // Reset retryCount pro všechny zaseklé úlovky po zprovoznění opravy (odstranění app_version)
        if (!localStorage.getItem('retry_count_reset_v1')) {
            if (db.objectStoreNames.contains('pendingPickups')) {
                try {
                    const tx = db.transaction(['pendingPickups'], 'readwrite');
                    const store = tx.objectStore('pendingPickups');
                    const request = store.openCursor();
                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            const item = cursor.value;
                            if ((item.retryCount || 0) >= 5) {
                                item.retryCount = 0;
                                cursor.update(item);
                                console.log(`Resetován retryCount pro úlovek ID ${item.id}`);
                            }
                            cursor.continue();
                        } else {
                            localStorage.setItem('retry_count_reset_v1', 'true');
                            console.log("Hotovo: Všechny retryCounty byly zresetovány na 0.");
                            updateSyncBanner();
                            syncOfflinePickups();
                        }
                    };
                    request.onerror = () => {
                        localStorage.setItem('retry_count_reset_v1', 'true');
                        updateSyncBanner();
                        syncOfflinePickups();
                    };
                } catch (err) {
                    console.error("Chyba při resetu retryCount:", err);
                    localStorage.setItem('retry_count_reset_v1', 'true');
                    updateSyncBanner();
                    syncOfflinePickups();
                }
            } else {
                localStorage.setItem('retry_count_reset_v1', 'true');
                updateSyncBanner();
                syncOfflinePickups();
            }
        } else {
            updateSyncBanner();
            syncOfflinePickups();
        }
    };
    dbRequest.onerror = (e) => {
        console.error("IndexedDB error:", e);
    };

    // --- Mock Data pro Žebříček (Fallback) ---
    const mockLeaderboard = [
        { nick: "Plechovkový Král", count: 1250 },
        { nick: "EkoVálečník", count: 840 },
        { nick: "Sběrač_007", count: 620 },
        { nick: "Příroda_v_srdci", count: 510 },
        { nick: "Hliníkový_Honza", count: 480 },
        { nick: "Kovy_z_lesa", count: 420 },
        { nick: "Recykluj_nebo_zemři", count: 390 },
        { nick: "Zelená_Zuzka", count: 350 },
        { nick: "Čistá_Stezka", count: 310 },
        { nick: "Plecháč", count: 280 }
    ];

    // --- Načítání dat ze Supabase ---
    async function loadData(skipSync = false) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/pickups?select=id,nickname,count,latitude,longitude,notes,created_at,photo_url,team_code,likes_count,energy_saved_kwh,aluminum_weight_g,co2_saved_kg,analysis_json,is_analyzed,user_volumes,is_verified`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            if (!response.ok) throw new Error('Chyba komunikace s databází');
            let data = await response.json();
            
            // Odstranění spam botů (příliš vysoké počty)
            data = data.filter(item => item.count <= 50 && item.count > 0);

            // Odstranění NSFW položek z veřejné galerie
            data = data.filter(item => {
                if (item.analysis_json && Array.isArray(item.analysis_json)) {
                    return !item.analysis_json.some(can => can.brand === 'NSFW');
                }
                return true;
            });
            
            allPickups = data; // Uložení do globálního pole pro galerii

            // Sčítání globálních a osobních statistik
            const totalCans = data.reduce((sum, item) => sum + item.count, 0);
            globalStats = 1000000 - totalCans;
            myStats = data.filter(item => item.nickname === userNick).reduce((sum, item) => sum + item.count, 0);

            // Součet celkové ušetřené energie
            const totalEnergy = data.reduce((sum, item) => sum + (parseFloat(item.energy_saved_kwh) || 0), 0);
            globalEnergy = totalEnergy;

            // Součet osobní ušetřené energie
            const myEnergy = data.filter(item => item.nickname === userNick)
                .reduce((sum, item) => sum + (parseFloat(item.energy_saved_kwh) || 0), 0);

            // Formátování historie pro aktuálního uživatele
            myHistory = data.filter(item => item.nickname === userNick)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5)
                .map(item => ({
                    count: item.count,
                    date: new Date(item.created_at).toLocaleString('cs-CZ', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'}),
                    coords: item.latitude ? { lat: item.latitude, lon: item.longitude } : null,
                    photo_url: item.photo_url || null
                }));

            // Záložní uložení do localStorage pro offline
            localStorage.setItem('milion_mystats', myStats);
            localStorage.setItem('milion_globalstats', globalStats);
            localStorage.setItem('milion_globalenergy', globalEnergy);
            localStorage.setItem('milion_myenergy', myEnergy);
            localStorage.setItem('milion_history', JSON.stringify(myHistory));

            // Aktualizace rozhraní
            myTotalEl.textContent = myStats;
            const myEnergyValEl = document.getElementById('myEnergyValue');
            if (myEnergyValEl) {
                myEnergyValEl.textContent = myEnergy.toFixed(1).replace('.', ',');
            }
            if (globalTotalEl) {
                globalTotalEl.textContent = globalStats.toLocaleString('cs-CZ');
            }
            if (globalEnergyEl) {
                globalEnergyEl.textContent = globalEnergy.toFixed(1).replace('.', ',') + ' kWh';
            }

            // Zobrazení tlačítka pro Wrapped a osobní úspory
            updateTomFeaturesVisibility();

            renderHistory();
            renderLeaderboard(data);
            renderMarkers(data);
            
            // Pokud je v URL parametr ?team=KOD, otevřeme týmový report (pouze jednou při startu)
            if (!teamReportOpened) {
                const urlParams = new URLSearchParams(window.location.search);
                const teamParam = urlParams.get('team');
                if (teamParam) {
                    teamReportOpened = true;
                    openTeamReport(teamParam, data);
                }
            }
            
            // Pokud jsme úspěšně online načetli data, zkusíme odeslat případné offline čekající položky
            if (!skipSync) {
                syncOfflinePickups();
            }
            
            // Obnovení administrátorského seznamu (pokud je otevřen)
            if (typeof window.filterAdminPickups === 'function') {
                window.filterAdminPickups();
            }
            // Aktualizace našeptávače značek
            if (typeof window.populateDynamicBrands === 'function') {
                window.populateDynamicBrands();
            }
        } catch (e) {
            console.error('Nepodařilo se připojit k databázi. Používám lokální mezipaměť:', e);
            // Fallback na lokální data z localStorage
            myTotalEl.textContent = myStats;
            const cachedMyEnergy = localStorage.getItem('milion_myenergy') || '0';
            const myEnergyValEl = document.getElementById('myEnergyValue');
            if (myEnergyValEl) {
                myEnergyValEl.textContent = parseFloat(cachedMyEnergy).toFixed(1).replace('.', ',');
            }
            if (globalTotalEl) {
                globalTotalEl.textContent = globalStats.toLocaleString('cs-CZ');
            }
            if (globalEnergyEl) {
                globalEnergyEl.textContent = globalEnergy.toFixed(1).replace('.', ',') + ' kWh';
            }

            // Zobrazení tlačítka pro Wrapped a osobní úspory
            updateTomFeaturesVisibility();

            renderHistory();
            renderLeaderboard(); 
            renderMarkers(); 
        }
    }

    // --- Navigace ---
    function switchView(viewName) {
        // Skrýt vše
        Object.values(sections).forEach(s => s.classList.add('hidden'));
        navItems.forEach(n => n.classList.remove('active'));

        // Zobrazit vybrané
        sections[viewName].classList.remove('hidden');
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        if (viewName === 'map') {
            setTimeout(() => map.invalidateSize(), 100);
        }
        
        // Načíst čerstvá data z databáze při každém přepnutí záložky
        loadData();
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    // --- Žebříček ---
    function renderLeaderboard(allData = []) {
        leaderboardList.innerHTML = '';
        
        if (allData.length === 0) {
            // Vykreslení mock dat (lokální fallback)
            mockLeaderboard.forEach((user, index) => {
                const li = document.createElement('li');
                li.className = 'leaderboard-item';
                li.innerHTML = `
                    <span class="rank">${index + 1}.</span>
                    <span class="nick">${user.nick}</span>
                    <span class="count">${user.count} ks</span>
                `;
                li.addEventListener('click', () => openUserGallery(user.nick));
                leaderboardList.appendChild(li);
            });

            const myLi = document.createElement('li');
            myLi.className = 'leaderboard-item me';
            myLi.innerHTML = `
                <span class="rank">11.</span>
                <span class="nick">${userNick || 'Já'}</span>
                <span class="count">${myStats} ks</span>
            `;
            myLi.addEventListener('click', () => { if (userNick) openUserGallery(userNick); });
            leaderboardList.appendChild(myLi);
            return;
        }

        // Sečtení plechovek podle uživatelů
        const userSums = {};
        allData.forEach(item => {
            const nick = item.nickname || 'Anonymní Sběrač';
            userSums[nick] = (userSums[nick] || 0) + item.count;
        });

        // Seřazení uživatelů sestupně
        const sortedUsers = Object.entries(userSums)
            .map(([nick, count]) => ({ nick, count }))
            .sort((a, b) => b.count - a.count);

        // Vykreslení TOP 10
        sortedUsers.slice(0, 50).forEach((user, index) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            if (user.nick === userNick) li.className += ' me';
            li.innerHTML = `
                <span class="rank">${index + 1}.</span>
                <span class="nick">${user.nick}</span>
                <span class="count">${user.count} ks</span>
            `;
            li.addEventListener('click', () => openUserGallery(user.nick));
            leaderboardList.appendChild(li);
        });

        // Moje pozice v reálném žebříčku
        const myRankIndex = sortedUsers.findIndex(u => u.nick === userNick);
        if (myRankIndex >= 10) {
            const myLi = document.createElement('li');
            myLi.className = 'leaderboard-item me';
            myLi.innerHTML = `
                <span class="rank">${myRankIndex + 1}.</span>
                <span class="nick">${userNick}</span>
                <span class="count">${userSums[userNick] || 0} ks</span>
            `;
            myLi.addEventListener('click', () => openUserGallery(userNick));
            leaderboardList.appendChild(myLi);
        } else if (myRankIndex === -1 && userNick) {
            // Pokud ještě nic nenasbíral
            const myLi = document.createElement('li');
            myLi.className = 'leaderboard-item me';
            myLi.innerHTML = `
                <span class="rank">${sortedUsers.length + 1}.</span>
                <span class="nick">${userNick}</span>
                <span class="count">0 ks</span>
            `;
            myLi.addEventListener('click', () => openUserGallery(userNick));
            leaderboardList.appendChild(myLi);
        }
    }

    // Pomocná funkce pro určení barvy plechovky (zelená, modrá, červená) podle souřadnic.
    // Výsledkem je, že plechovky budou mít různé barvy z loga, ale konkrétní nález bude mít vždy stejnou barvu.
    function getMarkerColorClass(item) {
        if (!item || !item.latitude || !item.longitude) return 'can-green';
        // Jednoduchý stabilní hash ze souřadnic
        const hash = Math.abs(Math.sin(item.latitude * 12.9898 + item.longitude * 78.233) * 43758.5453);
        const index = Math.floor((hash % 1) * 3); // 0 = zelená, 1 = teal, 2 = červená
        const classes = ['can-green', 'can-teal', 'can-red'];
        return classes[index];
    }

    // Stabilní barva pro lajkovací plechovky (podle souřadnic, případně podle ID pro případy bez GPS)
    function getCanColorClass(item) {
        if (!item) return 'can-green';
        if (item.latitude && item.longitude) {
            return getMarkerColorClass(item);
        }
        const hash = Math.abs(Math.sin((item.id || 0) * 12.9898) * 43758.5453);
        const index = Math.floor((hash % 1) * 3);
        const classes = ['can-green', 'can-teal', 'can-red'];
        return classes[index];
    }

    // Získání URL rychlého náhledu pomocí Supabase Image Transformation (zdarma a extrémně rychlé)
    function getThumbnailUrl(photoUrl) {
        if (!photoUrl) return 'can-marker-transparent.png';
        if (photoUrl.includes('/storage/v1/object/public/')) {
            return photoUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=200&height=200&resize=cover';
        }
        return photoUrl;
    }

    // --- Mapa ---
    function initMap() {
        map = L.map('map', { maxZoom: 21, closePopupOnClick: false }).setView([49.8175, 15.473], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 21,
            maxNativeZoom: 19
        }).addTo(map);
        
        // Inicializace MarkerClusteru se sčítáním celkového počtu plechovek
        markersLayer = L.markerClusterGroup({
            disableClusteringAtZoom: 18, // Od přiblížení 18 výše už body neshlukujeme (budou vidět samostatně)
            spiderfyOnMaxZoom: true,     // Pokud jsou body na stejném místě, rozbalí se do paprsků
            iconCreateFunction: function(cluster) {
                const childMarkers = cluster.getAllChildMarkers();
                let sum = 0;
                childMarkers.forEach(m => {
                    sum += m.options.canCount || 1;
                });
                
                // Dynamická velikost plechovky podle počtu seskupených kusů
                let size = 42;
                let fontSize = 12;
                if (sum >= 10 && sum < 100) {
                    size = 50;
                    fontSize = 14;
                } else if (sum >= 100) {
                    size = 58;
                    fontSize = 16;
                }
                
                // Stabilní barva shluku podle jeho středu
                const latlng = cluster.getLatLng();
                const colorClass = getMarkerColorClass({ latitude: latlng.lat, longitude: latlng.lng });
                
                return L.divIcon({
                    html: `<div style="font-size: ${fontSize}px; font-weight: 900; color: white; text-shadow: 0 0 5px rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; padding-top: 2px;">${sum}</div>`,
                    className: `cluster-can-icon ${colorClass}`,
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2]
                });
            }
        }).addTo(map);
        
        renderMarkers();
    }

    // Vykreslení všech bodů z databáze
    function renderMarkers(allData = []) {
        if (!markersLayer) return;
        markersLayer.clearLayers();
        
        // Filtrování pouze schválených sběrů pro veřejnou mapu (karanténa vypnuta pro okamžitou zpětnou vazbu)
        const validPickups = allData.filter(p => {
            // Zobrazíme i neschválené (čekající na AI). Skryjeme pouze PROKÁZANÝ spam.
            if (p.is_analyzed && p.analysis_json && Array.isArray(p.analysis_json)) {
                if (p.analysis_json.some(c => c.brand === 'Unknown' || c.brand === 'unknown' || c.brand === 'Nerozpoznáno')) {
                    return false; // Skrýt spam / zamítnuté umělou inteligencí
                }
            }
            return true;
        });

        // Pokud nemáme live data, ukážeme jen svoji historii z paměti
        const itemsToRender = validPickups.length > 0 ? validPickups : myHistory.map(h => ({
            nickname: userNick || 'Já',
            count: h.count,
            latitude: h.coords ? h.coords.lat : null,
            longitude: h.coords ? h.coords.lon : null,
            created_at: new Date(),
            notes: '',
            photo_url: h.photo_url || null
        }));
        
        itemsToRender.forEach(item => {
            if (item.latitude && item.longitude) {
                const dateStr = item.created_at 
                    ? new Date(item.created_at).toLocaleString('cs-CZ', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric'})
                    : '';
                
                const colorClass = getMarkerColorClass(item);
                const numberIcon = L.divIcon({
                    className: `custom-div-icon ${colorClass}`,
                    html: `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: 900; font-size: 13px; color: white; text-shadow: 0 0 5px rgba(0,0,0,0.9); padding-top: 2px;">${item.count}</div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });

                const popupText = `
                    <b>${item.nickname || 'Anonym'}</b><br>
                    🥫 <b>${item.count} ks</b><br>
                    ${dateStr}
                    ${item.notes ? `<br><i>${item.notes}</i>` : ''}
                    ${item.photo_url ? `<br><a href="${item.photo_url}" target="_blank"><img src="${item.photo_url}" style="width:120px; height:120px; object-fit:cover; border-radius:12px; margin-top:8px; display:block; border:1px solid #e2e8f0;"></a>` : ''}
                `;

                L.marker([item.latitude, item.longitude], { 
                    icon: numberIcon,
                    canCount: item.count
                })
                .bindPopup(popupText, { autoPan: false, minWidth: 140 })
                .addTo(markersLayer);
            }
        });
    }

    // --- Historie (moje) ---
    function renderHistory() {
        historyList.innerHTML = '';
        if (myHistory.length === 0) {
            historyList.innerHTML = '<li class="small-text" style="color:#888; text-align:center; width:100%;">Zatím nic. Vyraz ven!</li>';
            return;
        }
        // Zobrazíme posledních 20 záznamů v UI (ale v localStorage jich je uloženo až 1000 pro zálohu)
        myHistory.slice(0, 20).forEach(item => {
            const li = document.createElement('li');
            
            // Detekce, zda AI zamítla tento úlovek
            const isRejected = item.notes && item.notes.includes('[ZAMÍTNUTO AI: DUPLIKÁT SCÉNY]');
            
            if (isRejected) {
                li.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                        <div style="display: flex; justify-content: space-between; opacity: 0.6; text-decoration: line-through;">
                            <span>📅 ${item.date}${item.photo_url ? ` <a href="${item.photo_url}" target="_blank" style="text-decoration:none;">📸</a>` : ''}</span> 
                            <strong>+0 ks</strong>
                        </div>
                        <span style="font-size: 11px; color: var(--rust-red); background: rgba(220,38,38,0.1); padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                            ⚠️ Zamítnuto AI: Pokus o znovunahrání stejných plechovek
                        </span>
                    </div>
                `;
            } else {
                li.innerHTML = `<span>📅 ${item.date}${item.photo_url ? ` <a href="${item.photo_url}" target="_blank" style="text-decoration:none;">📸</a>` : ''}</span> <strong>+${item.count} ks</strong>`;
            }
            historyList.appendChild(li);
        });
    }

    // --- Inicializace ---
    if (userNick) {
        userNickDisplay.textContent = userNick;
    }
    updateTomFeaturesVisibility();
    initMap();
    loadData();
    initRealtime();

    // Nastavení GPS přepínače
    if (gpsToggle) {
        gpsToggle.checked = useGPS;
        gpsToggle.addEventListener('change', (e) => {
            useGPS = e.target.checked;
            localStorage.setItem('milion_use_gps', useGPS);
        });
    }

    // Inicializace a uložení přezdívky z nastavení
    if (settingsNicknameInput) {
        settingsNicknameInput.value = userNick;
        settingsNicknameInput.addEventListener('input', (e) => {
            userNick = e.target.value.trim();
            localStorage.setItem('milion_nickname', userNick);
            userNickDisplay.textContent = userNick;
            updateTomFeaturesVisibility();
        });
    }

    // Kliknutí na kartu vlastních statistik otevře osobní galerii
    if (myStatsCard) {
        myStatsCard.addEventListener('click', () => {
            if (userNick) {
                openUserGallery(userNick);
            }
        });
    }

    // Kontrola nickname
    if (!userNick) {
        loginScreen.classList.remove('hidden');
        sections.home.classList.add('hidden');
        document.querySelector('.bottom-nav').classList.add('hidden');
    }

    saveNickBtn.addEventListener('click', async () => {
        const val = nicknameInput.value.trim();
        if (!val) return;
        const errorEl = document.getElementById('nickErrorMsg');
        saveNickBtn.disabled = true;
        saveNickBtn.textContent = 'Kontroluji...';
        try {
            // Zkontroluj jestli přezdívka existuje v DB
            const resp = await fetch(`${SUPABASE_URL}/rest/v1/pickups?select=nickname&nickname=eq.${encodeURIComponent(val)}&limit=1`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            const existing = await resp.json();
            // Přezdívka existuje v DB – pravděpodobně tvoje vlastní, načteme data
            // (duplicita jiného uživatele se nedá bez účtu ověřit – přijmeme ji)
            userNick = val;
            localStorage.setItem('milion_nickname', userNick);
            userNickDisplay.textContent = userNick;
            updateTomFeaturesVisibility();
            if (errorEl) errorEl.style.display = 'none';
            loginScreen.classList.add('hidden');
            sections.home.classList.remove('hidden');
            document.querySelector('.bottom-nav').classList.remove('hidden');
            loadData();
        } catch (e) {
            // Offline – ulož přezdívku a pokračuj
            userNick = val;
            localStorage.setItem('milion_nickname', userNick);
            userNickDisplay.textContent = userNick;
            updateTomFeaturesVisibility();
            loginScreen.classList.add('hidden');
            sections.home.classList.remove('hidden');
            document.querySelector('.bottom-nav').classList.remove('hidden');
            loadData();
        } finally {
            saveNickBtn.disabled = false;
            saveNickBtn.textContent = 'Uložit a pokračovat';
        }
    });

    // --- Pomocná funkce pro kompresi obrázků na straně klienta ---
    function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const name = file.name.substring(0, file.name.lastIndexOf('.')) || 'photo';
                            const compressedFile = new File([blob], `${name}.jpg`, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Chyba při konverzi na Blob.'));
                        }
                    }, 'image/jpeg', quality);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    // --- Akce ---
    cameraBtn.addEventListener('click', () => cameraInput.click());
    galleryBtn.addEventListener('click', () => galleryInput.click());

    [cameraInput, galleryInput].forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const originalFile = e.target.files[0];
                selectedFile = originalFile; // Použít jako zálohu, pokud komprese selže
                
                // Okamžitý náhled původního obrázku pro rychlou odezvu UI
                const reader = new FileReader();
                reader.onload = (e) => { photoPreview.src = e.target.result; };
                reader.readAsDataURL(originalFile);
                
                sections.home.classList.add('hidden');
                document.querySelector('.bottom-nav').classList.add('hidden');
                pickupForm.classList.remove('hidden');
                
                if (canCountInput) {
                    canCountInput.value = 1;
                }
                const detailsEl = document.querySelector('#userVolumesGroup details');
                if (detailsEl) {
                    detailsEl.removeAttribute('open');
                }
                generateUserVolumeSelects(1);
                
                if (userVolumesGroup) {
                    const isTom = userNick && userNick.trim().toLowerCase() === 'tom';
                    userVolumesGroup.style.display = isTom ? 'block' : 'none';
                }
                
                if (useGPS) {
                    getGPSLocation();
                } else {
                    gpsStatus.innerHTML = "📍 Nemáte zapnutou polohu, vaše plechovky se nezobrazí na mapě.";
                    gpsStatus.style.color = "var(--rust-red)";
                    currentCoords = null;
                }

                // Spustit kompresi na pozadí
                compressImage(originalFile)
                    .then(compressedFile => {
                        selectedFile = compressedFile;
                        console.log(`Obrázek zkomprimován ze ${(originalFile.size / 1024 / 1024).toFixed(2)} MB na ${(compressedFile.size / 1024).toFixed(2)} KB.`);
                    })
                    .catch(err => {
                        console.error("Chyba při kompresi obrázku, použije se originál:", err);
                    });
            }
        });
    });

    function generateUserVolumeSelects(count) {
        if (!userVolumesContainer) return;
        userVolumesContainer.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.gap = '8px';
            div.style.fontSize = '12px';
            
            div.innerHTML = `
                <span style="font-weight: bold; color: var(--text-dark);">Plechovka #${i + 1}:</span>
                <select style="flex: 1; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; background: #fff; color: var(--text-dark);">
                    <option value="null">Neznámý objem</option>
                    <option value="0.5">0,5 l</option>
                    <option value="0.33">0,33 l</option>
                    <option value="0.25">0,25 l</option>
                    <option value="0.2">0,2 l</option>
                </select>
            `;
            userVolumesContainer.appendChild(div);
        }
    }

    if (canCountInput) {
        canCountInput.addEventListener('input', () => {
            const count = Math.max(1, Math.min(50, parseInt(canCountInput.value) || 1));
            generateUserVolumeSelects(count);
        });
    }

    async function compressImage(file, maxWidth = 2048, maxHeight = 2048, quality = 0.85) {
        if (!file || !file.type || !file.type.startsWith('image/')) return file;
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else resolve(file); // fallback
                    }, 'image/jpeg', quality);
                };
                img.onerror = error => {
                    console.error('Image load error during compression', error);
                    resolve(file); // fallback on error
                };
            };
            reader.onerror = error => {
                console.error('File read error during compression', error);
                resolve(file); // fallback
            };
        });
    }

    function getGPSLocation() {
        gpsStatus.textContent = "📍 Zjišťuji polohu...";
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                currentCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                gpsStatus.innerHTML = "📍 Poloha zaměřena!";
                gpsStatus.style.color = "var(--forest-green)";
            },
            (err) => {
                console.warn("Chyba GPS:", err);
                gpsStatus.innerHTML = "📍 Poloha nezaměřena. Zkontroluj oprávnění/GPS.";
                gpsStatus.style.color = "var(--rust-red)";
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    submitBtn.addEventListener('click', async () => {
        const count = parseInt(canCountInput.value) || 1;
        const notes = document.getElementById('notes').value.trim();
        
        // Sběr dobrovolně zadaných velikostí (user_volumes) - pouze pro uživatele Tom
        const isTom = userNick && userNick.trim().toLowerCase() === 'tom';
        let userVolumesPayload = null;
        if (isTom) {
            const volumeSelects = document.querySelectorAll('#userVolumesContainer select');
            let userVolumes = [];
            volumeSelects.forEach(select => {
                const val = select.value;
                userVolumes.push(val === 'null' ? null : parseFloat(val));
            });
            const hasValues = userVolumes.some(v => v !== null);
            userVolumesPayload = hasValues ? userVolumes : null;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = "Odesílám...";
        
        try {
            if (!navigator.onLine) {
                await savePickupOffline(count, notes, selectedFile, userVolumesPayload);
                return;
            }

            let photoUrl = null;
            if (selectedFile) {
                // Generování unikátního názvu souboru pro zabránění přepsání
                const fileExt = 'jpg'; // Forcováno na JPG díky kompresi
                const cleanNick = userNick.replace(/[^a-zA-Z0-9]/g, '_');
                const filename = `${Date.now()}_${cleanNick}.${fileExt}`;
                
                const compressedBlob = await compressImage(selectedFile, 2048, 2048, 0.85);
                
                const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/pickups-v3/${filename}`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'image/jpeg'
                    },
                    body: compressedBlob
                });
                
                if (uploadResponse.ok) {
                    photoUrl = `${SUPABASE_URL}/storage/v1/object/public/pickups-v3/${filename}`;
                } else {
                    throw new Error("Odesílání fotografie selhalo.");
                }
            }

            // Uložení do Supabase databáze
            let isInserted = false;
            const response = await fetch(`${SUPABASE_URL}/rest/v1/pickups`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    nickname: userNick,
                    count: count,
                    latitude: currentCoords ? currentCoords.lat : null,
                    longitude: currentCoords ? currentCoords.lon : null,
                    notes: notes || null,
                    photo_url: photoUrl,
                    user_volumes: userVolumesPayload
                })
            });
            
            if (!response.ok) throw new Error('Chyba zápisu do databáze');
            isInserted = true;
            
            // Okamžité znovunačtení dat z databáze
            try {
                await loadData();
            } catch (loadErr) {
                console.warn("Zápis úspěšný, ale nepodařilo se načíst nová data:", loadErr);
                // Data už jsou v databázi, chyba načtení skóre nevadí úspěšnému uložení.
            }
            
            // Reset titulku úspěšné obrazovky na výchozí online stav
            const successTitle = successScreen.querySelector('h3');
            const successDesc = successScreen.querySelector('p');
            if (successTitle) successTitle.textContent = "Úlovek zapsán! 🎉";
            if (successDesc) successDesc.innerHTML = "Skvělá práce, tvůj úlovek byl úspěšně zapsán do databáze a odečten od cílového milionu.";
            
            pickupForm.classList.add('hidden');
            successScreen.classList.remove('hidden');
            launchConfetti();
            
        } catch (error) {
            console.error("Chyba:", error);
            // Zkusíme uložit offline jako záložní řešení, POUZE pokud se nepovedlo odeslat data na server
            if (typeof isInserted !== 'undefined' && isInserted) {
                // Bylo úspěšně vloženo do databáze, ale selhalo něco jiného (např. chyba v UI).
                // V žádném případě neukládat do offline zálohy, jinak vzniknou duplikáty!
                pickupForm.classList.add('hidden');
                successScreen.classList.remove('hidden');
                launchConfetti();
            } else {
                await savePickupOffline(count, notes, selectedFile, userVolumesPayload);
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Odeslat do odpočtu";
        }
    });

    function launchConfetti() {
        const emojis = ['🥫', '♻️', '✨', '🌍', '💚'];
        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement('div');
            confetti.innerText = emojis[Math.floor(Math.random() * emojis.length)];
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-20px';
            confetti.style.fontSize = (Math.random() * 20 + 20) + 'px';
            confetti.style.zIndex = '1000';
            confetti.style.transition = `transform ${Math.random() * 2 + 1}s linear, opacity 2s`;
            document.body.appendChild(confetti);

            setTimeout(() => {
                confetti.style.transform = `translateY(100vh) rotate(${Math.random() * 360}deg)`;
                confetti.style.opacity = '0';
            }, 100);

            setTimeout(() => confetti.remove(), 3000);
        }
    }

    shareBtn.addEventListener('click', async () => {
        const count = canCountInput.value;
        const text = `Právě jsem sebral ${count} plechovek a pomáhám vyčistit Česko! Sleduj @milionplechovek a přidej se taky. #milionplechovek ♻️🥫`;
        
        // Zkopírování textu do schránky pro snadné vložení do Instagramu
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.warn("Nepodařilo se automaticky zkopírovat text:", err);
        }

        if (navigator.share) {
            const shareData = {
                title: 'Milion Plechovek',
                text: text
            };

            // Pokud máme obrázek a prohlížeč podporuje sdílení souborů, nasdílíme přímo fotku plechovky
            if (selectedFile && navigator.canShare && navigator.canShare({ files: [selectedFile] })) {
                shareData.files = [selectedFile];
            } else {
                shareData.url = window.location.href;
            }

            try {
                await navigator.share(shareData);
                alert("Obrázek byl odeslán do sdílení. V Instagramu stačí podržet prst a vložit zkopírovaný popisek příspěvku!");
            } catch (err) {
                console.log('Sdílení bylo zrušeno nebo selhalo:', err);
            }
        } else {
            alert("Váš prohlížeč nepodporuje přímé sdílení. Text popisku byl alespoň zkopírován do schránky!");
        }
    });
    
    // --- Záloha a Obnova (Ochrana proti promazání prohlížečem) ---
    window.exportData = () => {
        const data = {
            stats: myStats,
            global: globalStats,
            history: myHistory,
            nick: userNick
        };
        const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `milion_plechovek_zaloha_${userNick}.json`;
        a.click();
    };

    window.importData = (jsonStr) => {
        try {
            const data = JSON.parse(jsonStr);
            if (data.stats !== undefined) {
                myStats = data.stats;
                globalStats = data.global;
                myHistory = data.history;
                
                userNick = data.nick;
                localStorage.setItem('milion_mystats', myStats);
                localStorage.setItem('milion_globalstats', globalStats);
                localStorage.setItem('milion_history', JSON.stringify(myHistory));
                localStorage.setItem('milion_nickname', userNick);
                
                alert("Data úspěšně obnovena! Aplikace se restartuje.");
                window.location.reload();
            }
        } catch (e) {
            alert("Chyba při importu dat.");
        }
    };

    window.handleImport = (input) => {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => importData(e.target.result);
            reader.readAsText(file);
        }
    };

    window.toggleSettings = () => {
        const modal = document.getElementById('settingsModal');
        modal.classList.toggle('hidden');
    };

    // --- LOGIKA INTERAKTIVNÍ GALERIE FOTEK UŽIVATELŮ ---
    const userGalleryModal = document.getElementById('userGalleryModal');
    const closeGalleryBtn = document.getElementById('closeGalleryBtn');
    const galleryGrid = document.getElementById('galleryGrid');
    const galleryTitle = document.getElementById('galleryTitle');
    const photoDetailViewer = document.getElementById('photoDetailViewer');
    const detailImage = document.getElementById('detailImage');
    const detailCountNumber = document.getElementById('detailCountNumber');
    const detailCountIcon = document.getElementById('detailCountIcon');
    const detailDate = document.getElementById('detailDate');
    const detailNotes = document.getElementById('detailNotes');

    window.openUserGallery = (nickname) => {
        if (!nickname) return;
        
        galleryTitle.textContent = nickname === userNick ? 'Moje galerie fotek' : `Galerie: ${nickname}`;
        galleryGrid.innerHTML = '';
        photoDetailViewer.classList.add('hidden'); // Skrýt detail při otevření

        // Filtrování úlovků daného uživatele (zobrazujeme všechny platné fotky kromě zablokovaných jako NSFW)
        const userPickups = allPickups.filter(p => {
            if (p.nickname !== nickname || !p.photo_url) return false;
            if (p.is_analyzed && p.analysis_json && Array.isArray(p.analysis_json)) {
                if (p.analysis_json.some(c => c.brand === 'NSFW')) {
                    return false; // Skrýt nevhodný obsah
                }
            }
            return true;
        });

        if (userPickups.length === 0) {
            galleryGrid.innerHTML = '<div style="grid-column: span 3; text-align: center; color: var(--text-dim); padding: 20px 0; font-size: 13px;">Tento uživatel nemá nahrané žádné fotky.</div>';
        } else {
            // Seřazení od nejnovějších
            userPickups.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            
            userPickups.forEach(pickup => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'gallery-item';
                
                const thumbUrl = getThumbnailUrl(pickup.photo_url);
                itemDiv.innerHTML = `
                    <img src="${thumbUrl}" alt="Úlovek" loading="lazy">
                    <span class="gallery-badge">+${pickup.count}</span>
                `;
                
                // Kliknutí na náhled v galerii zobrazí velký detail pod mřížkou
                itemDiv.addEventListener('click', () => {
                    // Odbavení vizuálního výběru v gridu
                    document.querySelectorAll('.gallery-item').forEach(el => el.classList.remove('selected'));
                    itemDiv.classList.add('selected');
                    
                    activeDetailPickup = pickup; // Nastavíme aktivní úlovek pro lajkování
                    
                    detailImage.src = pickup.photo_url;
                    if (detailCountNumber) {
                        detailCountNumber.textContent = pickup.count;
                    }
                    if (detailCountIcon) {
                        detailCountIcon.className = 'custom-div-icon'; // reset
                        const colorClass = getCanColorClass(pickup);
                        if (colorClass) {
                            detailCountIcon.classList.add(colorClass);
                        }
                    }
                    detailDate.textContent = pickup.created_at 
                        ? new Date(pickup.created_at).toLocaleDateString('cs-CZ', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})
                        : '';
                    detailNotes.innerHTML = pickup.notes ? `„${pickup.notes}“` : 'Bez poznámky';
                    if (pickup.nickname === userNick) {
                        const editBtn = document.createElement('span');
                        editBtn.innerHTML = ' ✏️';
                        editBtn.style.cursor = 'pointer';
                        editBtn.title = 'Upravit poznámku';
                        editBtn.onclick = () => window.editPickupNote(pickup.id, pickup.notes);
                        detailNotes.appendChild(editBtn);
                    }
                    
                    // Nastavit počet lajků
                    const likeCountEl = document.getElementById('likeCount');
                    if (likeCountEl) {
                        likeCountEl.textContent = pickup.likes_count || 0;
                    }
                    
                    // Nastavit barvu lajkovací plechovky
                    const likeCanIconEl = document.getElementById('likeCanIcon');
                    if (likeCanIconEl) {
                        likeCanIconEl.className = ''; // Reset barvy
                        const colorClass = getCanColorClass(pickup);
                        if (colorClass) {
                            likeCanIconEl.classList.add(colorClass);
                            // Aktualizujeme src pro img element
                            if (colorClass === 'can-green') {
                                likeCanIconEl.src = 'can_marker_green_transparent.png';
                            } else if (colorClass === 'can-teal') {
                                likeCanIconEl.src = 'can_marker_teal_transparent.png';
                            } else if (colorClass === 'can-red') {
                                likeCanIconEl.src = 'can_marker_red_transparent.png';
                            }
                        } else {
                            likeCanIconEl.src = 'can-marker-transparent.png';
                        }
                    }
                    
                    // Vizuální stav lajknutí tlačítka
                    const likeBtnEl = document.getElementById('likeBtn');
                    if (likeBtnEl) {
                        if (pickup.nickname === userNick) {
                            likeBtnEl.style.opacity = '0.3';
                            likeBtnEl.style.cursor = 'not-allowed';
                            likeBtnEl.title = 'Vlastní úlovek nelze lajkovat';
                        } else if (likedPickups.has(pickup.id)) {
                            likeBtnEl.style.opacity = '0.7';
                            likeBtnEl.style.cursor = 'pointer';
                            likeBtnEl.title = 'Odebrat lajk';
                        } else {
                            likeBtnEl.style.opacity = '1';
                            likeBtnEl.style.cursor = 'pointer';
                            likeBtnEl.title = 'Přidat lajk';
                        }
                    }
                    
                    photoDetailViewer.classList.remove('hidden');
                    
                    // Odrolovat dolů k detailu pro lepší uživatelský zážitek na mobilu
                    setTimeout(() => {
                        userGalleryModal.scrollTo({
                            top: userGalleryModal.scrollHeight,
                            behavior: 'smooth'
                        });
                    }, 100);
                });
                
                galleryGrid.appendChild(itemDiv);
            });
        }
        
        userGalleryModal.classList.remove('hidden');
    };

    if (closeGalleryBtn) {
        closeGalleryBtn.addEventListener('click', () => {
            userGalleryModal.classList.add('hidden');
        });
    }

    // --- LOGIKA TLAČÍTKA LAJKOVÁNÍ FOTEK ---
    const likeBtn = document.getElementById('likeBtn');
    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            if (!activeDetailPickup) return;
            const pickupToLike = activeDetailPickup;
            
            // Zákaz lajkování vlastních fotek
            if (pickupToLike.nickname === userNick) {
                return;
            }
            
            const isLiking = !likedPickups.has(pickupToLike.id);
            const currentCount = pickupToLike.likes_count || 0;
            let newLikesCount = currentCount;
            
            if (isLiking) {
                likedPickups.add(pickupToLike.id);
                likeBtn.style.opacity = '0.7';
                likeBtn.title = 'Odebrat lajk';
                newLikesCount = currentCount + 1;
            } else {
                likedPickups.delete(pickupToLike.id);
                likeBtn.style.opacity = '1';
                likeBtn.title = 'Přidat lajk';
                newLikesCount = Math.max(0, currentCount - 1);
            }
            
            pickupToLike.likes_count = newLikesCount;
            const likeCountEl = document.getElementById('likeCount');
            if (likeCountEl) {
                likeCountEl.textContent = newLikesCount;
            }
            
            try {
                if (isLiking) {
                    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_likes`, {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ row_id: pickupToLike.id })
                    });
                    
                    if (!response.ok) throw new Error("RPC fallback");
                } else {
                    throw new Error("Force fallback for decrement"); // Nemáme decrement RPC, použijeme PATCH
                }
            } catch (err) {
                // Fallback na přímý PATCH
                await fetch(`${SUPABASE_URL}/rest/v1/pickups?id=eq.${pickupToLike.id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ likes_count: newLikesCount })
                });
            }
            
            // Načteme nová data na pozadí
            loadData();
        });
    }

    // --- FUNKCE PRO ÚPRAVU POZNÁMKY ---
    window.editPickupNote = async function(pickupId, currentNote) {
        const newNote = prompt("Upravit poznámku:", currentNote || "");
        if (newNote === null) return; // Zrušeno uživatelem
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/pickups?id=eq.${pickupId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notes: newNote.trim() || null })
            });
            
            if (response.ok) {
                const detailNotes = document.getElementById('detailNotes');
                if (detailNotes) {
                    detailNotes.innerHTML = newNote.trim() ? `„${newNote.trim()}“` : 'Bez poznámky';
                    const editBtn = document.createElement('span');
                    editBtn.innerHTML = ' ✏️';
                    editBtn.style.cursor = 'pointer';
                    editBtn.title = 'Upravit poznámku';
                    editBtn.onclick = () => window.editPickupNote(pickupId, newNote.trim());
                    detailNotes.appendChild(editBtn);
                }
                
                // Aktualizovat data v poli a překreslit
                const idx = allPickups.findIndex(p => p.id === pickupId);
                if (idx !== -1) {
                    allPickups[idx].notes = newNote.trim() || null;
                }
                if (activeDetailPickup && activeDetailPickup.id === pickupId) {
                    activeDetailPickup.notes = newNote.trim() || null;
                }
                loadData(); // Obnovit na pozadí
            } else {
                alert("Nepodařilo se upravit poznámku.");
            }
        } catch (err) {
            console.error(err);
            alert("Chyba spojení se serverem.");
        }
    };


    // --- REALTIME WEB-SOCKET AKTIVITY ---
    let toastTimeout = null;
    function showToast(message, emoji = '🥫') {
        const toastEl = document.getElementById('activityToast');
        const emojiEl = document.getElementById('toastEmoji');
        const textEl = document.getElementById('toastText');
        
        if (!toastEl || !emojiEl || !textEl) return;
        
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }
        
        emojiEl.textContent = emoji;
        textEl.textContent = message;
        
        toastEl.classList.remove('hidden');
        
        toastTimeout = setTimeout(() => {
            toastEl.classList.add('hidden');
        }, 4000);
    }

    function initRealtime() {
        const wsUrl = `${SUPABASE_URL.replace('https://', 'wss://')}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`;
        let ws = new WebSocket(wsUrl);
        let heartbeatInterval = null;
        let refCounter = 1;

        ws.onopen = () => {
            console.log("Supabase Realtime WebSocket připojen.");
            
            // Phoenix heartbeat každých 30 sekund
            heartbeatInterval = setInterval(() => {
                ws.send(JSON.stringify({
                    topic: "phoenix",
                    event: "heartbeat",
                    payload: {},
                    ref: (refCounter++).toString()
                }));
            }, 30000);

            // Přihlášení do kanálu pro sledování změn v pickups
            ws.send(JSON.stringify({
                topic: "realtime:public:pickups",
                event: "phx_join",
                payload: {
                    config: {
                        postgres_changes: [
                            {
                                event: "*",
                                schema: "public",
                                table: "pickups"
                            }
                        ]
                    }
                },
                ref: (refCounter++).toString()
            }));
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                
                // Ignorujeme odpovědi na heartbeat
                if (msg.event === "phx_reply" && msg.topic === "phoenix") return;
                
                if (msg.event === "postgres_changes") {
                    const change = msg.payload;
                    if (!change || !change.data) return;
                    
                    const record = change.data.record;
                    const type = change.data.type;
                    
                    if (type === "INSERT") {
                        // Někdo nasbíral plechovky!
                        showToast(`🥫 ${record.nickname || 'Někdo'} právě nasbíral ${record.count} plechovek!`);
                        loadData();
                    } else if (type === "UPDATE") {
                        const oldRecord = change.data.old_record;
                        if (record.likes_count > (oldRecord ? (oldRecord.likes_count || 0) : 0)) {
                            // Někdo dal lajk!
                            showToast(`💚 Někdo dal lajk fotce od ${record.nickname || 'někoho'}!`);
                            
                            // Aktualizace lokálního stavu pro okamžité zobrazení
                            const localPickup = allPickups.find(p => p.id === record.id);
                            if (localPickup) {
                                localPickup.likes_count = record.likes_count;
                                
                                const detailViewer = document.getElementById('photoDetailViewer');
                                if (detailViewer && !detailViewer.classList.contains('hidden') && activeDetailPickup && activeDetailPickup.id === record.id) {
                                    const likeCountEl = document.getElementById('likeCount');
                                    if (likeCountEl) {
                                        likeCountEl.textContent = record.likes_count;
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Chyba při zpracování WebSocket zprávy:", err);
            }
        };

        ws.onclose = () => {
            console.warn("Supabase Realtime WebSocket odpojen. Reconnect za 5s...");
            clearInterval(heartbeatInterval);
            setTimeout(initRealtime, 5000);
        };

        ws.onerror = (err) => {
            console.error("Chyba WebSocketu:", err);
            ws.close();
        };
    }

    window.toggleDesatero = () => {
        const modal = document.getElementById('desateroModal');
        modal.classList.toggle('hidden');
    };

    window.toggleEnergyInfo = () => {
        const modal = document.getElementById('energyInfoModal');
        if (modal) modal.classList.toggle('hidden');
    };

    const energyStatsCard = document.getElementById('energyStatsCard');
    if (energyStatsCard) {
        energyStatsCard.addEventListener('click', () => {
            toggleEnergyInfo();
        });
    }

    const closeEnergyInfoBtn = document.getElementById('closeEnergyInfoBtn');
    if (closeEnergyInfoBtn) {
        closeEnergyInfoBtn.addEventListener('click', () => {
            document.getElementById('energyInfoModal').classList.add('hidden');
        });
    }

    window.toggleTeamReport = () => {
        const modal = document.getElementById('teamReportModal');
        if (modal) modal.classList.toggle('hidden');
    };

    const closeTeamReportBtn = document.getElementById('closeTeamReportBtn');
    if (closeTeamReportBtn) {
        closeTeamReportBtn.addEventListener('click', () => {
            document.getElementById('teamReportModal').classList.add('hidden');
        });
    }

    function openTeamReport(teamCode, allData) {
        const modal = document.getElementById('teamReportModal');
        const title = document.getElementById('teamReportTitle');
        const cansTotal = document.getElementById('teamCansTotal');
        const energyTotal = document.getElementById('teamEnergyTotal');
        const weightTotal = document.getElementById('teamWeightTotal');
        const co2Total = document.getElementById('teamCo2Total');
        const leaderboard = document.getElementById('teamLeaderboardList');
        const gallery = document.getElementById('teamGalleryGrid');
        
        if (!modal || !title || !cansTotal || !energyTotal || !weightTotal || !co2Total || !leaderboard || !gallery) return;
        
        title.textContent = `Třídní Report: ${teamCode}`;
        leaderboard.innerHTML = '';
        gallery.innerHTML = '';
        
        const normalizedTeam = teamCode.trim().toUpperCase();
        const filtered = allData.filter(item => item.team_code && item.team_code.trim().toUpperCase() === normalizedTeam);
        
        if (filtered.length === 0) {
            cansTotal.textContent = '0 ks';
            energyTotal.textContent = '0 kWh';
            weightTotal.textContent = '0 kg';
            co2Total.textContent = '0 kg';
            leaderboard.innerHTML = '<li class="small-text" style="color:#888; text-align:center; padding:10px 0;">V tomto týmu zatím nikdo nic neodevzdal.</li>';
            gallery.innerHTML = '<div style="grid-column: span 3; text-align: center; color: var(--text-dim); padding: 10px 0; font-size: 11px;">Žádné společné fotky.</div>';
            modal.classList.remove('hidden');
            return;
        }
        
        // Spočítat statistiky
        const totalCans = filtered.reduce((sum, item) => sum + item.count, 0);
        const totalEnergy = filtered.reduce((sum, item) => sum + (parseFloat(item.energy_saved_kwh) || 0), 0);
        const totalWeight = filtered.reduce((sum, item) => sum + (parseFloat(item.aluminum_weight_g) || 0), 0) / 1000;
        const totalCo2 = filtered.reduce((sum, item) => sum + (parseFloat(item.co2_saved_kg) || 0), 0);
        
        cansTotal.textContent = `${totalCans} ks`;
        energyTotal.textContent = `${totalEnergy.toFixed(1).replace('.', ',')} kWh`;
        weightTotal.textContent = `${totalWeight.toFixed(2).replace('.', ',')} kg`;
        co2Total.textContent = `${totalCo2.toFixed(1).replace('.', ',')} kg`;
        
        // Žebříček ve třídě
        const userSums = {};
        filtered.forEach(item => {
            const nick = item.nickname || 'Anonymní Sběrač';
            userSums[nick] = (userSums[nick] || 0) + item.count;
        });
        
        const sortedUsers = Object.entries(userSums)
            .map(([nick, count]) => ({ nick, count }))
            .sort((a, b) => b.count - a.count);
            
        sortedUsers.forEach((user, index) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            if (user.nick === userNick) li.className += ' me';
            li.innerHTML = `
                <span class="rank">${index + 1}.</span>
                <span class="nick">${user.nick}</span>
                <span class="count">${user.count} ks</span>
            `;
            li.addEventListener('click', () => {
                modal.classList.add('hidden');
                openUserGallery(user.nick);
            });
            leaderboard.appendChild(li);
        });
        
        // Společné fotky
        const photos = filtered.filter(item => item.photo_url);
        if (photos.length === 0) {
            gallery.innerHTML = '<div style="grid-column: span 3; text-align: center; color: var(--text-dim); padding: 10px 0; font-size: 11px;">Žádné fotky z tohoto týmu.</div>';
        } else {
            // Seřadit od nejnovějších
            photos.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            photos.slice(0, 9).forEach(pickup => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'gallery-item';
                itemDiv.style.aspectRatio = '1';
                itemDiv.style.borderRadius = '8px';
                itemDiv.style.overflow = 'hidden';
                itemDiv.style.border = '1px solid #e2e8f0';
                itemDiv.style.position = 'relative';
                
                const thumbUrl = getThumbnailUrl(pickup.photo_url);
                itemDiv.innerHTML = `
                    <img src="${thumbUrl}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
                    <span class="gallery-badge" style="position:absolute; bottom:4px; right:4px; font-size:9px; padding:2px 4px; border-radius:4px; background:rgba(15,23,42,0.85); color:white; font-weight:700;">+${pickup.count}</span>
                `;
                
                itemDiv.addEventListener('click', () => {
                    modal.classList.add('hidden');
                    openUserGallery(pickup.nickname);
                });
                
                gallery.appendChild(itemDiv);
            });
        }
        
        modal.classList.remove('hidden');
    }

    window.forceRefresh = async () => {
        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (let name of cacheNames) {
                    await caches.delete(name);
                }
            }
        } catch (e) {
            console.error("Chyba při čištění mezipaměti:", e);
        }
        window.location.reload(true);
    };

    // --- PWA Instalační logika ---
    let deferredPrompt;
    const installOverlay = document.getElementById('installOverlay');
    const installBtn = document.getElementById('installBtn');
    const installInstructions = document.getElementById('installInstructions');

    // Detekce iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!isStandalone) installOverlay.classList.remove('hidden');
    });

    if (isIOS && !isStandalone) {
        installOverlay.classList.remove('hidden');
        installBtn.classList.add('hidden');
        installInstructions.innerHTML = "Na iPhone klepni na <strong>Sdílet</strong> <span style='font-size:20px'>⎋</span> a poté na <strong>Přidat na plochu</strong> ⊕.";
    }

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') installOverlay.classList.add('hidden');
            deferredPrompt = null;
        }
    });

    // --- POMOCNÉ FUNKCE PRO OFFLINE SYNCHRONIZACI ---
    function updateSyncBanner(activelySyncing = false) {
        if (!db) return;
        try {
            const transaction = db.transaction(['pendingPickups'], 'readonly');
            const store = transaction.objectStore('pendingPickups');
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => {
                const pending = getAllRequest.result;
                // Počítáme pouze aktivní čekající úlovky (které mají méně než 5 chyb)
                const activePending = pending.filter(item => (item.retryCount || 0) < 5);
                const pendingCount = activePending.length;
                
                if (pendingCount > 0) {
                    // Odlišíme stav: aktivní odesílání vs. čeká na připojení
                    if (activelySyncing || isSyncing) {
                        syncStatusText.textContent = `⏳ Právě odesílám ${pendingCount} úlovek… Nevypínej aplikaci.`;
                    } else {
                        syncStatusText.textContent = `📡 ${pendingCount} úlovek čeká na odeslání. Připoj se k internetu.`;
                    }
                    syncBanner.classList.remove('hidden');
                } else {
                    syncBanner.classList.add('hidden');
                }
            };
        } catch (e) {
            console.error("Chyba při aktualizaci banneru:", e);
        }
    }

    async function savePickupOffline(count, notes, file, userVolumes) {
        if (!db) {
            alert("Místní paměť telefonu není připravena. Úlovek se nepodařilo uložit.");
            return;
        }
        
        let photoBase64 = null;
        if (file) {
            try {
                // Komprese i pro offline režim, aby se ušetřilo místo v telefonu
                const compressedBlob = await compressImage(file, 2048, 2048, 0.85);
                photoBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(reader.error);
                    reader.readAsDataURL(compressedBlob);
                });
            } catch (e) {
                console.error("Nepodařilo se převést fotku na Base64:", e);
            }
        }
        
        try {
            const transaction = db.transaction(['pendingPickups'], 'readwrite');
            const store = transaction.objectStore('pendingPickups');
            
            const item = {
                nickname: userNick,
                count: count,
                latitude: currentCoords ? currentCoords.lat : null,
                longitude: currentCoords ? currentCoords.lon : null,
                notes: notes || null,
                photoBase64: photoBase64, // Ukládáme jako Base64 text (odolné vůči iOS Safari bugům)
                user_volumes: userVolumes || null,
                timestamp: Date.now()
            };
            
            const addRequest = store.add(item);
            addRequest.onsuccess = () => {
                updateSyncBanner();
                
                // Zobrazíme upravenou úspěšnou obrazovku
                const successTitle = successScreen.querySelector('h3');
                const successDesc = successScreen.querySelector('p');
                if (successTitle) successTitle.textContent = "Uloženo offline! 💾🥫";
                if (successDesc) successDesc.innerHTML = "Nemáš připojení, nebo si šetříš mobilní data. Tvůj úlovek je bezpečně uložený v telefonu a <strong>odešle se sám, jakmile budeš na internetu</strong>.";
                
                pickupForm.classList.add('hidden');
                successScreen.classList.remove('hidden');
                launchConfetti();
            };
            addRequest.onerror = (err) => {
                console.error("Chyba při offline zápisu do IndexedDB:", err);
                alert("Nepodařilo se uložit úlovek offline.");
            };
        } catch (e) {
            console.error("Kritická chyba IndexedDB transakce:", e);
            alert("Chyba zápisu do paměti telefonu.");
        }
    }

    let isSyncing = false;
    let syncStartedAt = 0; // Timestamp startu – pojistka proti zaseknutí

    async function incrementRetryCount(item) {
        try {
            await new Promise((resolve, reject) => {
                const tx = db.transaction(['pendingPickups'], 'readwrite');
                const store = tx.objectStore('pendingPickups');
                const updatedItem = { ...item, retryCount: (item.retryCount || 0) + 1 };
                store.put(updatedItem);
                tx.oncomplete = () => resolve();
                tx.onerror = (err) => reject(err);
            });
            console.log(`Zvýšen počet pokusů pro úlovek ID ${item.id} na ${(item.retryCount || 0) + 1}`);
        } catch (e) {
            console.error("Chyba při ukládání retryCount do IDB:", e);
        }
    }

    async function syncOfflinePickups() {
        // Pokud sync běží déle než 60s, považujeme ho za zaseknutý a resetujeme
        const SYNC_TIMEOUT_MS = 60000;
        if (isSyncing && (Date.now() - syncStartedAt) < SYNC_TIMEOUT_MS) return;
        if (isSyncing) {
            console.warn("Sync flag byl zaseknutý déle než 60s – automatický reset.");
            isSyncing = false;
        }
        if (!db || !navigator.onLine) return;
        
        try {
            const transaction = db.transaction(['pendingPickups'], 'readonly');
            const store = transaction.objectStore('pendingPickups');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = async () => {
                const pending = getAllRequest.result;
                // Ignorujeme úlovky, které již selhaly 5krát (dead-letter queue)
                const activePending = pending.filter(item => (item.retryCount || 0) < 5);
                if (activePending.length === 0) return;
                
                isSyncing = true;
                syncStartedAt = Date.now(); // Zaznamenat čas startu pro timeout pojistku
                updateSyncBanner(true); // Zobrazit „Právě odesílám…"
                console.log(`Spouštím synchronizaci ${activePending.length} offline úlovků...`);
                
                let syncedCount = 0;
                for (const item of activePending) {
                    try {
                        let photoUrl = item.photoUrl || null;
                        let uploadSuccess = true;
                        let isNetworkError = false;
                        
                        if (item.photoBase64 && !photoUrl) {
                            const fileExt = 'jpg';
                            const nickname = item.nickname || 'Anonym';
                            const cleanNick = nickname.replace(/[^a-zA-Z0-9]/g, '_');
                            const filename = `${Date.now()}_${cleanNick}.${fileExt}`;
                            
                            // Převedeme base64 zpět na Blob pro odeslání
                            const response = await fetch(item.photoBase64);
                            const uploadBody = await response.blob();
                            
                            // AbortController: přeruší upload pokud trvá déle než 30s
                            const uploadAbort = new AbortController();
                            const uploadTimeout = setTimeout(() => uploadAbort.abort(), 30000);
                            
                            try {
                                const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/pickups-v3/${filename}`, {
                                    method: 'POST',
                                    headers: {
                                        'apikey': SUPABASE_KEY,
                                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                                        'Content-Type': 'image/jpeg'
                                    },
                                    body: uploadBody,
                                    signal: uploadAbort.signal
                                });
                                
                                if (uploadResponse.ok) {
                                    photoUrl = `${SUPABASE_URL}/storage/v1/object/public/pickups-v3/${filename}`;
                                    
                                    // Uložíme photoUrl do IndexedDB a vymažeme photoBase64
                                    try {
                                        await new Promise((resolve, reject) => {
                                            const updateTx = db.transaction(['pendingPickups'], 'readwrite');
                                            const updateStore = updateTx.objectStore('pendingPickups');
                                            const updateItem = { ...item, photoUrl: photoUrl };
                                            delete updateItem.photoBase64;
                                            updateStore.put(updateItem);
                                            updateTx.oncomplete = () => {
                                                item.photoUrl = photoUrl;
                                                delete item.photoBase64;
                                                resolve();
                                            };
                                            updateTx.onerror = (err) => reject(err);
                                        });
                                        console.log(`Foto úspěšně nahráno a uloženo do IndexedDB: ${photoUrl}`);
                                    } catch (updateErr) {
                                        console.error("Nepodařilo se aktualizovat položku v IndexedDB s photoUrl:", updateErr);
                                    }
                                } else {
                                    console.error(`Storage sync upload failed with status: ${uploadResponse.status}`);
                                    uploadSuccess = false;
                                    isNetworkError = false; // permanentní serverová chyba
                                }
                            } catch (uploadErr) {
                                uploadSuccess = false;
                                if (uploadAbort.signal.aborted) {
                                    console.warn("Upload fotky přerušen – vypršel timeout 30s (špatný signál).");
                                    isNetworkError = true;
                                } else {
                                    console.error("Upload fotky selhal:", uploadErr);
                                    isNetworkError = true; // předpokládáme síťovou chybu
                                }
                            } finally {
                                clearTimeout(uploadTimeout);
                            }
                        }
                        
                        if (!uploadSuccess) {
                            if (isNetworkError) {
                                console.warn(`Přerušuji synchronizaci kvůli síťové chybě nahrávání fotky pro ID ${item.id}.`);
                                break; // Přerušíme celou frontu, abychom zamezili zbytečným timeoutům
                            } else {
                                console.warn(`Přeskakuji vadný záznam ID ${item.id} kvůli trvalé chybě serveru při nahrávání fotky.`);
                                await incrementRetryCount(item);
                                continue; // Jdeme na další soubor, tento je vadný
                            }
                        }
                        
                        // AbortController: přeruší zápis do DB pokud trvá déle než 15s
                        const dbAbort = new AbortController();
                        const dbTimeout = setTimeout(() => dbAbort.abort(), 15000);
                        
                        let dbResponse;
                        let isDbNetworkError = false;
                        try {
                            dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/pickups`, {
                                method: 'POST',
                                headers: {
                                    'apikey': SUPABASE_KEY,
                                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    nickname: item.nickname,
                                    count: item.count,
                                    latitude: item.latitude,
                                    longitude: item.longitude,
                                    notes: item.notes,
                                    photo_url: photoUrl,
                                    user_volumes: item.user_volumes || null,
                                    created_at: new Date(item.timestamp).toISOString()
                                }),
                                signal: dbAbort.signal
                            });
                            
                            if (!dbResponse.ok) {
                                console.error(`Database sync write failed with status: ${dbResponse.status}`);
                                isDbNetworkError = false; // serverová odmítnutí
                            }
                        } catch (dbErr) {
                            if (dbAbort.signal.aborted) {
                                console.warn("Zápis do DB přerušen – vypršel timeout 15s.");
                            } else {
                                console.error("Zápis do DB selhal:", dbErr);
                            }
                            isDbNetworkError = true;
                        } finally {
                            clearTimeout(dbTimeout);
                        }
                        
                        if (dbResponse && dbResponse.ok) {
                            // Smazat z IndexedDB
                            try {
                                await new Promise((resolve, reject) => {
                                    const deleteTx = db.transaction(['pendingPickups'], 'readwrite');
                                    const deleteStore = deleteTx.objectStore('pendingPickups');
                                    deleteStore.delete(item.id);
                                    deleteTx.oncomplete = () => resolve();
                                    deleteTx.onerror = (err) => reject(err);
                                });
                                console.log(`Offline úlovek ID ${item.id} úspěšně synchronizován.`);
                                syncedCount++;
                            } catch (deleteErr) {
                                console.error(`IDB delete selhal pro ID ${item.id}, ale DB zápis byl úspěšný. Označuji jako hotové.`, deleteErr);
                                syncedCount++;
                            }
                        } else {
                            if (isDbNetworkError) {
                                console.warn(`Přerušuji synchronizaci kvůli síťové chybě zápisu do DB pro ID ${item.id}.`);
                                break; // Síťová chyba, zkusíme příště
                            } else {
                                console.warn(`Přeskakuji vadný záznam ID ${item.id} kvůli trvalé chybě zápisu do DB.`);
                                await incrementRetryCount(item);
                                continue; // Jdeme na další soubor
                            }
                        }
                    } catch (err) {
                        console.error("Neočekávaná chyba při zpracování offline úlovku:", err);
                        break;
                    }
                }
                
                isSyncing = false;
                updateSyncBanner(false);
                if (syncedCount > 0) {
                    await loadData(true);
                }
            };
            getAllRequest.onerror = () => {
                isSyncing = false;
                updateSyncBanner(false);
            };
        } catch (e) {
            console.error("Chyba při čtení z IndexedDB pro synchronizaci:", e);
            isSyncing = false;
            updateSyncBanner(false);
        }
    }

    // Automatický spouštěč synchronizace při chycení signálu
    window.addEventListener('online', () => {
        console.log("Internetové připojení obnoveno, startuji synchronizaci...");
        syncOfflinePickups();
    });

    // --- Sběratelský Wrapped (Spotify / Instagram Stories styl) ---
    let currentWrappedSlide = 0;
    let wrappedTimer = null;
    const slideDuration = 6000; // 6s na slide
    let timerStartTime = 0;
    let timerElapsed = 0;

    const openWrappedBtn = document.getElementById('openWrappedBtn');
    const wrappedModal = document.getElementById('wrappedModal');
    const closeWrappedBtn = document.getElementById('closeWrappedBtn');

    if (openWrappedBtn) {
        openWrappedBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Zabrání otevření standardní galerie
            openWrapped();
        });
    }

    if (closeWrappedBtn) {
        closeWrappedBtn.addEventListener('click', () => {
            closeWrapped();
        });
    }

    function stopWrappedTimer() {
        if (wrappedTimer) {
            clearInterval(wrappedTimer);
            wrappedTimer = null;
        }
    }

    function startWrappedTimer() {
        stopWrappedTimer();
        const fillElements = document.querySelectorAll('.wrapped-progress-fill');
        const currentFill = fillElements[currentWrappedSlide];
        
        timerStartTime = Date.now();
        timerElapsed = 0;
        
        wrappedTimer = setInterval(() => {
            timerElapsed = Date.now() - timerStartTime;
            let percent = (timerElapsed / slideDuration) * 100;
            if (percent >= 100) {
                percent = 100;
                currentFill.style.width = '100%';
                stopWrappedTimer();
                window.nextWrappedSlide();
            } else {
                currentFill.style.width = `${percent}%`;
            }
        }, 50);
    }

    function showWrappedSlide(index) {
        currentWrappedSlide = index;
        const slides = document.querySelectorAll('.wrapped-slide');
        slides.forEach((slide, idx) => {
            if (idx === index) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        const fillElements = document.querySelectorAll('.wrapped-progress-fill');
        fillElements.forEach((fill, idx) => {
            if (idx < index) {
                fill.style.width = '100%';
            } else if (idx > index) {
                fill.style.width = '0%';
            } else {
                fill.style.width = '0%';
            }
        });

        startWrappedTimer();
    }

    window.prevWrappedSlide = () => {
        if (currentWrappedSlide > 0) {
            currentWrappedSlide--;
            showWrappedSlide(currentWrappedSlide);
        }
    };

    window.nextWrappedSlide = () => {
        currentWrappedSlide++;
        if (currentWrappedSlide >= 6) {
            closeWrapped();
        } else {
            showWrappedSlide(currentWrappedSlide);
        }
    };

    function closeWrapped() {
        stopWrappedTimer();
        if (wrappedModal) {
            wrappedModal.classList.add('hidden');
        }
    }

    function openWrapped() {
        if (!allPickups || allPickups.length === 0 || !userNick) return;

        // Osobní sběry přihlášeného uživatele
        const userPickups = allPickups.filter(item => 
            item.nickname && item.nickname.trim().toLowerCase() === userNick.trim().toLowerCase()
        );

        if (userPickups.length === 0) {
            alert("Musíš nejprve odevzdat alespoň jednu plechovku, abychom ti mohli sestavit report!");
            return;
        }

        // Filtrování na 3 měsíce (90 dní)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        let filteredPickups = userPickups.filter(item => new Date(item.created_at) >= ninetyDaysAgo);
        let isQuarterly = true;

        if (filteredPickups.length === 0) {
            filteredPickups = userPickups; // Fallback na celou historii
            isQuarterly = false;
        }

        // Třídění chronologicky pro určení první plechovky
        const sortedChrono = [...filteredPickups].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const firstPickup = sortedChrono[0];

        // Třídění podle počtu pro největší úlovek
        const sortedCount = [...filteredPickups].sort((a, b) => b.count - a.count);
        const maxPickup = sortedCount[0];

        // Spočítání nejčastější značky
        const brandCounts = {};
        filteredPickups.forEach(p => {
            if (p.is_analyzed && p.analysis_json) {
                p.analysis_json.forEach(c => {
                    let b = c.brand || 'Nerozpoznáno';
                    if (b === 'Unknown' || b === 'unknown') {
                        b = 'Nerozpoznáno';
                    }
                    brandCounts[b] = (brandCounts[b] || 0) + 1;
                });
            }
        });

        let topBrandName = 'Nerozpoznáno';
        let topBrandCount = 0;
        Object.entries(brandCounts).forEach(([name, count]) => {
            if (name !== 'Nerozpoznáno' && count > topBrandCount) {
                topBrandName = name;
                topBrandCount = count;
            }
        });

        if (topBrandCount === 0 && brandCounts['Nerozpoznáno']) {
            topBrandName = 'Nerozpoznáno';
            topBrandCount = brandCounts['Nerozpoznáno'];
        }

        // Souhrnné statistiky za dané období
        const totalCans = filteredPickups.reduce((sum, p) => sum + p.count, 0);
        const totalWeightKg = filteredPickups.reduce((sum, p) => sum + (parseFloat(p.aluminum_weight_g) || 0), 0) / 1000;
        const totalEnergyKwh = filteredPickups.reduce((sum, p) => sum + (parseFloat(p.energy_saved_kwh) || 0), 0);
        const totalCo2Kg = filteredPickups.reduce((sum, p) => sum + (parseFloat(p.co2_saved_kg) || 0), 0);

        // --- PLNĚNÍ DAT DO SLIDŮ ---
        
        // Slide 1: Intro text
        const introSub = document.querySelector('#wrappedSlide1 .wrapped-subtitle');
        const introText = document.querySelector('#wrappedSlide1 .wrapped-text');
        if (introSub) {
            introSub.textContent = "Lov započal!";
        }
        if (introText) {
            introText.textContent = isQuarterly 
                ? "Podívej se, jak jsi za poslední 3 měsíce pomohl vyčistit naši přírodu!"
                : "Jelikož jsi v posledních 3 měsících nesbíral, připravili jsme pro tebe tvůj celkový přehled jako dárek za podporu!";
        }

        // Slide 2: První plechovka
        const firstDateEl = document.getElementById('wrappedFirstDate');
        const firstImgEl = document.getElementById('wrappedFirstImage');
        const firstBrandEl = document.getElementById('wrappedFirstBrand');
        const firstNotesEl = document.getElementById('wrappedFirstNotes');

        if (firstPickup) {
            if (firstDateEl) {
                firstDateEl.textContent = new Date(firstPickup.created_at).toLocaleDateString('cs-CZ', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            }
            if (firstImgEl) {
                firstImgEl.src = firstPickup.photo_url || 'can-marker-transparent.png';
            }
            if (firstBrandEl) {
                const bName = firstPickup.analysis_json && firstPickup.analysis_json[0] && firstPickup.analysis_json[0].brand
                    ? firstPickup.analysis_json[0].brand
                    : 'Plechovka';
                firstBrandEl.textContent = `${bName} (${firstPickup.count} ks)`;
            }
            if (firstNotesEl) {
                firstNotesEl.textContent = firstPickup.notes ? `"${firstPickup.notes}"` : "Bez poznámky";
            }
        }

        // Slide 3: Největší úlovek
        const maxImgEl = document.getElementById('wrappedMaxImage');
        const maxCountEl = document.getElementById('wrappedMaxCount');
        const maxNotesEl = document.getElementById('wrappedMaxNotes');

        if (maxPickup) {
            if (maxImgEl) {
                maxImgEl.src = maxPickup.photo_url || 'can-marker-transparent.png';
            }
            if (maxCountEl) {
                maxCountEl.textContent = `${maxPickup.count} ks`;
            }
            if (maxNotesEl) {
                maxNotesEl.textContent = maxPickup.notes ? `"${maxPickup.notes}"` : "Bez poznámky";
            }
        }

        // Slide 4: Nejčastější značka
        const brandNameEl = document.getElementById('wrappedBrandName');
        const brandCountEl = document.getElementById('wrappedBrandCount');
        const brandIconEl = document.getElementById('wrappedBrandCanIcon');

        if (brandNameEl) {
            const textEl = document.querySelector('#wrappedSlide4 .wrapped-text');
            if (topBrandName === 'Nerozpoznáno' || topBrandName === 'Unknown') {
                brandNameEl.textContent = 'Záhadná značka 🕵️‍♂️';
                if (textEl) {
                    textEl.textContent = 'Tvé odevzdané plechovky byly pro AI příliš zmačkané na to, abychom určili značku, ale stále se počítají! Celkem jsi jich odevzdal:';
                }
            } else {
                brandNameEl.textContent = topBrandName;
                if (textEl) {
                    textEl.textContent = 'Byla to tvá nejčastěji sbíraná plechovka. Celkem jsi jich odevzdal:';
                }
            }
        }
        if (brandCountEl) {
            brandCountEl.textContent = `${topBrandCount} ks`;
        }
        if (brandIconEl) {
            brandIconEl.className = 'custom-div-icon large-can-icon';
            const lowerName = topBrandName.toLowerCase();
            if (lowerName.includes('birell') || lowerName.includes('monster')) {
                brandIconEl.classList.add('can-green');
            } else if (lowerName.includes('coca') || lowerName.includes('frisco') || lowerName.includes('red') || lowerName.includes('pepsi') || lowerName.includes('desperados')) {
                brandIconEl.classList.add('can-red');
            } else {
                brandIconEl.classList.add('can-teal');
            }
            brandIconEl.style.filter = 'none';
        }

        // Slide 5: Celkový dopad
        const totCansEl = document.getElementById('wrappedTotalCans');
        const totWeightEl = document.getElementById('wrappedTotalWeight');
        const totEnergyEl = document.getElementById('wrappedTotalEnergy');
        const totCo2El = document.getElementById('wrappedTotalCo2');

        if (totCansEl) totCansEl.textContent = `${totalCans} ks`;
        if (totWeightEl) totWeightEl.textContent = `${totalWeightKg.toFixed(2).replace('.', ',')} kg`;
        if (totEnergyEl) totEnergyEl.textContent = `${totalEnergyKwh.toFixed(1).replace('.', ',')} kWh`;
        if (totCo2El) totCo2El.textContent = `${totalCo2Kg.toFixed(1).replace('.', ',')} kg`;

        // Slide 6: Žebříček a srovnání se spotřebiči
        // 1. Spočítat pozici uživatele v žebříčku (myRank)
        const userSums = {};
        allPickups.forEach(p => {
            if (p.nickname) {
                const nick = p.nickname.trim();
                userSums[nick] = (userSums[nick] || 0) + p.count;
            }
        });
        
        const sortedUsers = Object.entries(userSums)
            .map(([nick, count]) => ({ nick, count }))
            .sort((a, b) => b.count - a.count);
        
        let myRank = sortedUsers.findIndex(u => u.nick.toLowerCase() === userNick.toLowerCase()) + 1;
        if (myRank === 0) myRank = sortedUsers.length + 1;
        
        const totalUsers = sortedUsers.length || 1;
        
        const rankValEl = document.getElementById('wrappedRankValue');
        const rankPercentileEl = document.getElementById('wrappedRankPercentile');
        
        if (rankValEl) {
            rankValEl.textContent = `#${myRank}`;
        }
        if (rankPercentileEl) {
            rankPercentileEl.textContent = `z celkem ${totalUsers} sběratelů`;
        }
        
        // 2. Energetické srovnání se spotřebiči na základě totalEnergyKwh
        const appliances = [
            { emoji: '🎮', text: 'hodin hraní na PlayStation 5 (spotřeba ~200W)', rate: 5 },
            { emoji: '💻', text: 'hodin práce na notebooku (spotřeba ~50W)', rate: 20 },
            { emoji: '☕', text: 'šálků kávy z kávovaru (~1000W po dobu 2 min)', rate: 30 },
            { emoji: '📱', text: 'nabití tvého chytrého telefonu', rate: 100 },
            { emoji: '💡', text: 'hodin svícení úsporné LED žárovky (~10W)', rate: 100 },
            { emoji: '❄️', text: 'dní provozu moderní ledničky A+++ (~0.4 kWh/den)', rate: 2.5 },
            { emoji: '🚗', text: 'metrů jízdy elektromobilem (~150 Wh/km)', rate: 6667 },
            { emoji: '📺', text: 'hodin sledování 4K Smart TV (~100W)', rate: 10 },
            { emoji: '🧺', text: 'cyklů praní v pračce (eko program ~0.8 kWh/cyklus)', rate: 1.25 }
        ];
        
        const appliance = appliances[Math.floor(Math.random() * appliances.length)];
        const applianceValue = Math.max(1, Math.round(totalEnergyKwh * appliance.rate));
        
        const appEmojiEl = document.getElementById('wrappedApplianceEmoji');
        const appTextEl = document.getElementById('wrappedApplianceText');
        
        if (appEmojiEl) appEmojiEl.textContent = appliance.emoji;
        if (appTextEl) appTextEl.textContent = `${applianceValue.toLocaleString('cs-CZ')} ${appliance.text}`;
        
        const funFacts = [
            "Každá plechovka se počítá! Zrecyklovaný hliník může být do 60 dnů zpět v regálu.",
            "Recyklace hliníku ušetří až 95 % energie ve srovnání s výrobou z bauxitu.",
            "Hliník lze recyklovat donekonečna, aniž by ztratil na své kvalitě.",
            "Věděli jste, že recyklace 1 tuny hliníku ušetří 9 tun emisí skleníkových plynů?",
            "Každá plechovka, kterou sebereš, pomáhá chránit zvířata a lesy v okolí."
        ];
        const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
        const factEl = document.getElementById('wrappedRandomFunFact');
        if (factEl) factEl.textContent = randomFact;

        // Zobrazení modálního okna
        if (wrappedModal) {
            wrappedModal.classList.remove('hidden');
            showWrappedSlide(0);
        }
    }

    // --- Administrátorský panel (Admin Editor) ---
    let adminSelectedPickup = null;
    let adminEditCansLocal = [];
    const POPULAR_BRANDS = [
        'Birell',
        'Pilsner Urquell',
        'Radegast',
        'Staropramen',
        'Coca-Cola',
        'Pepsi',
        'Monster',
        'Red Bull',
        'Tiger',
        'Kong Strong',
        'Heineken',
        'Starobrno',
        'Kozel',
        'Kofola',
        'Frisco',
        'Desperados',
        'Jiná / Ostatní',
        'Nerozpoznáno'
    ];
    const CAN_WEIGHTS = {
        0.5: 16.0,
        0.33: 13.5,
        0.25: 10.0,
        0.2: 8.0,
        'Unknown': 14.0
    };
    const ENERGY_SAVED_KWH_PER_KG = 14;
    const SCRAP_VALUE_RAW_PER_KG = 14;
    const CO2_SAVED_KG_PER_KG = 6.2;

    window.openAdminEditorPasscode = function() {
        const pw = prompt("Zadejte administrátorské heslo:");
        if (pw === "milion2026") {
            window.openAdminPanel();
        } else if (pw !== null) {
            alert("Nesprávné heslo!");
        }
    };

    window.openAdminPanel = async function() {
        const modal = document.getElementById('adminPanelModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
        
        const listContainer = document.getElementById('adminPickupsList');
        if (listContainer) {
            listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-dim); font-size: 12px;">Načítám data z databáze...</div>';
        }
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/pickups?select=id,nickname,count,notes,created_at,photo_url,is_analyzed,analysis_json,team_code,latitude,longitude,user_volumes,is_verified`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            if (!response.ok) throw new Error('Načítání selhalo');
            allPickups = await response.json();
            window.populateDynamicBrands();
            window.filterAdminPickups();
        } catch (e) {
            console.error(e);
            if (listContainer) {
                listContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--rust-red); font-size: 12px;">Chyba: ${e.message}</div>`;
            }
        }
    };

    window.closeAdminPanel = function() {
        const modal = document.getElementById('adminPanelModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        loadData(); // Obnovit veřejná data (bez NSFW) po zavření administrace
    };

    window.populateDynamicBrands = function() {
        const brandsSet = new Set(POPULAR_BRANDS);
        allPickups.forEach(p => {
            if (p.analysis_json && Array.isArray(p.analysis_json)) {
                p.analysis_json.forEach(can => {
                    if (can.brand && can.brand !== 'Unknown' && can.brand !== 'unknown' && can.brand !== 'Nerozpoznáno') {
                        brandsSet.add(can.brand);
                    }
                });
            }
        });
        const sortedBrands = Array.from(brandsSet).sort((a, b) => a.localeCompare(b, 'cs'));
        const datalist = document.getElementById('dynamicBrandsList');
        if (datalist) {
            datalist.innerHTML = '';
            sortedBrands.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b;
                datalist.appendChild(opt);
            });
        }
    };

    window.filterAdminPickups = function() {
        const searchInput = document.getElementById('adminSearchNick');
        const statusSelect = document.getElementById('adminStatusFilter');
        const listContainer = document.getElementById('adminPickupsList');
        
        if (!listContainer) return;
        listContainer.innerHTML = '';
        
        const searchNick = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const statusFilter = statusSelect ? statusSelect.value : 'all';
        
        // Seřadíme od nejnovějších
        const sorted = [...allPickups].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        const filtered = sorted.filter(p => {
            const nick = (p.nickname || '').toLowerCase();
            if (searchNick && !nick.includes(searchNick)) return false;
            
            const hasUnknown = p.is_analyzed && p.analysis_json && Array.isArray(p.analysis_json) && 
                p.analysis_json.some(c => {
                    const b = (c.brand || 'Nerozpoznáno').trim().toLowerCase();
                    const v = (c.volume_liters || c.volume || 'Unknown').toString().trim().toLowerCase();
                    return b === 'nerozpoznáno' || b === 'unknown' || b === 'neznámý' || b === 'neznámé' ||
                           v === 'unknown' || v === 'null' || v === 'undefined';
                });
                
            const isNsfw = p.is_analyzed && p.analysis_json && Array.isArray(p.analysis_json) &&
                p.analysis_json.some(c => c.brand === 'NSFW');

            if (statusFilter === 'unanalyzed') {
                return !p.is_analyzed;
            } else if (statusFilter === 'unverified_unknown') {
                return p.is_analyzed && hasUnknown && !isNsfw && !p.is_verified;
            } else if (statusFilter === 'unverified_ai') {
                return p.is_analyzed && !hasUnknown && !isNsfw && !p.is_verified;
            } else if (statusFilter === 'nsfw') {
                return isNsfw;
            } else if (statusFilter === 'verified') {
                return p.is_verified === true;
            }
            return true;
        });
        
        if (filtered.length === 0) {
            listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-dim); font-size: 12px;">Žádné nahrávky neodpovídají filtrům.</div>';
            return;
        }
        
        filtered.forEach(p => {
            const row = document.createElement('div');
            row.className = 'admin-pickup-row';
            
            const dateStr = new Date(p.created_at).toLocaleDateString('cs-CZ', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            let badgeHtml = '';
            if (p.is_verified) {
                badgeHtml = '<span class="admin-badge info">Ověřeno</span>';
            } else if (!p.is_analyzed) {
                badgeHtml = '<span class="admin-badge warning">Čeká</span>';
            } else {
                const hasUnknown = p.analysis_json && Array.isArray(p.analysis_json) && 
                    p.analysis_json.some(c => {
                        const b = (c.brand || 'Nerozpoznáno').trim().toLowerCase();
                        const v = (c.volume_liters || c.volume || 'Unknown').toString().trim().toLowerCase();
                        return b === 'nerozpoznáno' || b === 'unknown' || b === 'neznámý' || b === 'neznámé' ||
                               v === 'unknown' || v === 'null' || v === 'undefined';
                    });
                if (hasUnknown) {
                    badgeHtml = '<span class="admin-badge error">Neznámé</span>';
                } else {
                    badgeHtml = '<span class="admin-badge success">Hotovo</span>';
                }
            }

            
            row.innerHTML = `
                <span class="date">${dateStr}</span>
                <span class="nick" title="${p.nickname || '@anonym'}">${p.nickname || '@anonym'}</span>
                <span class="count">${p.count || 0} ks</span>
                <span class="badge-cell">${badgeHtml}</span>
                <button onclick="window.openAdminEditModal('${p.id}')" class="admin-edit-btn" title="Upravit">✏️</button>
            `;
            listContainer.appendChild(row);
        });
    };

    window.openAdminEditModal = function(pickupId) {
        const pickup = allPickups.find(p => p.id === pickupId);
        if (!pickup) return;
        
        adminSelectedPickup = pickup;
        adminEditCansLocal = [];
        
        if (pickup.analysis_json && Array.isArray(pickup.analysis_json)) {
            adminEditCansLocal = JSON.parse(JSON.stringify(pickup.analysis_json));
            // Sjednocení: převést 'Unknown', 'unknown', 'Neznámý' a 'Neznámé' na 'Nerozpoznáno'
            adminEditCansLocal.forEach(can => {
                if (can.brand === 'Unknown' || can.brand === 'unknown' || can.brand === 'Neznámý' || can.brand === 'Neznámé' || !can.brand) {
                    can.brand = 'Nerozpoznáno';
                }
            });
        }
        
        if (adminEditCansLocal.length === 0 && pickup.count > 0) {
            for (let i = 0; i < pickup.count; i++) {
                adminEditCansLocal.push({ brand: 'Nerozpoznáno', volume_liters: 'Unknown', detection_issue: null });
            }
        }
        
        const nickInput = document.getElementById('adminEditNickInput');
        const teamInput = document.getElementById('adminEditTeamInput');
        const dateEl = document.getElementById('adminEditDate');
        const notesEl = document.getElementById('adminEditNotes');
        const photoEl = document.getElementById('adminEditPhoto');
        
        if (nickInput) nickInput.value = pickup.nickname || '';
        if (teamInput) teamInput.value = pickup.team_code || '';
        if (dateEl) dateEl.textContent = new Date(pickup.created_at).toLocaleString('cs-CZ');
        if (notesEl) notesEl.textContent = pickup.notes ? `"${pickup.notes}"` : 'Bez poznámky';
        if (photoEl) photoEl.src = pickup.photo_url || 'can-marker-transparent.png';
        
        const userVolsEl = document.getElementById('adminEditUserVolumes');
        if (userVolsEl) {
            if (pickup.user_volumes && Array.isArray(pickup.user_volumes)) {
                userVolsEl.textContent = pickup.user_volumes.map(v => v === null ? 'Neznámý' : v + ' L').join(', ');
            } else {
                userVolsEl.textContent = 'Bez specifikace';
            }
        }
        
        window.renderAdminCansEditList();
        
        const editModal = document.getElementById('adminEditPickupModal');
        if (editModal) {
            editModal.classList.remove('hidden');
        }
    };

    window.closeAdminEditModal = function() {
        const editModal = document.getElementById('adminEditPickupModal');
        if (editModal) {
            editModal.classList.add('hidden');
        }
        adminSelectedPickup = null;
        adminEditCansLocal = [];
    };

    window.renderAdminCansEditList = function() {
        const container = document.getElementById('adminCansList');
        if (!container) return;
        container.innerHTML = '';
        
        adminEditCansLocal.forEach((can, index) => {
            const row = document.createElement('div');
            row.className = 'admin-can-row-wrapper';
            row.style.display = 'flex';
            row.style.flexDirection = 'column';
            row.style.gap = '6px';
            row.style.paddingBottom = '8px';
            row.style.borderBottom = '1px solid var(--border-color, #e2e8f0)';
            row.style.marginBottom = '6px';
            
            const vols = [0.5, 0.33, 0.25, 0.2, 'Unknown'];
            let volOptions = '';
            vols.forEach(v => {
                const isMatch = (can.volume_liters == v || (v === 'Unknown' && (can.volume_liters === 'Unknown' || !can.volume_liters)));
                volOptions += `<option value="${v}" ${isMatch ? 'selected' : ''}>${v === 'Unknown' ? 'Neznámý' : v + ' L'}</option>`;
            });
            
            let inputValue = (can.brand === 'Unknown' || can.brand === 'unknown' || can.brand === 'Neznámý' || can.brand === 'Neznámé' || can.brand === 'Nerozpoznáno' || !can.brand) ? 'Nerozpoznáno' : can.brand;
            
            row.innerHTML = `
                <div style="display: flex; gap: 8px; align-items: center; width: 100%;">
                    <span style="font-size: 11px; font-weight: 800; color: var(--text-dim); width: 20px;">#${index + 1}</span>
                    <input type="text" list="dynamicBrandsList" class="can-brand" style="flex: 1; min-width: 0; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; background: #fff;" value="${inputValue}" onchange="window.updateLocalCanBrandCustom(${index}, this.value)" onfocus="if(this.value==='Nerozpoznáno') this.value='';" onblur="if(this.value.trim()===''){ this.value='Nerozpoznáno'; window.updateLocalCanBrandCustom(${index}, 'Nerozpoznáno'); }" placeholder="Značka...">
                    <select class="can-volume" style="width: 90px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; background: #fff; color: var(--text-dark);" onchange="window.updateLocalCanVolume(${index}, this.value)">
                        ${volOptions}
                    </select>
                    <button onclick="window.prefillBrandRule(${index})" class="teach-brand-btn" style="background: none; border: none; cursor: pointer; font-size: 14px; padding: 4px;" title="Učit AI tuto značku">🎓</button>
                    <button onclick="window.removeCanFromEditList(${index})" class="delete-btn" style="background: none; border: none; cursor: pointer; color: var(--rust-red, #ef4444); font-size: 14px; padding: 4px;" title="Odstranit">🗑️</button>
                </div>
            `;
            container.appendChild(row);
        });
        
        window.recalculateAdminStats();
    };

    window.deleteAdminPickup = async function() {
        if (!adminSelectedPickup) return;
        if (!confirm("Opravdu chceš tento úlovek trvale smazat? Tato akce je nevratná.")) return;
        
        let adminPassword = sessionStorage.getItem('adminPassword');
        if (!adminPassword) {
            adminPassword = prompt("Zadejte administrátorské heslo pro smazání záznamu:");
            if (!adminPassword) return;
            sessionStorage.setItem('adminPassword', adminPassword);
        }
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_delete_pickup`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_id: adminSelectedPickup.id,
                    p_secret: (adminPassword === 'milion2026') ? 'tomasadmin123' : adminPassword
                })
            });
            if (!response.ok) {
                if (response.status === 400 || response.status === 403) {
                    sessionStorage.removeItem('adminPassword');
                    throw new Error("Špatné heslo nebo chyba oprávnění.");
                }
                throw new Error('Nelze smazat záznam z databáze');
            }
            
            alert('Záznam byl úspěšně smazán.');
            window.closeAdminEditModal();
            // Odebrat z lokálního pole a překreslit
            allPickups = allPickups.filter(p => p.id !== adminSelectedPickup.id);
            window.filterAdminPickups();
            loadData(); // obnovit veřejné zobrazení
        } catch (e) {
            console.error(e);
            alert("Chyba při mazání záznamu: " + e.message);
        }
    };

    window.updateLocalCanBrandCustom = function(index, value) {
        if (adminEditCansLocal[index]) {
            adminEditCansLocal[index].brand = value.trim() || 'Vlastní';
        }
    };

    window.updateLocalCanVolume = function(index, value) {
        if (adminEditCansLocal[index]) {
            adminEditCansLocal[index].volume_liters = (value === 'Unknown') ? 'Unknown' : parseFloat(value);
            window.recalculateAdminStats();
        }
    };

    window.removeCanFromEditList = function(index) {
        adminEditCansLocal.splice(index, 1);
        window.renderAdminCansEditList();
    };

    window.addCanToEditList = function() {
        adminEditCansLocal.push({ brand: 'Nerozpoznáno', volume_liters: 'Unknown', detection_issue: null });
        window.renderAdminCansEditList();
    };

    window.recalculateAdminStats = function() {
        let totalWeightG = 0;
        adminEditCansLocal.forEach(can => {
            const vol = can.volume_liters;
            let weight = CAN_WEIGHTS['Unknown'];
            if (vol === 0.5 || vol === '0.5') weight = CAN_WEIGHTS[0.5];
            else if (vol === 0.33 || vol === '0.33') weight = CAN_WEIGHTS[0.33];
            else if (vol === 0.25 || vol === '0.25') weight = CAN_WEIGHTS[0.25];
            else if (vol === 0.2 || vol === '0.2') weight = CAN_WEIGHTS[0.2];
            totalWeightG += weight;
        });
        
        const weightKg = totalWeightG / 1000.0;
        const energySaved = weightKg * ENERGY_SAVED_KWH_PER_KG;
        const co2Saved = weightKg * CO2_SAVED_KG_PER_KG;
        
        const liveCountEl = document.getElementById('liveCansCount');
        const liveWeightEl = document.getElementById('liveWeight');
        const liveEnergyEl = document.getElementById('liveEnergy');
        const liveCo2El = document.getElementById('liveCo2');
        
        if (liveCountEl) liveCountEl.textContent = `${adminEditCansLocal.length} ks`;
        if (liveWeightEl) liveWeightEl.textContent = `${totalWeightG.toFixed(1)} g`;
        if (liveEnergyEl) liveEnergyEl.textContent = `${energySaved.toFixed(3).replace('.', ',')} kWh`;
        if (liveCo2El) liveCo2El.textContent = `${co2Saved.toFixed(2).replace('.', ',')} kg`;
    };

    window.prefillBrandRule = function(index) {
        const can = adminEditCansLocal[index];
        if (!can) return;
        
        const brandInput = document.getElementById('teachBrandInput');
        const volumesInput = document.getElementById('teachVolumesInput');
        
        if (brandInput) {
            brandInput.value = (can.brand === 'Nerozpoznáno' || can.brand === 'Unknown') ? '' : can.brand;
        }
        if (volumesInput) {
            volumesInput.value = (can.volume_liters === 'Unknown' || !can.volume_liters) ? '' : can.volume_liters;
        }
        
        const hintInput = document.getElementById('teachHintInput');
        if (hintInput) hintInput.focus();
    };

    let recognition = null;
    window.dictateBrandHint = function() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Rozpoznávání hlasu není v tomto prohlížeči podporováno. Zkuste to v Chrome nebo Safari.");
            return;
        }
        
        const dictateBtn = document.getElementById('dictateHintBtn');
        const hintInput = document.getElementById('teachHintInput');
        if (!hintInput) return;
        
        if (recognition) {
            recognition.stop();
            return;
        }
        
        recognition = new SpeechRecognition();
        recognition.lang = 'cs-CZ';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.onstart = function() {
            if (dictateBtn) {
                dictateBtn.textContent = '🔴';
                dictateBtn.title = 'Nahrávám... kliknutím zastavíte';
                dictateBtn.style.color = '#ef4444';
            }
        };
        
        recognition.onend = function() {
            if (dictateBtn) {
                dictateBtn.textContent = '🎙️';
                dictateBtn.title = 'Diktovat nápovědu (česky)';
                dictateBtn.style.color = 'inherit';
            }
            recognition = null;
        };
        
        recognition.onerror = function(event) {
            console.error("Speech recognition error", event);
            if (dictateBtn) {
                dictateBtn.textContent = '🎙️';
                dictateBtn.title = 'Diktovat nápovědu (česky)';
                dictateBtn.style.color = 'inherit';
            }
            recognition = null;
        };
        
        recognition.onresult = function(event) {
            const resultText = event.results[0][0].transcript;
            if (resultText) {
                const existing = hintInput.value.trim();
                hintInput.value = existing ? `${existing} ${resultText}` : resultText;
            }
        };
        
        recognition.start();
    };

    window.saveBrandRule = async function() {
        const brandInput = document.getElementById('teachBrandInput');
        const volumesInput = document.getElementById('teachVolumesInput');
        const hintInput = document.getElementById('teachHintInput');
        
        if (!brandInput || !volumesInput || !hintInput) return;
        
        const brand = brandInput.value.trim();
        const volumes = volumesInput.value.trim();
        const hint = hintInput.value.trim();
        
        if (!brand) {
            alert("Zadejte prosím název značky.");
            brandInput.focus();
            return;
        }
        
        if (!volumes) {
            alert("Zadejte prosím objemy (např. 0.5 nebo 0.33, 0.5).");
            volumesInput.focus();
            return;
        }
        
        let adminPassword = sessionStorage.getItem('adminPassword');
        if (!adminPassword) {
            adminPassword = prompt("Zadejte administrátorské heslo pro uložení pravidla:");
            if (!adminPassword) return;
            sessionStorage.setItem('adminPassword', adminPassword);
        }
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_upsert_brand_rule`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_secret: (adminPassword === 'milion2026') ? 'tomasadmin123' : adminPassword,
                    p_brand: brand,
                    p_volumes: volumes,
                    p_hint: hint
                })
            });
            
            if (!response.ok) {
                if (response.status === 400 || response.status === 403) {
                    sessionStorage.removeItem('adminPassword');
                    throw new Error("Špatné heslo nebo chyba oprávnění.");
                }
                throw new Error('Nepodařilo se uložit pravidlo.');
            }
            
            alert('Pravidlo bylo úspěšně uloženo do databáze.');
            
            brandInput.value = '';
            volumesInput.value = '';
            hintInput.value = '';
            
            loadData();
        } catch (e) {
            console.error(e);
            alert("Chyba při ukládání pravidla: " + e.message);
        }
    };

    window.saveAdminEditChanges = async function() {
        if (!adminSelectedPickup) return;
        
        const saveBtn = document.getElementById('adminSaveBtn');
        if (!saveBtn) return;
        
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Ukládám...';
        saveBtn.disabled = true;
        
        const count = adminEditCansLocal.length;
        const newNick = document.getElementById('adminEditNickInput')?.value.trim() || '';
        const newTeam = document.getElementById('adminEditTeamInput')?.value.trim() || '';
        
        try {
            let adminPassword = sessionStorage.getItem('adminPassword');
            if (!adminPassword) {
                adminPassword = prompt("Zadejte administrátorské heslo pro uložení změn:");
                if (!adminPassword) {
                    saveBtn.textContent = originalText;
                    saveBtn.disabled = false;
                    return;
                }
                sessionStorage.setItem('adminPassword', adminPassword);
            }
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_update_pickup`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_id: adminSelectedPickup.id,
                    p_secret: (adminPassword === 'milion2026') ? 'tomasadmin123' : adminPassword,
                    p_nickname: newNick || null,
                    p_team: newTeam || null,
                    p_notes: adminSelectedPickup.notes,
                    p_is_analyzed: true,
                    p_analysis_json: adminEditCansLocal,
                    p_count: count
                })
            });
            
            if (!response.ok) {
                if (response.status === 400 || response.status === 403) {
                    sessionStorage.removeItem('adminPassword');
                    throw new Error("Špatné heslo nebo chyba oprávnění.");
                }
                throw new Error('Uložení do databáze selhalo.');
            }
            
            alert('Změny úspěšně uloženy.');
            window.closeAdminEditModal();
            loadData();
        } catch (e) {
            console.error(e);
            alert("Chyba při ukládání: " + e.message);
        } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    };

    window.recalculateGlobalStatsAfterAdminEdit = function() {
        const totalCans = allPickups.reduce((sum, item) => sum + item.count, 0);
        globalStats = 1000000 - totalCans;
        myStats = allPickups.filter(item => item.nickname === userNick).reduce((sum, item) => sum + item.count, 0);
        
        const totalEnergy = allPickups.reduce((sum, item) => sum + (parseFloat(item.energy_saved_kwh) || 0), 0);
        globalEnergy = totalEnergy;

        const myEnergy = allPickups.filter(item => item.nickname === userNick)
            .reduce((sum, item) => sum + (parseFloat(item.energy_saved_kwh) || 0), 0);
        
        myHistory = allPickups.filter(item => item.nickname === userNick)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map(item => ({
                count: item.count,
                date: new Date(item.created_at).toLocaleString('cs-CZ', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'}),
                coords: item.latitude ? { lat: item.latitude, lon: item.longitude } : null,
                photo_url: item.photo_url || null
            }));
        
        myTotalEl.textContent = myStats;
        const myEnergyValEl = document.getElementById('myEnergyValue');
        if (myEnergyValEl) {
            myEnergyValEl.textContent = myEnergy.toFixed(1).replace('.', ',');
        }
        if (globalTotalEl) {
            globalTotalEl.textContent = globalStats.toLocaleString('cs-CZ');
        }
        if (globalEnergyEl) {
            globalEnergyEl.textContent = globalEnergy.toFixed(1).replace('.', ',') + ' kWh';
        }
        
        updateTomFeaturesVisibility();
        
        renderHistory();
        renderLeaderboard(allPickups);
        renderMarkers(allPickups);
    };

    // Lightbox pro zobrazení velké fotky v administraci
    const adminEditPhoto = document.getElementById('adminEditPhoto');
    const adminPhotoLightbox = document.getElementById('adminPhotoLightbox');
    const adminLightboxImg = document.getElementById('adminLightboxImg');
    if (adminEditPhoto && adminPhotoLightbox && adminLightboxImg) {
        adminEditPhoto.style.cursor = 'zoom-in';
        adminEditPhoto.style.transition = 'transform 0.2s';
        adminEditPhoto.addEventListener('click', () => {
            adminLightboxImg.src = adminEditPhoto.src;
            adminPhotoLightbox.classList.remove('hidden');
        });
        adminPhotoLightbox.addEventListener('click', () => {
            adminPhotoLightbox.classList.add('hidden');
        });
    }

    newPickupBtn.addEventListener('click', () => { window.location.reload(); });
    cancelBtn.addEventListener('click', () => { window.location.reload(); });
});
