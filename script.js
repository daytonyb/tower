const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Keep pixel art crisp
ctx.imageSmoothingEnabled = false;

// Load the assets
const ASSETS = {
    playerTower: new Image(),
    zombie: new Image(),
    zombiePoisoned: new Image(),
    zombieCharmed: new Image(),
    poisonBubbles: new Image(),
    boss: new Image(),
    bossPoisoned: new Image()
};

// Make sure these match the filenames you saved them as!
ASSETS.playerTower.src = 'tower.png';
ASSETS.zombie.src = 'zombie.png';
ASSETS.zombiePoisoned.src = 'zombie_poisoned.png';
ASSETS.zombieCharmed.src = 'zombie_charmed.png';
ASSETS.poisonBubbles.src = 'bubbles.png'; 
ASSETS.boss.src = 'boss.png';
ASSETS.bossPoisoned.src = 'boss_poisoned.png';

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
const placementPhaseUI = document.getElementById('placementPhaseUI');
const placementPhaseText = document.getElementById('placementPhaseText');

let gameScale = 1;
let logicalWidth = window.innerWidth;
let logicalHeight = window.innerHeight;

function updateScaleAndDimensions() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // We use a baseline diagonal (1920x1080) to figure out how much to scale the game objects
    const currentDiagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    const baseDiagonal = Math.sqrt(1920 * 1920 + 1080 * 1080);
    
    gameScale = currentDiagonal / baseDiagonal;
    logicalWidth = canvas.width / gameScale;
    logicalHeight = canvas.height / gameScale;

    // Keep pixel art crisp even after resizing
    ctx.imageSmoothingEnabled = false;
}

// Call initially
updateScaleAndDimensions();

// --- MENU & SAVE SYSTEM ---
let currentSaveSlot = null;
let savedData = {};
let lastPlaytimeSave = 0; 

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
    document.getElementById('btnTabPrestige').style.display = 'none';
    
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
            masonry: 0, scholarsInsight: 0,
            evocationMastery: 0, alchemistsTouch: 0, potentToxins: 0, splinteringWards: 0, arcaneFortitude: 0, mesmerizingGaze: 0,
            cursedLure: 0, arcaneOverload: 0, brittlePitch: 0, voltaicChain: 0, kineticRepulsion: 0
        },
        prestigePoints: 0,
        unclaimedPlaytime: 0,
        unclaimedWins: 0,
        totalPlaytime: 0,
        totalDeaths: 0,
        prestigeUpgrades: { permBarricade: 0, permTar: 0, permWire: 0, permTesla: 0, permPlague: 0, permSoul: 0, permMending: 0, permCharm: 0, trueEnding: 0, goldenEpoch: 0, arcaneRicochet: 0, vampiricStrike: 0, soulBattery: 0, bountyHunter: 0, ironbark: 0, livingWood: 0, challengerBell: 0, temporalShift: 0, timeDilator: 0, chronoSurge: 0, bloodReckoning: 0, echoesOfPower: 0 }
    };
    
    // Backwards compatibility 
    if (savedData.upgrades.headStart !== undefined) delete savedData.upgrades.headStart; // Removed Head Start
    for (let key in UPGRADE_DATA) { if (savedData.upgrades[key] === undefined) savedData.upgrades[key] = 0; }
    if (savedData.prestigePoints === undefined) savedData.prestigePoints = 0;
    if (savedData.unclaimedPlaytime === undefined) savedData.unclaimedPlaytime = 0;
    if (savedData.unclaimedWins === undefined) savedData.unclaimedWins = 0;
    if (savedData.totalPlaytime === undefined) savedData.totalPlaytime = 0;
    if (savedData.totalDeaths === undefined) savedData.totalDeaths = 0;
    for (let key in PRESTIGE_UPGRADE_DATA) { if (savedData.prestigeUpgrades[key] === undefined) savedData.prestigeUpgrades[key] = 0; }
    
    saveGame();
    updateGoldUI();
    populateShop();
    updatePrestigeUI();

    document.getElementById('currentSaveDisplay').innerText = slotIndex;
    
    document.getElementById('saveSelectState').style.display = 'none';
    document.getElementById('runReadyState').style.display = 'block';
    
    document.getElementById('btnTabShop').style.display = 'block'; 
    document.getElementById('btnTabPrestige').style.display = 'block'; 
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
    arcaneHaste: { name: "Arcane Haste", desc: "Faster Shot Recharge.", baseCost: 2, maxLevel: 5 },
    volatileEmbers: { name: "Volatile Embers", desc: "+10% Shot Rad.", baseCost: 5, maxLevel: 5 },
    reinforcedWood: { name: "Reinforced Wood", desc: "+50 Wood HP.", baseCost: 2, maxLevel: 5 },
    viscousTar: { name: "Viscous Tar", desc: "Slower Tar.", baseCost: 3, maxLevel: 3 },
    serratedWire: { name: "Serrated Wire", desc: "+2 Wire Dmg.", baseCost: 1, maxLevel: 5 },
    highVoltage: { name: "High Voltage", desc: "+10 Tesla Dmg.", baseCost: 3, maxLevel: 5 },
    toxicSpores: { name: "Toxic Spores", desc: "+20 Plague Rad.", baseCost: 2, maxLevel: 5 },
    deepSiphon: { name: "Deep Siphon", desc: "+0.5x Siphon Boost.", baseCost: 4, maxLevel: 4 },
    blessedAura: { name: "Blessed Aura", desc: "Faster Healing.", baseCost: 3, maxLevel: 4 },
    masonry: { name: "Masonry", desc: "+10 Tower HP.", baseCost: 1, maxLevel: 10 },
    scholarsInsight: { name: "Scholar", desc: "+5% XP gain.", baseCost: 4, maxLevel: 5 },
    evocationMastery: { name: "Evocation", desc: "+2 Click Dmg.", baseCost: 3, maxLevel: 5 },
    alchemistsTouch: { name: "Alchemist", desc: "Better gold drops.", baseCost: 5, maxLevel: 3 },
    potentToxins: { name: "Potent Toxins", desc: "More Poison Dmg.", baseCost: 4, maxLevel: 5 },
    splinteringWards: { name: "Splinter Wards", desc: "Exploding walls.", baseCost: 5, maxLevel: 3 },
    arcaneFortitude: { name: "Arcane Fort", desc: "+25 Building HP.", baseCost: 2, maxLevel: 5 },
    mesmerizingGaze: { name: "Mesmerize", desc: "-1s Mind CD.", baseCost: 5, maxLevel: 5 },
    cursedLure: { name: "Cursed Lure", desc: "Faster enemy spawns.", baseCost: 3, maxLevel: 5 },
    arcaneOverload: { name: "Arcane Surge", desc: "5% Double XP chance.", baseCost: 5, maxLevel: 4 },
    brittlePitch: { name: "Brittle Pitch", desc: "Tar makes zombies weak.", baseCost: 4, maxLevel: 3 },
    voltaicChain: { name: "Voltaic Chain", desc: "Tesla zaps +1 target.", baseCost: 5, maxLevel: 3 },
    kineticRepulsion: { name: "Kinetic Repulse", desc: "Wall knockback.", baseCost: 3, maxLevel: 4 }
};

const PRESTIGE_UPGRADE_DATA = {
    permBarricade: { name: "Eternal Wall", desc: "Start with Wood Walls.", cost: 2, maxLevel: 4, type: 'barricade' },
    permTar: { name: "Eternal Tar", desc: "Start with Tar Pits.", cost: 3, maxLevel: 4, type: 'tar' },
    permWire: { name: "Eternal Wire", desc: "Start with Barbed Wire.", cost: 3, maxLevel: 4, type: 'wire' },
    permTesla: { name: "Genesis Spark", desc: "Start with Tesla Runes.", cost: 5, maxLevel: 4, type: 'tesla' },
    permPlague: { name: "Eternal Plague", desc: "Start with Plague Totems.", cost: 5, maxLevel: 4, type: 'plague' },
    permSoul: { name: "Eternal Soul", desc: "Start with Soul Siphons.", cost: 5, maxLevel: 4, type: 'soul' },
    permMending: { name: "Aura of Life", desc: "Start with Mending Wards.", cost: 5, maxLevel: 4, type: 'mending' },
    permCharm: { name: "Eternal Mind", desc: "Start with Mind Wards.", cost: 5, maxLevel: 4, type: 'charm' },
    goldenEpoch: { name: "Golden Epoch", desc: "Start runs with +2 Gold per level.", cost: 5, maxLevel: 5 },
    arcaneRicochet: { name: "Arcane Ricochet", desc: "Spells bounce to +1 enemy per level.", cost: 8, maxLevel: 3 },
    vampiricStrike: { name: "Vampiric Strike", desc: "Spell kills have +2% chance to heal 1 HP.", cost: 6, maxLevel: 5 },
    soulBattery: { name: "Soul Battery", desc: "Soul Siphons reduce Ward CD by 5% per level.", cost: 7, maxLevel: 4 },
    bountyHunter: { name: "Bounty Hunter", desc: "Boss kills yield +1 extra Gold per level.", cost: 5, maxLevel: 5 },
    ironbark: { name: "Ironbark", desc: "Barricades reflect 1 dmg per level.", cost: 5, maxLevel: 5 },
    livingWood: { name: "Living Wood", desc: "Barricades regen 5 HP/sec per level.", cost: 6, maxLevel: 5 },
    challengerBell: { name: "Challenger's Bell", desc: "-1 Level req for Bosses.", cost: 10, maxLevel: 2 },
    temporalShift: { name: "Temporal Shift", desc: "-30s boss backup timer.", cost: 8, maxLevel: 5 },
    timeDilator: { name: "Time Dilator", desc: "+10% Game Speed per level.", cost: 15, maxLevel: 5 },
    chronoSurge: { name: "Chrono-Surge", desc: "+50% Game speed until hit.", cost: 8, maxLevel: 3 },
    bloodReckoning: { name: "Blood Reckoning", desc: "-10% Spawn delay, +15% XP.", cost: 6, maxLevel: 5 },
    echoesOfPower: { name: "Echoes of Power", desc: "Start with +250 XP.", cost: 7, maxLevel: 5 },
    trueEnding: { name: "The Truth", desc: "Unlock the final mystery...", cost: 100, maxLevel: 1 }
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
let brittlePitchLevel = 0, voltaicChainLevel = 0, kineticRepulsionLevel = 0;

// Prestige Scaling Variables
let goldenEpochBonus, ricochetBounces, vampiricChance, soulBatteryReduction, bountyHunterBonus, ironbarkDamage, livingWoodRegen;
let chronoSurgeActive = false, chronoSurgeMult = 1, bloodReckoningReduction = 0, echoesOfPowerXP = 0;

// Pacing Variables
let lureSpawnReduction = 0, overloadChance = 0, bossLevelThreshold = 5, bossTimerReduction = 0, baseTimeDilation = 1;

let animationId, isPaused = false, isGameStarted = false, isPlacingPerms = false; 
let survivalTimeMs = 0, lastFrameTime = Date.now(), formattedTime = "00:00";
let level = 1, xp = 0, xpToNextLevel = 100, lastBossLevel = 0; 
let killCount = 0, runGold = 0, levelUpsQueued = 0;
let nextBossTime = 300000; 

let bossesKilled = 0;
let crystalsSpawned = false;
let victoryAchieved = false;
const crystals = [];

let currentBlueprint = null, blueprintAngle = 0; 
let pendingPerms = [];
const structures = [], spells = [], enemies = [], visualEffects = []; 
let lastRechargeTime = 0;
const restrictedRadius = 120; 

let spawnTimer, mouseX = logicalWidth / 2, mouseY = logicalHeight / 2;
const player = { x: logicalWidth / 2, y: logicalHeight / 2 };

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
    xpMultiplier = (1 + (savedData.upgrades.scholarsInsight * 0.05));
    level = 1;
    
    spellDamageBonus = savedData.upgrades.evocationMastery * 2;
    goldDropThreshold = 50 - (savedData.upgrades.alchemistsTouch * 5); 
    bossGoldBonus = savedData.upgrades.alchemistsTouch;
    poisonTickDamage = 0.05 + (savedData.upgrades.potentToxins * 0.02);
    barricadeExplosionDamage = savedData.upgrades.splinteringWards * 15;
    wardHPBonus = savedData.upgrades.arcaneFortitude * 25;
    charmCooldown = 10000 - (savedData.upgrades.mesmerizingGaze * 1000);
    brittlePitchLevel = savedData.upgrades.brittlePitch || 0;
    voltaicChainLevel = savedData.upgrades.voltaicChain || 0;
    kineticRepulsionLevel = savedData.upgrades.kineticRepulsion || 0;

    goldenEpochBonus = (savedData.prestigeUpgrades.goldenEpoch || 0) * 2;
    ricochetBounces = (savedData.prestigeUpgrades.arcaneRicochet || 0);
    vampiricChance = (savedData.prestigeUpgrades.vampiricStrike || 0) * 0.02;
    soulBatteryReduction = (savedData.prestigeUpgrades.soulBattery || 0) * 0.05;
    bountyHunterBonus = (savedData.prestigeUpgrades.bountyHunter || 0);
    ironbarkDamage = (savedData.prestigeUpgrades.ironbark || 0);
    livingWoodRegen = (savedData.prestigeUpgrades.livingWood || 0) * 5;

    chronoSurgeMult = 1 + ((savedData.prestigeUpgrades.chronoSurge || 0) * 0.5);
    bloodReckoningReduction = (savedData.prestigeUpgrades.bloodReckoning || 0) * 0.10;
    echoesOfPowerXP = (savedData.prestigeUpgrades.echoesOfPower || 0) * 250;
    chronoSurgeActive = (savedData.prestigeUpgrades.chronoSurge || 0) > 0;

    lureSpawnReduction = savedData.upgrades.cursedLure * 400; 
    overloadChance = savedData.upgrades.arcaneOverload * 0.05; 

    bossLevelThreshold = 5 - (savedData.prestigeUpgrades.challengerBell || 0); 
    bossTimerReduction = (savedData.prestigeUpgrades.temporalShift || 0) * 30000; 
    baseTimeDilation = 1 + ((savedData.prestigeUpgrades.timeDilator || 0) * 0.1); 
    
    xpToNextLevel = 100;
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

// --- PRESTIGE SYSTEM LOGIC ---
function updatePrestigeUI() {
    if (!savedData) return;
    document.getElementById('currentPPEl').innerText = savedData.prestigePoints;
    
    const totalMs = savedData.unclaimedPlaytime;
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    
    document.getElementById('unclaimedTimeEl').innerText = `${hours}h ${minutes}m`;
    document.getElementById('unclaimedWinsEl').innerText = savedData.unclaimedWins;
    
    const extraFromGold = Math.floor(savedData.gold / 100);
    document.getElementById('goldConversionEl').innerText = extraFromGold;

    const pending = (hours * 1) + (savedData.unclaimedWins * 2) + extraFromGold;
    document.getElementById('pendingPPEl').innerText = pending;
    
    populatePrestigeShop();
}

function doPrestige() {
    const hours = Math.floor(savedData.unclaimedPlaytime / 3600000);
    const extraFromGold = Math.floor(savedData.gold / 100);
    const pending = (hours * 1) + (savedData.unclaimedWins * 2) + extraFromGold;
    
    if (pending <= 0) {
        alert("You don't have any pending Prestige Points to claim! Play more or beat the game to earn points.");
        return;
    }

    if (confirm(`Are you sure you want to Prestige?\n\nYou will gain ${pending} Prestige Points (including +${extraFromGold} from Gold conversion).\nYou will LOSE ALL your Gold and Standard Upgrades. Your save slot progress will reset.`)) {
        savedData.prestigePoints += pending;
        savedData.unclaimedPlaytime %= 3600000; 
        savedData.unclaimedWins = 0;
        
        savedData.gold = 0; 
        for (let key in UPGRADE_DATA) {
            savedData.upgrades[key] = 0;
        }
        
        saveGame();
        updateGoldUI();
        updatePrestigeUI();
        populateShop();
        alert("You have Prestiged! The Cosmic Altar smiles upon you.");
    }
}

function populatePrestigeShop() {
    const container = document.getElementById('prestigeContainer');
    if (!container) return;
    container.innerHTML = '';
    
    let availableKeys = Object.keys(PRESTIGE_UPGRADE_DATA).filter(k => k !== 'trueEnding');
    
    shuffleArray(availableKeys);
    let selectedKeys = availableKeys.slice(0, 3);
    selectedKeys.push('trueEnding');
    
    selectedKeys.forEach(key => {
        const data = PRESTIGE_UPGRADE_DATA[key];
        const currentLvl = savedData.prestigeUpgrades[key] || 0;
        const canAfford = savedData.prestigePoints >= data.cost;
        const isMaxed = currentLvl >= data.maxLevel;

        const isTrueEnding = (key === 'trueEnding');

        const card = document.createElement('div');
        card.className = 'upgrade-card prestige-card';
        if (isTrueEnding) card.classList.add('true-ending-card');

        card.innerHTML = `
            <div>
                <h3>${data.name}</h3>
                <p>${data.desc}</p>
                <p style="color: #ccc; font-size: 8px;">Level ${currentLvl} / ${data.maxLevel}</p>
            </div>
            <button class="buy-btn prestige-btn" ${canAfford && !isMaxed ? '' : 'disabled'} onclick="buyPrestigeUpgrade('${key}')">
                ${isMaxed ? 'MAX' : data.cost + ' PP'}
            </button>
        `;
        container.appendChild(card);
    });
}

function buyPrestigeUpgrade(key) {
    const data = PRESTIGE_UPGRADE_DATA[key];
    if (savedData.prestigePoints >= data.cost && (savedData.prestigeUpgrades[key] || 0) < data.maxLevel) {
        savedData.prestigePoints -= data.cost;
        savedData.prestigeUpgrades[key] = (savedData.prestigeUpgrades[key] || 0) + 1;
        saveGame();
        updatePrestigeUI();
    }
}

// --- GAME STATE FLOW ---
function startGame() {
    applyUpgrades();
    updateAmmoUI();
    updateGoldUI();
    mainMenu.style.display = 'none'; 
    isGameStarted = true;
    isPlacingPerms = false;
    
    structures.length = 0; 
    pendingPerms = [];
    levelUpsQueued = 0;

    for (let key in PRESTIGE_UPGRADE_DATA) {
        if (PRESTIGE_UPGRADE_DATA[key].type) {
            let amount = savedData.prestigeUpgrades[key] || 0;
            for (let i = 0; i < amount; i++) {
                pendingPerms.push(PRESTIGE_UPGRADE_DATA[key].type);
            }
        }
    }

    if (pendingPerms.length > 0) {
        isPlacingPerms = true;
        currentBlueprint = pendingPerms.shift();
        
        placementPhaseUI.style.display = 'block';
        controlsTip.style.display = 'block';
        updatePlacementText();
    } else {
        startActualRun();
    }
}

function updatePlacementText() {
    const typeName = BLUEPRINT_DB[currentBlueprint].name;
    placementPhaseText.innerText = `Click to place your permanent ${typeName}.\n(${pendingPerms.length + 1} remaining)`;
}

function startActualRun() {
    isPlacingPerms = false;
    placementPhaseUI.style.display = 'none';
    controlsTip.style.display = 'none';
    
    lastRechargeTime = Date.now(); 
    lastFrameTime = Date.now(); 
    lastPlaytimeSave = Date.now(); 
    
    if (goldenEpochBonus > 0) {
        savedData.gold += goldenEpochBonus;
        runGold += goldenEpochBonus;
        saveGame();
        updateGoldUI();
    }

    if (echoesOfPowerXP > 0) {
        addXp(echoesOfPowerXP); 
    }

    if (levelUpsQueued === 0 && !isPaused) {
        spawnWave();
    }
}

function resetGame() {
    if (isGameStarted && !isPlacingPerms) {
        let diff = Date.now() - lastPlaytimeSave;
        savedData.unclaimedPlaytime += diff;
        savedData.totalPlaytime += diff;
        saveGame();
        updatePrestigeUI();
    }

    gameOverModal.style.display = 'none';
    pauseMenu.style.display = 'none';
    document.getElementById('victoryModal').style.display = 'none';
    document.getElementById('trueVictoryModal').style.display = 'none';
    placementPhaseUI.style.display = 'none';
    
    switchMenuTab('tab-start', document.getElementById('btnTabStart'));
    mainMenu.style.display = 'flex'; 
    
    isGameStarted = false;
    isPlacingPerms = false;
    isPaused = false;
    currentBlueprint = null;
    controlsTip.style.display = 'none';
    
    bossesKilled = 0;
    crystalsSpawned = false;
    victoryAchieved = false;
    crystals.length = 0;
    pendingPerms = [];
    levelUpsQueued = 0;
    
    survivalTimeMs = 0;
    formattedTime = "00:00";
    timerDisplay.innerText = formattedTime;
    xp = 0; lastBossLevel = 0; killCount = 0; runGold = 0;
    enemies.length = 0; spells.length = 0; structures.length = 0; visualEffects.length = 0;
    
    applyUpgrades(); 
    nextBossTime = 300000 - bossTimerReduction;
    
    xpBarFill.style.width = '0%';
    xpText.innerHTML = `${xp} / ${xpToNextLevel}`;
    updateAmmoUI();
    updateGoldUI();
    populateShop();
}

function togglePauseMenu() {
    if (!isGameStarted || isPlacingPerms || gameOverModal.style.display === 'flex' || levelUpModal.style.display === 'flex' || document.getElementById('victoryModal').style.display === 'flex' || document.getElementById('trueVictoryModal').style.display === 'flex') return;

    if (pauseMenu.style.display === 'flex') {
        pauseMenu.style.display = 'none';
        isPaused = false;
        canvas.style.cursor = 'none';
        lastFrameTime = Date.now(); 
        lastPlaytimeSave = Date.now(); 
        spawnWave();
    } else {
        isPaused = true;
        clearTimeout(spawnTimer);
        pauseMenu.style.display = 'flex';
        canvas.style.cursor = 'default';
        
        let diff = Date.now() - lastPlaytimeSave;
        savedData.unclaimedPlaytime += diff;
        savedData.totalPlaytime += diff;
        saveGame();
        updatePrestigeUI();
    }
}

function triggerGameOver() {
    isGameStarted = false; 
    clearTimeout(spawnTimer);
    
    let diff = Date.now() - lastPlaytimeSave;
    savedData.unclaimedPlaytime += diff;
    savedData.totalPlaytime += diff;
    savedData.totalDeaths += 1;
    
    if (savedData.gold > 0) {
        savedData.gold = Math.max(0, savedData.gold - 1);
    }
    saveGame();
    updateGoldUI();
    updatePrestigeUI();

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

function spawnCrystals(phase = 1) {
    let crystalHp = (80 + (level * 10)) * 3; 
    if (phase === 2) crystalHp *= 1.5;

    const positions = [
        { x: 100, y: 100 }, { x: logicalWidth - 100, y: 100 },
        { x: 100, y: logicalHeight - 100 }, { x: logicalWidth - 100, y: logicalHeight - 100 }
    ];

    if (phase === 2) {
        positions.push({ x: logicalWidth / 2, y: 100 }); 
        positions.push({ x: logicalWidth / 2, y: logicalHeight - 100 });
    }

    positions.forEach(pos => { crystals.push({ x: pos.x, y: pos.y, radius: 35, hp: crystalHp, maxHp: crystalHp }); });
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

function refreshShop() {
    if (savedData.gold >= 1) {
        savedData.gold -= 1;
        saveGame();
        updateGoldUI();
        populateShop();
    }
}

// --- INPUT LISTENERS ---
window.addEventListener('mousemove', (event) => { 
    mouseX = event.clientX / gameScale; 
    mouseY = event.clientY / gameScale; 
});

window.addEventListener('wheel', (event) => { if (currentBlueprint) blueprintAngle += event.deltaY > 0 ? 0.2 : -0.2; });

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') togglePauseMenu();
    if (currentBlueprint) {
        if (event.key.toLowerCase() === 'r') blueprintAngle += 0.2;
        if (event.key.toLowerCase() === 'e') blueprintAngle -= 0.2;
    }
});

// --- AUTO-RESIZE & SHIFT SCREEN ---
window.addEventListener('resize', () => {
    const oldWidth = logicalWidth; 
    const oldHeight = logicalHeight;
    
    updateScaleAndDimensions();
    
    const diffX = (logicalWidth - oldWidth) / 2; 
    const diffY = (logicalHeight - oldHeight) / 2;
    
    player.x = logicalWidth / 2; 
    player.y = logicalHeight / 2;
    
    structures.forEach(s => { s.x += diffX; s.y += diffY; });
    enemies.forEach(e => { e.x += diffX; e.y += diffY; });
    crystals.forEach(c => { c.x += diffX; c.y += diffY; });
    spells.forEach(s => { s.startX += diffX; s.startY += diffY; s.targetX += diffX; s.targetY += diffY; });
    visualEffects.forEach(v => {
        if (v.x !== undefined) v.x += diffX;
        if (v.y !== undefined) v.y += diffY;
        if (v.x1 !== undefined) { v.x1 += diffX; v.x2 += diffX; v.y1 += diffY; v.y2 += diffY; }
    });
});

window.addEventListener('click', (event) => {
    if (!isGameStarted || (isPaused && !currentBlueprint)) return; 

    // Convert raw click coordinates to scaled game coordinates
    const clickX = event.clientX / gameScale;
    const clickY = event.clientY / gameScale;

    const distFromTower = Math.hypot(player.x - clickX, player.y - clickY);

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

        let isPerm = isPlacingPerms;
        if (isPerm) {
            hp = 99999;
            w = w * 0.75;
            h = h * 0.75;
            radius = Math.max(radius * 0.75, 50); 
        }

        structures.push({ type: currentBlueprint, x: clickX, y: clickY, w: w, h: h, angle: blueprintAngle, hp: hp, radius: radius, hitZombies: new Map(), lastTick: Date.now(), isPermanent: isPerm });

        if (isPlacingPerms) {
            if (pendingPerms.length > 0) {
                currentBlueprint = pendingPerms.shift();
                updatePlacementText();
            } else {
                currentBlueprint = null;
                startActualRun();
            }
        } else {
            currentBlueprint = null; 
            controlsTip.style.display = 'none';
            if (levelUpsQueued > 0) {
                processLevelUpQueue();
            } else {
                isPaused = false; 
                lastFrameTime = Date.now();
                lastPlaytimeSave = Date.now();
                spawnWave(); 
            }
        }
        return; 
    }

    if (currentAmmo <= 0 || distFromTower <= restrictedRadius || isPlacingPerms) return; 

    if (currentAmmo === maxAmmo) lastRechargeTime = Date.now();
    currentAmmo--;
    updateAmmoUI();

    const distToTarget = Math.hypot(clickX - player.x, clickY - player.y);
    spells.push({
        startX: player.x, startY: player.y, targetX: clickX, targetY: clickY, distance: distToTarget,
        progress: 0, arcHeight: Math.min(distToTarget * 0.4, 200), radius: 0, maxRadius: maxBlastRadius, state: 'flying', 
        hitEnemies: new Set(), bounces: ricochetBounces, bounceHistory: new Set()
    });
});

// --- LEVEL UP LOGIC ---
function selectBlueprint(type, event) {
    event.stopPropagation(); 
    currentBlueprint = type; blueprintAngle = 0; 
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

function processLevelUpQueue() {
    if (levelUpsQueued > 0) {
        levelUpsQueued--;
        showLevelUpMenu();
    }
}

function addXp(amount) {
    xp += Math.floor(amount * xpMultiplier); 
    while (xp >= xpToNextLevel) {
        xp -= xpToNextLevel; 
        level++;
        xpToNextLevel = Math.floor(xpToNextLevel * 1.4); 
        levelUpsQueued++;
    }
    const xpPercent = Math.min(100, (xp / xpToNextLevel) * 100);
    xpBarFill.style.width = `${xpPercent}%`;
    xpText.innerHTML = `${xp} / ${xpToNextLevel}`;

    if (levelUpsQueued > 0 && !isPaused && !currentBlueprint && !isPlacingPerms) {
        processLevelUpQueue();
    }
}

// --- ENEMY SPAWNING ---
function spawnBossEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const x = player.x + Math.cos(angle) * (logicalWidth / 2 + 100);
    const y = player.y + Math.sin(angle) * (logicalHeight / 2 + 100);
    const bossHp = 80 + (level * 15); 
    const baseBossXp = 200 + (level * 50);
    const brMultiplier = 1 + (savedData.prestigeUpgrades.bloodReckoning || 0) * 0.15;
    enemies.push({ x, y, radius: 35, baseSpeed: 0.08, hp: bossHp, maxHp: bossHp, xpDrop: Math.floor(baseBossXp * brMultiplier), dead: false, isBoss: true, poisoned: false, charmed: false, inTar: false });
}

function spawnWave() {
    if (isPaused || !isGameStarted || isPlacingPerms) return;
    
    const minSpawn = Math.max(1000, 3000 - lureSpawnReduction);
    const maxSpawn = Math.max(2000, 7000 - lureSpawnReduction);
    const delayMult = Math.max(0.2, 1 - bloodReckoningReduction);
    const nextSpawnDelay = (Math.random() * (maxSpawn - minSpawn) + minSpawn) * delayMult;
    
    if (level % bossLevelThreshold === 0 && lastBossLevel !== level) {
        lastBossLevel = level;
        spawnBossEnemy();
    } else {
        const groupSize = Math.floor(Math.random() * (5 + Math.floor(level / 2))) + 3; 
        const hpMultiplier = 1 + (level * 0.20);
        const speedMultiplier = 1 + (level * 0.08);

        let groupX, groupY;
        if (Math.random() < 0.5) {
            groupX = Math.random() < 0.5 ? -65 : logicalWidth + 65;
            groupY = Math.random() * logicalHeight;
        } else {
            groupX = Math.random() * logicalWidth;
            groupY = Math.random() < 0.5 ? -65 : logicalHeight + 65;
        }

        const brMultiplier = 1 + (savedData.prestigeUpgrades.bloodReckoning || 0) * 0.15;

        for (let i = 0; i < groupSize; i++) {
            const x = groupX + (Math.random() - 0.5) * 80;
            const y = groupY + (Math.random() - 0.5) * 80;
            const speed = (0.4 + Math.random() * 0.3) * speedMultiplier; 
            const hp = Math.floor((Math.random() * 11 + 5) * hpMultiplier);
            const baseExp = Math.floor(hp + (speed * 10));
            enemies.push({ x, y, radius: 15, baseSpeed: speed, hp: hp, maxHp: hp, xpDrop: Math.floor(baseExp * brMultiplier), dead: false, isBoss: false, poisoned: false, charmed: false, inTar: false });
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
        return { collided: true, overlap: circle.radius - distance, localX,
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
    const activeTimeDilation = baseTimeDilation * (chronoSurgeActive ? chronoSurgeMult : 1);
    const deltaTime = (currentFrameTime - lastFrameTime) * activeTimeDilation;
    lastFrameTime = currentFrameTime;

    if (!isPaused && isGameStarted && !isPlacingPerms) {
        survivalTimeMs += deltaTime;
        const totalSeconds = Math.floor(survivalTimeMs / 1000);
        formattedTime = `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
        timerDisplay.innerText = formattedTime;
        
        if (currentFrameTime - lastPlaytimeSave >= 5000) {
            let diff = currentFrameTime - lastPlaytimeSave;
            savedData.unclaimedPlaytime += diff;
            savedData.totalPlaytime += diff;
            lastPlaytimeSave = currentFrameTime;
        }

        const currentBossInterval = 300000 - bossTimerReduction;
        if (survivalTimeMs >= nextBossTime) { 
            nextBossTime += currentBossInterval; 
            spawnBossEnemy(); 
        }

        if (currentAmmo < maxAmmo && currentFrameTime - lastRechargeTime >= rechargeRate) {
            currentAmmo++; lastRechargeTime += rechargeRate; updateAmmoUI();
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Start scaled rendering
    ctx.save();
    ctx.scale(gameScale, gameScale);

    ctx.beginPath(); ctx.arc(player.x, player.y, restrictedRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.05)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]); 

    for (let i = structures.length - 1; i >= 0; i--) {
        const struct = structures[i];
        
        if (!isPaused && isGameStarted && !isPlacingPerms) {
            if (struct.type === 'barricade' && livingWoodRegen > 0) {
                if (!struct.lastRegenTick) struct.lastRegenTick = currentFrameTime;
                if (currentFrameTime - struct.lastRegenTick >= 1000) {
                    struct.hp = Math.min(struct.isPermanent ? 99999 : barricadeHP, struct.hp + livingWoodRegen);
                    struct.lastRegenTick = currentFrameTime;
                }
            } else if (struct.type === 'tesla') {
                if (currentFrameTime - struct.lastTick > 2000) {
                    let inRange = enemies.filter(e => !e.charmed && Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.radius);
                    if (inRange.length > 0) {
                        inRange.sort(() => Math.random() - 0.5);
                        const zapCount = Math.min(1 + voltaicChainLevel, inRange.length);
                        for (let z = 0; z < zapCount; z++) {
                            const target = inRange[z];
                            target.hp -= (teslaDamage + (target.inTar ? brittlePitchLevel : 0)); 
                            if (target.hp <= 0) target.dead = true;
                            visualEffects.push({ type: 'lightning', x1: struct.x, y1: struct.y, x2: target.x, y2: target.y, expires: currentFrameTime + 150 });
                        }
                        struct.lastTick = currentFrameTime;
                    }
                }
            } else if (struct.type === 'plague') {
                enemies.forEach(e => { if (!e.charmed && Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.radius) e.poisoned = true; });
            } else if (struct.type === 'mending' || struct.type === 'charm') {
                let localCdMult = 1;
                if (soulBatteryReduction > 0) {
                    structures.forEach(s => {
                        if (s.type === 'soul' && Math.hypot(struct.x - s.x, struct.y - s.y) <= s.radius) {
                            localCdMult -= soulBatteryReduction;
                        }
                    });
                    localCdMult = Math.max(0.1, localCdMult); 
                }

                if (struct.type === 'mending') {
                    if (currentFrameTime - struct.lastTick > (mendingCooldown * localCdMult)) { 
                        if (health < maxHealth) { health++; updateHealthUI(); }
                        struct.lastTick = currentFrameTime;
                    }
                } else if (struct.type === 'charm') {
                    if (currentFrameTime - struct.lastTick > (charmCooldown * localCdMult)) {
                        const inRange = enemies.filter(e => !e.charmed && !e.isBoss && Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.radius);
                        if (inRange.length > 0) {
                            const target = inRange[Math.floor(Math.random() * inRange.length)];
                            target.charmed = true; struct.lastTick = currentFrameTime;
                            visualEffects.push({ type: 'charm_beam', x1: struct.x, y1: struct.y, x2: target.x, y2: target.y, expires: currentFrameTime + 200 });
                        }
                    }
                }
            }
        }

        ctx.save(); ctx.translate(struct.x, struct.y); ctx.rotate(struct.angle);

        if (struct.type === 'barricade') {
            ctx.fillStyle = struct.isPermanent ? '#5C3317' : '#8B4513'; ctx.fillRect(-struct.w/2, -struct.h/2, struct.w, struct.h);
            ctx.strokeStyle = struct.isPermanent ? '#e040fb' : '#5C3317'; ctx.lineWidth = 3; ctx.strokeRect(-struct.w/2, -struct.h/2, struct.w, struct.h);
            if (!struct.isPermanent && struct.hp < barricadeHP * 0.5) { ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(10, 5); ctx.stroke(); }
        } else if (struct.type === 'tar') {
            ctx.fillStyle = 'rgba(30, 30, 30, 0.7)'; ctx.fillRect(-struct.w/2, -struct.h/2, struct.w, struct.h);
            ctx.strokeStyle = struct.isPermanent ? '#e040fb' : '#000000'; ctx.lineWidth = 2; ctx.strokeRect(-struct.w/2, -struct.h/2, struct.w, struct.h);
        } else if (struct.type === 'wire') {
            ctx.fillStyle = 'rgba(150, 150, 150, 0.3)'; ctx.fillRect(-struct.w/2, -struct.h/2, struct.w, struct.h);
            ctx.strokeStyle = struct.isPermanent ? '#e040fb' : '#777777'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.strokeRect(-struct.w/2, -struct.h/2, struct.w, struct.h); ctx.setLineDash([]);
        } else if (struct.type === 'tesla') {
            ctx.fillStyle = '#00e5ff'; ctx.beginPath(); ctx.arc(0, 0, struct.w/2, 0, Math.PI*2); ctx.fill();
            if (struct.isPermanent) { ctx.strokeStyle = '#e040fb'; ctx.lineWidth = 2; ctx.stroke(); }
            ctx.fillStyle = 'rgba(0, 229, 255, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill();
        } else if (struct.type === 'plague') {
            ctx.fillStyle = '#1b5e20'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 15); ctx.lineTo(-15, 15); ctx.fill();
            if (struct.isPermanent) { ctx.strokeStyle = '#e040fb'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 15); ctx.lineTo(-15, 15); ctx.closePath(); ctx.stroke(); }
            ctx.fillStyle = 'rgba(27, 94, 32, 0.2)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill();
        } else if (struct.type === 'soul') {
            ctx.fillStyle = '#aa00ff'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.fill();
            if (struct.isPermanent) { ctx.strokeStyle = '#e040fb'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.closePath(); ctx.stroke(); }
            ctx.fillStyle = 'rgba(170, 0, 255, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill();
        } else if (struct.type === 'mending') {
            ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(0, 0, struct.w/2, 0, Math.PI*2); ctx.fill();
            if (struct.isPermanent) { ctx.strokeStyle = '#e040fb'; ctx.lineWidth = 2; ctx.stroke(); }
            ctx.fillStyle = 'white'; ctx.fillRect(-2, -10, 4, 20); ctx.fillRect(-10, -2, 20, 4);
        } else if (struct.type === 'charm') {
            ctx.fillStyle = '#29b6f6'; 
            ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 5); ctx.lineTo(-15, 5); ctx.fill(); 
            ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(15, -5); ctx.lineTo(-15, -5); ctx.fill(); 
            if (struct.isPermanent) { 
                ctx.strokeStyle = '#e040fb'; ctx.lineWidth = 2; 
                ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 5); ctx.lineTo(-15, 5); ctx.closePath(); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(15, -5); ctx.lineTo(-15, -5); ctx.closePath(); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(41, 182, 246, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
        
        if (struct.hp <= 0 && !struct.isPermanent) {
            if (struct.type === 'barricade' && barricadeExplosionDamage > 0) {
                enemies.forEach(e => {
                    if (!e.charmed && Math.hypot(e.x - struct.x, e.y - struct.y) <= 80) {
                        e.hp -= (barricadeExplosionDamage + (e.inTar ? brittlePitchLevel : 0));
                        if (e.hp <= 0) e.dead = true;
                    }
                });
                visualEffects.push({ type: 'explosion', x: struct.x, y: struct.y, radius: 80, expires: currentFrameTime + 200 });
            }
            structures.splice(i, 1); 
        }
    }

    if (!isPaused && isGameStarted && !isPlacingPerms) {
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
                        e.hp -= (Math.floor(Math.random() * 4) + 3 + spellDamageBonus + (e.inTar ? brittlePitchLevel : 0));
                        if (e.hp <= 0) {
                            e.dead = true;
                            if (Math.random() < vampiricChance && health < maxHealth) {
                                health++; updateHealthUI();
                            }
                        }
                    }
                });

                for (let c = crystals.length - 1; c >= 0; c--) {
                    const crystal = crystals[c];
                    if (Math.hypot(spell.targetX - crystal.x, spell.targetY - crystal.y) < spell.radius + crystal.radius && !spell.hitEnemies.has(crystal)) {
                        spell.hitEnemies.add(crystal);
                        crystal.hp -= (Math.floor(Math.random() * 4) + 3 + spellDamageBonus);
                        
                        if (crystal.hp <= 0) {
                            crystals.splice(c, 1);
                            
                            if (crystalsSpawned && crystals.length === 0 && !victoryAchieved) {
                                if (savedData.prestigeUpgrades.trueEnding > 0 && bossesKilled < 15) {
                                    crystalsSpawned = false; 
                                } else {
                                    victoryAchieved = true;
                                    isPaused = true;
                                    clearTimeout(spawnTimer);
                                    
                                    let diff = Date.now() - lastPlaytimeSave;
                                    savedData.unclaimedWins += 1;
                                    savedData.unclaimedPlaytime += diff; 
                                    savedData.totalPlaytime += diff;
                                    saveGame();
                                    updatePrestigeUI();

                                    canvas.style.cursor = 'default';
                                    
                                    if (savedData.prestigeUpgrades.trueEnding > 0 && bossesKilled >= 15) {
                                        let totalSecs = Math.floor(savedData.totalPlaytime / 1000);
                                        let hours = Math.floor(totalSecs / 3600);
                                        let minutes = Math.floor((totalSecs % 3600) / 60);
                                        
                                        let runPP = Math.floor(survivalTimeMs / 3600000) + 2; 

                                        document.getElementById('tvTotalTimeEl').innerText = `${hours}h ${minutes}m`;
                                        document.getElementById('tvDeathsEl').innerText = savedData.totalDeaths;
                                        document.getElementById('tvRunGoldEl').innerText = runGold;
                                        document.getElementById('tvRunPPEl').innerText = runPP;

                                        document.getElementById('trueVictoryModal').style.display = 'flex';
                                    } else {
                                        document.getElementById('victoryModal').style.display = 'flex';
                                    }
                                }
                            }
                        }
                    }
                }
                if (spell.radius >= spell.maxRadius) {
                    if (spell.bounces > 0) {
                        let validTargets = enemies.filter(e => !e.dead && !e.charmed && !spell.bounceHistory.has(e));
                        if (validTargets.length > 0) {
                            validTargets.sort((a,b) => Math.hypot(spell.targetX - a.x, spell.targetY - a.y) - Math.hypot(spell.targetX - b.x, spell.targetY - b.y));
                            let newTarget = validTargets[0];
                            spell.bounceHistory.add(newTarget);
                            let dist = Math.hypot(newTarget.x - spell.targetX, newTarget.y - spell.targetY);
                            spells.push({
                                startX: spell.targetX, startY: spell.targetY, targetX: newTarget.x, targetY: newTarget.y, distance: dist,
                                progress: 0, arcHeight: Math.min(dist * 0.4, 150), radius: 0, maxRadius: spell.maxRadius * 0.8, state: 'flying', 
                                hitEnemies: new Set(), bounces: spell.bounces - 1, bounceHistory: new Set(spell.bounceHistory) 
                            });
                        }
                    }
                    setTimeout(() => spells.splice(index, 1), 0);
                }
            }
        });

        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];

            if (e.poisoned && !e.charmed) { e.hp -= poisonTickDamage; if (e.hp <= 0) e.dead = true; }

            if (e.dead) {
                killCount++;
                if (e.isBoss) { 
                    savedData.gold += 2 + bossGoldBonus + bountyHunterBonus; 
                    runGold += 2 + bossGoldBonus + bountyHunterBonus; 
                    saveGame(); updateGoldUI(); 
                    bossesKilled++; 
                
                    if (bossesKilled === 10 && !crystalsSpawned) { 
                        crystalsSpawned = true; 
                        spawnCrystals(1); 
                    } else if (bossesKilled === 15 && !crystalsSpawned && savedData.prestigeUpgrades.trueEnding > 0) {
                        crystalsSpawned = true;
                        spawnCrystals(2);
                    }
                } 
                else if (killCount % goldDropThreshold === 0) { savedData.gold += 1; runGold += 1; saveGame(); updateGoldUI(); }

                let finalXp = e.xpDrop;
                structures.forEach(s => { if (s.type === 'soul' && Math.hypot(e.x - s.x, e.y - s.y) <= s.radius) finalXp *= soulMultiplier; });

                if (Math.random() < overloadChance) {
                    finalXp *= 2;
                }

                addXp(finalXp); 
                enemies.splice(i, 1); continue; 
            }

            let speedModifier = 1;
            let hitTarget = null; 
            let targetAngle = Math.atan2(player.y - e.y, player.x - e.x);
            e.inTar = false;

            if (e.charmed) {
                speedModifier = 1.2;
                let closestDist = Infinity; let closestEnemy = null;
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
                } else { targetAngle = Math.atan2(e.y - player.y, e.x - player.x); }
            } else {
                structures.forEach(struct => {
                    if (struct.type === 'tar') {
                        if (getCollisionData(e, struct).collided) {
                            speedModifier = tarSpeedMod;
                            e.inTar = true;
                        }
                    } else if (struct.type !== 'plague' && struct.type !== 'tesla' && struct.type !== 'charm') {
                        const col = getCollisionData(e, struct);
                        if (col.collided) {
                            if (struct.type === 'wire') {
                                const lastHitTime = struct.hitZombies.get(e) || 0;
                                if (currentFrameTime - lastHitTime >= 500) {
                                    struct.hitZombies.set(e, currentFrameTime);
                                    e.hp -= (Math.floor(Math.random() * 6) + 5 + wireDamageBonus + (e.inTar ? brittlePitchLevel : 0));
                                    if (e.hp <= 0) e.dead = true;
                                }
                            } else if (struct.type === 'barricade') {
                                if (Math.random() < (kineticRepulsionLevel * 0.10)) {
                                    e.x += col.normalX * 40;
                                    e.y += col.normalY * 40;
                                } else {
                                    hitTarget = struct; e.x += col.normalX * col.overlap; e.y += col.normalY * col.overlap;
                                }
                            } else {
                                hitTarget = struct; e.x += col.normalX * col.overlap; e.y += col.normalY * col.overlap;
                            }
                        }
                    }
                });

                if (hitTarget && !hitTarget.isPermanent) {
                    hitTarget.hp -= e.isBoss ? 2.5 : 0.5;
                    if (hitTarget.type === 'barricade' && ironbarkDamage > 0) {
                        e.hp -= ironbarkDamage;
                        if (e.hp <= 0) e.dead = true;
                    }
                }

                if (Math.hypot(player.x - e.x, player.y - e.y) - e.radius - 30 < 1) {
                    enemies.splice(i, 1); 
                    health -= e.isBoss ? 40 : 10; 
                    chronoSurgeActive = false; 
                    updateHealthUI(); 
                    continue; 
                }
            }

            e.x += Math.cos(targetAngle) * e.baseSpeed * speedModifier;
            e.y += Math.sin(targetAngle) * e.baseSpeed * speedModifier;
        }
    }

    // --- DRAW THE TOWER ---
    const tw = 60, th = 80;
    
    // Draw the shadow beneath the tower
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; 
    ctx.beginPath(); 
    ctx.ellipse(player.x, player.y + th/2, tw/2 + 10, 15, 0, 0, Math.PI * 2); 
    ctx.fill();

    // Draw the new pixel art tower
    if (ASSETS.playerTower.complete && ASSETS.playerTower.naturalHeight !== 0) {
        ctx.drawImage(ASSETS.playerTower, player.x - tw/2, player.y - th/2, tw, th);
    }

    // Health Bar
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
            const midX = (effect.x1 + effect.x2) / 2 + (Math.random() - 0.5) * 20; const midY = (effect.y1 + effect.y2) / 2 + (Math.random() - 0.5) * 20;
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

    // --- DRAW THE ENEMIES ---
    enemies.forEach(e => {
        ctx.save(); 
        ctx.translate(e.x, e.y); 
        
        // 1. Draw Health Bars 
        const bW = e.isBoss ? 40 : 20, bO = e.isBoss ? -35 : -22;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; ctx.fillRect(-bW/2, bO, bW, 4); 
        ctx.fillStyle = '#76ff03'; ctx.fillRect(-bW/2, bO, bW * (e.hp / e.maxHp), 4); 
        
        // 2. Rotate the enemy to face their target (fixed for upwards-facing sprites)
        if (e.charmed) { 
            ctx.rotate(Math.atan2(e.y - player.y, e.x - player.x) + Math.PI / 2); 
        } else { 
            ctx.rotate(Math.atan2(player.y - e.y, player.x - e.x) + Math.PI / 2); 
        }
        
        // 3. Figure out the base image
        let imgToDraw = e.isBoss ? ASSETS.boss : ASSETS.zombie;
        
        if (e.charmed) {
            imgToDraw = ASSETS.zombieCharmed; 
        } else if (e.poisoned) {
            imgToDraw = e.isBoss ? ASSETS.bossPoisoned : ASSETS.zombiePoisoned;
        }

        // Multiply by 3 to scale up the sprites and compensate for transparent edges
        const size = e.radius * 3; 
        const offset = -size / 2;

        // 4. Draw the base zombie
        if (imgToDraw.complete && imgToDraw.naturalHeight !== 0) {
            ctx.drawImage(imgToDraw, offset, offset, size, size);
        }

        // 5. If poisoned, draw the animated bubbles on top
        if (e.poisoned && !e.charmed && ASSETS.poisonBubbles.width > 0) {
            const frameCount = 5; 
            const animationSpeed = 250; 
            
            const currentFrame = Math.floor(Date.now() / animationSpeed) % frameCount;
            const frameWidth = ASSETS.poisonBubbles.width / frameCount;
            const sourceX = currentFrame * frameWidth;

            ctx.drawImage(
                ASSETS.poisonBubbles, 
                sourceX, 0, frameWidth, ASSETS.poisonBubbles.height, 
                offset, offset, size, size                      
            );
        }

        ctx.restore(); 
    });

    crystals.forEach(c => {
        ctx.save(); ctx.translate(c.x, c.y); 
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; ctx.fillRect(-25, -50, 50, 5); 
        ctx.fillStyle = '#ffd700'; ctx.fillRect(-25, -50, 50 * (c.hp / c.maxHp), 5); 
        ctx.fillStyle = 'rgba(170, 0, 255, 0.7)'; ctx.strokeStyle = '#e040fb'; ctx.lineWidth = 3; ctx.shadowBlur = 15; ctx.shadowColor = '#aa00ff';
        
        ctx.beginPath(); ctx.moveTo(0, -c.radius); ctx.lineTo(c.radius, 0); ctx.lineTo(0, c.radius); ctx.lineTo(-c.radius, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
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

        let isPerm = isPlacingPerms;
        if (isPerm) {
            w = w * 0.75;
            h = h * 0.75;
            radius = Math.max(radius * 0.75, 50);
        }

        ctx.save(); ctx.translate(mouseX, mouseY); ctx.rotate(blueprintAngle);
        if (Math.hypot(player.x - mouseX, player.y - mouseY) <= restrictedRadius) { 
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; ctx.strokeStyle = 'red'; 
            ctx.fillRect(-w/2, -h/2, w, h); ctx.lineWidth = 2; ctx.strokeRect(-w/2, -h/2, w, h);
        } else {
            if (currentBlueprint === 'barricade') { ctx.fillStyle = 'rgba(139, 69, 19, 0.5)'; ctx.strokeStyle = isPerm ? '#e040fb' : 'white'; ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h); } 
            else if (currentBlueprint === 'tar') { ctx.fillStyle = 'rgba(30, 30, 30, 0.5)'; ctx.strokeStyle = isPerm ? '#e040fb' : 'white'; ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h); } 
            else if (currentBlueprint === 'wire') { ctx.fillStyle = 'rgba(150, 150, 150, 0.3)'; ctx.strokeStyle = isPerm ? '#e040fb' : 'white'; ctx.setLineDash([5, 5]); ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h); }
            else if (currentBlueprint === 'tesla') { ctx.fillStyle = 'rgba(0, 229, 255, 0.5)'; ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.fill(); if(isPerm) { ctx.strokeStyle='#e040fb'; ctx.stroke(); } ctx.fillStyle='rgba(0, 229, 255, 0.1)'; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'plague') { ctx.fillStyle = 'rgba(27, 94, 32, 0.7)'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 15); ctx.lineTo(-15, 15); ctx.fill(); if(isPerm) { ctx.strokeStyle='#e040fb'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 15); ctx.lineTo(-15, 15); ctx.closePath(); ctx.stroke(); } ctx.fillStyle='rgba(27, 94, 32, 0.2)'; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'soul') { ctx.fillStyle = 'rgba(170, 0, 255, 0.5)'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.fill(); if(isPerm) { ctx.strokeStyle='#e040fb'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.closePath(); ctx.stroke(); } ctx.fillStyle='rgba(170, 0, 255, 0.1)'; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'mending') { ctx.fillStyle = 'rgba(255, 215, 0, 0.5)'; ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.fill(); if(isPerm) { ctx.strokeStyle='#e040fb'; ctx.stroke(); } }
            else if (currentBlueprint === 'charm') { 
                ctx.fillStyle = 'rgba(41, 182, 246, 0.5)'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 5); ctx.lineTo(-15, 5); ctx.fill(); 
                ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(15, -5); ctx.lineTo(-15, -5); ctx.fill(); 
                if(isPerm) { ctx.strokeStyle='#e040fb'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 5); ctx.lineTo(-15, 5); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(15, -5); ctx.lineTo(-15, -5); ctx.closePath(); ctx.stroke(); }
                ctx.fillStyle = 'rgba(41, 182, 246, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill();
            }
        }
        ctx.restore();
    } else if (!isPaused && isGameStarted && !isPlacingPerms) {
        const cannotShoot = Math.hypot(player.x - mouseX, player.y - mouseY) <= restrictedRadius || currentAmmo <= 0; 
        ctx.beginPath(); ctx.arc(mouseX, mouseY, maxBlastRadius, 0, Math.PI * 2);
        ctx.fillStyle = cannotShoot ? 'rgba(100, 100, 100, 0.2)' : 'rgba(255, 0, 0, 0.1)'; ctx.fill(); ctx.strokeStyle = cannotShoot ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 0, 0, 0.7)'; ctx.lineWidth = 2; ctx.stroke();
        const xs = 10; ctx.beginPath(); ctx.moveTo(mouseX - xs, mouseY - xs); ctx.lineTo(mouseX + xs, mouseY + xs); ctx.moveTo(mouseX + xs, mouseY - xs); ctx.lineTo(mouseX - xs, mouseY + xs); ctx.stroke();
    }

    // End scaled rendering
    ctx.restore(); 
}

showSaveSelect();
animate();