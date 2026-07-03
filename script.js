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
    bossPoisoned: new Image(),
    mendingWard: new Image(),
    tarPit: new Image()
};

ASSETS.playerTower.src = 'artwork/tower.png';
ASSETS.zombie.src = 'artwork/zombie.png';
ASSETS.zombiePoisoned.src = 'artwork/zombie_poisoned.png';
ASSETS.zombieCharmed.src = 'artwork/zombie_charmed.png';
ASSETS.poisonBubbles.src = 'artwork/bubbles.png';
ASSETS.boss.src = 'artwork/boss.png';
ASSETS.bossPoisoned.src = 'artwork/boss_poisoned.png';
ASSETS.mendingWard.src = 'artwork/mending.png';
ASSETS.tarPit.src = 'artwork/tar.png';

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

let gameScale = 1;
let logicalWidth = window.innerWidth;
let logicalHeight = window.innerHeight;

function updateScaleAndDimensions() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const currentDiagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    const baseDiagonal = Math.sqrt(1920 * 1920 + 1080 * 1080);
    gameScale = currentDiagonal / baseDiagonal;
    logicalWidth = canvas.width / gameScale;
    logicalHeight = canvas.height / gameScale;
    ctx.imageSmoothingEnabled = false;
}

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
        gold: 3, upgrades: {}, currentShop: [], currentPrestigeShop: [],
        prestigePoints: 0, unclaimedPlaytime: 0, unclaimedWins: 0,
        totalPlaytime: 0, totalDeaths: 0, prestigeUpgrades: {}
    };
    
    if (savedData.upgrades.headStart !== undefined) delete savedData.upgrades.headStart; 
    for (let key in UPGRADE_DATA) { if (savedData.upgrades[key] === undefined) savedData.upgrades[key] = 0; }
    for (let key in PRESTIGE_UPGRADE_DATA) { if (savedData.prestigeUpgrades[key] === undefined) savedData.prestigeUpgrades[key] = 0; }
    if (savedData.prestigePoints === undefined) savedData.prestigePoints = 0;
    if (savedData.unclaimedPlaytime === undefined) savedData.unclaimedPlaytime = 0;
    if (savedData.unclaimedWins === undefined) savedData.unclaimedWins = 0;
    if (savedData.totalPlaytime === undefined) savedData.totalPlaytime = 0;
    if (savedData.totalDeaths === undefined) savedData.totalDeaths = 0;
    
    if (!savedData.currentShop) savedData.currentShop = [];
    if (!savedData.currentPrestigeShop) savedData.currentPrestigeShop = [];

    saveGame(); updateGoldUI(); populateShop(); updatePrestigeUI();

    document.getElementById('currentSaveDisplay').innerText = slotIndex;
    document.getElementById('saveSelectState').style.display = 'none';
    document.getElementById('runReadyState').style.display = 'block';
    document.getElementById('btnTabShop').style.display = 'block'; 
    document.getElementById('btnTabPrestige').style.display = 'block'; 
    document.getElementById('btnTabPatch').style.display = 'none';
    document.getElementById('btnTabCredits').style.display = 'none';
}

function saveGame() { if (currentSaveSlot) localStorage.setItem('roR_save_' + currentSaveSlot, JSON.stringify(savedData)); }

function deleteSave() {
    if (confirm("Are you sure you want to delete THIS save file? This cannot be undone.")) {
        localStorage.removeItem('roR_save_' + currentSaveSlot);
        showSaveSelect();
    }
}

function updateGoldUI() {
    goldEl.innerText = savedData.gold;
    if (document.getElementById('hubTotalGoldEl')) document.getElementById('hubTotalGoldEl').innerText = savedData.gold;
    if (document.getElementById('prestigeHubGoldEl')) document.getElementById('prestigeHubGoldEl').innerText = savedData.gold;
}

// --- METAPROGRESSION DATA ---
const UPGRADE_DATA = {
    // Core
    deepPockets: { name: "Deep Pockets", desc: "+1 Max Ammo.", baseCost: 3, maxLevel: 5 },
    arcaneHaste: { name: "Arcane Haste", desc: "Faster Shot Recharge.", baseCost: 2, maxLevel: 5 },
    volatileEmbers: { name: "Volatile Embers", desc: "+10% Shot Rad.", baseCost: 5, maxLevel: 5 },
    evocationMastery: { name: "Evocation", desc: "+2 Click Dmg.", baseCost: 3, maxLevel: 5 },
    masonry: { name: "Masonry", desc: "+10 Tower HP.", baseCost: 1, maxLevel: 10 },
    arcaneFortitude: { name: "Arcane Fort", desc: "+25 Building HP.", baseCost: 2, maxLevel: 5 },
    scholarsInsight: { name: "Scholar", desc: "+5% XP gain.", baseCost: 4, maxLevel: 5 },
    alchemistsTouch: { name: "Alchemist", desc: "Better gold drops.", baseCost: 5, maxLevel: 3 },
    cursedLure: { name: "Cursed Lure", desc: "Faster enemy spawns.", baseCost: 3, maxLevel: 5 },
    arcaneOverload: { name: "Arcane Surge", desc: "5% Double XP chance.", baseCost: 5, maxLevel: 4 },
    // Barricade
    reinforcedWood: { name: "Reinforced Wood", desc: "+50 Wood HP.", baseCost: 2, maxLevel: 5 },
    splinteringWards: { name: "Splinter Wards", desc: "Exploding walls.", baseCost: 5, maxLevel: 3 },
    kineticRepulsion: { name: "Kinetic Repulse", desc: "Wall knockback.", baseCost: 3, maxLevel: 4 },
    // Tar
    viscousTar: { name: "Viscous Tar", desc: "Slower Tar.", baseCost: 3, maxLevel: 3 },
    brittlePitch: { name: "Brittle Pitch", desc: "Tar makes zombies weak.", baseCost: 4, maxLevel: 3 },
    stickyResidue: { name: "Sticky Residue", desc: "Slow persists after tar.", baseCost: 4, maxLevel: 4 },
    // Wire
    serratedWire: { name: "Serrated Wire", desc: "+2 Wire Dmg.", baseCost: 1, maxLevel: 5 },
    tetanusCoating: { name: "Tetanus Coating", desc: "Wire adds DoT.", baseCost: 4, maxLevel: 4 },
    tangledBarbs: { name: "Tangled Barbs", desc: "Wire can root zombies.", baseCost: 5, maxLevel: 4 },
    // Tesla
    highVoltage: { name: "High Voltage", desc: "+10 Tesla Dmg.", baseCost: 3, maxLevel: 5 },
    voltaicChain: { name: "Voltaic Chain", desc: "Tesla zaps +1 target.", baseCost: 5, maxLevel: 3 },
    staticField: { name: "Static Field", desc: "Tesla zaps stun.", baseCost: 4, maxLevel: 4 },
    // Plague
    toxicSpores: { name: "Toxic Spores", desc: "+20 Plague Rad.", baseCost: 2, maxLevel: 5 },
    potentToxins: { name: "Potent Toxins", desc: "More Poison Dmg.", baseCost: 4, maxLevel: 5 },
    miasmaCloud: { name: "Miasma Cloud", desc: "Poison ticks faster.", baseCost: 5, maxLevel: 4 },
    // Soul
    deepSiphon: { name: "Deep Siphon", desc: "+0.5x Siphon Boost.", baseCost: 4, maxLevel: 4 },
    wideNet: { name: "Wide Net", desc: "+10% Siphon Rad.", baseCost: 4, maxLevel: 4 },
    soulEchoes: { name: "Soul Echoes", desc: "Kills can drop 50XP.", baseCost: 6, maxLevel: 4 },
    // Mending
    blessedAura: { name: "Blessed Aura", desc: "Faster Healing.", baseCost: 3, maxLevel: 4 },
    expandedSanctuary: { name: "Sanctuary", desc: "+10% Mending Rad.", baseCost: 4, maxLevel: 5 },
    overheal: { name: "Overheal", desc: "Healing grants shield.", baseCost: 6, maxLevel: 5 },
    // Charm
    mesmerizingGaze: { name: "Mesmerize", desc: "-1s Mind CD.", baseCost: 5, maxLevel: 5 },
    charismaticReach: { name: "Charisma", desc: "+10% Charm Rad.", baseCost: 4, maxLevel: 5 },
    zealousConverts: { name: "Zealous Converts", desc: "Charmed deal more dmg.", baseCost: 5, maxLevel: 4 },
    // Wind
    galeForce: { name: "Gale Force", desc: "+10% Wind knockback.", baseCost: 3, maxLevel: 5 },
    swiftBreezes: { name: "Swift Breezes", desc: "-10% Wind Cooldown.", baseCost: 4, maxLevel: 4 },
    updraft: { name: "Updraft", desc: "Knockback slows zombies.", baseCost: 5, maxLevel: 4 },
    // Decoy
    loudCarvings: { name: "Loud Carvings", desc: "+15px Taunt Radius.", baseCost: 2, maxLevel: 4 },
    reinforcedBark: { name: "Reinforced Bark", desc: "+50 Decoy HP.", baseCost: 3, maxLevel: 5 },
    thornyCarvings: { name: "Thorny Carvings", desc: "Decoy reflects dmg.", baseCost: 4, maxLevel: 5 },
    // Frost
    deepFreeze: { name: "Deep Freeze", desc: "+0.5s Freeze Duration.", baseCost: 4, maxLevel: 4 },
    bitingCold: { name: "Biting Cold", desc: "Chill slows more.", baseCost: 4, maxLevel: 4 },
    flashFreeze: { name: "Flash Freeze", desc: "Zombies freeze faster.", baseCost: 5, maxLevel: 3 },
    // Focus
    resonantGem: { name: "Resonant Gem", desc: "+10% Focus Crystal rad.", baseCost: 5, maxLevel: 5 },
    flawlessFacet: { name: "Flawless Facet", desc: "+10% Bonus Focus Dmg.", baseCost: 5, maxLevel: 5 },
    refractingLens: { name: "Refracting Lens", desc: "+10% Bonus Focus Rad.", baseCost: 6, maxLevel: 4 },
    // Crucible
    transmutation: { name: "Transmutation", desc: "+0.5% Crucible gold chance.", baseCost: 5, maxLevel: 4 },
    gildedRadius: { name: "Gilded Radius", desc: "+10% Crucible Rad.", baseCost: 4, maxLevel: 5 },
    foolsGold: { name: "Fool's Gold", desc: "Chance for Ammo drop.", baseCost: 5, maxLevel: 4 },
    // Meteor
    astralPayload: { name: "Astral Payload", desc: "+15% Meteor radius.", baseCost: 6, maxLevel: 5 },
    sturdyCasing: { name: "Sturdy Casing", desc: "+50 Meteor HP.", baseCost: 4, maxLevel: 5 },
    impactTremors: { name: "Impact Tremors", desc: "Meteor explosion stuns.", baseCost: 5, maxLevel: 4 }
};

const PRESTIGE_UPGRADE_DATA = {
    // Core
    goldenEpoch: { name: "Golden Epoch", desc: "Start runs with +2 Gold/level.", cost: 5, maxLevel: 5 },
    arcaneRicochet: { name: "Arcane Ricochet", desc: "Spells bounce to +1 enemy/level.", cost: 8, maxLevel: 3 },
    vampiricStrike: { name: "Vampiric Strike", desc: "Spell kills heal chance.", cost: 6, maxLevel: 5 },
    bountyHunter: { name: "Bounty Hunter", desc: "Boss kills yield +1 Gold/level.", cost: 5, maxLevel: 5 },
    challengerBell: { name: "Challenger's Bell", desc: "-1 Level req for Bosses.", cost: 10, maxLevel: 2 },
    temporalShift: { name: "Temporal Shift", desc: "-30s boss backup timer.", cost: 8, maxLevel: 5 },
    timeDilator: { name: "Time Dilator", desc: "+10% Game Speed/level.", cost: 15, maxLevel: 5 },
    chronoSurge: { name: "Chrono-Surge", desc: "+50% Game speed until hit.", cost: 8, maxLevel: 3 },
    bloodReckoning: { name: "Blood Reckoning", desc: "-10% Spawn delay, +15% XP.", cost: 6, maxLevel: 5 },
    echoesOfPower: { name: "Echoes of Power", desc: "Start with +250 XP.", cost: 7, maxLevel: 5 },
    trueEnding: { name: "The Truth", desc: "Unlock the final mystery...", cost: 100, maxLevel: 1 },
    
    // New Blueprint Prestiges
    stalwartDeflection: { name: "Stalwart Deflection", desc: "Barricades have 10% chance/level to dodge hits.", cost: 3, maxLevel: 5 },
    ironbark: { name: "Ironbark", desc: "Barricades reflect 1 dmg/level.", cost: 5, maxLevel: 5 },
    livingWood: { name: "Living Wood", desc: "Barricades regen 5 HP/sec per level.", cost: 6, maxLevel: 5 },
    fossilizedPitch: { name: "Fossilized Pitch", desc: "Tar stuns zombies after 3 seconds.", cost: 5, maxLevel: 1 },
    flammablePitch: { name: "Flammable Pitch", desc: "Spells ignite tar.", cost: 8, maxLevel: 3 },
    rendingBarbs: { name: "Rending Barbs", desc: "Wire-hit zombies take +50% spell dmg.", cost: 5, maxLevel: 1 },
    bloodletting: { name: "Bloodletting", desc: "Wire kills grant more XP.", cost: 6, maxLevel: 3 },
    voltaicFeedback: { name: "Voltaic Feedback", desc: "Tesla kills trigger extra lightning.", cost: 8, maxLevel: 3 },
    conduitStrike: { name: "Conduit Strike", desc: "Spells trigger Tesla zaps.", cost: 10, maxLevel: 3 },
    noxiousWeakness: { name: "Noxious Weakness", desc: "Poisoned zombies deal 50% less dmg.", cost: 6, maxLevel: 1 },
    contagion: { name: "Contagion", desc: "Poison spreads on death.", cost: 8, maxLevel: 3 },
    harvestSurge: { name: "Harvest Surge", desc: "Placing Soul Siphons grants instant XP.", cost: 5, maxLevel: 3 },
    soulBattery: { name: "Soul Battery", desc: "Siphons reduce Ward CD.", cost: 7, maxLevel: 4 },
    arcaneStimulation: { name: "Arcane Stimulation", desc: "Mending Ward heals also recharge 1 Ammo.", cost: 8, maxLevel: 1 },
    martyrsGrace: { name: "Martyr's Grace", desc: "Broken wards heal tower.", cost: 8, maxLevel: 3 },
    frenziedThralls: { name: "Frenzied Thralls", desc: "Charmed zombies are faster & stronger.", cost: 8, maxLevel: 2 },
    undeadBetrayal: { name: "Undead Betrayal", desc: "Charmed explode on death.", cost: 8, maxLevel: 3 },

    // Existing late game prestiges
    cuttingWinds: { name: "Cutting Winds", desc: "Wind glyph deals 2 dmg.", cost: 6, maxLevel: 3 },
    zephyrsBlessing: { name: "Zephyr's Blessing", desc: "Spells thru wind deal more dmg.", cost: 9, maxLevel: 3 },
    splinteringMockery: { name: "Splintering Mockery", desc: "Decoy slows on death.", cost: 5, maxLevel: 1 },
    illusoryDouble: { name: "Illusory Double", desc: "Decoy spawns smaller decoy.", cost: 10, maxLevel: 2 },
    shatterStrike: { name: "Shatter Strike", desc: "2x spell dmg to frozen.", cost: 8, maxLevel: 1 },
    iceShards: { name: "Ice Shards", desc: "Frozen shatter into projectiles.", cost: 10, maxLevel: 3 },
    prismaticBeam: { name: "Prismatic Beam", desc: "Focus crystal spells bounce.", cost: 10, maxLevel: 2 },
    arcaneConduit: { name: "Arcane Conduit", desc: "Focus kills recharge ammo.", cost: 12, maxLevel: 3 },
    philosophersStone: { name: "Philosopher's Stone", desc: "Crucible gold heals 1 HP.", cost: 15, maxLevel: 1 },
    greedsReward: { name: "Greed's Reward", desc: "Held gold boosts drops.", cost: 10, maxLevel: 3 },
    scorchedEarth: { name: "Scorched Earth", desc: "Meteor leaves a fire pool.", cost: 12, maxLevel: 1 },
    armageddon: { name: "Armageddon", desc: "Kills trigger second meteor.", cost: 15, maxLevel: 3 }
};

const BLUEPRINT_DB = {
    barricade: { name: 'Wood Wall', desc: 'Blocks zombies.' },
    tar: { name: 'Tar Pit', desc: 'Slows zombies.' },
    wire: { name: 'Barbed Wire', desc: 'Damages zombies.' },
    tesla: { name: 'Tesla Rune', desc: 'Zaps nearby zombies.' },
    plague: { name: 'Plague Totem', desc: 'Poisons zombies.' },
    soul: { name: 'Soul Siphon', desc: 'Bonus XP nearby.' },
    mending: { name: 'Mending Ward', desc: 'Heals the tower.' },
    charm: { name: 'Mind Ward', desc: 'Converts zombies.' },
    wind: { name: 'Wind Glyph', desc: 'Knocks back zombies.' },
    decoy: { name: 'Decoy Totem', desc: 'Draws nearby zombies.' },
    frost: { name: 'Frost Ward', desc: 'Freezes zombies.' },
    focus: { name: 'Focus Crystal', desc: 'Buffs spells aimed here.' },
    crucible: { name: 'Crucible', desc: 'Chance for gold drops.' },
    meteor: { name: 'Meteor Beacon', desc: 'Explodes when destroyed.' }
};

// --- RUN VARIABLES ---
let maxHealth, health, towerShield = 0, maxAmmo, currentAmmo, rechargeRate, maxBlastRadius;
let barricadeHP, tarSpeedMod, wireDamageBonus, teslaDamage, plagueRadius, soulMultiplier, mendingCooldown, xpMultiplier;
let spellDamageBonus, goldDropThreshold, bossGoldBonus, poisonTickDamage, barricadeExplosionDamage, wardHPBonus, charmCooldown;
let brittlePitchLevel = 0, voltaicChainLevel = 0, kineticRepulsionLevel = 0;

let galeForceLevel = 0, loudCarvingsLevel = 0, deepFreezeLevel = 0, resonantGemLevel = 0, transmutationLevel = 0, astralPayloadLevel = 0;
let stickyResidueSlow = 0, flammablePitchDuration = 0, tetanusDamage = 0, tangledBarbsChance = 0, bloodlettingXp = 0;
let staticFieldStun = 0, conduitStrikeBounces = 0, miasmaCloudSpeed = 1, contagionChance = 0;
let wideNetRad = 1, soulEchoesChance = 0, expandedSanctuaryRad = 1, overhealMax = 0, martyrsGraceHeal = 0;
let charismaticReachRad = 1, zealousConvertsDmg = 1, undeadBetrayalDmg = 0, swiftBreezesCd = 1, updraftSlow = 0, zephyrsBlessingDmg = 1;
let reinforcedBarkHp = 0, thornyCarvingsDmg = 0, illusoryDoubleHp = 0, bitingColdSlow = 1, flashFreezeSpeed = 1, iceShardsCount = 0;
let flawlessFacetDmg = 1, refractingLensRad = 1, arcaneConduitAmmo = 0, gildedRadiusRad = 1, foolsGoldChance = 0, greedsRewardScale = 0;
let sturdyCasingHp = 0, impactTremorsStun = 0, armageddonKills = 15;

let cuttingWindsDmg = 0, splinteringMockeryActive = false, shatterStrikeActive = false, prismaticBeamBounces = 0, philosophersStoneActive = false, scorchedEarthActive = false;

// New Prestige Scaling Mechanics
let stalwartDeflectionChance = 0, fossilizedPitchActive = false, rendingBarbsActive = false, voltaicFeedbackZaps = 0;
let noxiousWeaknessActive = false, harvestSurgeXp = 0, arcaneStimulationActive = false, frenziedThrallsBonus = 0;

let goldenEpochBonus, ricochetBounces, vampiricChance, soulBatteryReduction, bountyHunterBonus, ironbarkDamage, livingWoodRegen;
let chronoSurgeActive = false, chronoSurgeMult = 1, bloodReckoningReduction = 0, echoesOfPowerXP = 0;
let lureSpawnReduction = 0, overloadChance = 0, bossLevelThreshold = 5, bossTimerReduction = 0, baseTimeDilation = 1;

let animationId, isPaused = false, isGameStarted = false; 
let survivalTimeMs = 0, lastFrameTime = Date.now(), formattedTime = "00:00";
let level = 1, xp = 0, xpToNextLevel = 100, lastBossLevel = 0; 
let killCount = 0, runGold = 0, levelUpsQueued = 0;
let nextBossTime = 300000; 

let bossesKilled = 0, crystalsSpawned = false, victoryAchieved = false;
const crystals = [];

let currentBlueprint = null, blueprintAngle = 0;
const structures = [], spells = [], enemies = [], visualEffects = []; 
const enemyProjectiles = [];
let currentWeather = 'Sunny';
let weatherState = 'none'; // 'none', 'fading_in', 'active'
let weatherTimer = 0;
let weatherAlpha = 0; // For visual fade-ins
let lastLightningStrike = 0;
let lastRechargeTime = 0;
const restrictedRadius = 120; 

let spawnTimer, mouseX = logicalWidth / 2, mouseY = logicalHeight / 2;
const player = { x: logicalWidth / 2, y: logicalHeight / 2 };

function applyUpgrades() {
    let u = savedData.upgrades;
    let p = savedData.prestigeUpgrades;

    maxHealth = 100 + (u.masonry * 10);
    health = maxHealth;
    towerShield = 0;
    maxAmmo = 5 + u.deepPockets;
    currentAmmo = maxAmmo;
    rechargeRate = 500 - (u.arcaneHaste * 25);
    maxBlastRadius = 45 * (1 + (u.volatileEmbers * 0.1));
    barricadeHP = 150 + (u.reinforcedWood * 50);
    tarSpeedMod = 0.5 - (u.viscousTar * 0.05); 
    wireDamageBonus = u.serratedWire * 2;
    teslaDamage = 20 + (u.highVoltage * 10);
    plagueRadius = 120 + (u.toxicSpores * 20);
    soulMultiplier = 2 + (u.deepSiphon * 0.5);
    mendingCooldown = 2000 - (u.blessedAura * 250);
    xpMultiplier = (1 + (u.scholarsInsight * 0.05));
    level = 1;
    
    spellDamageBonus = u.evocationMastery * 2;
    goldDropThreshold = 50 - (u.alchemistsTouch * 5); 
    bossGoldBonus = u.alchemistsTouch;
    poisonTickDamage = 0.05 + (u.potentToxins * 0.02);
    barricadeExplosionDamage = u.splinteringWards * 15;
    wardHPBonus = u.arcaneFortitude * 25;
    charmCooldown = 10000 - (u.mesmerizingGaze * 1000);
    
    brittlePitchLevel = u.brittlePitch || 0;
    voltaicChainLevel = u.voltaicChain || 0;
    kineticRepulsionLevel = u.kineticRepulsion || 0;
    galeForceLevel = u.galeForce || 0;
    loudCarvingsLevel = u.loudCarvings || 0;
    deepFreezeLevel = u.deepFreeze || 0;
    resonantGemLevel = u.resonantGem || 0;
    transmutationLevel = u.transmutation || 0;
    astralPayloadLevel = u.astralPayload || 0;

    stickyResidueSlow = u.stickyResidue > 0 ? 0.10 + (u.stickyResidue - 1) * 0.05 : 0;
    flammablePitchDuration = p.flammablePitch > 0 ? 2000 + (p.flammablePitch - 1) * 1000 : 0;
    tetanusDamage = u.tetanusCoating > 0 ? 1.0 + (u.tetanusCoating - 1) * 0.5 : 0;
    tangledBarbsChance = u.tangledBarbs > 0 ? 0.05 + (u.tangledBarbs - 1) * 0.025 : 0;
    bloodlettingXp = p.bloodletting > 0 ? 0.10 + (p.bloodletting - 1) * 0.05 : 0;
    staticFieldStun = u.staticField > 0 ? 100 + (u.staticField - 1) * 50 : 0;
    conduitStrikeBounces = p.conduitStrike || 0;
    miasmaCloudSpeed = u.miasmaCloud > 0 ? 1.10 + (u.miasmaCloud - 1) * 0.05 : 1.0;
    contagionChance = p.contagion > 0 ? 0.15 + (p.contagion - 1) * 0.05 : 0;
    wideNetRad = 1 + (u.wideNet * 0.10);
    soulEchoesChance = u.soulEchoes > 0 ? 0.02 + (u.soulEchoes - 1) * 0.01 : 0;
    expandedSanctuaryRad = 1 + (u.expandedSanctuary * 0.10);
    overhealMax = u.overheal || 0;
    martyrsGraceHeal = p.martyrsGrace > 0 ? 10 + (p.martyrsGrace - 1) * 5 : 0;
    charismaticReachRad = 1 + (u.charismaticReach * 0.10);
    zealousConvertsDmg = u.zealousConverts > 0 ? 1.15 + (u.zealousConverts - 1) * 0.15 : 1.0;
    undeadBetrayalDmg = p.undeadBetrayal > 0 ? 10 + (p.undeadBetrayal - 1) * 5 : 0;
    swiftBreezesCd = 1 - (u.swiftBreezes * 0.10);
    updraftSlow = u.updraft > 0 ? 0.20 + (u.updraft - 1) * 0.10 : 0;
    zephyrsBlessingDmg = u.zephyrsBlessing > 0 ? 1.10 + (u.zephyrsBlessing - 1) * 0.10 : 1.0;
    reinforcedBarkHp = u.reinforcedBark * 50;
    thornyCarvingsDmg = u.thornyCarvings || 0;
    illusoryDoubleHp = p.illusoryDouble > 0 ? 0.25 + (p.illusoryDouble - 1) * 0.25 : 0;
    bitingColdSlow = u.bitingCold > 0 ? 0.10 + (u.bitingCold - 1) * 0.05 : 0;
    flashFreezeSpeed = 1 + (u.flashFreeze * 0.10);
    iceShardsCount = p.iceShards > 0 ? 2 + (p.iceShards - 1) : 0;
    flawlessFacetDmg = 1 + (u.flawlessFacet * 0.10);
    refractingLensRad = 1 + (u.refractingLens * 0.10);
    arcaneConduitAmmo = p.arcaneConduit * 0.05;
    gildedRadiusRad = 1 + (u.gildedRadius * 0.10);
    foolsGoldChance = u.foolsGold > 0 ? 0.02 + (u.foolsGold - 1) * 0.01 : 0;
    greedsRewardScale = p.greedsReward > 0 ? 0.0005 + (p.greedsReward - 1) * 0.0005 : 0;
    sturdyCasingHp = u.sturdyCasing * 50;
    impactTremorsStun = u.impactTremors > 0 ? 1000 + (u.impactTremors - 1) * 500 : 0;
    armageddonKills = p.armageddon > 0 ? 15 - (p.armageddon * 2) : 999;

    goldenEpochBonus = (p.goldenEpoch || 0) * 2;
    ricochetBounces = (p.arcaneRicochet || 0);
    vampiricChance = (p.vampiricStrike || 0) * 0.02;
    soulBatteryReduction = (p.soulBattery || 0) * 0.05;
    bountyHunterBonus = (p.bountyHunter || 0);
    ironbarkDamage = (p.ironbark || 0);
    livingWoodRegen = (p.livingWood || 0) * 5;

    chronoSurgeMult = 1 + ((p.chronoSurge || 0) * 0.5);
    bloodReckoningReduction = (p.bloodReckoning || 0) * 0.10;
    echoesOfPowerXP = (p.echoesOfPower || 0) * 250;
    chronoSurgeActive = (p.chronoSurge || 0) > 0;

    cuttingWindsDmg = (p.cuttingWinds || 0) * 2;
    splinteringMockeryActive = (p.splinteringMockery || 0) > 0;
    shatterStrikeActive = (p.shatterStrike || 0) > 0;
    prismaticBeamBounces = (p.prismaticBeam || 0);
    philosophersStoneActive = (p.philosophersStone || 0) > 0;
    scorchedEarthActive = (p.scorchedEarth || 0) > 0;

    // Set new prestige upgrade values
    stalwartDeflectionChance = (p.stalwartDeflection || 0) * 0.10;
    fossilizedPitchActive = (p.fossilizedPitch || 0) > 0;
    rendingBarbsActive = (p.rendingBarbs || 0) > 0;
    voltaicFeedbackZaps = (p.voltaicFeedback || 0);
    noxiousWeaknessActive = (p.noxiousWeakness || 0) > 0;
    harvestSurgeXp = (p.harvestSurge || 0) * 100;
    arcaneStimulationActive = (p.arcaneStimulation || 0) > 0;
    frenziedThrallsBonus = (p.frenziedThralls || 0) * 0.50;

    lureSpawnReduction = u.cursedLure * 400; 
    overloadChance = u.arcaneOverload * 0.05; 
    bossLevelThreshold = 5 - (p.challengerBell || 0); 
    bossTimerReduction = (p.temporalShift || 0) * 30000; 
    baseTimeDilation = 1 + ((p.timeDilator || 0) * 0.1); 
    
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
    
    if (pending <= 0) { alert("You don't have any pending Prestige Points to claim!"); return; }

    if (confirm(`Are you sure you want to Prestige?\n\nYou will gain ${pending} Prestige Points.\nYou will LOSE ALL your Gold and Standard Upgrades.`)) {
        savedData.prestigePoints += pending;
        savedData.unclaimedPlaytime %= 3600000; 
        savedData.unclaimedWins = 0;
        savedData.gold = 0; 
        for (let key in UPGRADE_DATA) savedData.upgrades[key] = 0;
        savedData.currentShop = [];
        savedData.currentPrestigeShop = [];
        saveGame(); updateGoldUI(); updatePrestigeUI(); populateShop();
        alert("You have Prestiged! The Cosmic Altar smiles upon you.");
    }
}

function populatePrestigeShop() {
    const container = document.getElementById('prestigeContainer');
    if (!container) return;
    container.innerHTML = '';
    
    if (!savedData.currentPrestigeShop || savedData.currentPrestigeShop.length === 0) {
        let availableKeys = Object.keys(PRESTIGE_UPGRADE_DATA);
        shuffleArray(availableKeys);
        savedData.currentPrestigeShop = availableKeys.slice(0, 4); 
        saveGame();
    }
    
    let selectedKeys = [...savedData.currentPrestigeShop];
    selectedKeys.forEach(key => {
        const data = PRESTIGE_UPGRADE_DATA[key];
        const currentLvl = savedData.prestigeUpgrades[key] || 0;
        const isMaxed = currentLvl >= data.maxLevel;
        const canAfford = savedData.prestigePoints >= data.cost && !isMaxed;

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
            <button class="buy-btn prestige-btn" ${canAfford ? '' : 'disabled'} onclick="buyPrestigeUpgrade('${key}')">
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
        saveGame(); updatePrestigeUI();
    }
}

function refreshPrestigeShop() {
    if (savedData.gold >= 25) {
        savedData.gold -= 25;
        savedData.currentPrestigeShop = [];
        saveGame(); updateGoldUI(); updatePrestigeUI(); 
    }
}

// --- GAME STATE FLOW ---
function startGame() {
    applyUpgrades(); updateAmmoUI(); updateGoldUI();
    mainMenu.style.display = 'none'; 
    isGameStarted = true;
    structures.length = 0; levelUpsQueued = 0;
    startActualRun();
}

function startActualRun() {
    controlsTip.style.display = 'none';
    lastRechargeTime = Date.now(); lastFrameTime = Date.now(); lastPlaytimeSave = Date.now(); 
    
    if (goldenEpochBonus > 0) { savedData.gold += goldenEpochBonus; runGold += goldenEpochBonus; saveGame(); updateGoldUI(); }
    if (echoesOfPowerXP > 0) { addXp(echoesOfPowerXP); }
    if (levelUpsQueued === 0 && !isPaused) spawnWave();
}

function resetGame() {
    if (isGameStarted) {
        let diff = Date.now() - lastPlaytimeSave;
        savedData.unclaimedPlaytime += diff; savedData.totalPlaytime += diff; saveGame(); updatePrestigeUI();
    }

    gameOverModal.style.display = 'none'; pauseMenu.style.display = 'none';
    document.getElementById('victoryModal').style.display = 'none';
    document.getElementById('trueVictoryModal').style.display = 'none';
    
    switchMenuTab('tab-start', document.getElementById('btnTabStart'));
    mainMenu.style.display = 'flex'; 
    
    isGameStarted = false; isPaused = false; currentBlueprint = null; controlsTip.style.display = 'none';
    bossesKilled = 0; crystalsSpawned = false; victoryAchieved = false; crystals.length = 0; levelUpsQueued = 0;
    
    survivalTimeMs = 0; formattedTime = "00:00"; timerDisplay.innerText = formattedTime;
    xp = 0; lastBossLevel = 0; killCount = 0; runGold = 0;
    enemies.length = 0; spells.length = 0; structures.length = 0; visualEffects.length = 0;
    
    applyUpgrades(); nextBossTime = 300000 - bossTimerReduction;
    xpBarFill.style.width = '0%'; xpText.innerHTML = `${xp} / ${xpToNextLevel}`;
    updateAmmoUI(); updateGoldUI(); populateShop();
}

function togglePauseMenu() {
    if (!isGameStarted || gameOverModal.style.display === 'flex' || levelUpModal.style.display === 'flex' || document.getElementById('victoryModal').style.display === 'flex' || document.getElementById('trueVictoryModal').style.display === 'flex') return;

    if (pauseMenu.style.display === 'flex') {
        pauseMenu.style.display = 'none'; isPaused = false; canvas.style.cursor = 'none';
        lastFrameTime = Date.now(); lastPlaytimeSave = Date.now(); spawnWave();
    } else {
        isPaused = true; clearTimeout(spawnTimer); pauseMenu.style.display = 'flex'; canvas.style.cursor = 'default';
        let diff = Date.now() - lastPlaytimeSave;
        savedData.unclaimedPlaytime += diff; savedData.totalPlaytime += diff; saveGame(); updatePrestigeUI();
    }
}

function triggerGameOver() {
    isGameStarted = false; clearTimeout(spawnTimer);
    let diff = Date.now() - lastPlaytimeSave;
    savedData.unclaimedPlaytime += diff; savedData.totalPlaytime += diff; savedData.totalDeaths += 1;
    saveGame(); updateGoldUI(); updatePrestigeUI();

    document.getElementById('finalLevelEl').innerText = level;
    document.getElementById('finalTimeEl').innerText = formattedTime;
    document.getElementById('runGoldEl').innerText = runGold;
    gameOverModal.style.display = 'flex'; canvas.style.cursor = 'default';
}

function updateHealthUI() {
    health = Math.min(maxHealth, Math.max(0, health)); 
    if (health <= 0) triggerGameOver();
}

function spawnCrystals(phase = 1) {
    let crystalHp = (80 + (level * 10)) * 3; if (phase === 2) crystalHp *= 1.5;
    const positions = [ { x: 100, y: 100 }, { x: logicalWidth - 100, y: 100 }, { x: 100, y: logicalHeight - 100 }, { x: logicalWidth - 100, y: logicalHeight - 100 } ];
    if (phase === 2) { positions.push({ x: logicalWidth / 2, y: 100 }); positions.push({ x: logicalWidth / 2, y: logicalHeight - 100 }); }
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
    
    if (availableUpgrades.length === 0 && (!savedData.currentShop || savedData.currentShop.length === 0)) {
        shopContainer.innerHTML = '<h3 style="color: #4caf50;">You have maxed out all available upgrades!</h3>'; return;
    }

    if (!savedData.currentShop || savedData.currentShop.length === 0) {
        shuffleArray(availableUpgrades);
        savedData.currentShop = availableUpgrades.slice(0, 3); saveGame();
    }

    savedData.currentShop.forEach(key => {
        const data = UPGRADE_DATA[key]; const currentLvl = savedData.upgrades[key];
        const cost = data.baseCost * (currentLvl + 1); const isMaxed = currentLvl >= data.maxLevel;
        const canAfford = savedData.gold >= cost && !isMaxed;
        const card = document.createElement('div'); card.className = 'upgrade-card';
        card.innerHTML = `<div><h3>${data.name}</h3><p>${data.desc}</p><p style="color: #ccc; font-size: 8px;">Level ${currentLvl} / ${data.maxLevel}</p></div><button class="buy-btn" ${canAfford ? '' : 'disabled'} onclick="buyUpgrade('${key}', ${cost})">${isMaxed ? 'MAX' : cost + ' Gold'}</button>`;
        shopContainer.appendChild(card);
    });
}

function buyUpgrade(key, cost) {
    if (savedData.gold >= cost && savedData.upgrades[key] < UPGRADE_DATA[key].maxLevel) {
        savedData.gold -= cost; savedData.upgrades[key]++; savedData.currentShop = []; 
        saveGame(); updateGoldUI(); populateShop(); 
    }
}

function refreshShop() {
    if (savedData.gold >= 1) { savedData.gold -= 1; savedData.currentShop = []; saveGame(); updateGoldUI(); populateShop(); }
}

// --- INPUT LISTENERS ---
window.addEventListener('mousemove', (event) => { mouseX = event.clientX / gameScale; mouseY = event.clientY / gameScale; });
window.addEventListener('wheel', (event) => { if (currentBlueprint) blueprintAngle += event.deltaY > 0 ? 0.2 : -0.2; });
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') togglePauseMenu();
    if (currentBlueprint) { if (event.key.toLowerCase() === 'r') blueprintAngle += 0.2; if (event.key.toLowerCase() === 'e') blueprintAngle -= 0.2; }
});
window.addEventListener('resize', () => {
    const oldWidth = logicalWidth; const oldHeight = logicalHeight;
    updateScaleAndDimensions();
    const diffX = (logicalWidth - oldWidth) / 2; const diffY = (logicalHeight - oldHeight) / 2;
    player.x = logicalWidth / 2; player.y = logicalHeight / 2;
    structures.forEach(s => { s.x += diffX; s.y += diffY; });
    enemies.forEach(e => { e.x += diffX; e.y += diffY; }); crystals.forEach(c => { c.x += diffX; c.y += diffY; });
    spells.forEach(s => { s.startX += diffX; s.startY += diffY; s.targetX += diffX; s.targetY += diffY; });
    visualEffects.forEach(v => {
        if (v.x !== undefined) v.x += diffX; if (v.y !== undefined) v.y += diffY;
        if (v.x1 !== undefined) { v.x1 += diffX; v.x2 += diffX; v.y1 += diffY; v.y2 += diffY; }
    });
});

window.addEventListener('click', (event) => {
    if (!isGameStarted || (isPaused && !currentBlueprint)) return; 
    const clickX = event.clientX / gameScale; const clickY = event.clientY / gameScale;
    const distFromTower = Math.hypot(player.x - clickX, player.y - clickY);

    if (currentBlueprint) {
        if (distFromTower <= restrictedRadius) return; 
        let w = 40, h = 40, hp = 100 + wardHPBonus, radius = 0;
        if (currentBlueprint === 'barricade') { w = 80; h = 20; hp = barricadeHP; } 
        else if (currentBlueprint === 'tar') { w = 120; h = 120; }
        else if (currentBlueprint === 'wire') { w = 150; h = 40; }
        else if (currentBlueprint === 'tesla') { w = 30; h = 30; radius = 150; }
        else if (currentBlueprint === 'plague') { w = 30; h = 30; radius = plagueRadius; } 
        else if (currentBlueprint === 'soul') { w = 30; h = 30; radius = 150 * wideNetRad; hp = 50 + wardHPBonus; }
        else if (currentBlueprint === 'mending') { w = 30; h = 30; radius = 150 * expandedSanctuaryRad; hp = 50 + wardHPBonus; }
        else if (currentBlueprint === 'charm') { w = 30; h = 30; radius = 150 * charismaticReachRad; hp = 50 + wardHPBonus; }
        else if (currentBlueprint === 'wind') { w = 30; h = 30; radius = 100; hp = 50 + wardHPBonus; }
        else if (currentBlueprint === 'decoy') { w = 30; h = 60; radius = 150 + (loudCarvingsLevel * 15); hp = 150 + wardHPBonus + reinforcedBarkHp; }
        else if (currentBlueprint === 'frost') { w = 120; h = 120; }
        else if (currentBlueprint === 'focus') { w = 40; h = 40; radius = 100 * (1 + (resonantGemLevel * 0.10)); hp = 30 + wardHPBonus; }
        else if (currentBlueprint === 'crucible') { w = 50; h = 50; radius = 120 * gildedRadiusRad; hp = 80 + wardHPBonus; }
        else if (currentBlueprint === 'meteor') { w = 60; h = 60; hp = 200 + wardHPBonus + sturdyCasingHp; radius = 300 * (1 + (astralPayloadLevel * 0.15)); }

        structures.push({ type: currentBlueprint, x: clickX, y: clickY, w: w, h: h, angle: blueprintAngle, hp: hp, radius: radius, hitZombies: new Map(), lastTick: Date.now() });

        // Harvest Surge Check
        if (currentBlueprint === 'soul' && harvestSurgeXp > 0) { addXp(harvestSurgeXp); }

        currentBlueprint = null; controlsTip.style.display = 'none';
        if (levelUpsQueued > 0) processLevelUpQueue(); else { isPaused = false; lastFrameTime = Date.now(); lastPlaytimeSave = Date.now(); spawnWave(); }
        return; 
    }

    if (currentAmmo <= 0 || distFromTower <= restrictedRadius) return; 

    if (currentAmmo === maxAmmo) lastRechargeTime = Date.now();
    currentAmmo--; updateAmmoUI();

    const distToTarget = Math.hypot(clickX - player.x, clickY - player.y);
    let localDamageBonus = spellDamageBonus; let localBlastRadius = maxBlastRadius; let localBounces = ricochetBounces;
    
    structures.forEach(s => {
        if (s.type === 'focus' && Math.hypot(clickX - s.x, clickY - s.y) <= s.radius) {
            localDamageBonus += Math.floor(spellDamageBonus * flawlessFacetDmg) + 3; 
            localBlastRadius *= 1.5 * refractingLensRad;
            localBounces += prismaticBeamBounces;
        }
    });

    spells.push({
        startX: player.x, startY: player.y, targetX: clickX, targetY: clickY, distance: distToTarget,
        progress: 0, arcHeight: Math.min(distToTarget * 0.4, 200), radius: 0, maxRadius: localBlastRadius, state: 'flying', 
        hitEnemies: new Set(), bounces: localBounces, bounceHistory: new Set(), damageBonus: localDamageBonus, isFromFocus: localBlastRadius > maxBlastRadius
    });
});

// --- LEVEL UP LOGIC ---
function selectBlueprint(type, event) {
    event.stopPropagation(); currentBlueprint = type; blueprintAngle = 0; levelUpModal.style.display = 'none';
    canvas.style.cursor = 'none'; controlsTip.style.display = 'block';
}

function showLevelUpMenu() {
    isPaused = true; clearTimeout(spawnTimer); levelUpContainer.innerHTML = '';
    const keys = Object.keys(BLUEPRINT_DB); shuffleArray(keys); const options = keys.slice(0, 3);
    options.forEach(key => {
        const item = BLUEPRINT_DB[key]; const btn = document.createElement('button'); btn.className = 'upgrade-card';
        btn.onclick = (e) => selectBlueprint(key, e); btn.innerHTML = `<h3>${item.name}</h3><p>${item.desc}</p>`; levelUpContainer.appendChild(btn);
    });
    levelUpModal.style.display = 'flex'; canvas.style.cursor = 'default'; 
}

function processLevelUpQueue() { if (levelUpsQueued > 0) { levelUpsQueued--; showLevelUpMenu(); } }

function addXp(amount) {
    xp += Math.floor(amount * xpMultiplier); 
    while (xp >= xpToNextLevel) { xp -= xpToNextLevel; level++; xpToNextLevel = Math.floor(xpToNextLevel * 1.4); levelUpsQueued++; }
    xpBarFill.style.width = `${Math.min(100, (xp / xpToNextLevel) * 100)}%`; xpText.innerHTML = `${xp} / ${xpToNextLevel}`;
    if (levelUpsQueued > 0 && !isPaused && !currentBlueprint) processLevelUpQueue();
}

// --- ENEMY SPAWNING ---
function spawnBossEnemy() {
    const angle = Math.random() * Math.PI * 2; const x = player.x + Math.cos(angle) * (logicalWidth / 2 + 100); const y = player.y + Math.sin(angle) * (logicalHeight / 2 + 100);
    const bossHp = 80 + (level * 15); const baseBossXp = 200 + (level * 50); const brMultiplier = 1 + bloodReckoningReduction * 1.5;
    enemies.push({ x, y, radius: 35, baseSpeed: 0.08, hp: bossHp, maxHp: bossHp, xpDrop: Math.floor(baseBossXp * brMultiplier), dead: false, isBoss: true, poisoned: false, charmed: false, inTar: false, tarTime: 0, rending: false, lastTeslaHit: 0, chill: 0, frozen: 0, splinterSlow: 0, stickySlow: 0, updraftSlow: 0, stunned: 0, tetanus: false, rooted: 0 });
}

function spawnWave() {
    if (isPaused || !isGameStarted) return;
    const minSpawn = Math.max(1000, 3000 - lureSpawnReduction); 
    const maxSpawn = Math.max(2000, 7000 - lureSpawnReduction);
    const delayMult = Math.max(0.2, 1 - bloodReckoningReduction); 
    const nextSpawnDelay = (Math.random() * (maxSpawn - minSpawn) + minSpawn) * delayMult;
    
    if (level % bossLevelThreshold === 0 && lastBossLevel !== level) { 
        lastBossLevel = level; 
        spawnBossEnemy(); 
    } else {
        // Randomize wave composition
        const waveTypeRoll = Math.random();
        let groupSize = Math.floor(Math.random() * (5 + Math.floor(level / 2))) + 3; 
        const hpMult = 1 + (level * 0.20); 
        const spdMult = 1 + (level * 0.08);
        const brMult = 1 + bloodReckoningReduction * 1.5;

        let groupX, groupY;
        if (Math.random() < 0.5) { 
            groupX = Math.random() < 0.5 ? -65 : logicalWidth + 65; 
            groupY = Math.random() * logicalHeight; 
        } else { 
            groupX = Math.random() * logicalWidth; 
            groupY = Math.random() < 0.5 ? -65 : logicalHeight + 65; 
        }

        for (let i = 0; i < groupSize; i++) {
            const x = groupX + (Math.random() - 0.5) * 80; 
            const y = groupY + (Math.random() - 0.5) * 80;
            
            let eType = 'zombie';
            let speed = (0.4 + Math.random() * 0.3) * spdMult; 
            let hp = Math.floor((Math.random() * 11 + 5) * hpMult);
            let radius = 15;
            let range = 0;

            // Determine enemy type based on random roll
            if (waveTypeRoll < 0.2 && level > 2) { 
                // SWARMERS: Fast, weak, small, high count
                eType = 'swarmer'; speed *= 1.8; hp = Math.max(1, Math.floor(hp * 0.3)); radius = 10;
                if (i === 0) groupSize = Math.floor(groupSize * 1.5); 
            } else if (waveTypeRoll < 0.4 && level > 3) {
                // BRUTES: Slow, tanky, large
                eType = 'brute'; speed *= 0.6; hp *= 3; radius = 25;
                if (i === 0) groupSize = Math.max(1, Math.floor(groupSize / 2));
            } else if (waveTypeRoll < 0.6 && level > 4) {
                // RANGED: Skeletons that shoot
                eType = 'ranged'; speed *= 0.8; hp *= 0.8; range = 250;
            }

            enemies.push({ 
                type: eType, x, y, radius, baseSpeed: speed, hp: hp, maxHp: hp, attackRange: range, lastShot: 0,
                xpDrop: Math.floor((hp + speed * 10) * brMult), dead: false, isBoss: false, poisoned: false, 
                charmed: false, inTar: false, tarTime: 0, rending: false, lastTeslaHit: 0, chill: 0, frozen: 0, 
                splinterSlow: 0, stickySlow: 0, updraftSlow: 0, stunned: 0, tetanus: false, rooted: 0 
            });
        }
    }
    spawnTimer = setTimeout(spawnWave, nextSpawnDelay);
}

// --- PHYSICS HELPER ---
function getCollisionData(circle, rect) {
    const dx = circle.x - rect.x; const dy = circle.y - rect.y;
    const localX = dx * Math.cos(-rect.angle) - dy * Math.sin(-rect.angle); const localY = dx * Math.sin(-rect.angle) + dy * Math.cos(-rect.angle);
    const closestX = Math.max(-rect.w/2, Math.min(localX, rect.w/2)); const closestY = Math.max(-rect.h/2, Math.min(localY, rect.h/2));
    const distX = localX - closestX; const distY = localY - closestY; const distanceSquared = distX * distX + distY * distY;
    if (distanceSquared < circle.radius * circle.radius) {
        const distance = Math.sqrt(distanceSquared) || 0.1;
        return { collided: true, overlap: circle.radius - distance, localX, normalX: (distX / distance) * Math.cos(rect.angle) - (distY / distance) * Math.sin(rect.angle), normalY: (distX / distance) * Math.sin(rect.angle) + (distY / distance) * Math.cos(rect.angle) };
    }
    return { collided: false };
}

function distToSegmentSquared(p, v, w) {
    const l2 = (v.x - w.x)*(v.x - w.x) + (v.y - w.y)*(v.y - w.y); if (l2 === 0) return (p.x - v.x)*(p.x - v.x) + (p.y - v.y)*(p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2; t = Math.max(0, Math.min(1, t));
    return (p.x - (v.x + t * (w.x - v.x)))**2 + (p.y - (v.y + t * (w.y - v.y)))**2;
}

function getEnemySprite(enemy) {
    if (enemy.charmed) return ASSETS.zombieCharmed;
    if (enemy.poisoned) return enemy.isBoss ? ASSETS.bossPoisoned : ASSETS.zombiePoisoned;
    return enemy.isBoss ? ASSETS.boss : ASSETS.zombie;
}

function getEnemyDrawBox(enemy, size) {
    if (enemy.type === 'swarmer') return { x: -size * 0.34, y: -size * 0.32, w: size * 0.68, h: size * 0.82 };
    if (enemy.type === 'brute') return { x: -size * 0.62, y: -size * 0.58, w: size * 1.24, h: size * 1.26 };
    if (enemy.type === 'ranged') return { x: -size * 0.48, y: -size * 0.50, w: size * 0.96, h: size * 1.04 };
    return { x: -size / 2, y: -size / 2, w: size, h: size };
}

function drawFallbackEnemy(box, enemy) {
    let bodyColor = '#4caf50';
    let detailColor = '#dcedc8';

    if (enemy.type === 'swarmer') {
        bodyColor = '#8bc34a';
        detailColor = '#fff176';
    } else if (enemy.type === 'brute') {
        bodyColor = '#6d4c41';
        detailColor = '#bcaaa4';
    } else if (enemy.type === 'ranged') {
        bodyColor = '#90a4ae';
        detailColor = '#cfd8dc';
    } else if (enemy.isBoss) {
        bodyColor = '#8d6e63';
        detailColor = '#ffccbc';
    }

    if (enemy.poisoned && !enemy.charmed) {
        bodyColor = '#2e7d32';
        detailColor = '#a5d6a7';
    } else if (enemy.charmed) {
        bodyColor = '#29b6f6';
        detailColor = '#e1f5fe';
    }

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, box.y + box.h * 0.18, box.w * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(box.x + box.w * 0.26, box.y + box.h * 0.20, box.w * 0.48, box.h * 0.42);
    ctx.fillRect(box.x + box.w * 0.10, box.y + box.h * 0.28, box.w * 0.16, box.h * 0.34);
    ctx.fillRect(box.x + box.w * 0.74, box.y + box.h * 0.28, box.w * 0.16, box.h * 0.34);
    ctx.fillRect(box.x + box.w * 0.28, box.y + box.h * 0.60, box.w * 0.16, box.h * 0.36);
    ctx.fillRect(box.x + box.w * 0.56, box.y + box.h * 0.60, box.w * 0.16, box.h * 0.36);

    ctx.fillStyle = detailColor;
    ctx.fillRect(-box.w * 0.11, box.y + box.h * 0.10, box.w * 0.08, box.h * 0.05);
    ctx.fillRect(box.w * 0.03, box.y + box.h * 0.10, box.w * 0.08, box.h * 0.05);
}

function drawEnemyVariantBackdrop(enemy, size) {
    if (enemy.type === 'brute') {
        ctx.fillStyle = 'rgba(84, 110, 122, 0.55)';
        ctx.fillRect(-size * 0.54, -size * 0.16, size * 0.16, size * 0.54);
        ctx.fillRect(size * 0.38, -size * 0.16, size * 0.16, size * 0.54);
        ctx.fillRect(-size * 0.40, -size * 0.46, size * 0.80, size * 0.15);
    } else if (enemy.type === 'ranged') {
        ctx.fillStyle = 'rgba(121, 85, 72, 0.7)';
        ctx.fillRect(-size * 0.28, -size * 0.24, size * 0.08, size * 0.48);
        ctx.fillStyle = 'rgba(255, 245, 157, 0.7)';
        ctx.fillRect(-size * 0.24, -size * 0.18, size * 0.02, size * 0.36);
    }
}

function drawEnemyVariantOverlay(enemy, size) {
    if (enemy.type === 'swarmer') {
        ctx.fillStyle = '#ffee58';
        ctx.fillRect(-size * 0.12, -size * 0.08, size * 0.07, size * 0.05);
        ctx.fillRect(size * 0.05, -size * 0.08, size * 0.07, size * 0.05);
        ctx.strokeStyle = '#fdd835';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-size * 0.18, size * 0.18);
        ctx.lineTo(-size * 0.30, size * 0.34);
        ctx.moveTo(size * 0.18, size * 0.18);
        ctx.lineTo(size * 0.30, size * 0.34);
        ctx.stroke();
    } else if (enemy.type === 'brute') {
        ctx.fillStyle = 'rgba(120, 144, 156, 0.8)';
        ctx.fillRect(-size * 0.34, -size * 0.42, size * 0.68, size * 0.12);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-size * 0.16, -size * 0.16);
        ctx.lineTo(size * 0.10, size * 0.08);
        ctx.moveTo(size * 0.02, -size * 0.20);
        ctx.lineTo(size * 0.22, -size * 0.04);
        ctx.stroke();
    } else if (enemy.type === 'ranged') {
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(size * 0.28, 0, size * 0.18, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.strokeStyle = '#d7ccc8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(size * 0.28, -size * 0.18);
        ctx.lineTo(size * 0.28, size * 0.18);
        ctx.stroke();
        ctx.fillStyle = '#cfd8dc';
        ctx.beginPath();
        ctx.moveTo(size * 0.04, -size * 0.02);
        ctx.lineTo(size * 0.20, -size * 0.10);
        ctx.lineTo(size * 0.16, 0);
        ctx.closePath();
        ctx.fill();
    }
}

function drawEnemyPoisonBubbles(box) {
    if (ASSETS.poisonBubbles.width <= 0) return;

    const frameCount = 5;
    const animationSpeed = 250;
    const currentFrame = Math.floor(Date.now() / animationSpeed) % frameCount;
    const frameWidth = ASSETS.poisonBubbles.width / frameCount;
    const sourceX = currentFrame * frameWidth;

    ctx.drawImage(ASSETS.poisonBubbles, sourceX, 0, frameWidth, ASSETS.poisonBubbles.height, box.x, box.y, box.w, box.h);
}

function drawEnemy(enemy) {
    const size = enemy.radius * 3;
    const box = getEnemyDrawBox(enemy, size);
    const sprite = getEnemySprite(enemy);
    const hasSprite = sprite.complete && sprite.naturalHeight !== 0;
    const statusPad = enemy.type === 'brute' ? size * 0.12 : size * 0.06;
    const healthRatio = Math.max(0, enemy.hp / enemy.maxHp);

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.save();
    if (enemy.charmed) ctx.rotate(Math.atan2(enemy.y - player.y, enemy.x - player.x) + Math.PI / 2);
    else ctx.rotate(Math.atan2(player.y - enemy.y, player.x - enemy.x) + Math.PI / 2);

    if (enemy.frozen > 0 || enemy.stunned > 0) {
        ctx.fillStyle = enemy.frozen > 0 ? 'rgba(129, 212, 250, 0.4)' : 'rgba(255, 215, 0, 0.4)';
        ctx.fillRect(box.x - statusPad, box.y - statusPad, box.w + statusPad * 2, box.h + statusPad * 2);
    }

    drawEnemyVariantBackdrop(enemy, size);

    if (hasSprite) ctx.drawImage(sprite, box.x, box.y, box.w, box.h);
    else drawFallbackEnemy(box, enemy);

    drawEnemyVariantOverlay(enemy, size);

    if (enemy.poisoned && !enemy.charmed) drawEnemyPoisonBubbles(box);

    ctx.restore();

    const bW = enemy.isBoss ? 40 : 20;
    const bO = (enemy.radius * -1.5) - 10;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fillRect(-bW / 2, bO, bW, 4);
    ctx.fillStyle = '#76ff03';
    ctx.fillRect(-bW / 2, bO, bW * healthRatio, 4);
    ctx.restore();
}

function animate() {
    animationId = requestAnimationFrame(animate);
    const currentFrameTime = Date.now();
    const activeTimeDilation = baseTimeDilation * (chronoSurgeActive ? chronoSurgeMult : 1);
    const deltaTime = (currentFrameTime - lastFrameTime) * activeTimeDilation;
    lastFrameTime = currentFrameTime;

    if (!isPaused && isGameStarted) {
        survivalTimeMs += deltaTime; const totalSeconds = Math.floor(survivalTimeMs / 1000);
        formattedTime = `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
        timerDisplay.innerText = formattedTime;
        
        if (currentFrameTime - lastPlaytimeSave >= 5000) {
            let diff = currentFrameTime - lastPlaytimeSave; savedData.unclaimedPlaytime += diff; savedData.totalPlaytime += diff; lastPlaytimeSave = currentFrameTime;
        }

        if (survivalTimeMs >= nextBossTime) { nextBossTime += (300000 - bossTimerReduction); spawnBossEnemy(); }
        if (currentAmmo < maxAmmo && currentFrameTime - lastRechargeTime >= rechargeRate) { currentAmmo++; lastRechargeTime += rechargeRate; updateAmmoUI(); }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.scale(gameScale, gameScale);
    ctx.beginPath(); ctx.arc(player.x, player.y, restrictedRadius, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 0, 0, 0.05)'; ctx.fill(); ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]); 

    // --- STRUCTURE LOGIC ---
    for (let i = structures.length - 1; i >= 0; i--) {
        const struct = structures[i];
        if (struct.expires && currentFrameTime > struct.expires) { structures.splice(i, 1); continue; }
        
        if (!isPaused && isGameStarted) {
            if (struct.type === 'barricade' && livingWoodRegen > 0) {
                if (!struct.lastRegenTick) struct.lastRegenTick = currentFrameTime;
                if (currentFrameTime - struct.lastRegenTick >= 1000) { struct.hp = Math.min(barricadeHP, struct.hp + livingWoodRegen); struct.lastRegenTick = currentFrameTime; }
            } else if (struct.type === 'tesla') {
                if (currentFrameTime - struct.lastTick > 2000) {
                    let inRange = enemies.filter(e => !e.charmed && Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.radius);
                    if (inRange.length > 0) {
                        inRange.sort(() => Math.random() - 0.5); const zapCount = Math.min(1 + voltaicChainLevel, inRange.length);
                        for (let z = 0; z < zapCount; z++) {
                            const target = inRange[z]; target.hp -= (teslaDamage + (target.inTar ? brittlePitchLevel : 0)); 
                            if (staticFieldStun > 0) target.stunned = staticFieldStun;
                            target.lastTeslaHit = currentFrameTime;
                            if (target.hp <= 0) target.dead = true;
                            visualEffects.push({ type: 'lightning', x1: struct.x, y1: struct.y, x2: target.x, y2: target.y, expires: currentFrameTime + 150 });
                        }
                        struct.lastTick = currentFrameTime;
                    }
                }
            } else if (struct.type === 'plague') {
                enemies.forEach(e => { if (!e.charmed && Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.radius) e.poisoned = true; });
            } else if (struct.type === 'wind') {
                if (currentFrameTime - struct.lastTick > (3000 * swiftBreezesCd)) {
                    enemies.forEach(e => {
                        let dist = Math.hypot(e.x - struct.x, e.y - struct.y);
                        if (dist <= struct.radius && !e.charmed) {
                            let angle = Math.atan2(e.y - struct.y, e.x - struct.x); e.x += Math.cos(angle) * (50 + galeForceLevel * 10); e.y += Math.sin(angle) * (50 + galeForceLevel * 10);
                            if (updraftSlow > 0) e.updraftSlow = 1500;
                            if (cuttingWindsDmg > 0) { e.hp -= cuttingWindsDmg; if (e.hp <= 0) e.dead = true; }
                        }
                    });
                    visualEffects.push({ type: 'explosion', x: struct.x, y: struct.y, radius: struct.radius, expires: currentFrameTime + 200, color: 'rgba(255, 255, 255, 0.4)' });
                    struct.lastTick = currentFrameTime;
                }
            } else if (struct.type === 'fire_pool' || struct.type === 'tar') {
                if (struct.type === 'tar' && struct.onFire && currentFrameTime > struct.onFire) struct.onFire = 0;
                if (struct.type === 'fire_pool' || struct.onFire) {
                    enemies.forEach(e => {
                        if (!e.charmed && Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.w) { e.hp -= 0.5; if (e.hp <= 0) e.dead = true; }
                    });
                }
            } else if (struct.type === 'mending' || struct.type === 'charm') {
                let localCdMult = 1;
                if (soulBatteryReduction > 0) {
                    structures.forEach(s => { if (s.type === 'soul' && Math.hypot(struct.x - s.x, struct.y - s.y) <= s.radius) localCdMult -= soulBatteryReduction; });
                    localCdMult = Math.max(0.1, localCdMult); 
                }
                if (struct.type === 'mending') {
                    if (currentFrameTime - struct.lastTick > (mendingCooldown * localCdMult)) { 
                        if (health < maxHealth) { health++; updateHealthUI(); } 
                        else if (overhealMax > 0 && towerShield < overhealMax) { towerShield++; }
                        if (arcaneStimulationActive) { currentAmmo = Math.min(maxAmmo, currentAmmo + 1); updateAmmoUI(); }
                        struct.lastTick = currentFrameTime;
                    }
                } else if (struct.type === 'charm') {
                    if (currentFrameTime - struct.lastTick > (charmCooldown * localCdMult)) {
                        const inRange = enemies.filter(e => !e.charmed && !e.isBoss && Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.radius);
                        if (inRange.length > 0) {
                            const target = inRange[Math.floor(Math.random() * inRange.length)]; target.charmed = true; struct.lastTick = currentFrameTime;
                            visualEffects.push({ type: 'charm_beam', x1: struct.x, y1: struct.y, x2: target.x, y2: target.y, expires: currentFrameTime + 200 });
                        }
                    }
                }
            }
        }

        ctx.save(); ctx.translate(struct.x, struct.y); ctx.rotate(struct.angle);
        if (struct.type === 'barricade') { ctx.fillStyle = '#8B4513'; ctx.fillRect(-struct.w/2, -struct.h/2, struct.w, struct.h); ctx.strokeStyle = '#5C3317'; ctx.lineWidth = 3; ctx.strokeRect(-struct.w/2, -struct.h/2, struct.w, struct.h); } 
        else if (struct.type === 'tar') { 
            if (ASSETS.tarPit.complete && ASSETS.tarPit.naturalHeight !== 0) { ctx.drawImage(ASSETS.tarPit, -struct.w/2, -struct.h/2, struct.w, struct.h); } else { ctx.fillStyle = 'rgba(30, 30, 30, 0.7)'; ctx.fillRect(-struct.w/2, -struct.h/2, struct.w, struct.h); }
            if (struct.onFire) { ctx.fillStyle = 'rgba(255,69,0,0.4)'; ctx.fillRect(-struct.w/2, -struct.h/2, struct.w, struct.h); }
        } 
        else if (struct.type === 'wire') { ctx.fillStyle = 'rgba(150, 150, 150, 0.3)'; ctx.fillRect(-struct.w/2, -struct.h/2, struct.w, struct.h); ctx.strokeStyle = '#777777'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.strokeRect(-struct.w/2, -struct.h/2, struct.w, struct.h); ctx.setLineDash([]); } 
        else if (struct.type === 'tesla') { ctx.fillStyle = '#00e5ff'; ctx.beginPath(); ctx.arc(0, 0, struct.w/2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'rgba(0, 229, 255, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill(); } 
        else if (struct.type === 'plague') { ctx.fillStyle = '#1b5e20'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 15); ctx.lineTo(-15, 15); ctx.fill(); ctx.fillStyle = 'rgba(27, 94, 32, 0.2)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill(); } 
        else if (struct.type === 'soul') { ctx.fillStyle = '#aa00ff'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.fill(); ctx.fillStyle = 'rgba(170, 0, 255, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill(); } 
        else if (struct.type === 'mending') { if (ASSETS.mendingWard.complete && ASSETS.mendingWard.naturalHeight !== 0) { ctx.drawImage(ASSETS.mendingWard, -15, -45, 30, 60); } } 
        else if (struct.type === 'charm') { ctx.fillStyle = '#29b6f6'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 5); ctx.lineTo(-15, 5); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(15, -5); ctx.lineTo(-15, -5); ctx.fill(); ctx.fillStyle = 'rgba(41, 182, 246, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill(); } 
        else if (struct.type === 'wind') { ctx.fillStyle = '#b0bec5'; ctx.beginPath(); ctx.arc(0, 0, struct.w/2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'rgba(176, 190, 197, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill(); } 
        else if (struct.type === 'decoy') { ctx.fillStyle = '#5d4037'; ctx.fillRect(-struct.w/2, -struct.h/2, struct.w, struct.h); ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 2; ctx.strokeRect(-struct.w/2, -struct.h/2, struct.w, struct.h); ctx.strokeStyle = 'rgba(93, 64, 55, 0.2)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.stroke(); } 
        else if (struct.type === 'frost') { ctx.fillStyle = 'rgba(129, 212, 250, 0.5)'; ctx.fillRect(-struct.w/2, -struct.h/2, struct.w, struct.h); ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2; ctx.strokeRect(-struct.w/2, -struct.h/2, struct.w, struct.h); } 
        else if (struct.type === 'focus') { ctx.fillStyle = '#ce93d8'; ctx.beginPath(); ctx.moveTo(0, -struct.h/2); ctx.lineTo(struct.w/2, 0); ctx.lineTo(0, struct.h/2); ctx.lineTo(-struct.w/2, 0); ctx.fill(); ctx.fillStyle = 'rgba(206, 147, 216, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill(); } 
        else if (struct.type === 'crucible') { ctx.fillStyle = '#424242'; ctx.beginPath(); ctx.arc(0, 0, struct.w/2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#ffca28'; ctx.beginPath(); ctx.arc(0, 0, struct.w/4, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'rgba(255, 202, 40, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, struct.radius, 0, Math.PI*2); ctx.fill(); } 
        else if (struct.type === 'meteor') { ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.arc(0, 0, struct.w/2, 0, Math.PI*2); ctx.fill(); } 
        else if (struct.type === 'fire_pool') { ctx.fillStyle = 'rgba(255, 87, 34, 0.4)'; ctx.beginPath(); ctx.arc(0, 0, struct.w, 0, Math.PI*2); ctx.fill(); }
        ctx.restore();
        
        if (struct.hp <= 0 && struct.type !== 'fire_pool') {
            if (struct.type === 'barricade' && barricadeExplosionDamage > 0) {
                enemies.forEach(e => { if (!e.charmed && Math.hypot(e.x - struct.x, e.y - struct.y) <= 80) { e.hp -= (barricadeExplosionDamage + (e.inTar ? brittlePitchLevel : 0)); if (e.hp <= 0) e.dead = true; } });
                visualEffects.push({ type: 'explosion', x: struct.x, y: struct.y, radius: 80, expires: currentFrameTime + 200, color: 'rgba(255, 69, 0, 0.5)' });
            } else if (struct.type === 'meteor') {
                let mKills = 0;
                enemies.forEach(e => { if (Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.radius) { e.hp -= 500; if (impactTremorsStun > 0) e.stunned = impactTremorsStun; if (e.hp <= 0) { e.dead = true; mKills++; } } });
                visualEffects.push({ type: 'explosion', x: struct.x, y: struct.y, radius: struct.radius, expires: currentFrameTime + 500, color: 'rgba(255, 112, 67, 0.8)' });
                if (scorchedEarthActive) structures.push({ type: 'fire_pool', x: struct.x, y: struct.y, w: struct.radius, h: struct.radius, hp: 9999, expires: currentFrameTime + 5000 });
                if (mKills >= armageddonKills) { setTimeout(() => {
                    enemies.forEach(e => { if (Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.radius*0.5) { e.hp -= 300; if (e.hp <= 0) e.dead = true; } });
                    visualEffects.push({ type: 'explosion', x: struct.x, y: struct.y, radius: struct.radius*0.5, expires: Date.now() + 500, color: 'rgba(255, 112, 67, 0.9)' });
                }, 2000); }
            } else if (struct.type === 'decoy') {
                if (splinteringMockeryActive) { enemies.forEach(e => { if (Math.hypot(e.x - struct.x, e.y - struct.y) <= struct.radius) e.splinterSlow = 3000; }); visualEffects.push({ type: 'explosion', x: struct.x, y: struct.y, radius: struct.radius, expires: currentFrameTime + 200, color: 'rgba(141, 110, 99, 0.5)' }); }
                if (illusoryDoubleHp > 0) structures.push({ type: 'decoy', x: struct.x + 20, y: struct.y + 20, w: 20, h: 40, angle: 0, hp: (150 + wardHPBonus + reinforcedBarkHp) * illusoryDoubleHp, radius: struct.radius * 0.7, hitZombies: new Map(), lastTick: currentFrameTime });
            } else if (struct.type === 'mending' && martyrsGraceHeal > 0) {
                health = Math.min(maxHealth, health + martyrsGraceHeal); updateHealthUI();
                visualEffects.push({ type: 'explosion', x: struct.x, y: struct.y, radius: struct.radius, expires: currentFrameTime + 200, color: 'rgba(255, 215, 0, 0.5)' });
            }
            structures.splice(i, 1); 
        }
    }

    // --- SPELLS LOGIC ---
    if (!isPaused && isGameStarted) {
        spells.forEach((spell, index) => {
            if (spell.state === 'flying') {
                spell.progress += 15 / spell.distance;
                const gx = spell.startX + (spell.targetX - spell.startX) * spell.progress;
                const gy = spell.startY + (spell.targetY - spell.startY) * spell.progress;
                const ay = gy - Math.sin(spell.progress * Math.PI) * spell.arcHeight;

                if (zephyrsBlessingDmg > 1) {
                    structures.forEach(s => { if (s.type === 'wind' && Math.hypot(gx - s.x, gy - s.y) <= s.radius && !spell.zephyrBoosted) { spell.damageBonus += Math.floor(spellDamageBonus * (zephyrsBlessingDmg - 1)); spell.zephyrBoosted = true; spell.progress = 1; } });
                }

                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.beginPath(); ctx.ellipse(gx, gy, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff4500'; ctx.beginPath(); ctx.arc(gx, ay, 12, 0, Math.PI * 2); ctx.fill();

                if (spell.progress >= 1) spell.state = 'exploding';
            } else if (spell.state === 'exploding') {
                spell.radius += 4; 
                if (flammablePitchDuration > 0) { structures.forEach(s => { if (s.type === 'tar' && Math.hypot(spell.targetX - s.x, spell.targetY - s.y) <= spell.radius + s.w/2) s.onFire = currentFrameTime + flammablePitchDuration; }); }
                if (conduitStrikeBounces > 0) { structures.forEach(s => { if (s.type === 'tesla' && Math.hypot(spell.targetX - s.x, spell.targetY - s.y) <= spell.radius + s.w/2 && !spell.triggeredTesla) { spell.triggeredTesla = true; let inRange = enemies.filter(e => !e.charmed && Math.hypot(e.x - s.x, e.y - s.y) <= s.radius); if (inRange.length > 0) { inRange.sort(() => Math.random() - 0.5); const zapCount = Math.min(conduitStrikeBounces, inRange.length); for (let z = 0; z < zapCount; z++) { const target = inRange[z]; target.hp -= teslaDamage; target.lastTeslaHit = currentFrameTime; if (target.hp <= 0) target.dead = true; visualEffects.push({ type: 'lightning', x1: s.x, y1: s.y, x2: target.x, y2: target.y, expires: currentFrameTime + 150 }); } } } }); }

                enemies.forEach(e => {
                    if (e.dead || e.charmed) return; 
                    if (Math.hypot(spell.targetX - e.x, spell.targetY - e.y) < spell.radius + e.radius && !spell.hitEnemies.has(e)) {
                        spell.hitEnemies.add(e); 
                        let dmg = Math.floor(Math.random() * 4) + 3 + spell.damageBonus + (e.inTar ? brittlePitchLevel : 0);
                        if (shatterStrikeActive && e.frozen > 0) dmg *= 2;
                        if (rendingBarbsActive && e.rending) dmg *= 1.5;
                        e.hp -= dmg;
                        if (e.hp <= 0) {
                            e.dead = true;
                            if (Math.random() < vampiricChance && health < maxHealth) { health++; updateHealthUI(); }
                            if (spell.isFromFocus && arcaneConduitAmmo > 0) { currentAmmo = Math.min(maxAmmo, currentAmmo + arcaneConduitAmmo); updateAmmoUI(); }
                        }
                    }
                });

                for (let c = crystals.length - 1; c >= 0; c--) {
                    const crystal = crystals[c];
                    if (Math.hypot(spell.targetX - crystal.x, spell.targetY - crystal.y) < spell.radius + crystal.radius && !spell.hitEnemies.has(crystal)) {
                        spell.hitEnemies.add(crystal); crystal.hp -= (Math.floor(Math.random() * 4) + 3 + spell.damageBonus);
                        if (crystal.hp <= 0) {
                            crystals.splice(c, 1);
                            if (crystalsSpawned && crystals.length === 0 && !victoryAchieved) {
                                if (savedData.prestigeUpgrades.trueEnding > 0 && bossesKilled < 15) { crystalsSpawned = false; } else {
                                    victoryAchieved = true; isPaused = true; clearTimeout(spawnTimer);
                                    let diff = Date.now() - lastPlaytimeSave; savedData.unclaimedWins += 1; savedData.unclaimedPlaytime += diff; savedData.totalPlaytime += diff; saveGame(); updatePrestigeUI(); canvas.style.cursor = 'default';
                                    if (savedData.prestigeUpgrades.trueEnding > 0 && bossesKilled >= 15) {
                                        let totalSecs = Math.floor(savedData.totalPlaytime / 1000); let hours = Math.floor(totalSecs / 3600); let minutes = Math.floor((totalSecs % 3600) / 60); let runPP = Math.floor(survivalTimeMs / 3600000) + 2; 
                                        document.getElementById('tvTotalTimeEl').innerText = `${hours}h ${minutes}m`; document.getElementById('tvDeathsEl').innerText = savedData.totalDeaths; document.getElementById('tvRunGoldEl').innerText = runGold; document.getElementById('tvRunPPEl').innerText = runPP; document.getElementById('trueVictoryModal').style.display = 'flex';
                                    } else { document.getElementById('victoryModal').style.display = 'flex'; }
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
                            let newTarget = validTargets[0]; spell.bounceHistory.add(newTarget); let dist = Math.hypot(newTarget.x - spell.targetX, newTarget.y - spell.targetY);
                            spells.push({ startX: spell.targetX, startY: spell.targetY, targetX: newTarget.x, targetY: newTarget.y, distance: dist, progress: 0, arcHeight: Math.min(dist * 0.4, 150), radius: 0, maxRadius: spell.maxRadius * 0.8, state: 'flying', hitEnemies: new Set(), bounces: spell.bounces - 1, bounceHistory: new Set(spell.bounceHistory), damageBonus: spell.damageBonus, isFromFocus: spell.isFromFocus });
                        }
                    }
                    setTimeout(() => spells.splice(index, 1), 0);
                }
            }
        });

        // --- ENEMY LOGIC ---
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];

            if (e.poisoned && !e.charmed) { e.hp -= (poisonTickDamage * miasmaCloudSpeed); if (e.hp <= 0) e.dead = true; }
            if (e.tetanus) { e.hp -= (tetanusDamage * (deltaTime / 1000)); if (e.hp <= 0) e.dead = true; }

            if (e.dead) {
                killCount++;
                if (e.isBoss) { 
                    savedData.gold += 2 + bossGoldBonus + bountyHunterBonus; runGold += 2 + bossGoldBonus + bountyHunterBonus; saveGame(); updateGoldUI(); bossesKilled++; 
                    triggerRandomWeather(); // WEATHER TRIGGERED HERE
                    if (bossesKilled === 10 && !crystalsSpawned) { crystalsSpawned = true; spawnCrystals(1); } else if (bossesKilled === 15 && !crystalsSpawned && savedData.prestigeUpgrades.trueEnding > 0) { crystalsSpawned = true; spawnCrystals(2); }
                } 
                else if (killCount % goldDropThreshold === 0) { savedData.gold += 1; runGold += 1; saveGame(); updateGoldUI(); }

                // Voltaic Feedback Logic
                if (currentFrameTime - e.lastTeslaHit < 500 && voltaicFeedbackZaps > 0) {
                    let nearby = enemies.filter(o => !o.dead && !o.charmed && Math.hypot(o.x - e.x, o.y - e.y) <= 150);
                    if (nearby.length > 0) {
                        nearby.sort(() => Math.random() - 0.5);
                        let zaps = Math.min(voltaicFeedbackZaps, nearby.length);
                        for(let z=0; z<zaps; z++) {
                            nearby[z].hp -= (teslaDamage / 2);
                            if(nearby[z].hp <= 0) nearby[z].dead = true;
                            visualEffects.push({ type: 'lightning', x1: e.x, y1: e.y, x2: nearby[z].x, y2: nearby[z].y, expires: currentFrameTime + 150 });
                        }
                    }
                }

                let inCrucible = false; let finalXp = e.xpDrop;
                if (e.wireHit && bloodlettingXp > 0) finalXp *= (1 + bloodlettingXp);

                structures.forEach(s => { 
                    if (s.type === 'soul' && Math.hypot(e.x - s.x, e.y - s.y) <= s.radius) { finalXp *= soulMultiplier; if (Math.random() < soulEchoesChance) finalXp += 50; }
                    if (s.type === 'crucible' && Math.hypot(e.x - s.x, e.y - s.y) <= s.radius) inCrucible = true;
                });

                if (Math.random() < overloadChance) finalXp *= 2;
                
                if (inCrucible) {
                    let goldChance = 0.01 + (transmutationLevel * 0.005) + (Math.floor(savedData.gold / 10) * greedsRewardScale);
                    if (Math.random() < goldChance) {
                        savedData.gold++; runGold++; if (philosophersStoneActive && health < maxHealth) { health++; updateHealthUI(); } saveGame(); updateGoldUI();
                    } else if (foolsGoldChance > 0 && Math.random() < foolsGoldChance) {
                        currentAmmo = Math.min(maxAmmo, currentAmmo + 1); updateAmmoUI();
                    }
                }

                if (e.poisoned && Math.random() < contagionChance) {
                    let closest = null, closestDist = Infinity;
                    for(let j=0; j<enemies.length; j++) { if(i!==j && !enemies[j].poisoned && !enemies[j].charmed && !enemies[j].dead) { let dist = Math.hypot(e.x - enemies[j].x, e.y - enemies[j].y); if (dist < closestDist) { closestDist = dist; closest = enemies[j]; } } }
                    if (closest) closest.poisoned = true;
                }

                if (e.charmed && undeadBetrayalDmg > 0) {
                    enemies.forEach(other => { if (!other.charmed && Math.hypot(e.x - other.x, e.y - other.y) <= 80) { other.hp -= undeadBetrayalDmg; if (other.hp <= 0) other.dead = true; } });
                    visualEffects.push({ type: 'explosion', x: e.x, y: e.y, radius: 80, expires: currentFrameTime + 200, color: 'rgba(41, 182, 246, 0.5)' });
                }

                if (e.frozen > 0 && iceShardsCount > 0) {
                    for(let i=0; i<iceShardsCount; i++) {
                        let target = enemies[Math.floor(Math.random()*enemies.length)];
                        if(target && !target.dead && !target.charmed) { target.hp -= 10; target.chill += 500; if (target.hp <= 0) target.dead = true; visualEffects.push({ type: 'lightning', x1: e.x, y1: e.y, x2: target.x, y2: target.y, expires: currentFrameTime + 150 }); }
                    }
                }

                addXp(finalXp); enemies.splice(i, 1); continue; 
            }

            let speedModifier = 1; let hitTarget = null; e.inTar = false; e.wireHit = false;
            let closestDecoyDist = Infinity; let activeDecoy = null;
            structures.forEach(s => { if (s.type === 'decoy') { let dist = Math.hypot(e.x - s.x, e.y - s.y); if (dist <= s.radius && dist < closestDecoyDist) { closestDecoyDist = dist; activeDecoy = s; } } });

            let targetAngle = Math.atan2(player.y - e.y, player.x - e.x);
            if (activeDecoy && !e.charmed) targetAngle = Math.atan2(activeDecoy.y - e.y, activeDecoy.x - e.x);

            if (e.charmed) {
                speedModifier = 1.2 * (1 + frenziedThrallsBonus); let closestDist = Infinity; let closestEnemy = null;
                for (let j = 0; j < enemies.length; j++) { const other = enemies[j]; if (i !== j && !other.charmed && !other.dead) { const dist = Math.hypot(other.x - e.x, other.y - e.y); if (dist < closestDist) { closestDist = dist; closestEnemy = other; } } }
                if (closestEnemy) { targetAngle = Math.atan2(closestEnemy.y - e.y, closestEnemy.x - e.x); if (closestDist < e.radius + closestEnemy.radius + 2) { closestEnemy.hp -= (2 * zealousConvertsDmg * (1 + frenziedThrallsBonus)); e.hp -= 1; if (closestEnemy.hp <= 0) closestEnemy.dead = true; if (e.hp <= 0) e.dead = true; } } else { targetAngle = Math.atan2(e.y - player.y, e.x - player.x); }
            } else {
                structures.forEach(struct => {
                    if (struct.type === 'tar' || struct.type === 'frost') {
                        if (getCollisionData(e, struct).collided) {
                            if (struct.type === 'tar') { speedModifier *= tarSpeedMod; e.inTar = true; e.stickySlow = 2000; }
                            if (struct.type === 'frost') { e.chill += deltaTime; if (e.chill > 2000 / flashFreezeSpeed) { e.frozen = 2000 + (deepFreezeLevel * 500); e.chill = 0; } if (e.frozen <= 0) speedModifier *= (0.7 - bitingColdSlow); }
                        }
                    } else if (struct.type !== 'plague' && struct.type !== 'tesla' && struct.type !== 'charm' && struct.type !== 'wind' && struct.type !== 'fire_pool' && struct.type !== 'soul' && struct.type !== 'mending' && struct.type !== 'crucible' && struct.type !== 'focus') {
                        const col = getCollisionData(e, struct);
                        if (col.collided) {
                            if (struct.type === 'wire') {
                                e.wireHit = true; if (rendingBarbsActive) e.rending = true;
                                const lastHitTime = struct.hitZombies.get(e) || 0;
                                if (currentFrameTime - lastHitTime >= 500) {
                                    struct.hitZombies.set(e, currentFrameTime); e.hp -= (Math.floor(Math.random() * 6) + 5 + wireDamageBonus + (e.inTar ? brittlePitchLevel : 0));
                                    if (tetanusDamage > 0) e.tetanus = true;
                                    if (tangledBarbsChance > 0 && Math.random() < tangledBarbsChance) e.rooted = 1000;
                                    if (e.hp <= 0) e.dead = true;
                                }
                            } else if (struct.type === 'barricade') {
                                if (Math.random() < (kineticRepulsionLevel * 0.10)) { e.x += col.normalX * 40; e.y += col.normalY * 40; } else { hitTarget = struct; e.x += col.normalX * col.overlap; e.y += col.normalY * col.overlap; }
                            } else { hitTarget = struct; e.x += col.normalX * col.overlap; e.y += col.normalY * col.overlap; }
                        }
                    }
                });

                if (hitTarget) {
                    let structDmg = e.isBoss ? 2.5 : 0.5;
                    if (e.poisoned && noxiousWeaknessActive) structDmg /= 2;

                    if (hitTarget.type === 'barricade' && Math.random() < stalwartDeflectionChance) {
                        // Dodged the hit!
                    } else {
                        hitTarget.hp -= structDmg;
                    }

                    if (hitTarget.type === 'barricade' && ironbarkDamage > 0) { e.hp -= ironbarkDamage; if (e.hp <= 0) e.dead = true; }
                    if (hitTarget.type === 'decoy' && thornyCarvingsDmg > 0) { e.hp -= thornyCarvingsDmg; if (e.hp <= 0) e.dead = true; }
                }

                if (Math.hypot(player.x - e.x, player.y - e.y) - e.radius - 30 < 1) {
                    enemies.splice(i, 1); 
                    let dmgIn = e.isBoss ? 40 : 10;
                    if (e.poisoned && noxiousWeaknessActive) dmgIn /= 2;

                    if (towerShield > 0) { let block = Math.min(towerShield, dmgIn); towerShield -= block; dmgIn -= block; }
                    health -= dmgIn; chronoSurgeActive = false; updateHealthUI(); continue; 
                }
            }

            // Heatwave overrides Tar slow
            if (currentWeather === 'Heatwave' && e.inTar) {
                speedModifier /= tarSpeedMod;
                e.hp -= 1; // Burn them instead
                if (e.hp <= 0) e.dead = true;
            }

            // Apply Fossilized Pitch logic
            if (e.inTar) {
                e.tarTime += deltaTime;
                if (fossilizedPitchActive && e.tarTime >= 3000) {
                    e.stunned = 2000; e.tarTime = 0;
                }
            } else {
                e.tarTime = 0;
            }

            if (e.frozen > 0) { e.frozen -= deltaTime; speedModifier = 0; }
            if (e.stunned > 0) { e.stunned -= deltaTime; speedModifier = 0; }
            if (e.rooted > 0) { e.rooted -= deltaTime; speedModifier = 0; }
            if (e.splinterSlow > 0) { e.splinterSlow -= deltaTime; speedModifier *= 0.7; }
            if (e.updraftSlow > 0) { e.updraftSlow -= deltaTime; speedModifier *= (1 - updraftSlow); }
            if (!e.inTar && e.stickySlow > 0) { e.stickySlow -= deltaTime; speedModifier *= (1 - stickyResidueSlow); }

            // NEW MOVEMENT LOGIC
            const distToTower = Math.hypot(player.x - e.x, player.y - e.y);
            if (e.type === 'ranged' && !e.charmed && distToTower <= e.attackRange) {
                // Stop moving, shoot an arrow
                if (currentFrameTime - e.lastShot > 2000) {
                    enemyProjectiles.push({ 
                        x: e.x, y: e.y, targetX: player.x, targetY: player.y, speed: 4 
                    });
                    e.lastShot = currentFrameTime;
                }
            } else {
                e.x += Math.cos(targetAngle) * e.baseSpeed * speedModifier; 
                e.y += Math.sin(targetAngle) * e.baseSpeed * speedModifier;
            }
        }

        // --- ENEMY PROJECTILES ---
        for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
            let p = enemyProjectiles[i];
            let angle = Math.atan2(p.targetY - p.y, p.targetX - p.x);
            p.x += Math.cos(angle) * p.speed;
            p.y += Math.sin(angle) * p.speed;

            // Collision with tower
            if (Math.hypot(player.x - p.x, player.y - p.y) <= restrictedRadius) {
                health -= 5; 
                updateHealthUI();
                enemyProjectiles.splice(i, 1);
            }
        }
    }

    if (isGameStarted) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (!enemies[i].dead) drawEnemy(enemies[i]);
        }

        enemyProjectiles.forEach(projectile => {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // --- WEATHER DRAWING ---
    updateAndDrawWeather(ctx, currentFrameTime);

    // --- DRAW THE TOWER ---
    const tw = 60, th = 80;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.beginPath(); ctx.ellipse(player.x, player.y + th/2, tw/2 + 10, 15, 0, 0, Math.PI * 2); ctx.fill();
    if (ASSETS.playerTower.complete && ASSETS.playerTower.naturalHeight !== 0) ctx.drawImage(ASSETS.playerTower, player.x - tw/2, player.y - th/2, tw, th);

    const hpW = 60, hpH = 8, hpX = player.x - hpW/2, hpY = player.y - th/2 - 30;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(hpX, hpY, hpW, hpH);
    ctx.fillStyle = '#e94560'; ctx.fillRect(hpX, hpY, hpW * (health / maxHealth), hpH);
    if (towerShield > 0) { ctx.fillStyle = 'rgba(0, 229, 255, 0.8)'; ctx.fillRect(hpX, hpY, hpW * (towerShield / overhealMax), hpH); }
    ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.strokeRect(hpX, hpY, hpW, hpH);

    spells.forEach(spell => { if (spell.state === 'exploding') { ctx.fillStyle = `rgba(255, 69, 0, ${1 - (spell.radius / spell.maxRadius)})`; ctx.beginPath(); ctx.arc(spell.targetX, spell.targetY, spell.radius, 0, Math.PI * 2); ctx.fill(); } });

    for (let i = visualEffects.length - 1; i >= 0; i--) {
        const effect = visualEffects[i];
        if (currentFrameTime > effect.expires) { visualEffects.splice(i, 1); continue; }
        if (effect.type === 'lightning') { ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(effect.x1, effect.y1); const midX = (effect.x1 + effect.x2) / 2 + (Math.random() - 0.5) * 20; const midY = (effect.y1 + effect.y2) / 2 + (Math.random() - 0.5) * 20; ctx.lineTo(midX, midY); ctx.lineTo(effect.x2, effect.y2); ctx.stroke(); } 
        else if (effect.type === 'explosion') { const life = Math.max(0, (effect.expires - currentFrameTime) / 200); ctx.fillStyle = effect.color || `rgba(255, 69, 0, ${life * 0.5})`; ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2); ctx.fill(); } 
        else if (effect.type === 'charm_beam') { ctx.strokeStyle = '#29b6f6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(effect.x1, effect.y1); ctx.lineTo(effect.x2, effect.y2); ctx.stroke(); }
    }

    // --- DRAW THE CRYSTALS ---
    crystals.forEach(c => {
        ctx.save(); ctx.translate(c.x, c.y); 
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; ctx.fillRect(-25, -50, 50, 5); ctx.fillStyle = '#ffd700'; ctx.fillRect(-25, -50, 50 * (c.hp / c.maxHp), 5); ctx.fillStyle = 'rgba(170, 0, 255, 0.7)'; ctx.strokeStyle = '#e040fb'; ctx.lineWidth = 3; ctx.shadowBlur = 15; ctx.shadowColor = '#aa00ff';
        ctx.beginPath(); ctx.moveTo(0, -c.radius); ctx.lineTo(c.radius, 0); ctx.lineTo(0, c.radius); ctx.lineTo(-c.radius, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore(); 
    });

    // --- DRAW RETICLE / BLUEPRINTS ---
    if (currentBlueprint) {
        let w = 40, h = 40, radius = 0;
        if (currentBlueprint === 'barricade') { w = 80; h = 20; } else if (currentBlueprint === 'tar') { w = 120; h = 120; } else if (currentBlueprint === 'wire') { w = 150; h = 40; } else if (currentBlueprint === 'tesla') { radius = 150; } else if (currentBlueprint === 'plague') { radius = plagueRadius; } else if (currentBlueprint === 'soul') { radius = 150 * wideNetRad; } else if (currentBlueprint === 'charm') { radius = 150 * charismaticReachRad; } else if (currentBlueprint === 'wind') { w = 30; h = 30; radius = 100; } else if (currentBlueprint === 'decoy') { w = 30; h = 60; radius = 150 + (loudCarvingsLevel * 15); } else if (currentBlueprint === 'frost') { w = 120; h = 120; } else if (currentBlueprint === 'focus') { w = 40; h = 40; radius = 100 * (1 + (resonantGemLevel * 0.10)); } else if (currentBlueprint === 'crucible') { w = 50; h = 50; radius = 120 * gildedRadiusRad; } else if (currentBlueprint === 'meteor') { w = 60; h = 60; radius = 300 * (1 + (astralPayloadLevel * 0.15)); }

        ctx.save(); ctx.translate(mouseX, mouseY); ctx.rotate(blueprintAngle);
        if (Math.hypot(player.x - mouseX, player.y - mouseY) <= restrictedRadius) { 
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; ctx.strokeStyle = 'red'; ctx.fillRect(-w/2, -h/2, w, h); ctx.lineWidth = 2; ctx.strokeRect(-w/2, -h/2, w, h);
        } else {
            if (currentBlueprint === 'barricade') { ctx.fillStyle = 'rgba(139, 69, 19, 0.5)'; ctx.strokeStyle = 'white'; ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h); } 
            else if (currentBlueprint === 'tar') { ctx.globalAlpha = 0.5; if (ASSETS.tarPit.complete && ASSETS.tarPit.naturalHeight !== 0) ctx.drawImage(ASSETS.tarPit, -w/2, -h/2, w, h); else { ctx.fillStyle = 'rgba(30, 30, 30, 0.5)'; ctx.fillRect(-w/2, -h/2, w, h); } ctx.globalAlpha = 1.0; ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.strokeRect(-w/2, -h/2, w, h); } 
            else if (currentBlueprint === 'wire') { ctx.fillStyle = 'rgba(150, 150, 150, 0.3)'; ctx.strokeStyle = 'white'; ctx.setLineDash([5, 5]); ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h); }
            else if (currentBlueprint === 'tesla') { ctx.fillStyle = 'rgba(0, 229, 255, 0.5)'; ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(0, 229, 255, 0.1)'; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'plague') { ctx.fillStyle = 'rgba(27, 94, 32, 0.7)'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 15); ctx.lineTo(-15, 15); ctx.fill(); ctx.fillStyle='rgba(27, 94, 32, 0.2)'; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'soul') { ctx.fillStyle = 'rgba(170, 0, 255, 0.5)'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.fill(); ctx.fillStyle='rgba(170, 0, 255, 0.1)'; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'mending') { ctx.globalAlpha = 0.5; if (ASSETS.mendingWard.complete && ASSETS.mendingWard.naturalHeight !== 0) ctx.drawImage(ASSETS.mendingWard, -15, -45, 30, 60); else { ctx.fillStyle = 'rgba(255, 215, 0, 0.5)'; ctx.fillRect(-15, -15, 30, 30); } ctx.globalAlpha = 1.0; }
            else if (currentBlueprint === 'charm') { ctx.fillStyle = 'rgba(41, 182, 246, 0.5)'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 5); ctx.lineTo(-15, 5); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(15, -5); ctx.lineTo(-15, -5); ctx.fill(); ctx.fillStyle = 'rgba(41, 182, 246, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'wind') { ctx.fillStyle = 'rgba(176, 190, 197, 0.5)'; ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(176, 190, 197, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'decoy') { ctx.fillStyle = 'rgba(93, 64, 55, 0.5)'; ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h); ctx.strokeStyle = 'rgba(93, 64, 55, 0.2)'; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.stroke(); }
            else if (currentBlueprint === 'frost') { ctx.fillStyle = 'rgba(129, 212, 250, 0.5)'; ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h); }
            else if (currentBlueprint === 'focus') { ctx.fillStyle = 'rgba(206, 147, 216, 0.5)'; ctx.beginPath(); ctx.moveTo(0, -h/2); ctx.lineTo(w/2, 0); ctx.lineTo(0, h/2); ctx.lineTo(-w/2, 0); ctx.fill(); ctx.fillStyle='rgba(206, 147, 216, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'crucible') { ctx.fillStyle = 'rgba(66, 66, 66, 0.5)'; ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'rgba(255, 202, 40, 0.5)'; ctx.beginPath(); ctx.arc(0, 0, w/4, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(255, 202, 40, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill(); }
            else if (currentBlueprint === 'meteor') { ctx.fillStyle = 'rgba(255, 112, 67, 0.5)'; ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.fill(); }
        }
        ctx.restore();
    } else if (!isPaused && isGameStarted) {
        const cannotShoot = Math.hypot(player.x - mouseX, player.y - mouseY) <= restrictedRadius || currentAmmo <= 0; 
        let localBlastRadius = maxBlastRadius;
        structures.forEach(s => { if (s.type === 'focus' && Math.hypot(mouseX - s.x, mouseY - s.y) <= s.radius) localBlastRadius *= 1.5 * refractingLensRad; });

        ctx.beginPath(); ctx.arc(mouseX, mouseY, localBlastRadius, 0, Math.PI * 2);
        ctx.fillStyle = cannotShoot ? 'rgba(100, 100, 100, 0.2)' : 'rgba(255, 0, 0, 0.1)'; ctx.fill(); ctx.strokeStyle = cannotShoot ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 0, 0, 0.7)'; ctx.lineWidth = 2; ctx.stroke();
        const xs = 10; ctx.beginPath(); ctx.moveTo(mouseX - xs, mouseY - xs); ctx.lineTo(mouseX + xs, mouseY + xs); ctx.moveTo(mouseX + xs, mouseY - xs); ctx.lineTo(mouseX - xs, mouseY + xs); ctx.stroke();
    }
    ctx.restore(); 
}

function triggerRandomWeather() {
    const storms = [
        { name: 'Acid Rain', duration: 45000, color: '#76ff03' },
        { name: 'Heatwave', duration: 30000, color: '#ff7043' },
        { name: 'Thunderstorm', duration: 60000, color: '#9fa8da' }
    ];
    const storm = storms[Math.floor(Math.random() * storms.length)];
    
    currentWeather = storm.name;
    weatherState = 'fading_in';
    weatherTimer = Date.now() + 10000; // 10 seconds to fade in
    weatherAlpha = 0;
    
    const display = document.getElementById('weatherDisplay');
    display.innerText = "Storm Brewing...";
    display.style.color = "#aaa";

    // Schedule the actual storm to start
    setTimeout(() => {
        weatherState = 'active';
        weatherTimer = Date.now() + storm.duration;
        display.innerText = storm.name;
        display.style.color = storm.color;
    }, 10000);
}

function updateAndDrawWeather(ctx, currentFrameTime) {
    if (weatherState === 'none') return;
    const weatherWidth = logicalWidth;
    const weatherHeight = logicalHeight;

    // Fade logic
    if (weatherState === 'fading_in') {
        weatherAlpha = Math.min(0.5, weatherAlpha + 0.005);
    } else if (weatherState === 'active') {
        weatherAlpha = 0.5;
        if (currentFrameTime > weatherTimer) {
            weatherState = 'none';
            currentWeather = 'Sunny';
            document.getElementById('weatherDisplay').innerText = "Sunny";
            document.getElementById('weatherDisplay').style.color = "#4fc3f7";
        }
    }

    ctx.save();
    ctx.globalAlpha = weatherAlpha;

    if (currentWeather === 'Acid Rain') {
        // Draw thin falling green lines
        ctx.strokeStyle = '#76ff03';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 150; i++) {
            let x = Math.random() * weatherWidth;
            let y = Math.random() * weatherHeight;
            ctx.moveTo(x, y);
            ctx.lineTo(x - 5, y + 20); // Slanted rain
        }
        ctx.stroke();

        // Gameplay effect: Slowly damage all structures
        if (weatherState === 'active' && Math.random() < 0.1) {
            structures.forEach(s => { s.hp -= 0.5; });
        }

    } else if (currentWeather === 'Heatwave') {
        // Draw hot orange overlay
        ctx.fillStyle = '#ff7043';
        ctx.fillRect(0, 0, weatherWidth, weatherHeight);
        
        // Gameplay effect: Handled in the enemy loop (Tar no longer slows, burns instead)

    } else if (currentWeather === 'Thunderstorm') {
        // Dark blue overlay
        ctx.fillStyle = '#1a237e';
        ctx.fillRect(0, 0, weatherWidth, weatherHeight);

        // Random Lightning Flashes
        if (weatherState === 'active' && currentFrameTime - lastLightningStrike > Math.random() * 5000 + 2000) {
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, weatherWidth, weatherHeight);
            lastLightningStrike = currentFrameTime;
            
            // Strike a random enemy or tower
            if (enemies.length > 0 && Math.random() < 0.7) {
                let target = enemies[Math.floor(Math.random() * enemies.length)];
                target.hp -= 50; if (target.hp <= 0) target.dead = true;
                visualEffects.push({ type: 'lightning', x1: target.x, y1: 0, x2: target.x, y2: target.y, expires: currentFrameTime + 200 });
            } else {
                health -= 15; updateHealthUI();
                visualEffects.push({ type: 'lightning', x1: player.x, y1: 0, x2: player.x, y2: player.y, expires: currentFrameTime + 200 });
            }
        }
    }
    ctx.restore();
}

showSaveSelect();
animate();
