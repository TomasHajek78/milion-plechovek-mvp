// --- Registrace Service Workera pro PWA stabilitu ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker registrován'))
        .catch(err => console.log('Service Worker selhal', err));
}

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
    let currentCoords = null;
    let map, markersLayer;

    // --- Mock Data pro Žebříček ---
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
        if (viewName === 'leaderboard') {
            renderLeaderboard();
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    // --- Žebříček ---
    function renderLeaderboard() {
        leaderboardList.innerHTML = '';
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

        // Moje pozice (11. řádek)
        const myLi = document.createElement('li');
        myLi.className = 'leaderboard-item me';
        myLi.innerHTML = `
            <span class="rank">11.</span>
            <span class="nick">${userNick || 'Já'}</span>
            <span class="count">${myStats} ks</span>
        `;
        leaderboardList.appendChild(myLi);
    }

    // --- Mapa ---
    function initMap() {
        map = L.map('map').setView([49.8175, 15.473], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        markersLayer = L.layerGroup().addTo(map);
        renderMarkers();
    }

    function renderMarkers() {
        markersLayer.clearLayers();
        myHistory.forEach(item => {
            if (item.coords) {
                const numberIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<span>${item.count}</span>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });

                L.marker([item.coords.lat, item.coords.lon], { icon: numberIcon })
                    .bindPopup(`<b>${item.count} ks</b><br>${item.date}`)
                    .addTo(markersLayer);
            }
        });
    }

    // --- Historie ---
    function renderHistory() {
        historyList.innerHTML = '';
        if (myHistory.length === 0) {
            historyList.innerHTML = '<li class="small-text" style="color:#888; text-align:center; width:100%;">Zatím nic. Vyraz ven!</li>';
            return;
        }
        myHistory.slice(0, 5).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>📅 ${item.date}</span> <strong>+${item.count} ks</strong>`;
            historyList.appendChild(li);
        });
    }

    // --- Inicializace ---
    myTotalEl.textContent = myStats;
    globalTotalEl.textContent = globalStats.toLocaleString('cs-CZ');
    if (userNick) userNickDisplay.textContent = userNick;
    renderHistory();
    initMap();

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
            renderLeaderboard();
        }
    });

    // --- Akce ---
    cameraBtn.addEventListener('click', () => cameraInput.click());
    galleryBtn.addEventListener('click', () => galleryInput.click());

    [cameraInput, galleryInput].forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => { photoPreview.src = e.target.result; };
                reader.readAsDataURL(e.target.files[0]);
                sections.home.classList.add('hidden');
                document.querySelector('.bottom-nav').classList.add('hidden');
                pickupForm.classList.remove('hidden');
                getGPSLocation();
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
            () => { gpsStatus.innerHTML = "📍 Poloha nezaměřena."; gpsStatus.style.color = "var(--rust-red)"; },
            { timeout: 5000 }
        );
    }

    submitBtn.addEventListener('click', () => {
        const count = parseInt(canCountInput.value) || 1;
        const now = new Date();
        const dateStr = now.toLocaleDateString('cs-CZ') + ' ' + now.toLocaleTimeString('cs-CZ', {hour: '2-digit', minute:'2-digit'});
        
        myStats += count;
        globalStats -= count;
        myHistory.unshift({ count: count, date: dateStr, coords: currentCoords });
        
        localStorage.setItem('milion_mystats', myStats);
        localStorage.setItem('milion_globalstats', globalStats);
        localStorage.setItem('milion_history', JSON.stringify(myHistory));
        
        myTotalEl.textContent = myStats;
        globalTotalEl.textContent = globalStats.toLocaleString('cs-CZ');
        renderHistory();
        renderMarkers();

        pickupForm.classList.add('hidden');
        successScreen.classList.remove('hidden');
        launchConfetti();
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

    shareBtn.addEventListener('click', () => {
        const count = canCountInput.value;
        const text = `Právě jsem sebral ${count} plechovek a pomáhám vyčistit Česko! Sleduj @milionplechovek a přidej se taky. #milionplechovek ♻️🥫`;
        if (navigator.share) {
            navigator.share({
                title: 'Milion Plechovek',
                text: text,
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(text);
            alert("Text pro sdílení byl zkopírován do schránky!");
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

    window.forceRefresh = async () => {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
            }
        }
        const cacheNames = await caches.keys();
        for (let name of cacheNames) {
            await caches.delete(name);
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
