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

// Mostrar/Ocultar mejoras
function hideLockedUpgrades() {
    [...clickUpgrades, ...autoUpgrades, ...allies].forEach(up=>{
        const el = document.getElementById(up.id);
        if(!up.unlocked) el.style.display="none";
    });
}
hideLockedUpgrades();

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

// Click automático
setInterval(()=>{ score += pps; updateScreen(); },1000);

function updateScreen(){
    scoreEl.textContent = score;
    ppcEl.textContent = ppc;
    ppsEl.textContent = pps;
    updateLockedStyles();
}

function updateLockedStyles(){
    [...clickUpgrades, ...autoUpgrades, ...allies].forEach(up=>{
        const el = document.getElementById(up.id);
        if(score < up.cost) el.classList.add("disabled");
        else el.classList.remove("disabled");
    });
}

/* Códigos secretos */
const codes = { "MILLON": 100000, "GOLD": 50000, "RAICHU": 10000, "PIKACHU": 5000 };
const codeInput = document.getElementById("codeInput");
const redeemButton = document.getElementById("redeemCode");
const codeMessage = document.getElementById("codeMessage");

redeemButton.addEventListener("click", ()=>{
    const code = codeInput.value.toUpperCase().trim();
    if(codes[code]){
        score += codes[code];
        codeMessage.textContent = `Código correcto! +${codes[code]} puntos`;
        codeMessage.style.color = "lightgreen";
        updateScreen();
        codeInput.value = "";
    } else {
        codeMessage.textContent = "Código incorrecto!";
        codeMessage.style.color = "red";
    }
});

/* ==============================
      GUARDADO FUNCIONAL
================================= */

function saveGame() {
    const saveData = {
        score, ppc, pps,
        clickUnlocked: clickUpgrades.map(u=>u.unlocked),
        autoUnlocked: autoUpgrades.map(u=>u.unlocked),
        alliesUnlocked: allies.map(a=>a.unlocked)
    };
    localStorage.setItem("pokeClickerSave", JSON.stringify(saveData));
    const msg = document.getElementById("saveMessage");
    msg.textContent = "¡Partida guardada!";
    msg.style.color = "lightgreen";
    setTimeout(()=>msg.textContent="",2000);
}

function loadGame() {
    const saveData = JSON.parse(localStorage.getItem("pokeClickerSave"));
    if(!saveData) return;

    score = saveData.score;
    ppc = saveData.ppc;
    pps = saveData.pps;

    clickUpgrades.forEach((u,i)=>u.unlocked = saveData.clickUnlocked[i]);
    autoUpgrades.forEach((u,i)=>u.unlocked = saveData.autoUnlocked[i]);
    allies.forEach((a,i)=>a.unlocked = saveData.alliesUnlocked[i]);

    showUnlockedUpgrades();
    updateScreen();
}

function deleteSave() {
    localStorage.removeItem("pokeClickerSave");
    location.reload();
}

document.getElementById("saveGame").addEventListener("click", saveGame);
document.getElementById("deleteSave").addEventListener("click", deleteSave);

loadGame();
setInterval(saveGame,5000); // auto-guardar
