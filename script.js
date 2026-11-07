// ===============================
// CONFIGURACIÓN (todo lo editable está aquí)
// ===============================
const SPR = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/";
const art  = id => `${SPR}pokemon/other/official-artwork/${id}.png`;
const mini = id => `${SPR}pokemon/${id}.png`;
const item = n  => `${SPR}items/${n}.png`;

// Evoluciones: se activan al llegar a "at" puntos ganados en total. "mult" multiplica todo.
const EVOLUTIONS = [
    { name: "Pichu",   id: 172, at: 0,       mult: 1 },
    { name: "Pikachu", id: 25,  at: 500000,    mult: 1.5 },
    { name: "Raichu",  id: 26,  at: 25000000,  mult: 3 },
];

// Mejoras manuales (PPC): cada una se desbloquea al comprar la anterior
const CLICK_UPGRADES = [
    { name: "Poción",          amount: 1,     cost: 30,         icon: item("potion") },
    { name: "Superpoción",     amount: 3,     cost: 200,        icon: item("super-potion") },
    { name: "Hiperpoción",     amount: 10,    cost: 1500,       icon: item("hyper-potion") },
    { name: "Caramelo Raro",   amount: 40,    cost: 12000,      icon: item("rare-candy") },
    { name: "Restaurar Todo",  amount: 150,   cost: 100000,     icon: item("full-restore") },
    { name: "Revivir Máximo",  amount: 600,   cost: 800000,     icon: item("max-revive") },
    { name: "Master Ball",     amount: 2500,  cost: 6000000,    icon: item("master-ball") },
    { name: "Elixir Máximo",   amount: 12000, cost: 50000000,   icon: item("max-elixir") },
];

// Equipo automático (PPS): el coste sube ~6x por escalón y la producción ~5x
const AUTO_UPGRADES = [
    { name: "Pidgey",    amount: 1,        cost: 25,           icon: mini(16) },
    { name: "Machop",    amount: 6,        cost: 180,          icon: mini(66) },
    { name: "Geodude",   amount: 30,       cost: 1100,         icon: mini(74) },
    { name: "Growlithe", amount: 160,      cost: 6500,         icon: mini(58) },
    { name: "Gengar",    amount: 900,      cost: 40000,        icon: mini(94) },
    { name: "Alakazam",  amount: 5000,     cost: 250000,       icon: mini(65) },
    { name: "Gyarados",  amount: 28000,    cost: 1600000,      icon: mini(130) },
    { name: "Dragonite", amount: 160000,   cost: 10000000,     icon: mini(149) },
    { name: "Lugia",     amount: 900000,   cost: 70000000,     icon: mini(249) },
    { name: "Mewtwo",    amount: 5000000,  cost: 500000000,    icon: mini(150) },
    { name: "Arceus",    amount: 30000000, cost: 4000000000,   icon: mini(493) },
];

// Objetos especiales (se compran una vez). fx:
//   click / auto / all = multiplicadores · critChance / critMult / tap = bonus sumados
//   tap = cada toque da además ese % de tu PPS
const ITEMS = [
    { id: "band",   name: "Cinta Fuerte",     desc: "Toques x2",                        cost: 500,         icon: item("muscle-band"), fx: { click: 2 } },
    { id: "share",  name: "Repartir Exp.",    desc: "Equipo automático x1,5",           cost: 2500,        icon: item("exp-share"),   fx: { auto: 1.5 } },
    { id: "scope",  name: "Periscopio",       desc: "+5% de probabilidad de crítico",   cost: 6000,        icon: item("scope-lens"),  fx: { critChance: 0.05 } },
    { id: "claw",   name: "Garra Afilada",    desc: "Críticos: +3 al multiplicador",    cost: 30000,       icon: item("razor-claw"),  fx: { critMult: 3 } },
    { id: "brace",  name: "Brazal Recio",     desc: "Cada toque da +5% de tu PPS",      cost: 150000,      icon: item("macho-brace"), fx: { tap: 0.05 } },
    { id: "choice", name: "Cinta Elegida",    desc: "Toques x2",                        cost: 500000,      icon: item("choice-band"), fx: { click: 2 } },
    { id: "coin",   name: "Moneda Amuleto",   desc: "Equipo automático x2",             cost: 2000000,     icon: item("amulet-coin"), fx: { auto: 2 } },
    { id: "belt",   name: "Cinturón Experto", desc: "Todo x1,25",                       cost: 10000000,    icon: item("expert-belt"), fx: { all: 1.25 } },
    { id: "orb",    name: "Vidasfera",        desc: "Toques x3",                        cost: 60000000,    icon: item("life-orb"),    fx: { click: 3 } },
    { id: "egg",    name: "Huevo Suerte",     desc: "Todo x1,5",                        cost: 400000000,   icon: item("lucky-egg"),   fx: { all: 1.5 } },
    { id: "charm",  name: "Amuleto Iris",     desc: "Todo x2",                          cost: 5000000000,  icon: item("shiny-charm"), fx: { all: 2 } },
];

const COSTE_CRECIENTE = 1.15;       // cada compra sube el precio un 15%
const CRIT_CHANCE = 0.10;
const CRIT_MULT = 5;
const LOGRO_BONUS = 0.02;           // cada logro suma +2% a todo
const OFFLINE_EFICIENCIA = 0.5;     // fuera del juego produces la mitad
const MAX_OFFLINE_HORAS = 4;

// Los códigos solo dan puntos (no cuentan para evolución ni logros)
const CODES = {
    "PIKACHU": 1000,
    "RAICHU": 5000,
    "GOLD": 25000,
    "LEGEND": 100000,
    "ADMIN": 5000000,   // código de pruebas: bórralo cuando publiques el juego
};

// ===============================
// UTILIDADES
// ===============================
const $ = id => document.getElementById(id);
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const anim = (el, kf, opt) => (RM ? null : el.animate(kf, opt));

const BALL = "data:image/svg+xml," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='#fff' stroke='#111' stroke-width='6'/><path d='M4 50a46 46 0 0 1 92 0z' fill='#e8403a' stroke='#111' stroke-width='6'/><circle cx='50' cy='50' r='12' fill='#fff' stroke='#111' stroke-width='6'/></svg>"
);
function setImg(img, src) {
    img.onerror = () => { img.onerror = null; img.src = BALL; };
    img.src = src;
}

// 1.234 · 15,3K · 2,50M ... (dec = mostrar decimales en números pequeños)
function fmt(n, dec) {
    if (n < 1000) {
        if (dec && n < 100 && n % 1 !== 0) return (Math.round(n * 10) / 10).toLocaleString("es-ES");
        return Math.floor(n).toLocaleString("es-ES");
    }
    const units = ["K", "M", "B", "T", "Qa", "Qi"];
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
    crits: 0,
    click: CLICK_UPGRADES.map(() => 0),
    auto: AUTO_UPGRADES.map(() => 0),
    items: [],
    ach: [],
    usedCodes: [],
    last: Date.now(),
};

const sum = (list, lv) => list.reduce((t, u, i) => t + u.amount * lv[i], 0);
const sumLv = lv => lv.reduce((t, n) => t + n, 0);
const stageOf = () => EVOLUTIONS.reduce((s, e, i) => (state.total >= e.at ? i : s), 0);

function mods() {
    const m = { click: 1, auto: 1, all: 1, critChance: CRIT_CHANCE, critMult: CRIT_MULT, tap: 0 };
    ITEMS.forEach(it => {
        if (!state.items.includes(it.id)) return;
        for (const k in it.fx) {
            if (k === "click" || k === "auto" || k === "all") m[k] *= it.fx[k];
            else m[k] += it.fx[k];
        }
    });
    return m;
}

const getMult = () => EVOLUTIONS[stageOf()].mult * mods().all * (1 + LOGRO_BONUS * state.ach.length);
const getPps = () => sum(AUTO_UPGRADES, state.auto) * mods().auto * getMult();
const getPpc = () => (1 + sum(CLICK_UPGRADES, state.click)) * mods().click * getMult() + getPps() * mods().tap;

// Precio de comprar n niveles seguidos (suma geométrica). qty = 1, 10, 100 o "max"
function bulk(up, lv, qty) {
    const r = COSTE_CRECIENTE;
    const base = up.cost * Math.pow(r, lv);
    const priceOf = n => Math.ceil(base * (Math.pow(r, n) - 1) / (r - 1));
    if (qty !== "max") return { n: qty, price: priceOf(qty) };
    let n = Math.floor(Math.log(1 + state.score * (r - 1) / base) / Math.log(r));
    while (n > 0 && priceOf(n) > state.score) n--;
    return n > 0 ? { n, price: priceOf(n) } : { n: 1, price: priceOf(1) };
}

// Una mejora se desbloquea al comprar la anterior
const isUnlocked = (key, i) => i === 0 || state[key][i - 1] > 0 || state[key][i] > 0;

// ===============================
// LOGROS
// ===============================
const ACH = [];
const addAch = (id, name, desc, test) => ACH.push({ id, name, desc, test });

[[1, "Primer toque"], [100, "Dedos ágiles"], [1000, "Mano de acero"], [10000, "Dedo de oro"], [100000, "Leyenda del toque"]]
    .forEach(([n, name]) => addAch("clk" + n, name, `Toca ${fmt(n)} veces`, () => state.clicks >= n));

[[1e3, "Ahorrador"], [1e5, "Cazafortunas"], [1e7, "Magnate Pokémon"], [1e9, "Multimillonario"], [1e11, "Dueño de Kanto"]]
    .forEach(([n, name]) => addAch("tot" + n, name, `Gana ${fmt(n)} puntos en total`, () => state.total >= n));

[[10, "Pequeña granja"], [1e3, "Fábrica de puntos"], [1e5, "Máquina imparable"], [1e7, "Economía legendaria"]]
    .forEach(([n, name]) => addAch("pps" + n, name, `Llega a ${fmt(n)} puntos por segundo`, () => getPps() >= n));

[[1, "¡Crítico!"], [100, "Puntería perfecta"], [1000, "Suerte infinita"]]
    .forEach(([n, name]) => addAch("crt" + n, name, `Consigue ${fmt(n)} críticos`, () => state.crits >= n));

[[1, "Primer compañero"], [25, "Equipo en marcha"], [100, "Liga Pokémon"], [300, "Maestro de maestros"]]
    .forEach(([n, name]) => addAch("team" + n, name, `Ten ${n} Pokémon en el equipo`, () => sumLv(state.auto) >= n));

[[25, "Botiquín completo"], [100, "Farmacia Pokémon"]]
    .forEach(([n, name]) => addAch("mnl" + n, name, `Compra ${n} mejoras manuales`, () => sumLv(state.click) >= n));

[[1, "Coleccionista"], [5, "Mochila llena"], [ITEMS.length, "Objeto por objeto"]]
    .forEach(([n, name]) => addAch("itm" + n, name, `Compra ${n} objeto${n > 1 ? "s" : ""} especial${n > 1 ? "es" : ""}`, () => state.items.length >= n));

EVOLUTIONS.slice(1).forEach((e, i) =>
    addAch("evo" + (i + 1), `Evolución: ${e.name}`, `Evoluciona a ${e.name}`, () => stageOf() >= i + 1));

addAch("full", "Equipo completo", `Consigue los ${AUTO_UPGRADES.length} Pokémon distintos`, () => state.auto.every(l => l > 0));
addAch("code", "Hacker de Kanto", "Canjea un código secreto", () => state.usedCodes.length >= 1);

// ===============================
// ELEMENTOS Y AVISOS
// ===============================
const stageEl = $("stage"), pokemon = $("pokemon"), pokeImg = $("pokeImg");
const codeInput = $("codeInput"), codeMessage = $("codeMessage");

function toast(text, cls = "") {
    const el = document.createElement("div");
    el.className = "toast " + cls;
    el.textContent = text;
    $("toasts").appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

const known = new Set();   // mejoras ya desbloqueadas (para avisar solo de las nuevas)
let ready = false;         // false durante la carga inicial (sin avisos)
let lastStage = -1;
let qty = 1;
let achSeen = 0;      // logros ya vistos (para el punto rojo de la pestaña)
let tab = "manual";

function checkAch() {
    ACH.forEach(a => {
        if (!state.ach.includes(a.id) && a.test()) {
            state.ach.push(a.id);
            if (ready) toast(`Logro: ${a.name} (+${Math.round(LOGRO_BONUS * 100)}%)`, "ach");
        }
    });
}

// ===============================
// CONSTRUCCIÓN DE LA INTERFAZ
// ===============================
const shops = [];

function buildShop(containerId, list, key) {
    list.forEach((up, i) => {
        const btn = document.createElement("button");
        btn.className = "upgrade";
        btn.innerHTML = `<img class="icon" alt=""><span><b></b><small></small></span><span class="cost"></span>`;
        setImg(btn.querySelector(".icon"), up.icon);
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
    const { n, price } = bulk(list[i], state[key][i], qty);
    if (state.score < price) return;
    state.score -= price;
    state[key][i] += n;
    anim(btn, [{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(1)" }], { duration: 180 });
    update();
}

buildShop("clickShop", CLICK_UPGRADES, "click");
buildShop("autoShop", AUTO_UPGRADES, "auto");

const itemEls = ITEMS.map(it => {
    const b = document.createElement("button");
    b.className = "upgrade";
    b.innerHTML = `<img class="icon" alt=""><span><b>${it.name}</b><small>${it.desc}</small></span><span class="cost"></span>`;
    setImg(b.querySelector(".icon"), it.icon);
    b.addEventListener("click", () => {
        if (state.items.includes(it.id) || state.score < it.cost) return;
        state.score -= it.cost;
        state.items.push(it.id);
        toast(`¡Objeto conseguido: ${it.name}!`);
        update();
    });
    $("itemShop").appendChild(b);
    return { it, b, cost: b.querySelector(".cost") };
});

const achEls = ACH.map(a => {
    const d = document.createElement("div");
    d.className = "ach";
    d.innerHTML = `<b>${a.name}</b><small>${a.desc}</small>`;
    $("achGrid").appendChild(d);
    return d;
});

const mates = AUTO_UPGRADES.map(up => {
    const div = document.createElement("div");
    div.className = "mate";
    div.hidden = true;
    div.title = up.name;
    div.innerHTML = `<img alt=""><span></span>`;
    setImg(div.querySelector("img"), up.icon);
    $("team").appendChild(div);
    return { div, badge: div.querySelector("span") };
});

document.querySelectorAll(".qty button").forEach(b => {
    b.addEventListener("click", () => {
        qty = b.dataset.q === "max" ? "max" : +b.dataset.q;
        document.querySelectorAll(".qty button").forEach(x => x.classList.toggle("on", x === b));
        update();
    });
});

// ===============================
// PESTAÑAS
// ===============================
function showTab(name) {
    tab = name;
    document.querySelectorAll(".tabs-bar button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
    document.querySelectorAll(".pane").forEach(p => p.classList.toggle("on", p.dataset.pane === name));
    $("qtyBar").hidden = !(name === "manual" || name === "auto");
    if (name === "ach") achSeen = state.ach.length;
    update();
}
document.querySelectorAll(".tabs-bar button").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));

// ===============================
// ACTUALIZAR PANTALLA
// ===============================
function update() {
    checkAch();
    const m = mods(), gm = getMult();

    $("score").textContent = fmt(state.score);
    $("ppc").textContent = fmt(getPpc(), true);
    $("pps").textContent = fmt(getPps(), true);
    $("mult").textContent = "x" + (Math.round(gm * 100) / 100);
    $("clicks").textContent = fmt(state.clicks);
    $("crits").textContent = fmt(state.crits);
    $("total").textContent = fmt(state.total);

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

    // Mejoras
    shops.forEach(({ btn, up, i, key, list, name, small, cost }) => {
        const level = state[key][i];
        const unlocked = isUnlocked(key, i);
        const teaser = !unlocked && isUnlocked(key, i - 1);

        btn.hidden = !unlocked && !teaser;
        btn.classList.toggle("locked", !unlocked);

        if (unlocked) {
            const { n, price } = bulk(up, level, qty);
            const per = up.amount * (key === "click" ? m.click : m.auto) * gm;
            btn.disabled = state.score < price;
            name.textContent = up.name + (n > 1 ? ` x${n}` : "");
            small.textContent = `+${fmt(per * n, true)} ${key === "click" ? "PPC" : "PPS"} · Nivel ${level}`;
            cost.textContent = fmt(price);
        } else {
            btn.disabled = true;
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

    // Objetos especiales (aparecen cuando ya has ganado el 25% de su precio)
    let anyItem = false;
    itemEls.forEach(({ it, b, cost }) => {
        const has = state.items.includes(it.id);
        const seen = has || state.total >= it.cost * 0.25;
        b.hidden = !seen;
        if (seen) anyItem = true;
        b.classList.toggle("owned", has);
        b.disabled = has || state.score < it.cost;
        cost.textContent = has ? "✓" : fmt(it.cost);
    });
    $("itemEmpty").hidden = anyItem;

    // Logros
    ACH.forEach((a, i) => achEls[i].classList.toggle("done", state.ach.includes(a.id)));
    $("achCount").textContent = `${state.ach.length} / ${ACH.length} · bonus +${Math.round(state.ach.length * LOGRO_BONUS * 100)}% a todo`;

    // Equipo
    mates.forEach((mt, i) => {
        mt.div.hidden = state.auto[i] === 0;
        mt.badge.textContent = "x" + state.auto[i];
    });

    // Puntos rojos en las pestañas: algo que comprar o un logro nuevo
    const canBuy = key => shops.some(s => s.key === key && !s.btn.hidden && !s.btn.disabled);
    const dot = (name, on) => ($("dot-" + name).hidden = !on || tab === name);
    dot("manual", canBuy("click"));
    dot("auto", canBuy("auto"));
    dot("items", itemEls.some(e => !e.b.hidden && !e.b.disabled));
    dot("ach", state.ach.length > achSeen);
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
    const m = mods();
    const crit = Math.random() < m.critChance;
    const gain = getPpc() * (crit ? m.critMult : 1);

    state.score += gain;
    state.total += gain;
    state.clicks++;
    if (crit) state.crits++;

    let x = e.clientX, y = e.clientY;
    if (e.detail === 0) {   // con teclado no hay posición de ratón
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

    floatText(x, y, `+${fmt(gain, true)}${crit ? "!" : ""}`, crit);
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
        showMessage(`¡Código válido! +${fmt(CODES[code])} puntos`, "#9dffb0");
        codeInput.value = "";
        update();
    }
}

$("redeemCode").addEventListener("click", redeem);
codeInput.addEventListener("keydown", e => { if (e.key === "Enter") redeem(); });

// ===============================
// GUARDADO (local + nube, lo gestiona auth.js)
// ===============================
let resetting = false;
let playing = false;

function save(force) {
    if (resetting || !playing) return;
    state.last = Date.now();
    Auth.saveSave(state, force);
}

setInterval(() => save(), 5000);
window.addEventListener("beforeunload", () => save(true));
document.addEventListener("visibilitychange", () => { if (document.hidden) save(true); });

$("resetBtn").addEventListener("click", async () => {
    if (!confirm("¿Seguro que quieres borrar toda tu partida?")) return;
    resetting = true;
    await Auth.deleteSave();
    location.reload();
});

// ===============================
// CARGA
// ===============================
const validIds = (arr, list) => (Array.isArray(arr) ? arr.filter(id => list.some(x => x.id === id)) : []);

function load(data) {
    if (data) {
        state.score = data.score || 0;
        state.total = data.total || 0;
        state.clicks = data.clicks || 0;
        state.crits = data.crits || 0;
        state.usedCodes = data.usedCodes || [];
        state.click = CLICK_UPGRADES.map((_, i) => (data.click && data.click[i]) || 0);
        state.auto = AUTO_UPGRADES.map((_, i) => (data.auto && data.auto[i]) || 0);
        state.items = validIds(data.items, ITEMS);
        state.ach = validIds(data.ach, ACH);
        state.last = data.last || Date.now();
        return;
    }

    // Partida de antes de las cuentas: se aprovecha una sola vez
    let prev = null;
    try { prev = JSON.parse(localStorage.getItem("pokemonSave2")); } catch (e) {}
    if (prev) { localStorage.removeItem("pokemonSave2"); return load(prev); }

    let old = null;
    try { old = JSON.parse(localStorage.getItem("pokemonSave")); } catch (e) {}
    if (!old) return;
    state.score = old.score || 0;
    state.total = state.score;
    state.click = CLICK_UPGRADES.map((_, i) => (old.clickUnlocks && old.clickUnlocks[i + 1] ? 1 : 0));
    state.auto = AUTO_UPGRADES.map((_, i) => (old.autoUnlocks && old.autoUnlocks[i + 1] ? 1 : 0));
    localStorage.removeItem("pokemonSave");
}

// ===============================
// ARRANQUE: el juego empieza cuando el jugador ha iniciado sesión
// ===============================
Auth.start((data) => {
    load(data);

    const secondsAway = Math.min((Date.now() - state.last) / 1000, MAX_OFFLINE_HORAS * 3600);
    if (secondsAway > 10 && getPps() > 0) {
        const offline = getPps() * secondsAway * OFFLINE_EFICIENCIA;
        state.score += offline;
        state.total += offline;
        toast(`Mientras no estabas: +${fmt(offline)} puntos`);
    }

    checkAch();
    achSeen = state.ach.length;
    update();
    ready = true;     // a partir de ahora sí se avisa de desbloqueos, logros y evoluciones
    playing = true;
});
