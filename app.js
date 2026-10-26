"use strict";

// Étape 2 : coller ici l’adresse de l’application web Apps Script.
const CONFIG = { API_URL: "https://cordierromain1983-svg.github.io/QG-Sentinelles/" };

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

construireCadre();
if (document.body.dataset.page === "faq") initFaq();
