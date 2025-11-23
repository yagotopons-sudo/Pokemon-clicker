// ===============================
// VARIABLES PRINCIPALES
// ===============================
let score = 0;
let ppc = 1;
let pps = 0;

const scoreEl = document.getElementById("score");
const ppcEl = document.getElementById("ppc");
const ppsEl = document.getElementById("pps");
const pokemon = document.getElementById("pokemon");

// ===============================
// ANIMACIÓN DE +PUNTOS
// ===============================
function floatText(x, y, text) {
    const float = document.createElement("div");
    float.textContent = text;
    float.style.position = "absolute";
    float.style.left = x + "px";
    float.style.top = y + "px";
    float.style.color = "white";
    float.style.fontWeight = "bold";
    float.style.pointerEvents = "none";
    float.style.transition = "0.6s ease-out";
    document.body.appendChild(float);

    setTimeout(() => {
        float.style.transform = "translateY(-40px)";
        float.style.opacity = "0";
    }, 10);

    setTimeout(() => float.remove(), 600);
}

// ===============================
// CLICK MANUAL
// ===============================
pokemon.addEventListener("click", (e) => {
    score += ppc;
    floatText(e.clientX, e.clientY, `+${ppc}`);
    updateScreen();
});

// ===============================
// LISTA DE MEJORAS
// ===============================
const clickUpgrades = [
    { id: "upgrade1", cost: 50, amount: 1, unlocked: true },
    { id: "upgrade2", cost: 150, amount: 2, unlocked: false },
    { id: "upgrade3", cost: 300, amount: 4, unlocked: false },
    { id: "upgrade4", cost: 600, amount: 8, unlocked: false },
    { id: "upgrade5", cost: 1500, amount: 16, unlocked: false },
];

const autoUpgrades = [
    { id: "auto1", cost: 100, amount: 1, unlocked: true },
    { id: "auto2", cost: 300, amount: 3, unlocked: false },
    { id: "auto3", cost: 800, amount: 6, unlocked: false },
    { id: "auto4", cost: 2000, amount: 12, unlocked: false },
    { id: "auto5", cost: 5000, amount: 25, unlocked: false },
];

// ===============================
// MOSTRAR / OCULTAR MEJORAS
// ===============================
function updateVisibility() {
    [...clickUpgrades, ...autoUpgrades].forEach(up => {
        const el = document.getElementById(up.id);
        el.style.display = up.unlocked ? "block" : "none";
    });
}

// ===============================
// COMPRA DE MEJORAS
// ===============================
function initUpgradeEvents(list) {
    list.forEach((up, index) => {
        const el = document.getElementById(up.id);

        el.addEventListener("click", () => {
            if (!up.unlocked || score < up.cost) return;

            score -= up.cost;

            if (list === clickUpgrades) ppc += up.amount;
            else pps += up.amount;

            // Desbloquear la siguiente mejora
            if (list[index + 1]) {
                list[index + 1].unlocked = true;
            }

            updateScreen();
            updateVisibility();
        });
    });
}

initUpgradeEvents(clickUpgrades);
initUpgradeEvents(autoUpgrades);

// ===============================
// CLICK AUTOMÁTICO
// ===============================
setInterval(() => {
    score += pps;
    updateScreen();
}, 1000);

// ===============================
// ACTUALIZAR PANTALLA
// ===============================
function updateScreen() {
    scoreEl.textContent = score.toLocaleString();
    ppcEl.textContent = ppc;
    ppsEl.textContent = pps;

    [...clickUpgrades, ...autoUpgrades].forEach(up => {
        const el = document.getElementById(up.id);
        if (score < up.cost) el.classList.add("disabled");
        else el.classList.remove("disabled");
    });
}

// ===============================
// CÓDIGOS SECRETOS
// ===============================
const codes = {
    "PIKACHU": 5000,
    "RAICHU": 10000,
    "GOLD": 50000,
    "LEGEND": 75000,
    "ADMIN": 1000000000
};

const codeInput = document.getElementById("codeInput");
const redeemButton = document.getElementById("redeemCode");
const codeMessage = document.getElementById("codeMessage");

redeemButton.addEventListener("click", () => {
    const code = codeInput.value.trim().toUpperCase();

    if (codes[code]) {
        score += codes[code];
        showMessage(`¡Código válido! +${codes[code]} puntos`, "lightgreen");
        updateScreen();
        codeInput.value = "";
    } else {
        showMessage("Código incorrecto", "red");
    }
});

// ===============================
// MENSAJES
// ===============================
function showMessage(text, color) {
    codeMessage.textContent = text;
    codeMessage.style.color = color;
    setTimeout(() => codeMessage.textContent = "", 3000);
}

// ===============================
// AUTOGUARDADO (cada 5 segundos)
// ===============================
setInterval(() => {
    localStorage.setItem("pokemonSave", JSON.stringify({
        score,
        ppc,
        pps,
        clickUnlocks: clickUpgrades.map(u => u.unlocked),
        autoUnlocks: autoUpgrades.map(u => u.unlocked)
    }));
}, 5000);

// ===============================
// CARGA DE PARTIDA
// ===============================
window.addEventListener("load", () => {
    const data = JSON.parse(localStorage.getItem("pokemonSave"));
    if (!data) {
        updateVisibility();
        updateScreen();
        return;
    }

    score = data.score || 0;
    ppc = data.ppc || 1;
    pps = data.pps || 0;

    if (data.clickUnlocks)
        data.clickUnlocks.forEach((val, i) => clickUpgrades[i].unlocked = val);

    if (data.autoUnlocks)
        data.autoUnlocks.forEach((val, i) => autoUpgrades[i].unlocked = val);

    updateVisibility();
    updateScreen();
});
