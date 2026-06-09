const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const xpText = document.getElementById('xpText');
const xpBarFill = document.getElementById('xpBarFill');
const timerDisplay = document.getElementById('timerDisplay');
const goldEl = document.getElementById('goldEl');

const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseMenu');
const gameOverModal = document.getElementById('gameOverModal');
const levelUpModal = document.getElementById('levelUpModal');

const levelUpContainer = document.getElementById('levelUpContainer');
const shopContainer = document.getElementById('shopContainer');
const ammoContainer = document.getElementById('ammoContainer');
const controlsTip = document.getElementById('controlsTip');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- MENU & SAVE SYSTEM ---
let currentSaveSlot = null;
let savedData = {};

function switchMenuTab(tabId, buttonElement) {
    document.querySelectorAll('.menu-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.menu-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    buttonElement.classList.add('active');
}

function showSaveSelect() {
    for (let i = 1; i <= 3; i++) {
        let s = JSON.parse(localStorage.getItem('roR_save_' + i));
        let btn = document.getElementById('saveBtn' + i);
        if (s) btn.innerText = `SAVE ${i} (Gold: ${s.gold})`;
        else btn.innerText = `SAVE ${i} (Empty)`;
    }
    
    document.getElementById('saveSelectState').style.display = 'block';
    document.getElementById('runReadyState').style.display = 'none';
    
    document.getElementById('btnTabPatch').style.display = 'block';
    document.getElementById('btnTabCredits').style.display = 'block';
    document.getElementById('btnTabShop').style.display = 'none'; 
    
    switchMenuTab('tab-start', document.getElementById('btnTabStart'));
    
    currentSaveSlot = null;
}

function loadSaveSlot(slotIndex) {
    currentSaveSlot = slotIndex;
    savedData = JSON.parse(localStorage.getItem('roR_save_' + slotIndex)) || {
        gold: 0,
        upgrades: { 
            deepPockets: 0, arcaneHaste: 0, volatileEmbers: 0, reinforcedWood: 0, viscousTar: 0, 
            serratedWire: 0, highVoltage: 0, toxicSpores: 0, deepSiphon: 0, blessedAura: 0, 
            masonry: 0, scholarsInsight: 0, headStart: 0, 
            evocationMastery: 0, alchemistsTouch: 0, potentToxins: 0, splinteringWards: 0, arcaneFortitude: 0, mesmerizingGaze: 0 
        }
    };
    
    for (let key in UPGRADE_DATA) {
        if (savedData.upgrades[key] === undefined) savedData.upgrades[key] = 0;
    }
    
    saveGame();
    updateGoldUI();
    populateShop();

    document.getElementById('currentSaveDisplay').innerText = slotIndex;
    
    document.getElementById('saveSelectState').style.display = 'none';
    document.getElementById('runReadyState').style.display = 'block';
    
    document.getElementById('btnTabShop').style.display = 'block'; 
    document.getElementById('btnTabPatch').style.display = 'none';
    document.getElementById('btnTabCredits').style.display = 'none';
}

function saveGame() {
    if (currentSaveSlot) localStorage.setItem('roR_save_' + currentSaveSlot, JSON.stringify(savedData));
}

function deleteSave() {
    if (confirm("Are you sure you want to delete THIS save file? This cannot be undone.")) {
        localStorage.removeItem('roR_save_' + currentSaveSlot);
        showSaveSelect();
    }
}

function updateGoldUI() {
    goldEl.innerText = savedData.gold;
    const hubGold = document.getElementById('hubTotalGoldEl');
    if (hubGold) hubGold.innerText = savedData.gold;
}

// --- METAPROGRESSION DATA ---
const UPGRADE_DATA = {
    deepPockets: { name: "Deep Pockets", desc: "+1 Max Ammo.", baseCost: 3, maxLevel: 5 },
    arcaneHaste: { name: "Arcane Haste", desc: "Faster Recharge.", baseCost: 2, maxLevel: 5 },
    volatileEmbers: { name: "Volatile Embers", desc: "+10% Radius.", baseCost: 5, maxLevel: 5 },
    reinforcedWood: { name: "Reinforced Wood", desc: "+50 Wood HP.", baseCost: 2, maxLevel: 5 },
    viscousTar: { name: "Viscous Tar", desc: "More Tar slow.", baseCost: 3, maxLevel: 3 },
    serratedWire: { name: "Serrated Wire", desc: "+2 Wire Dmg.", baseCost: 1, maxLevel: 5 },
    highVoltage: { name: "High Voltage", desc: "+10 Tesla Dmg.", baseCost: 3, maxLevel: 5 },
    toxicSpores: { name: "Toxic Spores", desc: "+20 Plague Rad.", baseCost: 2, maxLevel: 5 },
    deepSiphon: { name: "Deep Siphon", desc: "+0.5x XP Boost.", baseCost: 4, maxLevel: 4 },
    blessedAura: { name: "Blessed Aura", desc: "Faster Healing.", baseCost: 3, maxLevel: 4 },
    masonry: { name: "Masonry", desc: "+10 Tower HP.", baseCost: 1, maxLevel: 10 },
    scholarsInsight: { name: "Scholar", desc: "+5% XP gain.", baseCost: 4, maxLevel: 5 },
    headStart: { name: "Head Start", desc: "Skip early levels.", baseCost: 10, maxLevel: 3 },
    
    evocationMastery: { name: "Evocation", desc: "+2 Click Dmg.", baseCost: 3, maxLevel: 5 },
    alchemistsTouch: { name: "Alchemist", desc: "Better gold drops.", baseCost: 5, maxLevel: 3 },
    potentToxins: { name: "Potent Toxins", desc: "More Poison Dmg.", baseCost: 4, maxLevel: 5 },
    splinteringWards: { name: "Splinter Wards", desc: "Exploding walls.", baseCost: 5, maxLevel: 3 },
    arcaneFortitude: { name: "Arcane Fort", desc: "+25 Trap HP.", baseCost: 2, maxLevel: 5 },
    mesmerizingGaze: { name: "Mesmerize", desc: "-1s Charm CD.", baseCost: 5, maxLevel: 5 }
};

const BLUEPRINT_DB = {
    barricade: { name: 'Wood Wall', desc: 'Blocks zombies.' },
    tar: { name: 'Tar Pit', desc: 'Slows zombies.' },
    wire: { name: 'Barbed Wire', desc: 'Damages zombies.' },
    tesla: { name: 'Tesla Rune', desc: 'Zaps nearby zombies.' },
    plague: { name: 'Plague Totem', desc: 'Poisons zombies.' },
    soul: { name: 'Soul Siphon', desc: 'Bonus XP nearby.' },
    mending: { name: 'Mending Ward', desc: 'Heals the tower.' },
    charm: { name: 'Mind Ward', desc: 'Converts zombies.' }
};

// --- RUN VARIABLES ---
let maxHealth, health, maxAmmo, currentAmmo, rechargeRate, maxBlastRadius;
let barricadeHP, tarSpeedMod, wireDamageBonus, teslaDamage, plagueRadius, soulMultiplier, mendingCooldown, xpMultiplier;
let spellDamageBonus, goldDropThreshold, bossGoldBonus, poisonTickDamage, barricadeExplosionDamage, wardHPBonus, charmCooldown;

let animationId, isPaused = false, isGameStarted = false; 
let survivalTimeMs = 0, lastFrameTime = Date.now(), formattedTime = "00:00";
let level = 1, xp = 0, xpToNextLevel = 100, lastBossLevel = 0; 
let killCount = 0, runGold = 0;
let nextBossTime = 300000; // 5 minutes in milliseconds

let bossesKilled = 0;
let crystalsSpawned = false;
let victoryAchieved = false;
const crystals = [];

let currentBlueprint = null, blueprintAngle = 0; 
const structures = [], spells = [], enemies = [], visualEffects = []; 
let lastRechargeTime = 0;
const restrictedRadius = 120; 
let spawnTimer, mouseX = canvas.width / 2, mouseY = canvas.height / 2;
const player = { x: canvas.width / 2, y: canvas.height / 2 };

function applyUpgrades() {
    maxHealth = 100 + (savedData.upgrades.masonry * 10);
    health = maxHealth;
    maxAmmo = 5 + savedData.upgrades.deepPockets;
    currentAmmo = maxAmmo;
    rechargeRate = 500 - (savedData.upgrades.arcaneHaste * 25);
    maxBlastRadius = 45 * (1 + (savedData.upgrades.volatileEmbers * 0.1));
    barricadeHP = 150 + (savedData.upgrades.reinforcedWood * 50);
    tarSpeedMod = 0.5 - (savedData.upgrades.viscousTar * 0.05); 
    wireDamageBonus = savedData.upgrades.serratedWire * 2;
    teslaDamage = 20 + (savedData.upgrades.highVoltage * 10);
    plagueRadius = 120 + (savedData.upgrades.toxicSpores * 20);
    soulMultiplier = 2 + (savedData.upgrades.deepSiphon * 0.5);
    mendingCooldown = 2000 - (savedData.upgrades.blessedAura * 250);
    xpMultiplier = 1 + (savedData.upgrades.scholarsInsight * 0.05);
    level = 1 + savedData.upgrades.headStart;
    
    spellDamageBonus = savedData.upgrades.evocationMastery * 2;
    goldDropThreshold = 50 - (savedData.upgrades.alchemistsTouch * 5); 
    bossGoldBonus = savedData.upgrades.alchemistsTouch;
    poisonTickDamage = 0.05 + (savedData.upgrades.potentToxins * 0.02);
    barricadeExplosionDamage = savedData.upgrades.splinteringWards * 15;
    wardHPBonus = savedData.upgrades.arcaneFortitude * 25;
    charmCooldown = 10000 - (savedData.upgrades.mesmerizingGaze * 1000);
    
    xpToNextLevel = 100;
    for (let i = 1; i < level; i++) xpToNextLevel = Math.floor(xpToNextLevel * 1.4);
}

function updateAmmoUI() {
    ammoContainer.innerHTML = ''; 
    for (let i = 0; i < maxAmmo; i++) {
        const slot = document.createElement('div');
        slot.className = 'ammo-slot';
        if (i < currentAmmo) slot.classList.add('filled');
        ammoContainer.appendChild(slot);
    }
}

// --- GAME STATE FLOW ---
function startGame() {
    applyUpgrades();
    updateAmmoUI();
    updateGoldUI();
    mainMenu.style.display = 'none'; 
    isGameStarted = true;
    lastRechargeTime = Date.now(); 
    lastFrameTime = Date.now(); 
    spawnWave(); 
}

function resetGame() {
    gameOverModal.style.display = 'none';
    pauseMenu.style.display = 'none';
    document.getElementById('victoryModal').style.display = 'none';
    
    switchMenuTab('tab-start', document.getElementById('btnTabStart'));
    mainMenu.style.display = 'flex'; 
    
    isGameStarted = false;
    isPaused = false;
    currentBlueprint = null;
    controlsTip.style.display = 'none';
    
    bossesKilled = 0;
    crystalsSpawned = false;
    victoryAchieved = false;
    crystals.length = 0;
    
    survivalTimeMs = 0;
    nextBossTime = 300000;
    formattedTime = "00:00";
    timerDisplay.innerText = formattedTime;
    xp = 0; lastBossLevel = 0; killCount = 0; runGold = 0;
    enemies.length = 0; spells.length = 0; structures.length = 0; visualEffects.length = 0;
    
    applyUpgrades(); 
    xpBarFill.style.width = '0%';
    xpText.innerHTML = `${xp} / ${xpToNextLevel}`;
    updateAmmoUI();
    updateGoldUI();
    populateShop();
}

function togglePauseMenu() {
    if (!isGameStarted || gameOverModal.style.display === 'flex' || levelUpModal.style.display === 'flex' || document.getElementById('victoryModal').style.display === 'flex') return;

    if (pauseMenu.style.display === 'flex') {
        pauseMenu.style.display = 'none';
        isPaused = false;
        canvas.style.cursor = 'none';
        lastFrameTime = Date.now(); 
        spawnWave();
    } else {
        isPaused = true;
        clearTimeout(spawnTimer);
        pauseMenu.style.display = 'flex';
        canvas.style.cursor = 'default';
    }
}

function triggerGameOver() {
    isGameStarted = false; 
    clearTimeout(spawnTimer);
    document.getElementById('finalLevelEl').innerText = level;
    document.getElementById('finalTimeEl').innerText = formattedTime;
    document.getElementById('runGoldEl').innerText = runGold;
    gameOverModal.style.display = 'flex';
    canvas.style.cursor = 'default';
}

function updateHealthUI() {
    health = Math.min(maxHealth, Math.max(0, health)); 
    if (health <= 0) triggerGameOver();
}

function spawnCrystals() {
    const crystalHp = (80 + (level * 10)) * 3; 
    const corners = [
        { x: 100, y: 100 },
        { x: canvas.width - 100, y: 100 },
        { x: 100, y: canvas.height - 100 },
        { x: canvas.width - 100, y: canvas.height - 100 }
    ];
    
    corners.forEach(pos => {
        crystals.push({ x: pos.x, y: pos.y, radius: 35, hp: crystalHp, maxHp: crystalHp });
    });
}

function continueRun() {
    document.getElementById('victoryModal').style.display = 'none';
    isPaused = false;
    canvas.style.cursor = 'none';
    lastFrameTime = Date.now();
    spawnWave();
}

// --- SHOP LOGIC ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function populateShop() {
    if (!shopContainer) return;
    shopContainer.innerHTML = '';
    let availableUpgrades = Object.keys(UPGRADE_DATA).filter(k => savedData.upgrades[k] < UPGRADE_DATA[k].maxLevel);
    
    if (availableUpgrades.length === 0) {
        shopContainer.innerHTML = '<h3 style="color: #4caf50;">You have maxed out all available upgrades!</h3>';
        return;
    }

    shuffleArray(availableUpgrades);
    const chosenUpgrades = availableUpgrades.slice(0, 3); 

    chosenUpgrades.forEach(key => {
        const data = UPGRADE_DATA[key];
        const currentLvl = savedData.upgrades[key];
        const cost = data.baseCost * (currentLvl + 1); 
        const canAfford = savedData.gold >= cost;

        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div>
                <h3>${data.name}</h3>
                <p>${data.desc}</p>
                <p style="color: #ccc; font-size: 8px;">Level ${currentLvl} / ${data.maxLevel}</p>
            </div>
            <button class="buy-btn" ${canAfford ? '' : 'disabled'} onclick="buyUpgrade('${key}', ${cost})">
                ${cost} Gold
            </button>
        `;
        shopContainer.appendChild(card);
    });
}

function buyUpgrade(key, cost) {
    if (savedData.gold >= cost && savedData.upgrades[key] < UPGRADE_DATA[key].maxLevel) {
        savedData.gold -= cost;
        savedData.upgrades[key]++;
        saveGame();
        updateGoldUI();
        populateShop(); 
    }
}

// --- INPUT LISTENERS ---
window.addEventListener('mousemove', (event) => { mouseX = event.clientX; mouseY = event.clientY; });
window.addEventListener('wheel', (event) => { if (currentBlueprint) blueprintAngle += event.deltaY > 0 ? 0.2 : -0.2; });

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') togglePauseMenu();
    if (currentBlueprint) {
        if (event.key.toLowerCase() === 'r') blueprintAngle += 0.2;
        if (event.key.toLowerCase() === 'e') blueprintAngle -= 0.2;
    }
});

window.addEventListener('click', (event) => {
    if (!isGameStarted || (isPaused && !currentBlueprint)) return; 

    const distFromTower = Math.hypot(player.x - event.clientX, player.y - event.clientY);

    if (currentBlueprint) {
        if (distFromTower <= restrictedRadius) return; 

        let w = 40, h = 40, hp = 100 + wardHPBonus, radius = 0;
        if (currentBlueprint === 'barricade') { w = 80; h = 20; hp = barricadeHP; } 
        else if (currentBlueprint === 'tar') { w = 120; h = 120; }
        else if (currentBlueprint === 'wire') { w = 150; h = 40; }
        else if (currentBlueprint === 'tesla') { w = 30; h = 30; radius = 150; }
        else if (currentBlueprint === 'plague') { w = 30; h = 30; radius = plagueRadius; } 
        else if (currentBlueprint === 'soul') { w = 30; h = 30; radius = 150; hp = 50 + wardHPBonus; }
        else if (currentBlueprint === 'mending') { w = 30; h = 30; hp = 50 + wardHPBonus; }
        else if (currentBlueprint === 'charm') { w = 30; h = 30; radius = 150; hp = 50 + wardHPBonus; }

        structures.push({ type: currentBlueprint, x: event.clientX, y: event.clientY, w: w, h: h, angle: blueprintAngle, hp: hp, radius: radius, hitZombies: new Map(), lastTick: Date.now() });

        currentBlueprint = null; 
        controlsTip.style.display = 'none';
        isPaused = false; 
        lastFrameTime = Date.now();
        spawnWave(); 
        return; 
    }

    if (currentAmmo <= 0 || distFromTower <= restrictedRadius) return; 

    if (currentAmmo === maxAmmo) lastRechargeTime = Date.now();
    currentAmmo--;
    updateAmmoUI();

    const distToTarget = Math.hypot(event.clientX - player.x, event.clientY - player.y);
    spells.push({
        startX: player.x, startY: player.y, targetX: event.clientX, targetY: event.clientY, distance: distToTarget,
        progress: 0, arcHeight: Math.min(distToTarget * 0.4, 200), radius: 0, maxRadius: maxBlastRadius, state: 'flying', hitEnemies: new Set() 
    });
});

// --- LEVEL UP LOGIC ---
function selectBlueprint(type, event) {
    event.stopPropagation(); 
    currentBlueprint = type;
    blueprintAngle = 0; 
    levelUpModal.style.display = 'none';
    canvas.style.cursor = 'none'; 
    controlsTip.style.display = 'block';
}

function showLevelUpMenu() {
    isPaused = true;
    clearTimeout(spawnTimer); 
    
    levelUpContainer.innerHTML = '';
    const keys = Object.keys(BLUEPRINT_DB);
    shuffleArray(keys);
    const options = keys.slice(0, 3);
    
    options.forEach(key => {
        const item = BLUEPRINT_DB[key];
        const btn = document.createElement('button');
        btn.className = 'upgrade-card';
        btn.onclick = (e) => selectBlueprint(key, e);
        btn.innerHTML = `<h3>${item.name}</h3><p>${item.desc}</p>`;
        levelUpContainer.appendChild(btn);
    });

    levelUpModal.style.display = 'flex';
    canvas.style.cursor = 'default'; 
}

function addXp(amount) {
    xp += Math.floor(amount * xpMultiplier); 
    if (xp >= xpToNextLevel) {
        xp -= xpToNextLevel; 
        level++;
        xpToNextLevel = Math.floor(xpToNextLevel * 1.4); 
        showLevelUpMenu();
    }
    const xpPercent = Math.min(100, (xp / xpToNextLevel) * 100);
    xpBarFill.style.width = `${xpPercent}%`;
    xpText.innerHTML = `${xp} / ${xpToNextLevel}`;
}

// --- ENEMY SPAWNING ---
function spawnBossEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const x = player.x + Math.cos(angle) * (canvas.width / 2 + 100);
    const y = player.y + Math.sin(angle) * (canvas.height / 2 + 100);
    
    const bossHp = 80 + (level * 15); 
    enemies.push({ x, y, radius: 35, baseSpeed: 0.08, hp: bossHp, maxHp: bossHp, xpDrop: 200 + (level * 50), dead: false, isBoss: true, poisoned: false, charmed: false });
}

function spawnWave() {
    if (isPaused || !isGameStarted) return;

    const nextSpawnDelay = Math.random() * (7000 - 3000) + 3000;
    
    if (level % 5 === 0 && lastBossLevel !== level) {
        lastBossLevel = level;
        spawnBossEnemy();
    } else {
        const groupSize = Math.floor(Math.random() * (5 + Math.floor(level / 2))) + 3; 
        const hpMultiplier = 1 + (level * 0.20);
        const speedMultiplier = 1 + (level * 0.08);

        let groupX, groupY;
        if (Math.random() < 0.5) {
            groupX = Math.random() < 0.5 ? -65 : canvas.width + 65;
            groupY = Math.random() * canvas.height;
        } else {
            groupX = Math.random() * canvas.width;
            groupY = Math.random() < 0.5 ? -65 : canvas.height + 65;
        }

        for (let i = 0; i < groupSize; i++) {
            const x = groupX + (Math.random() - 0.5) * 80;
            const y = groupY + (Math.random() - 0.5) * 80;
            const speed = (0.4 + Math.random() * 0.3) * speedMultiplier; 
            const hp = Math.floor((Math.random() * 11 + 5) * hpMultiplier);
            enemies.push({ x, y, radius: 15, baseSpeed: speed, hp: hp, maxHp: hp, xpDrop: Math.floor(hp + (speed * 10)), dead: false, isBoss: false, poisoned: false, charmed: false });
        }
    }
    spawnTimer = setTimeout(spawnWave, nextSpawnDelay);
}

// --- PHYSICS HELPER ---
function getCollisionData(circle, rect) {
    const dx = circle.x - rect.x;
    const dy = circle.y - rect.y;
    const localX = dx * Math.cos(-rect.angle) - dy * Math.sin(-rect.angle);
    const localY = dx * Math.sin(-rect.angle) + dy * Math.cos(-rect.angle);
    const closestX = Math.max(-rect.w/2, Math.min(localX, rect.w/2));
    const closestY = Math.max(-rect.h/2, Math.min(localY, rect.h/2));
    const distX = localX - closestX;
    const distY = localY - closestY;
    const distanceSquared = distX * distX + distY * distY;
    
    if (distanceSquared < circle.radius * circle.radius) {
        const distance = Math.sqrt(distanceSquared) || 0.1;
        return { 
            collided: true, overlap: circle.radius - distance, localX,
            normalX: (distX / distance) * Math.cos(rect.angle) - (distY / distance) * Math.sin(rect.angle), 
            normalY: (distX / distance) * Math.sin(rect.angle) + (distY / distance) * Math.cos(rect.angle) 
        };
    }
    return { collided: false };
}

// --- MAIN GAME LOOP ---
function animate() {
    animationId = requestAnimationFrame(animate);
    
    const currentFrameTime = Date.now();
    const deltaTime = currentFrameTime - lastFrameTime;
    lastFrameTime = currentFrameTime;

    if (!isPaused && isGameStarted) {
        survivalTimeMs += deltaTime;
        const totalSeconds = Math.floor(survivalTimeMs / 1000);
        formattedTime = `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
        timerDisplay.innerText = formattedTime;

        // Check for 5-minute timer boss spawn
        if (survivalTimeMs >= nextBossTime) {
            nextBossTime += 300000;
            spawnBossEnemy();
        }

        if (currentAmmo < maxAmmo && currentFrameTime - lastRechargeTime >= rechargeRate) {
            currentAmmo++;
            lastRechargeTime += rechargeRate; 
            updateAmmoUI();
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath(); ctx.arc(player.x, player.y, restrictedRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.05)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]); 

    for (let i = structures.length - 1; i >= 0; i--) {
        const struct = structures[i];
        
        if (!isPaused && isGameStarted) {
            if (struct.type === 'tesla') {
                if (currentFrameTime - struct.lastTick > 2000) {
                    const inRange = enemies.filter(e => !e.charmed && Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.radius);
                    if (inRange.length > 0) {
                        const target = inRange[Math.floor(Math.random() * inRange.length)];
                        target.hp -= teslaDamage; 
                        if (target.hp <= 0) target.dead = true;
                        struct.lastTick = currentFrameTime;
                        visualEffects.push({ type: 'lightning', x1: struct.x, y1: struct.y, x2: target.x, y2: target.y, expires: currentFrameTime + 150 });
                    }
                }
            } else if (struct.type === 'plague') {
                enemies.forEach(e => {
                    if (!e.charmed && Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.radius) e.poisoned = true;
                });
            } else if (struct.type === 'mending') {
                if (currentFrameTime - struct.lastTick > mendingCooldown) { 
                    if (health < maxHealth) { health++; updateHealthUI(); }
                    struct.lastTick = currentFrameTime;
                }
            } else if (struct.type === 'charm') {
                if (currentFrameTime - struct.lastTick > charmCooldown) {
                    const inRange = enemies.filter(e => !e.charmed && !e.isBoss && Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.radius);
                    if (inRange.length > 0) {
                        const target = inRange[Math.floor(Math.random() * inRange.length)];
                        target.charmed = true;
                        struct.lastTick = currentFrameTime;
                        visualEffects.push({ type: 'charm_beam', x1: struct.x, y1: struct.y, x2: target.x, y2: target.y, expires: currentFrameTime + 200 });
                    }
                }
            }
        }

        ctx.save(); ctx.translate(struct.x, struct.y); ctx.rotate(struct.angle);

        if (struct.type === 'barricade') {
            ctx.fillStyle = '#8B4513'; ctx.fillRect(-struct.w/2, -struct.h/2, struct.w, struct.h);
            ctx.strokeStyle = '#5C3317'; ctx.lineWidth = 3; ctx.strokeRect(-struct.w/2, -struct.h/2, struct.w, struct.h);
            if (struct.hp < barricadeHP * 0.5) { ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(10, 5); ctx.stroke(); }
        } else if (struct.type === 'tar') {
            ctx.fillStyle = 'rgba(30, 30, 30, 0.7)'; ctx.fillRect(-struct.w/2, -struct.h/2, struct.w, struct.h);
            ctx.strokeStyle = '#000000'; ctx.lineWidth = 2; ctx.strokeRect(-struct.w/2, -struct.h/2, struct.w, struct.h);
        } else if (struct.type === 'wire') {
            ctx.fillStyle = 'rgba(150, 150, 150, 0.3)'; ctx.fillRect(-struct.w/2, -struct.h/2, struct.w, struct.h);
            ctx.strokeStyle = '#777777'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.strokeRect(-struct.w/2, -struct.h/2, struct.w, struct.h); ctx.setLineDash([]);
        } else if (struct.type === 'tesla') {
            ctx.fillStyle = '#00e5ff'; ctx.beginPath(); ctx.arc(0, 0, struct.w/2, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(0, 229, 255, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill();
        } else if (struct.type === 'plague') {
            ctx.fillStyle = '#1b5e20'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 15); ctx.lineTo(-15, 15); ctx.fill();
            ctx.fillStyle = 'rgba(27, 94, 32, 0.2)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill();
        } else if (struct.type === 'soul') {
            ctx.fillStyle = '#aa00ff'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.fill();
            ctx.fillStyle = 'rgba(170, 0, 255, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill();
        } else if (struct.type === 'mending') {
            ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(0, 0, struct.w/2, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'white'; ctx.fillRect(-2, -10, 4, 20); ctx.fillRect(-10, -2, 20, 4);
        } else if (struct.type === 'charm') {
            ctx.fillStyle = '#29b6f6'; 
            ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 5); ctx.lineTo(-15, 5); ctx.fill(); 
            ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(15, -5); ctx.lineTo(-15, -5); ctx.fill(); 
            ctx.fillStyle = 'rgba(41, 182, 246, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.restore();
        
        if (struct.hp <= 0) {
            if (struct.type === 'barricade' && barricadeExplosionDamage > 0) {
                enemies.forEach(e => {
                    if (!e.charmed && Math.hypot(e.x - struct.x, e.y - struct.y) <= 80) {
                        e.hp -= barricadeExplosionDamage;
                        if (e.hp <= 0) e.dead = true;
                    }
                });
                visualEffects.push({ type: 'explosion', x: struct.x, y: struct.y, radius: 80, expires: currentFrameTime + 200 });
            }
            structures.splice(i, 1); 
        }
    }

    if (!isPaused && isGameStarted) {
        spells.forEach((spell, index) => {
            if (spell.state === 'flying') {
                spell.progress += 15 / spell.distance;
                const gx = spell.startX + (spell.targetX - spell.startX) * spell.progress;
                const gy = spell.startY + (spell.targetY - spell.startY) * spell.progress;
                const ay = gy - Math.sin(spell.progress * Math.PI) * spell.arcHeight;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.beginPath(); ctx.ellipse(gx, gy, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff4500'; ctx.beginPath(); ctx.arc(gx, ay, 12, 0, Math.PI * 2); ctx.fill();

                if (spell.progress >= 1) spell.state = 'exploding';
            } else if (spell.state === 'exploding') {
                spell.radius += 4; 
                enemies.forEach(e => {
                    if (e.dead || e.charmed) return; 
                    if (Math.hypot(spell.targetX - e.x, spell.targetY - e.y) < spell.radius + e.radius && !spell.hitEnemies.has(e)) {
                        spell.hitEnemies.add(e); 
                        e.hp -= Math.floor(Math.random() * 4) + 3 + spellDamageBonus;
                        if (e.hp <= 0) e.dead = true;
                    }
                });

                for (let c = crystals.length - 1; c >= 0; c--) {
                    const crystal = crystals[c];
                    if (Math.hypot(spell.targetX - crystal.x, spell.targetY - crystal.y) < spell.radius + crystal.radius && !spell.hitEnemies.has(crystal)) {
                        spell.hitEnemies.add(crystal);
                        crystal.hp -= Math.floor(Math.random() * 4) + 3 + spellDamageBonus;
                        
                        if (crystal.hp <= 0) {
                            crystals.splice(c, 1);
                            if (crystalsSpawned && crystals.length === 0 && !victoryAchieved) {
                                victoryAchieved = true;
                                isPaused = true;
                                clearTimeout(spawnTimer);
                                canvas.style.cursor = 'default';
                                document.getElementById('victoryModal').style.display = 'flex';
                            }
                        }
                    }
                }

                if (spell.radius >= spell.maxRadius) setTimeout(() => spells.splice(index, 1), 0);
            }
        });

        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];

            if (e.poisoned && !e.charmed) { e.hp -= poisonTickDamage; if (e.hp <= 0) e.dead = true; }

            if (e.dead) {
                killCount++;
                if (e.isBoss) { 
                    savedData.gold += 2 + bossGoldBonus; runGold += 2 + bossGoldBonus; saveGame(); updateGoldUI(); 
                    bossesKilled++; 
                    
                    if (bossesKilled === 10 && !crystalsSpawned) {
                        crystalsSpawned = true;
                        spawnCrystals();
                    }
                } 
                else if (killCount % goldDropThreshold === 0) { savedData.gold += 1; runGold += 1; saveGame(); updateGoldUI(); }

                let finalXp = e.xpDrop;
                structures.forEach(s => { if (s.type === 'soul' && Math.hypot(e.x - s.x, e.y - s.y) <= s.radius) finalXp *= soulMultiplier; });

                addXp(finalXp); 
                enemies.splice(i, 1);
                continue; 
            }

            let speedModifier = 1;
            let hitTarget = null; 
            let targetAngle = Math.atan2(player.y - e.y, player.x - e.x);

            if (e.charmed) {
                speedModifier = 1.2;
                let closestDist = Infinity;
                let closestEnemy = null;
                for (let j = 0; j < enemies.length; j++) {
                    const other = enemies[j];
                    if (i !== j && !other.charmed && !other.dead) {
                        const dist = Math.hypot(other.x - e.x, other.y - e.y);
                        if (dist < closestDist) { closestDist = dist; closestEnemy = other; }
                    }
                }
                
                if (closestEnemy) {
                    targetAngle = Math.atan2(closestEnemy.y - e.y, closestEnemy.x - e.x);
                    if (closestDist < e.radius + closestEnemy.radius + 2) {
                        closestEnemy.hp -= 2; 
                        e.hp -= 1; 
                        if (closestEnemy.hp <= 0) closestEnemy.dead = true;
                        if (e.hp <= 0) e.dead = true;
                    }
                } else {
                    targetAngle = Math.atan2(e.y - player.y, e.x - player.x); 
                }
            } else {
                structures.forEach(struct => {
                    if (struct.type === 'tar') {
                        if (getCollisionData(e, struct).collided) speedModifier = tarSpeedMod;
                    } else if (struct.type !== 'plague' && struct.type !== 'tesla' && struct.type !== 'charm') {
                        const col = getCollisionData(e, struct);
                        if (col.collided) {
                            if (struct.type === 'wire') {
                                const lastHitTime = struct.hitZombies.get(e) || 0;
                                if (currentFrameTime - lastHitTime >= 500) {
                                    struct.hitZombies.set(e, currentFrameTime);
                                    e.hp -= Math.floor(Math.random() * 6) + 5 + wireDamageBonus;
                                    if (e.hp <= 0) e.dead = true;
                                }
                            } else {
                                hitTarget = struct;
                                e.x += col.normalX * col.overlap;
                                e.y += col.normalY * col.overlap;
                            }
                        }
                    }
                });

                if (hitTarget) hitTarget.hp -= e.isBoss ? 2.5 : 0.5;

                if (Math.hypot(player.x - e.x, player.y - e.y) - e.radius - 30 < 1) {
                    enemies.splice(i, 1);
                    health -= e.isBoss ? 40 : 10;
                    updateHealthUI();
                    continue; 
                }
            }

            e.x += Math.cos(targetAngle) * e.baseSpeed * speedModifier;
            e.y += Math.sin(targetAngle) * e.baseSpeed * speedModifier;
        }
    }

    const tw = 60, th = 80;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.beginPath(); ctx.ellipse(player.x, player.y + th/2, tw/2 + 10, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a939e'; ctx.fillRect(player.x - tw/2, player.y - th/2, tw, th);
    ctx.fillStyle = '#5c636a'; ctx.fillRect(player.x - tw/2, player.y - th/2 - 15, 15, 15); ctx.fillRect(player.x - tw/2 + 22.5, player.y - th/2 - 15, 15, 15); ctx.fillRect(player.x - tw/2 + 45, player.y - th/2 - 15, 15, 15);
    ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.arc(player.x, player.y + th/2 - 15, 15, Math.PI, 0); ctx.fill(); ctx.fillRect(player.x - 15, player.y + th/2 - 15, 30, 15);

    const hpW = 60, hpH = 8, hpX = player.x - hpW/2, hpY = player.y - th/2 - 30;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(hpX, hpY, hpW, hpH);
    ctx.fillStyle = '#e94560'; ctx.fillRect(hpX, hpY, hpW * (health / maxHealth), hpH);
    ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.strokeRect(hpX, hpY, hpW, hpH);

    spells.forEach(spell => {
        if (spell.state === 'exploding') {
            ctx.fillStyle = `rgba(255, 69, 0, ${1 - (spell.radius / spell.maxRadius)})`;
            ctx.beginPath(); ctx.arc(spell.targetX, spell.targetY, spell.radius, 0, Math.PI * 2); ctx.fill();
        }
    });

    for (let i = visualEffects.length - 1; i >= 0; i--) {
        const effect = visualEffects[i];
        if (currentFrameTime > effect.expires) { visualEffects.splice(i, 1); continue; }
        
        if (effect.type === 'lightning') {
            ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(effect.x1, effect.y1);
            const midX = (effect.x1 + effect.x2) / 2 + (Math.random() - 0.5) * 20;
            const midY = (effect.y1 + effect.y2) / 2 + (Math.random() - 0.5) * 20;
            ctx.lineTo(midX, midY); ctx.lineTo(effect.x2, effect.y2); ctx.stroke();
        } else if (effect.type === 'explosion') {
            const life = Math.max(0, (effect.expires - currentFrameTime) / 200);
            ctx.fillStyle = `rgba(255, 69, 0, ${life * 0.5})`;
            ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2); ctx.fill();
        } else if (effect.type === 'charm_beam') {
            ctx.strokeStyle = '#29b6f6'; ctx.lineWidth = 3; 
            ctx.beginPath(); ctx.moveTo(effect.x1, effect.y1); ctx.lineTo(effect.x2, effect.y2); ctx.stroke();
        }
    }

    enemies.forEach(e => {
        ctx.save(); ctx.translate(e.x, e.y); 
        const bW = e.isBoss ? 40 : 20, bO = e.isBoss ? -35 : -22;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; ctx.fillRect(-bW/2, bO, bW, 4); 
        ctx.fillStyle = '#76ff03'; ctx.fillRect(-bW/2, bO, bW * (e.hp / e.maxHp), 4); 
        
        if (e.charmed) {
            ctx.rotate(Math.atan2(e.y - player.y, e.x - player.x)); 
        } else {
            ctx.rotate(Math.atan2(player.y - e.y, player.x - e.x)); 
        }
        
        if (e.poisoned && !e.charmed) {
            ctx.fillStyle = 'rgba(27, 94, 32, 0.6)';
            ctx.beginPath(); ctx.arc(0, 0, e.radius + 6, 0, Math.PI * 2); ctx.fill();
        }

        const baseColor = e.charmed ? '#29b6f6' : (e.isBoss ? '#4a148c' : '#4caf50');
        const strokeColor = e.charmed ? '#0288d1' : (e.isBoss ? '#12005e' : '#1b5e20');
        
        ctx.fillStyle = (e.poisoned && !e.charmed) ? '#1b5e20' : baseColor; 
        ctx.strokeStyle = strokeColor; 
        ctx.lineWidth = 2;
        
        const aL = e.isBoss ? 25 : 15, aW = e.isBoss ? 10 : 6, aY = e.isBoss ? 18 : 12;
        ctx.fillRect(e.radius * 0.3, -aY, aL, aW); ctx.strokeRect(e.radius * 0.3, -aY, aL, aW);
        ctx.fillRect(e.radius * 0.3, aY - aW, aL, aW); ctx.strokeRect(e.radius * 0.3, aY - aW, aL, aW);
        ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2, false); ctx.fill(); ctx.stroke();
        if (e.isBoss) { ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(e.radius * 0.4, -8, 4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(e.radius * 0.4, 8, 4, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore(); 
    });

    crystals.forEach(c => {
        ctx.save(); 
        ctx.translate(c.x, c.y); 
        
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; ctx.fillRect(-25, -50, 50, 5); 
        ctx.fillStyle = '#ffd700'; ctx.fillRect(-25, -50, 50 * (c.hp / c.maxHp), 5); 
        
        ctx.fillStyle = 'rgba(170, 0, 255, 0.7)';
        ctx.strokeStyle = '#e040fb';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#aa00ff';
        
        ctx.beginPath();
        ctx.moveTo(0, -c.radius);
        ctx.lineTo(c.radius, 0);
        ctx.lineTo(0, c.radius);
        ctx.lineTo(-c.radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore(); 
    });

    if (currentBlueprint) {
        let w = 40, h = 40, radius = 0;
        if (currentBlueprint === 'barricade') { w = 80; h = 20; }
        else if (currentBlueprint === 'tar') { w = 120; h = 120; }
        else if (currentBlueprint === 'wire') { w = 150; h = 40; }
        else if (currentBlueprint === 'tesla') { radius = 150; }
        else if (currentBlueprint === 'plague') { radius = plagueRadius; } 
        else if (currentBlueprint === 'soul') { radius = 150; }
        else if (currentBlueprint === 'charm') { radius = 150; }

        ctx.save(); ctx.translate(mouseX, mouseY); ctx.rotate(blueprintAngle);
        if (Math.hypot(player.x - mouseX, player.y - mouseY) <= restrictedRadius) { 
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; ctx.strokeStyle = 'red'; 
            ctx.fillRect(-w/2, -h/2, w, h); ctx.lineWidth = 2; ctx.strokeRect(-w/2, -h/2, w, h);
        } else {
            if (currentBlueprint === 'barricade') { ctx.fillStyle = 'rgba(139, 69, 19, 0.5)'; ctx.strokeStyle = 'white'; ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h); } 
            else if (currentBlueprint === 'tar') { ctx.fillStyle = 'rgba(30, 30, 30, 0.5)'; ctx.strokeStyle = 'white'; ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h); } 
            else if (currentBlueprint === 'wire') { ctx.fillStyle = 'rgba(150, 150, 150, 0.3)'; ctx.strokeStyle = 'white'; ctx.setLineDash([5, 5]); ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h); }
            else if (currentBlueprint === 'tesla') { ctx.fillStyle = 'rgba(0, 229, 255, 0.5)'; ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(0, 229, 255, 0.1)'; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'plague') { ctx.fillStyle = 'rgba(27, 94, 32, 0.7)'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 15); ctx.lineTo(-15, 15); ctx.fill(); ctx.fillStyle='rgba(27, 94, 32, 0.2)'; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'soul') { ctx.fillStyle = 'rgba(170, 0, 255, 0.5)'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.fill(); ctx.fillStyle='rgba(170, 0, 255, 0.1)'; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'mending') { ctx.fillStyle = 'rgba(255, 215, 0, 0.5)'; ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'charm') { 
                ctx.fillStyle = 'rgba(41, 182, 246, 0.5)'; 
                ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 5); ctx.lineTo(-15, 5); ctx.fill(); 
                ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(15, -5); ctx.lineTo(-15, -5); ctx.fill(); 
                ctx.fillStyle = 'rgba(41, 182, 246, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill();
            }
        }
        ctx.restore();
    } else if (!isPaused && isGameStarted) {
        const cannotShoot = Math.hypot(player.x - mouseX, player.y - mouseY) <= restrictedRadius || currentAmmo <= 0; 
        ctx.beginPath(); ctx.arc(mouseX, mouseY, maxBlastRadius, 0, Math.PI * 2);
        ctx.fillStyle = cannotShoot ? 'rgba(100, 100, 100, 0.2)' : 'rgba(255, 0, 0, 0.1)'; ctx.fill(); ctx.strokeStyle = cannotShoot ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 0, 0, 0.7)'; ctx.lineWidth = 2; ctx.stroke();
        const xs = 10; ctx.beginPath(); ctx.moveTo(mouseX - xs, mouseY - xs); ctx.lineTo(mouseX + xs, mouseY + xs); ctx.moveTo(mouseX + xs, mouseY - xs); ctx.lineTo(mouseX - xs, mouseY + xs); ctx.stroke();
    }
}

showSaveSelect();
animate();