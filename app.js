// --- Registrace Service Workera pro PWA stabilitu ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker registrován'))
        .catch(err => console.log('Service Worker selhal', err));
}

// --- Konfigurace Supabase Databáze ---
const SUPABASE_URL = 'https://dxlyjugmeucevosmhage.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CR-YuABHB1SvPK6b6sz-WQ_Q6y_8iKx';

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
    const myTotalEl = document.getElementById('myTotal');
    const globalTotalEl = document.getElementById('globalTotal');
    
    const historyList = document.getElementById('historyList');
    const leaderboardList = document.getElementById('leaderboardList');

    // --- State Aplikace ---
    let myStats = parseInt(localStorage.getItem('milion_mystats')) || 0;
    let globalStats = parseInt(localStorage.getItem('milion_globalstats')) || 999171;
    let myHistory = JSON.parse(localStorage.getItem('milion_history')) || [];
    let userNick = localStorage.getItem('milion_nickname') || '';
    let useGPS = localStorage.getItem('milion_use_gps') !== 'false';
    let currentCoords = null;
    let map, markersLayer;
    let selectedFile = null;

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
    async function loadData() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/pickups?select=nickname,count,latitude,longitude,notes,created_at,photo_url`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            if (!response.ok) throw new Error('Chyba komunikace s databází');
            const data = await response.json();

            // Sčítání globálních a osobních statistik
            const totalCans = data.reduce((sum, item) => sum + item.count, 0);
            globalStats = 1000000 - totalCans;
            myStats = data.filter(item => item.nickname === userNick).reduce((sum, item) => sum + item.count, 0);

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
            localStorage.setItem('milion_history', JSON.stringify(myHistory));

            // Aktualizace rozhraní
            myTotalEl.textContent = myStats;
            globalTotalEl.textContent = globalStats.toLocaleString('cs-CZ');
            renderHistory();
            renderLeaderboard(data);
            renderMarkers(data);

        } catch (e) {
            console.error('Nepodařilo se připojit k databázi. Používám lokální mezipaměť:', e);
            // Fallback na lokální data z localStorage
            myTotalEl.textContent = myStats;
            globalTotalEl.textContent = globalStats.toLocaleString('cs-CZ');
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
                leaderboardList.appendChild(li);
            });

            const myLi = document.createElement('li');
            myLi.className = 'leaderboard-item me';
            myLi.innerHTML = `
                <span class="rank">11.</span>
                <span class="nick">${userNick || 'Já'}</span>
                <span class="count">${myStats} ks</span>
            `;
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
        sortedUsers.slice(0, 10).forEach((user, index) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            if (user.nick === userNick) li.className += ' me';
            li.innerHTML = `
                <span class="rank">${index + 1}.</span>
                <span class="nick">${user.nick}</span>
                <span class="count">${user.count} ks</span>
            `;
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
            leaderboardList.appendChild(myLi);
        }
    }

    // --- Mapa ---
    function initMap() {
        map = L.map('map', { maxZoom: 21 }).setView([49.8175, 15.473], 7);
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
                
                let c = ' marker-cluster-';
                if (sum < 10) {
                    c += 'small';
                } else if (sum < 100) {
                    c += 'medium';
                } else {
                    c += 'large';
                }
                
                return L.divIcon({
                    html: '<div><span>' + sum + '</span></div>',
                    className: 'marker-cluster' + c,
                    iconSize: [40, 40]
                });
            }
        }).addTo(map);
        
        renderMarkers();
    }

    // Vykreslení všech bodů z databáze
    function renderMarkers(allData = []) {
        if (!markersLayer) return;
        markersLayer.clearLayers();
        
        // Pokud nemáme live data, ukážeme jen svoji historii z paměti
        const itemsToRender = allData.length > 0 ? allData : myHistory.map(h => ({
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
                
                const numberIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `${item.count}`,
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
                .bindPopup(popupText)
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
        myHistory.slice(0, 5).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>📅 ${item.date}${item.photo_url ? ` <a href="${item.photo_url}" target="_blank" style="text-decoration:none;">📸</a>` : ''}</span> <strong>+${item.count} ks</strong>`;
            historyList.appendChild(li);
        });
    }

    // --- Inicializace ---
    if (userNick) {
        userNickDisplay.textContent = userNick;
    }
    initMap();
    loadData();

    // Nastavení GPS přepínače
    if (gpsToggle) {
        gpsToggle.checked = useGPS;
        gpsToggle.addEventListener('change', (e) => {
            useGPS = e.target.checked;
            localStorage.setItem('milion_use_gps', useGPS);
        });
    }

    // Kontrola nickname
    if (!userNick) {
        loginScreen.classList.remove('hidden');
        sections.home.classList.add('hidden');
        document.querySelector('.bottom-nav').classList.add('hidden');
    }

    saveNickBtn.addEventListener('click', () => {
        if(nicknameInput.value.trim() !== '') {
            userNick = nicknameInput.value.trim();
            localStorage.setItem('milion_nickname', userNick);
            userNickDisplay.textContent = userNick;
            loginScreen.classList.add('hidden');
            sections.home.classList.remove('hidden');
            document.querySelector('.bottom-nav').classList.remove('hidden');
            loadData();
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
        
        submitBtn.disabled = true;
        submitBtn.textContent = "Odesílám...";
        
        try {
            let photoUrl = null;
            if (selectedFile) {
                // Generování unikátního názvu souboru pro zabránění přepsání
                const fileExt = selectedFile.name.split('.').pop() || 'jpg';
                const cleanNick = userNick.replace(/[^a-zA-Z0-9]/g, '_');
                const filename = `${Date.now()}_${cleanNick}.${fileExt}`;
                
                try {
                    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/pickup-photos/${filename}`, {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`,
                            'Content-Type': selectedFile.type
                        },
                        body: selectedFile
                    });
                    
                    if (uploadResponse.ok) {
                        photoUrl = `${SUPABASE_URL}/storage/v1/object/public/pickup-photos/${filename}`;
                    } else {
                        console.error("Storage upload failed (status not ok), saving entry without image...");
                    }
                } catch (uploadError) {
                    console.error("Network error during storage upload, saving entry without image:", uploadError);
                }
            }

            // Uložení do Supabase databáze
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
                    photo_url: photoUrl
                })
            });
            
            if (!response.ok) throw new Error('Chyba zápisu do databáze');
            
            // Okamžité znovunačtení dat z databáze
            await loadData();
            
            pickupForm.classList.add('hidden');
            successScreen.classList.remove('hidden');
            launchConfetti();
            
        } catch (e) {
            alert('Ukládání selhalo: ' + e.message);
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

    window.toggleDesatero = () => {
        const modal = document.getElementById('desateroModal');
        modal.classList.toggle('hidden');
    };

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

    newPickupBtn.addEventListener('click', () => { window.location.reload(); });
    cancelBtn.addEventListener('click', () => { window.location.reload(); });
});
