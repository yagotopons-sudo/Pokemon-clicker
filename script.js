let score = 0;
let ppc = 1;
let pps = 0;

const scoreEl = document.getElementById("score");
const ppcEl = document.getElementById("ppc");
const ppsEl = document.getElementById("pps");
const pokemon = document.getElementById("pokemon");

// CLICK MANUAL
pokemon.addEventListener("click", () => {
    score += ppc;
    updateScreen();
});

// Mejoras manuales
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
    { id: "upgrade10", cost: 100000, amount: 500, unlocked: false }
];

// Mejoras automáticas
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
    { id: "auto10", cost: 200000, amount: 600, unlocked: false }
];

// Pokémon aliados
const allies = [
    { id: "ally1", cost: 500, effect: () => pps += 1, unlocked: true },
    { id: "ally2", cost: 1500, effect: () => pps += 5, unlocked: false },
    { id: "ally3", cost: 3000, effect: () => ppc += 10, unlocked: false }
];

// Ocultar bloqueados
function hideLockedUpgrades() {
    [...clickUpgrades, ...autoUpgrades, ...allies].forEach(up=>{
        const el = document.getElementById(up.id);
        if(!up.unlocked) el.style.display="none";
    });
}
hideLockedUpgrades();

// Mostrar desbloqueados
function showUnlockedUpgrades() {
    [...clickUpgrades, ...autoUpgrades, ...allies].forEach(up=>{
        const el = document.getElementById(up.id);
        if(up.unlocked) el.style.display="block";
    });
}

// Eventos de compra
function initUpgradeEvents(list){
    list.forEach((up,index)=>{
        const el = document.getElementById(up.id);
        el.addEventListener("click",()=>{
            if(!up.unlocked) return;
            if(score < up.cost) return;

            score -= up.cost;

            if(list===clickUpgrades) ppc += up.amount;
            else if(list===autoUpgrades) pps += up.amount;
            else if(list===allies) up.effect();

            if(list[index+1]) list[index+1].unlocked = true;

            updateScreen();
            showUnlockedUpgrades();
        });
    });
}

initUpgradeEvents(clickUpgrades);
initUpgradeEvents(autoUpgrades);
initUpgradeEvents(allies);

// Click automático cada segundo
setInterval(()=>{ score += pps; updateScreen(); },1000);

function updateScreen(){
    scoreEl.textContent = score;
    ppcEl.textContent = ppc;
    ppsEl.textContent = pps;
    updateLockedStyles();
}

// Estilos grises si no hay dinero
function updateLockedStyles(){
    [...clickUpgrades, ...autoUpgrades, ...allies].forEach(up=>{
        const el = document.getElementById(up.id);
        if(score < up.cost) el.classList.add("disabled");
        else el.classList.remove("disabled");
    });
}

// Códigos secretos
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
    "ADMIN": 1e100 // broma enorme
};

const codeInput = document.getElementById("codeInput");
const redeemButton = document.getElementById("redeemCode");
const codeMessage = document.getElementById("codeMessage");

redeemButton.addEventListener("click", ()=>{
    const code = codeInput.value.toUpperCase().trim();
    if(codes[code]){
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

/* ================================
   SISTEMA DE GUARDADO
================================= */

// GUARDAR PARTIDA
function saveGame() {
    const data = {
        score,
        ppc,
        pps,
        clickUpgrades,
        autoUpgrades,
        allies
    };
    localStorage.setItem("pokeClickerSave", JSON.stringify(data));

    const msg = document.getElementById("saveMessage");
    msg.textContent = "¡Partida guardada!";
    msg.style.color = "lightgreen";

    setTimeout(() => msg.textContent = "", 2000);
}

// CARGAR PARTIDA
function loadGame() {
    const data = JSON.parse(localStorage.getItem("pokeClickerSave"));
    if (!data) return;

    score = data.score;
    ppc = data.ppc;
    pps = data.pps;

    data.clickUpgrades.forEach((u, i) => clickUpgrades[i] = u);
    data.autoUpgrades.forEach((u, i) => autoUpgrades[i] = u);
    data.allies.forEach((u, i) => allies[i] = u);

    showUnlockedUpgrades();
    updateScreen();
}

// BORRAR PARTIDA
function deleteSave() {
    localStorage.removeItem("pokeClickerSave");

    const msg = document.getElementById("saveMessage");
    msg.textContent = "Guardado eliminado.";
    msg.style.color = "red";

    setTimeout(() => msg.textContent = "", 2000);

    location.reload();
}

// BOTONES
document.getElementById("saveGame").addEventListener("click", saveGame);
document.getElementById("deleteSave").addEventListener("click", deleteSave);

// CARGAR AUTOMÁTICAMENTE AL INICIAR
loadGame();

// AUTO-GUARDADO CADA 5s
setInterval(saveGame, 5000);
