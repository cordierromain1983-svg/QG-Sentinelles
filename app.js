"use strict";

// Étape 2 : coller ici l’adresse de l’application web Apps Script.
const CONFIG = { API_URL: "https://script.google.com/macros/s/AKfycbyYt4ipAol5ihHZKybK7y8K6tc7pgijrnUIIxzsv6bQCgl8Vmri29zIgyDdE6vHrieU/exec" };

const PAGES = [
  { id: "index", href: "index.html", ico: "accueil", nom: "Accueil" },
  { id: "missions", href: "missions.html", ico: "mission", nom: "J’agis" },
  { id: "parcours", href: "parcours.html", ico: "marches", nom: "J’apprends" },
  { id: "faq", href: "faq.html", ico: "bouee", nom: "Aide" },
  { id: "portfolio", href: "portfolio.html", ico: "medaille", nom: "Mon parcours" }
];

// Pictogrammes du menu : dessinés ici, aucun fichier ni police externe.
const ICONES = {
  accueil: ["M3 11l9-8 9 8", "M5 10v10h5v-6h4v6h5V10"],
  mission: ["M13 2L4 14h7l-1 8 9-12h-7z"],
  marches: ["M3 20h18", "M5 20v-5h4v5", "M10 20V9h4v11", "M15 20V4h4v16"],
  bouee: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z", "M5.6 5.6l3.9 3.9", "M14.5 14.5l3.9 3.9", "M18.4 5.6l-3.9 3.9", "M9.5 14.5l-3.9 3.9"],
  medaille: ["M12 3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z", "M8.5 13.5L7 22l5-3 5 3-1.5-8.5"]
};
function icone(nom) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  (ICONES[nom] || []).forEach(d => {
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", d);
    svg.append(p);
  });
  return svg;
}

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
}

// Lit une feuille publique (FAQ, RESSOURCES…). Renvoie null tant que l’API n’est pas configurée.
async function lireFeuille(nom) {
  if (!CONFIG.API_URL) return null;
  const d = await appeler("feuille", { nom: nom });
  if (d && d.erreur) throw new Error(d.erreur);
  if (!Array.isArray(d)) throw new Error("Données invalides");
  return d;
}

function construireCadre() {
  const page = document.body.dataset.page;
  const haut = el("header", "haut");
  haut.append(el("h1", null, "Le QG des Sentinelles"),
              el("p", null, "Ton espace de formation, d’engagement et de progression."));
  const nav = el("nav", "onglets");
  nav.setAttribute("aria-label", "Navigation principale");
  PAGES.forEach(p => {
    const a = el("a");
    a.href = p.href;
    a.append(icone(p.ico), el("span", null, p.nom));
    if (p.id === page) a.setAttribute("aria-current", "page");
    nav.append(a);
  });
  if (jeton() && page !== "referent") {
    const q = el("button", "quitter", "Quitter");
    q.type = "button";
    q.setAttribute("aria-label", "Me déconnecter");
    q.addEventListener("click", quitter);
    haut.append(q);
    document.body.prepend(haut, nav);
  } else {
    document.body.prepend(haut);
  }
  const pied = el("footer", "pied");
  const lien = el("a", null, "Mentions légales et confidentialité");
  lien.href = "mentions-legales.html";
  const ref = el("a", null, "Espace référent");
  ref.href = "referent.html";
  pied.append(lien, document.createTextNode(" · "), ref);
  document.body.append(pied);
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
  const d = await r.json();
  if (d && d.erreur && action !== "connexion") {
    if (/Session expirée/.test(d.erreur)) { sessionStorage.removeItem("qg_token"); location.replace("index.html?s=expire"); return { erreur: d.erreur }; }
    if (/Choisis d’abord ton mot de passe/.test(d.erreur) && document.body.dataset.page !== "index") { location.replace("index.html"); return { erreur: d.erreur }; }
  }
  return d;
}

async function quitter() {
  try { await appeler("deconnexion"); } catch (e) { /* on quitte quand même */ }
  sessionStorage.removeItem("qg_token");
  location.replace("index.html");
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
    if (p.referent) { await appeler("deconnexion"); sessionStorage.removeItem("qg_token"); montrer("zone-connexion"); dire("Ce compte est un compte référent : utilise l’Espace référent (lien en bas de page)."); return; }
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
    await quitter();
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

// Quiz d’un module : 3 questions à choix, correction immédiate, module validé à 2 bonnes réponses sur 3.
async function ouvrirQuiz(m, bouton, zone) {
  const dire = t => { const p = document.getElementById("parcours-message"); p.textContent = t || ""; p.hidden = !t; };
  bouton.disabled = true;
  let d;
  try { d = await appeler("quiz", { idModule: m.id }); }
  catch (e) { dire("Quiz indisponible pour le moment. Réessaie plus tard."); bouton.disabled = false; return; }
  if (d.erreur) { dire(d.erreur); bouton.disabled = false; return; }
  dire("");
  bouton.hidden = true;
  const form = el("form", "quiz-form");
  form.setAttribute("novalidate", "");
  d.questions.forEach((qu, i) => {
    const fs = el("fieldset", "quiz-q");
    fs.dataset.id = qu.id;
    fs.append(el("legend", null, (i + 1) + ". " + qu.question));
    ["A", "B", "C"].forEach(l => {
      const lab = el("label", "quiz-choix");
      const inp = el("input");
      inp.type = "radio"; inp.name = qu.id; inp.value = l;
      lab.append(inp, el("span", null, qu.choix[l]));
      fs.append(lab);
    });
    fs.append(el("p", "quiz-retour"));
    form.append(fs);
  });
  const env = el("button", "btn", "Valider mes réponses");
  env.type = "submit";
  const bilan = el("p", "quiz-bilan");
  bilan.setAttribute("role", "status");
  form.append(env, bilan);
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const reponses = {};
    form.querySelectorAll("fieldset").forEach(fs => {
      const c = fs.querySelector("input:checked");
      if (c) reponses[fs.dataset.id] = c.value;
    });
    if (Object.keys(reponses).length < d.questions.length) { bilan.textContent = "Réponds aux " + d.questions.length + " questions avant de valider."; return; }
    env.disabled = true;
    let r;
    try { r = await appeler("repondreQuiz", { idModule: m.id, reponses: reponses }); }
    catch (e) { bilan.textContent = "Envoi impossible pour le moment. Réessaie plus tard."; env.disabled = false; return; }
    if (r.erreur) { bilan.textContent = r.erreur; env.disabled = false; return; }
    r.resultats.forEach(x => {
      const fs = form.querySelector('fieldset[data-id="' + x.id + '"]');
      fs.classList.add(x.juste ? "juste" : "faux");
      fs.disabled = true;
      fs.querySelector(".quiz-retour").textContent = (x.juste ? "✔ Bonne réponse. " : "✘ Pas tout à fait. ") + x.explication;
    });
    const score = r.bonnes + " bonne" + (r.bonnes > 1 ? "s" : "") + " réponse" + (r.bonnes > 1 ? "s" : "") + " sur " + r.total + ".";
    if (r.reussi) {
      bilan.textContent = score + " Module validé ! " + (r.nouveauxBadges && r.nouveauxBadges.length ? "Nouveau badge : " + r.nouveauxBadges.join(", ") + ". " : "");
      const suite = el("button", "btn", "Continuer");
      suite.type = "button";
      suite.addEventListener("click", () => initParcours());
      form.append(suite);
    } else {
      bilan.textContent = score + " Il en faut " + r.seuil + " pour valider. Relis le module puis réessaie.";
      const encore = el("button", "btn", "Réessayer");
      encore.type = "button";
      encore.addEventListener("click", () => { zone.replaceChildren(); bouton.hidden = false; bouton.disabled = false; ouvrirQuiz(m, bouton, zone); });
      form.append(encore);
    }
  });
  zone.replaceChildren(form);
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
        else if (m.contenu && m.fait) {
          const dd = el("details", "relire");
          dd.append(el("summary", null, "Relire le module"), el("p", "contenu", m.contenu));
          t.append(dd);
        }
        li.append(t);
        if (m.disponible) {
          const zq = el("div", "quiz");
          const b = el("button", "btn", "Passer le quiz");
          b.type = "button";
          b.addEventListener("click", () => ouvrirQuiz(m, b, zq));
          li.append(b, zq);
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

function initEntree() {
  const ID = id => document.getElementById(id);
  const msg = ID("message");
  const dire = t => { msg.textContent = t || ""; msg.hidden = !t; };
  const agir = async f => {
    try { await f(); } catch (e) { dire("Connexion impossible pour le moment. Réessaie plus tard."); }
  };
  const montrer = id => ["zone-connexion", "zone-changement", "zone-accueil"].forEach(z => { ID(z).hidden = z !== id; });

  const ouvrir = async () => {
    const p = await appeler("profil");
    if (p.erreur) { montrer("zone-connexion"); dire(p.erreur); return; }
    if (p.referent) { location.replace("referent.html"); return; }
    if (p.doitChanger) { montrer("zone-changement"); dire("Première connexion : choisis ton mot de passe personnel."); return; }
    montrer("zone-accueil"); document.body.classList.add("connecte"); initAccueil();
  };
  montrer("zone-connexion");
  if (/[?&]s=expire/.test(location.search)) dire("Ta session a expiré. Reconnecte-toi.");
  if (!CONFIG.API_URL) { dire("La connexion n’est pas encore configurée."); return; }
  if (jeton()) agir(ouvrir);

  ID("zone-connexion").addEventListener("submit", ev => {
    ev.preventDefault();
    agir(async () => {
      const r = await appeler("connexion", { code: ID("code").value, mdp: ID("mdp").value });
      ID("mdp").value = "";
      if (r.erreur) { dire(r.erreur); return; }
      sessionStorage.setItem("qg_token", r.token);
      if (r.doitChanger) { montrer("zone-changement"); dire("Première connexion : choisis ton mot de passe personnel."); return; }
      if (r.role === "referent" || r.role === "admin") { location.replace("referent.html"); return; }
      location.replace("index.html");
    });
  });

  ID("zone-changement").addEventListener("submit", ev => {
    ev.preventDefault();
    agir(async () => {
      const x = ID("nv-mdp").value, y = ID("nv-mdp2").value;
      if (x !== y) { dire("Les deux mots de passe ne sont pas identiques."); return; }
      const r = await appeler("changerMdp", { nouveau: x });
      if (r.erreur) { dire(r.erreur); return; }
      ID("nv-mdp").value = ""; ID("nv-mdp2").value = "";
      const p = await appeler("profil");
      if (p.referent) { location.replace("referent.html"); return; }
      location.replace("index.html");
    });
  });
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

async function initReferent() {
  const ID = id => document.getElementById(id);
  const zones = ["zone-connexion", "zone-changement", "zone-ref"];
  const msg = ID("message");
  const dire = t => { msg.textContent = t || ""; msg.hidden = !t; };
  const montrer = id => zones.forEach(z => { ID(z).hidden = z !== id; });
  const agir = async f => {
    try { await f(); } catch (e) { dire("Connexion impossible pour le moment. Réessaie plus tard."); }
  };
  let vue = null;

  function carte(s) {
    const d = el("details");
    d.append(el("summary", null, s.code + " · " + s.niveau + " · " + s.modules + "/" + vue.modulesTotal + " modules"));
    const c = el("div");
    c.append(el("p", null, "Missions Flash : " + s.missions + " · Défis : " + s.defis + " · Score : " + s.score));
    if (!s.premiereConnexionFaite) c.append(el("p", "vide", "Pas encore connecté·e (mot de passe provisoire non changé)."));
    c.append(el("p", null, "Badges (" + s.badges.length + ") : " + (s.badges.length ? s.badges.join(", ") : "aucun")));

    const f = el("form", "outils");
    const sel = el("select");
    sel.setAttribute("aria-label", "Badge à attribuer");
    vue.badgesManuels.forEach(b => { const o = el("option", null, b.famille + " · " + b.nom); o.value = b.id; sel.append(o); });
    const com = el("input"); com.placeholder = "Commentaire (facultatif, 200 caractères)"; com.maxLength = 200;
    com.setAttribute("aria-label", "Commentaire");
    const ok = el("button", "btn", "Attribuer ce badge"); ok.type = "submit";
    f.append(sel, com, ok);
    f.addEventListener("submit", ev => { ev.preventDefault(); agir(async () => {
      const r = await appeler("refBadge", { cible: s.code, idBadge: sel.value, commentaire: com.value });
      if (r.erreur) { dire(r.erreur); return; }
      dire("Badge « " + r.badge + " » attribué à " + s.code + ".");
      await charger();
    }); });
    c.append(f);

    if (vue.role === "admin") {
      const b = el("button", "btn", "Réinitialiser le mot de passe"); b.type = "button";
      let arme = false;
      b.addEventListener("click", () => agir(async () => {
        if (!arme) { arme = true; b.textContent = "Confirmer la réinitialisation de " + s.code; return; }
        const r = await appeler("adminReinit", { cible: s.code });
        arme = false; b.textContent = "Réinitialiser le mot de passe";
        if (r.erreur) { dire(r.erreur); return; }
        dire("Code provisoire de " + r.cible + " : " + r.provisoire + " — note-le maintenant, il ne sera plus affiché.");
        window.scrollTo(0, 0);
      }));
      c.append(b);
    }
    d.append(c);
    return d;
  }

  async function charger() {
    const v = await appeler("refVue");
    if (v.erreur) { sessionStorage.removeItem("qg_token"); montrer("zone-connexion"); dire(v.erreur); return; }
    vue = v;
    ID("r-nb").textContent = v.sentinelles.length;
    ID("r-mod").textContent = v.sentinelles.reduce((t, s) => t + s.modules, 0);
    ID("r-liste").replaceChildren(...v.sentinelles.map(carte));
    const dm = await appeler("refDemandes");
    const aTraiter = (dm.demandes || []).filter(x => x.statut !== "Traitée");
    ID("r-dem").textContent = aTraiter.length;
    ID("r-demandes").replaceChildren(...(aTraiter.length ? aTraiter.map(x => {
      const p = el("div", "demande");
      p.append(el("p", null, x.code + " · " + x.date + " · " + x.motif + (x.dispo ? " (dispo : " + x.dispo + ")" : "")));
      const b = el("button", "btn", "Marquer comme traitée"); b.type = "button";
      b.addEventListener("click", () => agir(async () => {
        const r = await appeler("refTraiter", { id: x.id });
        if (r.erreur) { dire(r.erreur); return; }
        await charger();
      }));
      p.append(b);
      return p;
    }) : [el("p", "vide", "Aucune demande en attente.")]));
    montrer("zone-ref");
  }

  ID("zone-connexion").addEventListener("submit", ev => {
    ev.preventDefault();
    agir(async () => {
      const r = await appeler("connexion", { code: ID("code").value, mdp: ID("mdp").value });
      ID("mdp").value = "";
      if (r.erreur) { dire(r.erreur); return; }
      if (r.role !== "referent" && r.role !== "admin") {
        sessionStorage.setItem("qg_token", r.token);
        await appeler("deconnexion"); sessionStorage.removeItem("qg_token");
        dire("Ce compte n’est pas un compte référent."); return;
      }
      sessionStorage.setItem("qg_token", r.token);
      if (r.doitChanger) { montrer("zone-changement"); dire("Première connexion : choisis ton mot de passe personnel."); return; }
      dire(""); await charger();
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
      dire(""); await charger();
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
  if (jeton()) agir(charger);
}

const PAGES_PROTEGEES = ["missions", "parcours", "portfolio", "faq"];
if (PAGES_PROTEGEES.indexOf(document.body.dataset.page) >= 0 && !jeton()) {
  location.replace("index.html");
  throw new Error("Connexion requise");
}
construireCadre();
if (document.body.dataset.page === "faq") initFaq();
if (document.body.dataset.page === "portfolio") initPortfolio();
if (document.body.dataset.page === "missions") initMissions();
if (document.body.dataset.page === "parcours") initParcours();
if (document.body.dataset.page === "index") initEntree();
if (document.body.dataset.page === "referent") initReferent();
