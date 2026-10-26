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

function dateDuJour() { return new Date().toLocaleDateString("fr-FR"); }

function ligne(parent, tag, cls, txt) { const e = el(tag, cls, txt); parent.append(e); return e; }

// Construit le document imprimable (portfolio ou certificat) puis ouvre l’impression : « Enregistrer au format PDF ».
function imprimerDocument(type, d) {
  const doc = document.getElementById("doc-impression");
  doc.replaceChildren();
  if (type === "certificat") {
    doc.className = "doc doc-certificat";
    ligne(doc, "p", "doc-sur", "🛡️ Le QG des Sentinelles");
    ligne(doc, "h1", null, "Certificat Sentinelle");
    ligne(doc, "p", null, "Ce certificat est remis à");
    ligne(doc, "p", "doc-blanc", "");
    ligne(doc, "p", "doc-note", "(nom à écrire à la main)");
    ligne(doc, "p", null, "Sentinelle " + d.code + ", pour son engagement dans la prévention du harcèlement au lycée et pour avoir validé l’ensemble du parcours de formation.");
    ligne(doc, "p", "doc-grand", "Niveau atteint : " + d.niveau);
    ligne(doc, "p", null, "Score : " + d.score + " points · " + d.badges.length + " badges");
    ligne(doc, "p", "doc-note", "Délivré le " + dateDuJour());
    const sg = ligne(doc, "div", "doc-signature");
    ligne(sg, "span", null, "Signature du référent");
  } else {
    doc.className = "doc";
    ligne(doc, "p", "doc-sur", "🛡️ Le QG des Sentinelles");
    ligne(doc, "h1", null, "Portfolio Sentinelle");
    ligne(doc, "p", "doc-note", "Sentinelle " + d.code + " · édité le " + dateDuJour() + " · document personnel, sans nom ni donnée personnelle");
    const stats = ligne(doc, "div", "doc-stats");
    [["Niveau", d.niveau], ["Score", String(d.score)], ["Badges", String(d.badges.length)]].forEach(([l, v]) => {
      const c = ligne(stats, "div"); ligne(c, "b", null, v); ligne(c, "span", null, l);
    });
    ligne(doc, "h2", null, "Mes badges");
    if (d.badges.length) {
      const ul = ligne(doc, "ul");
      d.badges.forEach(b => ligne(ul, "li", null, b.nom + (b.date ? " (" + b.date + ")" : "")));
    } else ligne(doc, "p", null, "Aucun badge pour l’instant.");
    ligne(doc, "h2", null, "Ma formation");
    const ul2 = ligne(doc, "ul");
    d.parcours.forEach(p => ligne(ul2, "li", null, p.titre + " : " + p.faits + "/" + p.total + " modules"));
    ligne(doc, "h2", null, "Mes actions");
    const ul3 = ligne(doc, "ul");
    const fam = Object.keys(d.missions);
    if (fam.length) fam.forEach(f => ligne(ul3, "li", null, "Missions Flash " + f + " : " + d.missions[f]));
    else ligne(ul3, "li", null, "Aucune Mission Flash pour l’instant.");
    ligne(ul3, "li", null, "Défis relevés : " + d.defis);
  }
  const titre = document.title;
  document.title = (type === "certificat" ? "Certificat-" : "Portfolio-") + d.code;
  window.addEventListener("afterprint", () => { document.title = titre; }, { once: true });
  window.print();
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

  async function document_(type) {
    const d = await appeler("portfolio");
    if (d.erreur) { dire(d.erreur); return; }
    if (type === "certificat" && !d.certificat) {
      dire("Le certificat se débloque quand tu as terminé le parcours « Sentinelle Confirmée ».");
      return;
    }
    dire("");
    imprimerDocument(type, d);
  }
  ID("btn-portfolio").addEventListener("click", () => agir(() => document_("portfolio")));
  ID("btn-certificat").addEventListener("click", () => agir(() => document_("certificat")));

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

function aujourdhui() { return new Date().toLocaleDateString("sv-SE"); } // AAAA-MM-JJ, heure locale

function estIso(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d || ""); }

function enCours(l, debut, fin) {
  const t = aujourdhui();
  return estIso(l[debut]) && estIso(l[fin]) && l[debut] <= t && t <= l[fin];
}

function remplir(id, contenu) {
  document.getElementById(id).replaceChildren(contenu);
}

async function initAccueil() {
  const connecte = !!(CONFIG.API_URL && jeton());

  // Actualités : publiées et non expirées (3 maximum, les plus récentes d’abord)
  (async () => {
    try {
      const data = await lireFeuille("ACTUALITES");
      if (!data) { remplir("acc-actus", el("p", "vide", "Les actualités apparaîtront ici.")); return; }
      const liste = data.filter(l => enCours(l, "Date_Publication", "Date_Expiration"))
        .sort((x, y) => y.Date_Publication.localeCompare(x.Date_Publication)).slice(0, 3);
      if (!liste.length) { remplir("acc-actus", el("p", "vide", "Pas d’actualité en ce moment.")); return; }
      const ul = el("ul", "actus");
      liste.forEach(l => {
        const li = el("li");
        li.append(el("strong", null, l.Titre), el("span", null, l.Message));
        ul.append(li);
      });
      remplir("acc-actus", ul);
    } catch (e) { remplir("acc-actus", el("p", "vide", "Impossible de charger les actualités pour le moment.")); }
  })();

  // Défi du mois : celui dont les dates couvrent aujourd’hui
  (async () => {
    try {
      const data = await lireFeuille("DEFIS");
      if (!data) { remplir("acc-defi", el("p", "vide", "Le défi du mois apparaîtra ici.")); return; }
      const d = data.filter(l => enCours(l, "Date_Debut", "Date_Fin"))[0];
      if (!d) { remplir("acc-defi", el("p", "vide", "Pas de défi en cours.")); return; }
      const c = el("div");
      c.append(el("strong", null, d.Titre), el("p", null, d.Description));
      remplir("acc-defi", c);
    } catch (e) { remplir("acc-defi", el("p", "vide", "Impossible de charger le défi pour le moment.")); }
  })();

  // Mission Flash et progression : seulement si l’élève est connecté
  const invite = () => {
    const p = el("p", "vide");
    p.append("Connecte-toi dans ", Object.assign(el("a", null, "Mon parcours"), { href: "portfolio.html" }), " pour voir ceci.");
    return p;
  };
  if (!connecte) { remplir("acc-mission", invite()); remplir("acc-progression", invite()); return; }

  (async () => {
    try {
      const r = await appeler("missionsSemaine");
      if (r.erreur) { remplir("acc-mission", el("p", "vide", r.erreur)); return; }
      const m = r.missions.filter(x => !x.fait)[0];
      const c = el("div");
      if (!m) { c.append(el("p", null, "Bravo, tu as fait toutes les missions de la semaine !")); }
      else {
        c.append(el("strong", null, m.titre), el("span", null, m.famille));
        const a = el("a", "btn", "Je relève la mission"); a.href = "missions.html";
        c.append(a);
      }
      remplir("acc-mission", c);
    } catch (e) { remplir("acc-mission", el("p", "vide", "Impossible de charger la mission pour le moment.")); }
  })();

  (async () => {
    try {
      const [p, r] = await Promise.all([appeler("profil"), appeler("parcours")]);
      if (p.erreur || r.erreur) {
        const t = p.erreur || r.erreur;
        if (/expir/i.test(t)) sessionStorage.removeItem("qg_token");
        remplir("acc-progression", el("p", "vide", t)); return;
      }
      if (p.doitChanger) { remplir("acc-progression", invite()); return; }
      let faits = 0, total = 0;
      r.parcours.forEach(x => { faits += x.faits; total += x.total; });
      const g = el("div", "stats");
      [[p.niveau, "Niveau"], [String(p.score), "Score"], [faits + "/" + total, "Modules"]].forEach(([v, l]) => {
        const d = el("div"); d.append(el("b", null, v), el("span", null, l)); g.append(d);
      });
      remplir("acc-progression", g);
    } catch (e) { remplir("acc-progression", el("p", "vide", "Impossible de charger ta progression pour le moment.")); }
  })();
}

construireCadre();
if (document.body.dataset.page === "faq") initFaq();
if (document.body.dataset.page === "portfolio") initPortfolio();
if (document.body.dataset.page === "missions") initMissions();
if (document.body.dataset.page === "parcours") initParcours();
if (document.body.dataset.page === "index") initAccueil();
