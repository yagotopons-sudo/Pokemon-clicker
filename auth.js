// ===============================
// CONFIGURACIÓN
// ===============================
// Para jugar desde varios dispositivos pega aquí tu config de Firebase.
// Si lo dejas en null, las cuentas solo existen en ESTE navegador (modo prueba).
const FIREBASE_CONFIG = null;
/* Ejemplo:
const FIREBASE_CONFIG = {
    apiKey: "...", authDomain: "...", projectId: "...", appId: "..."
};
*/

// Entrenadores disponibles (imágenes de Pokémon Showdown)
const TRAINERS = ["red", "blue", "leaf", "ethan", "lyra", "brendan", "may", "lucas", "dawn", "cynthia", "lance", "steven"];
const trainerSrc = n => `https://play.pokemonshowdown.com/sprites/trainers/${n}.png`;

const Auth = (() => {
    const $$ = id => document.getElementById(id);
    const cloud = !!FIREBASE_CONFIG;
    const FALLBACK = "data:image/svg+xml," + encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='#3b4cca'/><circle cx='50' cy='38' r='18' fill='#ffcb05'/><path d='M14 96a36 30 0 0 1 72 0z' fill='#ffcb05'/></svg>"
    );
    const ERR = {
        "auth/email-already-in-use": "Ese correo ya está registrado. Pulsa «Entrar».",
        "auth/invalid-credential": "Correo o contraseña incorrectos.",
        "auth/invalid-email": "El correo no es válido.",
        "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
        "auth/network-request-failed": "Sin conexión. Inténtalo de nuevo.",
        "auth/too-many-requests": "Demasiados intentos. Espera un poco.",
    };

    let fb = null, user = null, mode = "login", regAvatar = TRAINERS[0];
    let pending = null, started = false, lastCloud = 0, lastState = null, onReady = null;

    const msg = t => ($$("authMsg").textContent = t);
    const hash = s => { let h = 5381; for (const c of s) h = (h * 33 ^ c.charCodeAt(0)) >>> 0; return h.toString(36); };
    const accounts = () => { try { return JSON.parse(localStorage.getItem("pokemonAccounts")) || {}; } catch (e) { return {}; } };
    const putAccounts = a => localStorage.setItem("pokemonAccounts", JSON.stringify(a));
    const localKey = uid => "pokemonSave_" + uid;
    const cached = uid => { try { return JSON.parse(localStorage.getItem(localKey(uid))); } catch (e) { return null; } };
    const newest = (a, b) => (a && b ? ((a.last || 0) >= (b.last || 0) ? a : b) : a || b);

    // ---------- Imágenes y selector de entrenador ----------
    function setSrc(img, name) {
        img.onerror = () => { img.onerror = null; img.src = FALLBACK; };
        img.src = trainerSrc(name);
    }

    function renderPicker(box, selected, onPick) {
        box.innerHTML = "";
        TRAINERS.forEach(n => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "pick" + (n === selected ? " on" : "");
            b.setAttribute("aria-label", n);
            const img = document.createElement("img");
            img.alt = ""; img.draggable = false;
            setSrc(img, n);
            b.appendChild(img);
            b.onclick = () => { onPick(n); renderPicker(box, n, onPick); };
            box.appendChild(b);
        });
    }

    // ---------- Perfil ----------
    function showUser(u) {
        user = u;
        $$("pName").textContent = u.name;
        $$("pId").textContent = "ID: #" + u.uid.slice(0, 8).toUpperCase();
        setSrc($$("avatarImg"), u.avatar);
        $$("profile").hidden = false;
        $$("authScreen").hidden = true;
    }

    function enter(u, data) {
        showUser(u);
        if (!started) { started = true; onReady(data); }
    }

    function setAvatar(n) {
        user.avatar = n;
        setSrc($$("avatarImg"), n);
        if (cloud) {
            fb.f.setDoc(fb.f.doc(fb.db, "users", user.uid), { avatar: n }, { merge: true }).catch(() => {});
        } else {
            const acc = accounts(), k = localStorage.getItem("pokemonSession");
            if (acc[k]) { acc[k].avatar = n; putAccounts(acc); }
        }
    }

    // ---------- Formulario ----------
    function setMode(m) {
        mode = m;
        const reg = m === "register";
        $$("regOnly").hidden = !reg;
        $$("tabLogin").classList.toggle("on", !reg);
        $$("tabRegister").classList.toggle("on", reg);
        $$("authSubmit").textContent = reg ? "Crear cuenta" : "Entrar";
        $$("authPass").autocomplete = reg ? "new-password" : "current-password";
        msg("");
    }

    async function submit(e) {
        e.preventDefault();
        const name = $$("authName").value.trim();
        const id = $$("authUser").value.trim();
        const pass = $$("authPass").value;
        const reg = mode === "register";

        if (!id || !pass) return msg("Rellena todos los campos.");
        if (reg && name.length < 3) return msg("El nombre de entrenador necesita al menos 3 letras.");

        $$("authSubmit").disabled = true;
        msg("");
        try {
            if (cloud) await cloudAuth(reg, name, id, pass);
            else localAuth(reg, name, id, pass);
        } catch (err) {
            pending = null;
            msg(ERR[err.code] || err.message || "Algo ha fallado. Inténtalo de nuevo.");
        }
        $$("authSubmit").disabled = false;
    }

    async function cloudAuth(reg, name, email, pass) {
        if (reg) {
            pending = { name, avatar: regAvatar };   // el perfil se crea al detectar la sesión
            await fb.a.createUserWithEmailAndPassword(fb.auth, email, pass);
        } else {
            await fb.a.signInWithEmailAndPassword(fb.auth, email, pass);
        }
    }

    function localAuth(reg, name, key, pass) {
        key = key.toLowerCase();
        const acc = accounts();
        if (reg) {
            if (acc[key]) throw { message: "Ese usuario ya existe. Pulsa «Entrar»." };
            acc[key] = { pass: hash(pass), uid: Math.random().toString(36).slice(2, 10).padEnd(8, "0"), name, avatar: regAvatar };
            putAccounts(acc);
        } else if (!acc[key] || acc[key].pass !== hash(pass)) {
            throw { message: "Usuario o contraseña incorrectos." };
        }
        localStorage.setItem("pokemonSession", key);
        enter(acc[key], cached(acc[key].uid));
    }

    // ---------- Guardado ----------
    function saveSave(state, force) {
        if (!user) return;
        lastState = state;
        const json = JSON.stringify(state);
        try { localStorage.setItem(localKey(user.uid), json); } catch (e) {}
        if (cloud && fb && (force || Date.now() - lastCloud > 15000)) {
            lastCloud = Date.now();
            return fb.f.setDoc(fb.f.doc(fb.db, "users", user.uid), { save: JSON.parse(json) }, { merge: true }).catch(() => {});
        }
    }

    async function deleteSave() {
        if (!user) return;
        localStorage.removeItem(localKey(user.uid));
        if (cloud && fb) {
            try { await fb.f.updateDoc(fb.f.doc(fb.db, "users", user.uid), { save: fb.f.deleteField() }); } catch (e) {}
        }
    }

    async function logout() {
        if (lastState) await saveSave(lastState, true);
        if (cloud) await fb.a.signOut(fb.auth);
        else localStorage.removeItem("pokemonSession");
        user = null;
        location.reload();
    }

    // ---------- Arranque ----------
    async function loadFirebase() {
        const base = "https://www.gstatic.com/firebasejs/10.12.2/";
        const [app, a, f] = await Promise.all([
            import(base + "firebase-app.js"),
            import(base + "firebase-auth.js"),
            import(base + "firebase-firestore.js"),
        ]);
        const application = app.initializeApp(FIREBASE_CONFIG);
        return { a, f, auth: a.getAuth(application), db: f.getFirestore(application) };
    }

    async function start(cb) {
        onReady = cb;

        $$("authForm").addEventListener("submit", submit);
        $$("tabLogin").onclick = () => setMode("login");
        $$("tabRegister").onclick = () => setMode("register");
        $$("avatarBtn").onclick = () => {
            renderPicker($$("modalPicker"), user.avatar, setAvatar);
            $$("pickModal").hidden = false;
        };
        $$("pickClose").onclick = () => ($$("pickModal").hidden = true);
        $$("logoutBtn").onclick = logout;
        renderPicker($$("regPicker"), regAvatar, n => (regAvatar = n));
        $$("authUser").type = cloud ? "email" : "text";
        $$("authUserLabel").textContent = cloud ? "Correo electrónico" : "Usuario";
        $$("authNote").hidden = cloud;
        setMode("login");

        // Modo prueba (sin Firebase)
        if (!cloud) {
            const acc = accounts()[localStorage.getItem("pokemonSession")];
            if (acc) enter(acc, cached(acc.uid));
            else $$("authScreen").hidden = false;
            return;
        }

        // Modo nube
        $$("authScreen").hidden = false;
        msg("Conectando...");
        try { fb = await loadFirebase(); }
        catch (e) { return msg("No se pudo cargar Firebase. Revisa tu conexión y la configuración."); }
        msg("");

        fb.a.onAuthStateChanged(fb.auth, async (u) => {
            if (!u) { user = null; $$("authScreen").hidden = false; return; }
            let d = {};
            try {
                const ref = fb.f.doc(fb.db, "users", u.uid);
                const snap = await fb.f.getDoc(ref);
                d = snap.exists() ? snap.data() : {};
                if (!d.name && pending) {
                    d = { ...d, ...pending };
                    await fb.f.setDoc(ref, pending, { merge: true });
                }
            } catch (e) {
                return msg("No se pudo leer tu perfil. Revisa las reglas de Firestore.");
            }
            pending = null;
            enter(
                { uid: u.uid, name: d.name || "Entrenador", avatar: d.avatar || TRAINERS[0] },
                newest(d.save || null, cached(u.uid))
            );
        });
    }

    return { start, saveSave, deleteSave };
})();
