// ===============================
// CONFIGURACIÓN (añade o cambia mejoras aquí)
// ===============================
const CLICK_UPGRADES = [
    { name: "Poción",         amount: 1,  cost: 50 },
    { name: "Superpoción",    amount: 2,  cost: 150 },
    { name: "Hiperpoción",    amount: 4,  cost: 300 },
    { name: "Caramelo Raro",  amount: 8,  cost: 600 },
    { name: "Restaurar Todo", amount: 16, cost: 1500 },
];

const AUTO_UPGRADES = [
    { name: "Pidgey explorador", amount: 1,  cost: 100 },
    { name: "Machop entrenador", amount: 3,  cost: 300 },
    { name: "Alakazam",          amount: 6,  cost: 800 },
    { name: "Dragonite",         amount: 12, cost: 2000 },
    { name: "Mewtwo",            amount: 25, cost: 5000 },
];

const COSTE_CRECIENTE = 1.15;   // cada compra sube el precio un 15%
const CRIT_CHANCE = 0.10;
const CRIT_MULT = 5;
const MAX_OFFLINE_HORAS = 8;

const CODES = {
    "PIKACHU": 5000,
    "RAICHU": 10000,
    "GOLD": 50000,
    "LEGEND": 75000,
    "ADMIN": 1000000000,
};

const SAVE_KEY = "pokemonSave2";

// ===============================
// ESTADO
// ===============================
let state = {
    score: 0,
    total: 0,
    clicks: 0,
    click: CLICK_UPGRADES.map(() => 0),  // nivel de cada mejora manual
    auto: AUTO_UPGRADES.map(() => 0),    // nivel de cada mejora automática
    usedCodes: [],
    last: Date.now(),
};

const sum = (list, levels) => list.reduce((t, u, i) => t + u.amount * levels[i], 0);
const getPpc = () => 1 + sum(CLICK_UPGRADES, state.click);
const getPps = () => sum(AUTO_UPGRADES, state.auto);
const costOf = (up, level) => Math.ceil(up.cost * Math.pow(COSTE_CRECIENTE, level));

// Formato: 1.234 → 1.234 · 15.300 → 15.3K · 2.5M ...
function fmt(n) {
    n = Math.floor(n);
    if (n < 1000) return n.toLocaleString("es-ES");
    const units = ["K", "M", "B", "T"];
    let i = -1;
    while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
    return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + units[i];
}

// ===============================
// ELEMENTOS
// ===============================
const $ = id => document.getElementById(id);
const scoreEl = $("score"), ppcEl = $("ppc"), ppsEl = $("pps");
const clicksEl = $("clicks"), totalEl = $("total");
const pokemon = $("pokemon");
const codeInput = $("codeInput"), codeMessage = $("codeMessage");

// ===============================
// TIENDA (se construye una sola vez)
// ===============================
const shops = [];

function buildShop(containerId, list, key) {
    const container = $(containerId);
    list.forEach((up, i) => {
        const btn = document.createElement("button");
        btn.className = "upgrade";
        btn.innerHTML = `<span><b>${up.name}</b><small></small></span><span class="cost"></span>`;
        btn.addEventListener("click", () => buy(key, list, i));
        container.appendChild(btn);
        shops.push({ btn, up, i, key, small: btn.querySelector("small"), cost: btn.querySelector(".cost") });
    });
}

function buy(key, list, i) {
    const price = costOf(list[i], state[key][i]);
    if (state.score < price) return;
    state.score -= price;
    state[key][i]++;
    update();
}

buildShop("clickShop", CLICK_UPGRADES, "click");
buildShop("autoShop", AUTO_UPGRADES, "auto");

// ===============================
// ACTUALIZAR PANTALLA
// ===============================
function update() {
    scoreEl.textContent = fmt(state.score);
    ppcEl.textContent = fmt(getPpc());
    ppsEl.textContent = fmt(getPps());
    clicksEl.textContent = fmt(state.clicks);
    totalEl.textContent = fmt(state.total);

    shops.forEach(({ btn, up, i, key, small, cost }) => {
        const level = state[key][i];
        const price = costOf(up, level);
        // Visible si es la primera o ya compraste la anterior
        btn.hidden = !(i === 0 || state[key][i - 1] > 0);
        btn.disabled = state.score < price;
        small.textContent = `+${up.amount} ${key === "click" ? "PPC" : "PPS"} · Nivel ${level}`;
        cost.textContent = fmt(price);
    });
}

// ===============================
// TEXTO FLOTANTE
// ===============================
function floatText(x, y, text, crit) {
    const el = document.createElement("div");
    el.className = "float" + (crit ? " crit" : "");
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    el.animate(
        [
            { transform: "translate(-50%, 0)", opacity: 1 },
            { transform: "translate(-50%, -60px)", opacity: 0 },
        ],
        { duration: 700, easing: "ease-out" }
    ).onfinish = () => el.remove();
}

// ===============================
// CLICK MANUAL
// ===============================
pokemon.addEventListener("click", (e) => {
    const crit = Math.random() < CRIT_CHANCE;
    const gain = getPpc() * (crit ? CRIT_MULT : 1);

    state.score += gain;
    state.total += gain;
    state.clicks++;

    // Con teclado (espacio/enter) el ratón no tiene posición: usamos el centro
    let x = e.clientX, y = e.clientY;
    if (e.detail === 0) {
        const r = pokemon.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 3;
    }
    floatText(x, y, `+${fmt(gain)}${crit ? "!" : ""}`, crit);
    update();
});

// ===============================
// CLICK AUTOMÁTICO (fluido: 10 veces por segundo)
// ===============================
setInterval(() => {
    const gain = getPps() / 10;
    if (gain > 0) {
        state.score += gain;
        state.total += gain;
        update();
    }
}, 100);

// ===============================
// CÓDIGOS SECRETOS (un solo uso cada uno)
// ===============================
function showMessage(text, color) {
    codeMessage.textContent = text;
    codeMessage.style.color = color;
    clearTimeout(showMessage.t);
    showMessage.t = setTimeout(() => (codeMessage.textContent = ""), 4000);
}

function redeem() {
    const code = codeInput.value.trim().toUpperCase();
    if (!code) return;

    if (!(code in CODES)) {
        showMessage("Código incorrecto", "#ff6b6b");
    } else if (state.usedCodes.includes(code)) {
        showMessage("Ya has canjeado este código", "#ffd966");
    } else {
        state.usedCodes.push(code);
        state.score += CODES[code];
        state.total += CODES[code];
        showMessage(`¡Código válido! +${fmt(CODES[code])} puntos`, "#9dffb0");
        codeInput.value = "";
        update();
    }
}

$("redeemCode").addEventListener("click", redeem);
codeInput.addEventListener("keydown", e => { if (e.key === "Enter") redeem(); });

// ===============================
// GUARDADO
// ===============================
let resetting = false;

function save() {
    if (resetting) return;
    state.last = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}

setInterval(save, 5000);
window.addEventListener("beforeunload", save);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

$("resetBtn").addEventListener("click", () => {
    if (!confirm("¿Seguro que quieres borrar toda tu partida?")) return;
    resetting = true;
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem("pokemonSave");
    location.reload();
});

// ===============================
// CARGA (con migración de tu guardado antiguo)
// ===============================
function load() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}

    if (data) {
        state.score = data.score || 0;
        state.total = data.total || 0;
        state.clicks = data.clicks || 0;
        state.usedCodes = data.usedCodes || [];
        state.click = CLICK_UPGRADES.map((_, i) => (data.click && data.click[i]) || 0);
        state.auto = AUTO_UPGRADES.map((_, i) => (data.auto && data.auto[i]) || 0);
        state.last = data.last || Date.now();
        return;
    }

    // Guardado del formato antiguo: conserva puntos y mejoras ya compradas
    let old = null;
    try { old = JSON.parse(localStorage.getItem("pokemonSave")); } catch (e) {}
    if (old) {
        state.score = old.score || 0;
        state.total = state.score;
        // una mejora estaba comprada si la siguiente ya estaba desbloqueada
        state.click = CLICK_UPGRADES.map((_, i) => (old.clickUnlocks && old.clickUnlocks[i + 1] ? 1 : 0));
        state.auto = AUTO_UPGRADES.map((_, i) => (old.autoUnlocks && old.autoUnlocks[i + 1] ? 1 : 0));
    }
}

load();

// Progreso mientras estabas fuera
const secondsAway = Math.min((Date.now() - state.last) / 1000, MAX_OFFLINE_HORAS * 3600);
if (secondsAway > 10 && getPps() > 0) {
    const offline = getPps() * secondsAway;
    state.score += offline;
    state.total += offline;
    showMessage(`Mientras no estabas: +${fmt(offline)} puntos`, "#9dffb0");
}

update();
