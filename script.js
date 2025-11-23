// ==========================
// VARIABLES PRINCIPALES
// ==========================
let score = 0;
let ppc = 1;
let pps = 0;

const scoreEl = document.getElementById("score");
const ppcEl = document.getElementById("ppc");
const ppsEl = document.getElementById("pps");
const pokemon = document.getElementById("pokemon");

// ==========================
// CLICK MANUAL
// ==========================
pokemon.addEventListener("click", () => {
    score += ppc;
    updateScreen();
});

// ==========================
// MEJORAS MANUALES (20)
// ==========================
const clickUpgrades = [
    { id: "upgrade1", cost: 50, amount: 1, unlocked: true },
    { id: "upgrade2", cost: 150, amount: 2, unlocked: false },
    { id: "upgrade3", cost: 300, amount: 4, unlocked: false },
    { id: "upgrade4", cost: 600, amount: 8, unlocked: false },
    { id: "upgrade5", cost: 1500, amount: 16, unlocked: false },
    { id: "upgrade6", cost: 3000, amount: 30, unlocked: false },
    { id: "upgrade7", cost: 8000, amount: 60, unlocked: false },
    { id: "upgrade8", cost: 20000, amount: 120, unlocked: false },
    { id: "upgrade9", cost: 40000, amount: 250, unlocked: false },
    { id: "upgrade10", cost: 100000, amount: 500, unlocked: false },
    { id: "upgrade11", cost: 200000, amount: 1000, unlocked: false },
    { id: "upgrade12", cost: 400000, amount: 2000, unlocked: false },
    { id: "upgrade13", cost: 800000, amount: 4000, unlocked: false },
    { id: "upgrade14", cost: 1600000, amount: 8000, unlocked: false },
    { id: "upgrade15", cost: 3200000, amount: 16000, unlocked: false },
    { id: "upgrade16", cost: 6400000, amount: 32000, unlocked: false },
    { id: "upgrade17", cost: 12800000, amount: 64000, unlocked: false },
    { id: "upgrade18", cost: 25600000, amount: 128000, unlocked: false },
    { id: "upgrade19", cost: 51200000, amount: 256000, unlocked: false },
    { id: "upgrade20", cost: 100000000, amount: 500000, unlocked: false }
];

// ==========================
// MEJORAS AUTOMÁTICAS (20)
// ==========================
const autoUpgrades = [
    { id: "auto1", cost: 100, amount: 1, unlocked: true },
    { id: "auto2", cost: 300, amount: 3, unlocked: false },
    { id: "auto3", cost: 800, amount: 6, unlocked: false },
    { id: "auto4", cost: 2000, amount: 12, unlocked: false },
    { id: "auto5", cost: 5000, amount: 25, unlocked: false },
    { id: "auto6", cost: 9000, amount: 40, unlocked: false },
    { id: "auto7", cost: 20000, amount: 80, unlocked: false },
    { id: "auto8", cost: 50000, amount: 160, unlocked: false },
    { id: "auto9", cost: 100000, amount: 300, unlocked: false },
    { id: "auto10", cost: 200000, amount: 600, unlocked: false },
    { id: "auto11", cost: 400000, amount: 1200, unlocked: false },
    { id: "auto12", cost: 800000, amount: 2400, unlocked: false },
    { id: "auto13", cost: 1600000, amount: 4800, unlocked: false },
    { id: "auto14", cost: 3200000, amount: 9600, unlocked: false },
    { id: "auto15", cost: 6400000, amount: 19200, unlocked: false },
    { id: "auto16", cost: 12800000, amount: 38400, unlocked: false },
    { id: "auto17", cost: 25600000, amount: 76800, unlocked: false },
    { id: "auto18", cost: 51200000, amount: 153600, unlocked: false },
    { id: "auto19", cost: 102400000, amount: 307200, unlocked: false },
    { id: "auto20", cost: 200000000, amount: 600000, unlocked: false }
];

// ==========================
// OCULTAR BLOQUEADOS
// ==========================
function hideLockedUpgrades() {
    [...clickUpgrades, ...autoUpgrades].forEach(up => {
        const el = document.getElementById(up.id);
        if (!up.unlocked) el.style.display = "none";
    });
}
hideLockedUpgrades();

// ==========================
// MOSTRAR DESBLOQUEADOS
// ==========================
function showUnlockedUpgrades() {
    [...clickUpgrades, ...autoUpgrades].forEach(up => {
        const el = document.getElementById(up.id);
        if (up.unlocked) el.style.display = "block";
    });
}

// ==========================
// EVENTOS DE COMPRA
// ==========================
function initUpgradeEvents(list) {
    list.forEach((up, index) => {
        const el = document.getElementById(up.id);
        el.addEventListener("click", () => {
            if (!up.unlocked) return;
            if (score < up.cost) return;

            score -= up.cost;

            if (list === clickUpgrades) ppc += up.amount;
            else if (list === autoUpgrades) pps += up.amount;

            if (list[index + 1]) list[index + 1].unlocked = true;

            updateScreen();
            showUnlockedUpgrades();
        });
    });
}

initUpgradeEvents(clickUpgrades);
initUpgradeEvents(autoUpgrades);

// ==========================
// CLICK AUTOMÁTICO CADA SEGUNDO
// ==========================
setInterval(() => {
    score += pps;
    updateScreen();
}, 1000);

// ==========================
// ACTUALIZAR PANTALLA
// ==========================
function updateScreen() {
    scoreEl.textContent = score;
    ppcEl.textContent = ppc;
    ppsEl.textContent = pps;
    updateLockedStyles();
}

// ==========================
// ESTILOS BLOQUEADOS
// ==========================
function updateLockedStyles() {
    [...clickUpgrades, ...autoUpgrades].forEach(up => {
        const el = document.getElementById(up.id);
        if (score < up.cost) el.classList.add("disabled");
        else el.classList.remove("disabled");
    });
}

// ==========================
// CÓDIGOS SECRETOS
// ==========================
const codes = {
    "MILLON": 100000,
    "GOLD": 50000,
    "RAICHU": 10000,
    "PIKACHU": 5000,
    "CHARIZARD": 20000,
    "BULBASAUR": 2000,
    "SQUIRTLE": 2000,
    "MASTER": 50000,
    "LEGEND": 75000,
    "ADMIN": 1000000000000000000000
};

const codeInput = document.getElementById("codeInput");
const redeemButton = document.getElementById("redeemCode");
const codeMessage = document.getElementById("codeMessage");

redeemButton.addEventListener("click", () => {
    const code = codeInput.value.toUpperCase().trim();
    if (codes[code]) {
        score += codes[code];
        codeMessage.textContent = `Código correcto! Has recibido ${codes[code]} puntos!`;
        codeMessage.style.color = "lightgreen";
        updateScreen();
        codeInput.value = "";
    } else {
        codeMessage.textContent = "Código incorrecto!";
        codeMessage.style.color = "red";
    }
});

// ==========================
// AUTOSAVE (cada 5 segundos)
// ==========================
setInterval(() => {
    const saveData = {
        score,
        ppc,
        pps,
        clickUpgrades: clickUpgrades.map(u => u.unlocked),
        autoUpgrades: autoUpgrades.map(u => u.unlocked)
    };
    localStorage.setItem("pokemonClickerSave", JSON.stringify(saveData));
}, 5000);

// ==========================
// CARGAR PARTIDA
// ==========================
window.addEventListener("load", () => {
    const saved = JSON.parse(localStorage.getItem("pokemonClickerSave"));
    if (saved) {
        score = saved.score || 0;
        ppc = saved.ppc || 1;
        pps = saved.pps || 0;

        saved.clickUpgrades.forEach((unlocked, i) => clickUpgrades[i].unlocked = unlocked);
        saved.autoUpgrades.forEach((unlocked, i) => autoUpgrades[i].unlocked = unlocked);
    }
    updateScreen();
    showUnlockedUpgrades();
});
