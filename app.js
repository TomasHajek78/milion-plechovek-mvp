document.addEventListener('DOMContentLoaded', () => {
    // --- Prvky UI ---
    const loginScreen = document.getElementById('loginScreen');
    const statsRow = document.getElementById('statsRow');
    const mainAction = document.getElementById('mainAction');
    const pickupForm = document.getElementById('pickupForm');
    const successScreen = document.getElementById('successScreen');
    const mapCard = document.querySelector('.map-card');
    
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
    
    const canCountInput = document.getElementById('canCount');
    const myTotalEl = document.getElementById('myTotal');
    const globalTotalEl = document.getElementById('globalTotal');
    
    const myStatsCard = document.getElementById('myStatsCard');
    const historyPanel = document.getElementById('historyPanel');
    const historyList = document.getElementById('historyList');

    // --- State Aplikace ---
    let myStats = parseInt(localStorage.getItem('milion_mystats')) || 0;
    let globalStats = parseInt(localStorage.getItem('milion_globalstats')) || 999171;
    let myHistory = JSON.parse(localStorage.getItem('milion_history')) || [];
    let currentCoords = null;
    let map, markersLayer;

    // --- Inicializace Mapy ---
    function initMap() {
        // Výchozí pohled na ČR, pokud nemáme polohu
        map = L.map('map').setView([49.8175, 15.473], 7);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        markersLayer = L.layerGroup().addTo(map);
        renderMarkers();
    }

    function renderMarkers() {
        markersLayer.clearLayers();
        myHistory.forEach(item => {
            if (item.coords) {
                const marker = L.marker([item.coords.lat, item.coords.lon]);
                marker.bindPopup(`<b>${item.count} ks</b><br>${item.date}<br>${item.note || ''}`);
                markersLayer.addLayer(marker);
            }
        });
        
        // Pokud máme body, zazoomujeme na ně
        if (myHistory.length > 0 && myHistory[0].coords) {
            const latest = myHistory[0].coords;
            map.setView([latest.lat, latest.lon], 13);
        }
    }

    initMap();

    // Vykreslení historie v seznamu
    function renderHistory() {
        historyList.innerHTML = '';
        if (myHistory.length === 0) {
            historyList.innerHTML = '<li class="small-text" style="color:#888;">Zatím žádné úlovky. Běž na lov!</li>';
            return;
        }
        myHistory.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>📅 ${item.date}</span> <strong>+${item.count} ks</strong>`;
            historyList.appendChild(li);
        });
    }

    // Inicializace UI
    myTotalEl.textContent = myStats;
    globalTotalEl.textContent = globalStats.toLocaleString('cs-CZ');
    renderHistory();

    // Přepínání panelu historie
    myStatsCard.addEventListener('click', () => {
        historyPanel.classList.toggle('hidden');
    });

    // Kontrola přezdívky
    let userNick = localStorage.getItem('milion_nickname');
    if (!userNick) {
        loginScreen.classList.remove('hidden');
        statsRow.classList.add('hidden');
        mainAction.classList.add('hidden');
        mapCard.classList.add('hidden');
    } else {
        userNickDisplay.textContent = userNick;
    }

    saveNickBtn.addEventListener('click', () => {
        if(nicknameInput.value.trim() !== '') {
            userNick = nicknameInput.value.trim();
            localStorage.setItem('milion_nickname', userNick);
            userNickDisplay.textContent = userNick;
            
            loginScreen.classList.add('hidden');
            statsRow.classList.remove('hidden');
            mainAction.classList.remove('hidden');
            mapCard.classList.remove('hidden');
        }
    });

    // --- Ovládání vstupu (Foťák/Galerie) ---
    cameraBtn.addEventListener('click', () => cameraInput.click());
    galleryBtn.addEventListener('click', () => galleryInput.click());

    [cameraInput, galleryInput].forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (e) => { photoPreview.src = e.target.result; };
                reader.readAsDataURL(file);

                mainAction.classList.add('hidden');
                statsRow.classList.add('hidden');
                mapCard.classList.add('hidden');
                pickupForm.classList.remove('hidden');

                getGPSLocation();
            }
        });
    });

    // Získání polohy
    function getGPSLocation() {
        gpsStatus.textContent = "📍 Zjišťuji polohu...";
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentCoords = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    };
                    gpsStatus.innerHTML = `📍 <b>Poloha zaměřena!</b>`;
                    gpsStatus.style.color = 'var(--forest-green)';
                },
                (error) => {
                    gpsStatus.innerHTML = "📍 Polohu se nepodařilo zaměřit.";
                    gpsStatus.style.color = 'var(--rust-red)';
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    }

    // Odeslání do odpočtu
    submitBtn.addEventListener('click', () => {
        const count = parseInt(canCountInput.value) || 1;
        const now = new Date();
        const dateStr = now.toLocaleDateString('cs-CZ') + ' ' + now.toLocaleTimeString('cs-CZ', {hour: '2-digit', minute:'2-digit'});
        const note = document.getElementById('notes').value;
        
        // Update statistik
        myStats += count;
        globalStats -= count;
        
        // Zápis do historie včetně souřadnic
        const newEntry = { 
            count: count, 
            date: dateStr, 
            coords: currentCoords,
            note: note 
        };
        myHistory.unshift(newEntry);
        
        // Persistence
        localStorage.setItem('milion_mystats', myStats);
        localStorage.setItem('milion_globalstats', globalStats);
        localStorage.setItem('milion_history', JSON.stringify(myHistory));
        
        // Update UI
        myTotalEl.textContent = myStats;
        globalTotalEl.textContent = globalStats.toLocaleString('cs-CZ');
        renderHistory();
        renderMarkers();

        pickupForm.classList.add('hidden');
        successScreen.classList.remove('hidden');
        statsRow.classList.remove('hidden');
    });

    // Sdílení
    shareBtn.addEventListener('click', async () => {
        const count = canCountInput.value;
        const shareText = `Právě jsem sebral a odečetl ${count} plechovek z přírody! 🚮 @milionplechovek #youaresomeone`;
        
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Milion Plechovek', text: shareText, url: window.location.href });
            } catch (err) {}
        } else {
            alert("Text zkopírován! Vlož ho na svůj IG.");
        }
    });

    newPickupBtn.addEventListener('click', () => { window.location.reload(); });
    cancelBtn.addEventListener('click', () => { window.location.reload(); });
});
