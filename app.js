"use strict";

// Étape 2 : coller ici l’adresse de l’application web Apps Script.
const CONFIG = { API_URL: "https://script.google.com/macros/s/AKfycbyYt4ipAol5ihHZKybK7y8K6tc7pgijrnUIIxzsv6bQCgl8Vmri29zIgyDdE6vHrieU/exec" };

const PAGES = [
  { id: "index", href: "index.html", ico: "🏠", nom: "Accueil" },
  { id: "missions", href: "missions.html", ico: "❤️", nom: "J’agis" },
  { id: "parcours", href: "parcours.html", ico: "🧠", nom: "J’apprends" },
  { id: "faq", href: "faq.html", ico: "🛟", nom: "Aide" },
  { id: "portfolio", href: "portfolio.html", ico: "🎖", nom: "Mon parcours" }
];

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
}

// Lit une feuille publique (FAQ, RESSOURCES…). Renvoie null tant que l’API n’est pas configurée.
async function lireFeuille(nom) {
  if (!CONFIG.API_URL) return null;
  const r = await fetch(CONFIG.API_URL + "?feuille=" + encodeURIComponent(nom));
  if (!r.ok) throw new Error("Réponse " + r.status);
  const d = await r.json();
  if (!Array.isArray(d)) throw new Error("Données invalides");
  return d;
}

function construireCadre() {
  const page = document.body.dataset.page;
  const haut = el("header", "haut");
  haut.append(el("h1", null, "🛡️ Le QG des Sentinelles"),
              el("p", null, "Ton espace de formation, d’engagement et de progression."));
  const nav = el("nav", "onglets");
  nav.setAttribute("aria-label", "Navigation principale");
  PAGES.forEach(p => {
    const a = el("a");
    a.href = p.href;
    const ico = el("span", "ico", p.ico);
    ico.setAttribute("aria-hidden", "true");
    a.append(ico, el("span", null, p.nom));
    if (p.id === page) a.setAttribute("aria-current", "page");
    nav.append(a);
  });
  document.body.prepend(haut, nav);
}

async function initFaq() {
  const zone = document.getElementById("faq-liste");
  const champ = document.getElementById("faq-recherche");
  const choix = document.getElementById("faq-rubrique");
  let data;
  try { data = await lireFeuille("FAQ"); }
  catch (e) { zone.replaceChildren(el("p", "vide", "Impossible de charger l’aide pour le moment. Réessaie plus tard.")); return; }
  if (!data) { zone.replaceChildren(el("p", "vide", "Le centre d’aide sera relié à la base de données à l’étape 2.")); return; }

  [...new Set(data.map(f => f.Rubrique))].forEach(r => {
    const o = el("option", null, r); o.value = r; choix.append(o);
  });

  function afficher() {
    const mot = champ.value.trim().toLowerCase();
    const rub = choix.value;
    const frag = document.createDocumentFragment();
    let courante = "";
    data.filter(f => (!rub || f.Rubrique === rub) && (!mot || (f.Titre + " " + f.Question).toLowerCase().includes(mot)))
      .forEach(f => {
        if (f.Rubrique !== courante) { courante = f.Rubrique; frag.append(el("h2", "rubrique", courante)); }
        const d = el("details");
        d.append(el("summary", null, f.Titre));
        const c = el("div");
        [["Je peux", f.Je_Peux], ["J’évite", f.JEvite], ["Je demande de l’aide quand", f.Quand_Demander_Aide], ["À retenir", f.A_Retenir]]
          .forEach(([t, v]) => { if (v) { const p = el("p"); p.append(el("strong", null, t + " : "), document.createTextNode(v)); c.append(p); } });
        d.append(c); frag.append(d);
      });
    if (!frag.childNodes.length) frag.append(el("p", "vide", "Aucun résultat. Essaie un autre mot."));
    zone.replaceChildren(frag);
  }
  champ.addEventListener("input", afficher);
  choix.addEventListener("change", afficher);
  afficher();
}

function jeton() { return sessionStorage.getItem("qg_token") || ""; }

async function appeler(action, extra) {
  const r = await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify(Object.assign({ action: action, token: jeton() }, extra || {}))
  });
  if (!r.ok) throw new Error("Réponse " + r.status);
  return r.json();
}

function initPortfolio() {
  const ID = id => document.getElementById(id);
  const zones = ["zone-connexion", "zone-changement", "zone-profil"];
  const msg = ID("message");
  const dire = t => { msg.textContent = t || ""; msg.hidden = !t; };
  const montrer = id => zones.forEach(z => { ID(z).hidden = z !== id; });
  const agir = async f => {
    try { await f(); } catch (e) { dire("Connexion impossible pour le moment. Réessaie plus tard."); }
  };

  async function afficherProfil() {
    const p = await appeler("profil");
    if (p.erreur) { sessionStorage.removeItem("qg_token"); montrer("zone-connexion"); dire(p.erreur); return; }
    if (p.doitChanger) { montrer("zone-changement"); dire("Première connexion : choisis ton mot de passe personnel."); return; }
    ID("p-niveau").textContent = p.niveau;
    ID("p-score").textContent = p.score;
    ID("p-badges").textContent = p.badges.length;
    ID("liste-badges").replaceChildren(...(p.badges.length
      ? p.badges.map(b => el("li", null, b))
      : [el("li", null, "Aucun badge pour l’instant.")]));
    montrer("zone-profil");
    dire("");
  }

  ID("zone-connexion").addEventListener("submit", ev => {
    ev.preventDefault();
    agir(async () => {
      const r = await appeler("connexion", { code: ID("code").value, mdp: ID("mdp").value });
      ID("mdp").value = "";
      if (r.erreur) { dire(r.erreur); return; }
      sessionStorage.setItem("qg_token", r.token);
      await afficherProfil();
    });
  });

  ID("zone-changement").addEventListener("submit", ev => {
    ev.preventDefault();
    agir(async () => {
      const a = ID("nv-mdp").value, b = ID("nv-mdp2").value;
      if (a !== b) { dire("Les deux mots de passe ne sont pas identiques."); return; }
      const r = await appeler("changerMdp", { nouveau: a });
      if (r.erreur) { dire(r.erreur); return; }
      ID("nv-mdp").value = ""; ID("nv-mdp2").value = "";
      await afficherProfil();
    });
  });

  ID("btn-deco").addEventListener("click", () => agir(async () => {
    await appeler("deconnexion");
    sessionStorage.removeItem("qg_token");
    montrer("zone-connexion");
    dire("Tu es déconnecté·e.");
  }));

  montrer("zone-connexion");
  if (!CONFIG.API_URL) { dire("La connexion n’est pas encore configurée."); return; }
  if (jeton()) agir(afficherProfil);
}

async function initMissions() {
  const zone = document.getElementById("flash-liste");
  const msg = document.getElementById("flash-message");
  const dire = t => { msg.textContent = t || ""; msg.hidden = !t; };
  if (!CONFIG.API_URL || !jeton()) {
    zone.replaceChildren(el("p", "vide", "Connecte-toi dans « Mon parcours » pour voir tes missions de la semaine."));
    return;
  }
  async function charger() {
    let r;
    try { r = await appeler("missionsSemaine"); }
    catch (e) { zone.replaceChildren(el("p", "vide", "Impossible de charger les missions pour le moment. Réessaie plus tard.")); return; }
    if (r.erreur) {
      if (/expir/i.test(r.erreur)) sessionStorage.removeItem("qg_token");
      zone.replaceChildren(el("p", "vide", r.erreur));
      return;
    }
    const ul = el("ul", "missions");
    r.missions.forEach(m => {
      const li = el("li");
      const t = el("div");
      t.append(el("strong", null, m.titre), el("span", null, m.famille));
      li.append(t);
      if (m.fait) {
        li.append(el("span", "fait", "✔ Faite"));
      } else {
        const b = el("button", "btn", "J’ai fait cette mission");
        b.type = "button";
        b.addEventListener("click", async () => {
          b.disabled = true;
          try {
            const v = await appeler("faireMission", { codeMF: m.code });
            if (v.erreur) { dire(v.erreur); b.disabled = false; return; }
            dire(v.nouveauxBadges && v.nouveauxBadges.length
              ? "Bravo ! Nouveau badge : " + v.nouveauxBadges.join(", ")
              : "Mission enregistrée. Bravo !");
            await charger();
          } catch (e) { dire("Enregistrement impossible pour le moment. Réessaie plus tard."); b.disabled = false; }
        });
        li.append(b);
      }
      ul.append(li);
    });
    zone.replaceChildren(r.missions.length ? ul : el("p", "vide", "Aucune mission cette semaine."));
  }
  await charger();
}

async function initParcours() {
  const zone = document.getElementById("parcours-liste");
  const msg = document.getElementById("parcours-message");
  const dire = t => { msg.textContent = t || ""; msg.hidden = !t; };
  if (!CONFIG.API_URL || !jeton()) {
    zone.replaceChildren(el("p", "vide", "Connecte-toi dans « Mon parcours » pour suivre tes parcours de formation."));
    return;
  }
  const ouverts = new Set();
  async function charger() {
    let r;
    try { r = await appeler("parcours"); }
    catch (e) { zone.replaceChildren(el("p", "vide", "Impossible de charger les parcours pour le moment. Réessaie plus tard.")); return; }
    if (r.erreur) {
      if (/expir/i.test(r.erreur)) sessionStorage.removeItem("qg_token");
      zone.replaceChildren(el("p", "vide", r.erreur));
      return;
    }
    const frag = document.createDocumentFragment();
    let premierOuvert = false;
    r.parcours.forEach((p, i) => {
      const d = el("details", "parcours-bloc");
      const termine = p.total > 0 && p.faits === p.total;
      if (ouverts.has(p.id) || (!ouverts.size && !premierOuvert && !termine)) { d.open = true; premierOuvert = true; }
      d.addEventListener("toggle", () => { d.open ? ouverts.add(p.id) : ouverts.delete(p.id); });
      d.append(el("summary", null, (termine ? "✔ " : "") + (i + 1) + ". " + p.titre + " (" + p.faits + "/" + p.total + ")"));
      const c = el("div");
      if (p.description) c.append(el("p", "chapo", p.description + (p.badge ? " · Badge : " + p.badge : "")));
      const ol = el("ol", "modules");
      p.modules.forEach(m => {
        const li = el("li");
        const t = el("div");
        t.append(el("strong", null, m.titre), el("span", null, (m.fait ? "✔ Terminé" : m.disponible ? "À faire" : "À venir") + (m.duree ? " · " + m.duree : "")));
        if (m.contenu && m.disponible) t.append(el("p", "contenu", m.contenu));
        li.append(t);
        if (m.disponible) {
          const b = el("button", "btn", "J’ai terminé ce module");
          b.type = "button";
          b.addEventListener("click", async () => {
            b.disabled = true;
            try {
              const v = await appeler("validerModule", { idModule: m.id });
              if (v.erreur) { dire(v.erreur); b.disabled = false; return; }
              dire(v.nouveauxBadges && v.nouveauxBadges.length
                ? "Bravo ! Nouveau badge : " + v.nouveauxBadges.join(", ")
                : "Module enregistré. Bravo !");
              await charger();
            } catch (e) { dire("Enregistrement impossible pour le moment. Réessaie plus tard."); b.disabled = false; }
          });
          li.append(b);
        }
        ol.append(li);
      });
      c.append(ol);
      d.append(c);
      frag.append(d);
    });
    zone.replaceChildren(frag);
  }
  await charger();
}

construireCadre();
if (document.body.dataset.page === "faq") initFaq();
if (document.body.dataset.page === "portfolio") initPortfolio();
if (document.body.dataset.page === "missions") initMissions();
if (document.body.dataset.page === "parcours") initParcours();
