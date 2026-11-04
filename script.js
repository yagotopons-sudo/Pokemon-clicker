// ===============================
// CONFIGURACIÓN (todo lo editable está aquí)
// ===============================
const SPR = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/";
const art  = id => `${SPR}pokemon/other/official-artwork/${id}.png`;
const mini = id => `${SPR}pokemon/${id}.png`;
const item = n  => `${SPR}items/${n}.png`;

// Evoluciones: se activan al llegar a "at" puntos totales ganados.
// "mult" multiplica tus PPC y PPS. Cambia los id para usar otra línea evolutiva.
const EVOLUTIONS = [
    { name: "Pichu",   id: 172, at: 0,     mult: 1 },
    { name: "Pikachu", id: 25,  at: 1500,  mult: 1.5 },
    { name: "Raichu",  id: 26,  at: 30000, mult: 2.5 },
];

const CLICK_UPGRADES = [
    { name: "Poción",         amount: 1,  cost: 50,   icon: item("potion") },
    { name: "Superpoción",    amount: 2,  cost: 150,  icon: item("super-potion") },
    { name: "Hiperpoción",    amount: 4,  cost: 300,  icon: item("hyper-potion") },
    { name: "Caramelo Raro",  amount: 8,  cost: 600,  icon: item("rare-candy") },
    { name: "Restaurar Todo", amount: 16, cost: 1500, icon: item("full-restore") },
];

const AUTO_UPGRADES = [
    { name: "Pidgey",   amount: 1,  cost: 100,  icon: mini(16) },
    { name: "Machop",   amount: 3,  cost: 300,  icon: mini(66) },
    { name: "Alakazam", amount: 6,  cost: 800,  icon: mini(65) },
    { name: "Dragonite",amount: 12, cost: 2000, icon: mini(149) },
    { name: "Mewtwo",   amount: 25, cost: 5000, icon: mini(150) },
];

const COSTE_CRECIENTE = 1.15;
const CRIT_CHANCE = 0.10;
const CRIT_MULT = 5;
const MAX_OFFLINE_HORAS = 8;
const SAVE_KEY = "pokemonSave2";

const CODES = {
    "PIKACHU": 5000,
    "RAICHU": 10000,
    "GOLD": 50000,
    "LEGEND": 75000,
    "ADMIN": 1000000000,
};

// ===============================
// UTILIDADES
// ===============================
const $ = id => document.getElementById(id);
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const anim = (el, kf, opt) => (RM ? null : el.animate(kf, opt));

// Poké Ball de respaldo si una imagen no carga
const BALL = "data:image/svg+xml," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='#fff' stroke='#111' stroke-width='6'/><path d='M4 50a46 46 0 0 1 92 0z' fill='#e8403a' stroke='#111' stroke-width='6'/><circle cx='50' cy='50' r='12' fill='#fff' stroke='#111' stroke-width='6'/></svg>"
);
function setImg(img, src) {
    img.onerror = () => { img.onerror = null; img.src = BALL; };
    img.src = src;
}

function fmt(n) {
    n = Math.floor(n);
    if (n < 1000) return n.toLocaleString("es-ES");
    const units = ["K", "M", "B", "T"];
    let i = -1;
    while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
    return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + units[i];
}

// ===============================
// ESTADO
// ===============================
const state = {
    score: 0,
    total: 0,
    clicks: 0,
    click: CLICK_UPGRADES.map(() => 0),
    auto: AUTO_UPGRADES.map(() => 0),
    usedCodes: [],
    last: Date.now(),
};

const sum = (list, lv) => list.reduce((t, u, i) => t + u.amount * lv[i], 0);
const stageOf = () => EVOLUTIONS.reduce((s, e, i) => (state.total >= e.at ? i : s), 0);
const getMult = () => EVOLUTIONS[stageOf()].mult;
const getPpc = () => (1 + sum(CLICK_UPGRADES, state.click)) * getMult();
const getPps = () => sum(AUTO_UPGRADES, state.auto) * getMult();
const costOf = (up, lv) => Math.ceil(up.cost * Math.pow(COSTE_CRECIENTE, lv));

// Una mejora se desbloquea al comprar la anterior
const isUnlocked = (key, i) => i === 0 || state[key][i - 1] > 0 || state[key][i] > 0;

// ===============================
// ELEMENTOS
// ===============================
const stageEl = $("stage"), pokemon = $("pokemon"), pokeImg = $("pokeImg");
const codeInput = $("codeInput"), codeMessage = $("codeMessage");

// ===============================
// AVISOS (toasts)
// ===============================
function toast(text, cls = "") {
    const el = document.createElement("div");
    el.className = "toast " + cls;
    el.textContent = text;
    $("toasts").appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// ===============================
// TIENDAS
// ===============================
const shops = [];

function buildShop(containerId, list, key) {
    list.forEach((up, i) => {
        const btn = document.createElement("button");
        btn.className = "upgrade";
        btn.innerHTML = `<img class="icon" alt=""><span><b></b><small></small></span><span class="cost"></span>`;
        const icon = btn.querySelector(".icon");
        setImg(icon, up.icon);
        btn.addEventListener("click", () => buy(key, list, i, btn));
        $(containerId).appendChild(btn);
        shops.push({
            btn, up, i, key, list,
            name: btn.querySelector("b"),
            small: btn.querySelector("small"),
            cost: btn.querySelector(".cost"),
        });
    });
}

function buy(key, list, i, btn) {
    const price = costOf(list[i], state[key][i]);
    if (state.score < price) return;
    state.score -= price;
    state[key][i]++;
    anim(btn, [{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(1)" }], { duration: 180 });
    update();
}

buildShop("clickShop", CLICK_UPGRADES, "click");
buildShop("autoShop", AUTO_UPGRADES, "auto");

// Equipo: los Pokémon automáticos que ya tienes
const mates = AUTO_UPGRADES.map(up => {
    const div = document.createElement("div");
    div.className = "mate";
    div.hidden = true;
    div.innerHTML = `<img alt=""><span></span>`;
    setImg(div.querySelector("img"), up.icon);
    div.title = up.name;
    $("team").appendChild(div);
    return { div, badge: div.querySelector("span") };
});

// ===============================
// ACTUALIZAR PANTALLA
// ===============================
const known = new Set();   // mejoras ya desbloqueadas (para avisar solo de las nuevas)
let ready = false;         // false durante la primera carga (sin avisos)
let lastStage = -1;
let lastScoreText = "";

function update() {
    // Cabecera
    const scoreText = fmt(state.score);
    $("score").textContent = scoreText;
    $("ppc").textContent = fmt(getPpc());
    $("pps").textContent = fmt(getPps());
    $("mult").textContent = "x" + getMult();
    $("clicks").textContent = fmt(state.clicks);
    $("total").textContent = fmt(state.total);
    lastScoreText = scoreText;

    // Evolución
    const stage = stageOf();
    if (stage !== lastStage) {
        const evo = EVOLUTIONS[stage];
        setImg(pokeImg, art(evo.id));
        $("pokeName").textContent = evo.name;
        if (ready && stage > lastStage) {
            toast(`¡Tu Pokémon ha evolucionado a ${evo.name}! Bonus x${evo.mult}`, "evo");
            anim(stageEl, [{ filter: "brightness(6)" }, { filter: "brightness(1)" }], { duration: 900 });
            anim(pokeImg, [{ transform: "scale(0.6)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], { duration: 700 });
        }
        lastStage = stage;
    }
    const next = EVOLUTIONS[stage + 1];
    if (next) {
        const cur = EVOLUTIONS[stage].at;
        $("evoFill").style.width = Math.min(100, ((state.total - cur) / (next.at - cur)) * 100) + "%";
        $("evoText").textContent = `Evoluciona a ${next.name}: ${fmt(state.total)} / ${fmt(next.at)}`;
    } else {
        $("evoFill").style.width = "100%";
        $("evoText").textContent = "Evolución máxima alcanzada";
    }

    // Tiendas
    shops.forEach(({ btn, up, i, key, list, name, small, cost }) => {
        const level = state[key][i];
        const price = costOf(up, level);
        const unlocked = isUnlocked(key, i);
        const teaser = !unlocked && isUnlocked(key, i - 1);   // siguiente a desbloquear

        btn.hidden = !unlocked && !teaser;
        btn.classList.toggle("locked", !unlocked);
        btn.disabled = !unlocked || state.score < price;

        if (unlocked) {
            name.textContent = up.name;
            small.textContent = `+${up.amount} ${key === "click" ? "PPC" : "PPS"} · Nivel ${level}`;
            cost.textContent = fmt(price);
        } else {
            name.textContent = "???";
            small.textContent = `Compra «${list[i - 1].name}» para desbloquear`;
            cost.textContent = "🔒";
        }

        const id = key + i;
        if (unlocked && !known.has(id)) {
            known.add(id);
            if (ready) {
                toast(`¡Nueva mejora desbloqueada: ${up.name}!`);
                btn.classList.add("new");
                setTimeout(() => btn.classList.remove("new"), 800);
            }
        }
    });

    // Equipo
    mates.forEach((m, i) => {
        const lv = state.auto[i];
        m.div.hidden = lv === 0;
        m.badge.textContent = "x" + lv;
    });
}

// ===============================
// EFECTOS DE CLICK
// ===============================
function floatText(x, y, text, crit) {
    const el = document.createElement("div");
    el.className = "float" + (crit ? " crit" : "");
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    const a = anim(el, [
        { transform: "translate(-50%, 0)", opacity: 1 },
        { transform: "translate(-50%, -70px)", opacity: 0 },
    ], { duration: 750, easing: "ease-out" });
    if (a) a.onfinish = () => el.remove();
    else setTimeout(() => el.remove(), 750);
}

function sparks(x, y, n) {
    if (RM) return;
    for (let k = 0; k < n; k++) {
        const s = document.createElement("div");
        s.className = "spark";
        s.style.left = x + "px";
        s.style.top = y + "px";
        document.body.appendChild(s);
        const ang = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 60;
        s.animate([
            { transform: "translate(0,0) scale(1)", opacity: 1 },
            { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px) scale(0)`, opacity: 0 },
        ], { duration: 500 + Math.random() * 250, easing: "ease-out" }).onfinish = () => s.remove();
    }
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

    // Con teclado no hay posición de ratón: usamos el centro del Pokémon
    let x = e.clientX, y = e.clientY;
    if (e.detail === 0) {
        const r = pokemon.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 3;
    }

    anim(pokemon, [
        { transform: "scale(1)" },
        { transform: "scale(0.88) rotate(-3deg)" },
        { transform: "scale(1)" },
    ], { duration: 140 });

    if (crit) anim(stageEl, [
        { transform: "translateX(0)" }, { transform: "translateX(-8px)" },
        { transform: "translateX(8px)" }, { transform: "translateX(0)" },
    ], { duration: 220 });

    floatText(x, y, `+${fmt(gain)}${crit ? "!" : ""}`, crit);
    sparks(x, y, crit ? 14 : 5);
    update();
});

// ===============================
// PUNTOS AUTOMÁTICOS (10 veces por segundo)
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
// CARGA (con migración del guardado antiguo)
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

    let old = null;
    try { old = JSON.parse(localStorage.getItem("pokemonSave")); } catch (e) {}
    if (old) {
        state.score = old.score || 0;
        state.total = state.score;
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
    toast(`Mientras no estabas: +${fmt(offline)} puntos`);
}

update();
ready = true;   // a partir de ahora sí se avisa de desbloqueos y evoluciones
