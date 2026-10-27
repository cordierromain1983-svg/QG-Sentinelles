// Médailles des badges : dessinées en SVG, aucune image ni police externe.
const FAMILLES_BADGES = {
  "Formation":   { forme: "ecu",     c: "#7FB0FF", clair: "#CFE2FF" },
  "Voir":        { forme: "hexa",    c: "#4CC9F0", clair: "#C4F1FF" },
  "Écouter":     { forme: "cercle",  c: "#4CC38A", clair: "#C6F5DF" },
  "Agir":        { forme: "octo",    c: "#FF9F5A", clair: "#FFD9BD" },
  "Protéger":    { forme: "losange", c: "#B48CFF", clair: "#E3D3FF" },
  "Commun":      { forme: "double",  c: "#F2B705", clair: "#FFE79A" },
  "Distinction": { forme: "etoile",  c: "#FFD95A", clair: "#FFFFFF" }
};
const ORDRE_FAMILLES = ["Formation", "Voir", "Écouter", "Agir", "Protéger", "Commun", "Distinction"];

const GLYPHES = {
  sprout: ["M12 21V11", "M12 11C12 7 9 5 5 5c0 4 3 6 7 6", "M12 14c0-3 2-5 6-5 0 4-2 6-6 6"],
  eye: ["M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  eyePlus: ["M2 13s3.5-6.5 10-6.5S22 13 22 13s-3.5 6.5-10 6.5S2 13 2 13z", "M12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "M19 2v5", "M16.5 4.5h5"],
  ear: ["M7 10a5 5 0 0 1 10 0c0 3-2.5 4-3.2 6.2-.6 1.8-1.5 3-3.3 3-1.8 0-2.8-1.3-2.8-3", "M10.5 10.5a1.8 1.8 0 0 1 3.6 0", "M2.5 9.5v5", "M4.8 7.5v9"],
  earCheck: ["M7 9a5 5 0 0 1 10 0c0 3-2.5 4-3.2 6.2", "M10.5 9.5a1.8 1.8 0 0 1 3.6 0", "M2.5 9v5", "M4.8 7v9", "M13 18l2.5 2.5 5-5.5"],
  wave: ["M2 12h3l2-5 3 10 3-14 3 12 2-3h4"],
  bolt: ["M13 2L4 14h7l-1 8 9-12h-7z"],
  shield: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"],
  shieldCheck: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "M8.5 12l2.5 2.5 4.5-5"],
  shieldHeart: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "M12 16s-3-1.8-3-4a1.7 1.7 0 0 1 3-1 1.7 1.7 0 0 1 3 1c0 2.2-3 4-3 4z"],
  crown: ["M3 8l4 4 5-7 5 7 4-4-2 11H5z"],
  sun: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 2v2.5", "M12 19.5V22", "M2 12h2.5", "M19.5 12H22", "M4.9 4.9l1.8 1.8", "M17.3 17.3l1.8 1.8", "M19.1 4.9l-1.8 1.8", "M6.7 17.3l-1.8 1.8"],
  radar: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 12l6-6"],
  calendar: ["M4 6h16v15H4z", "M4 10h16", "M8 3v4", "M16 3v4", "M9 15l2 2 4-4"],
  heart: ["M12 20s-8-4.8-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.2 12 20 12 20z"],
  hand: ["M7 12V6.5a1.5 1.5 0 0 1 3 0V11", "M10 11V4.5a1.5 1.5 0 0 1 3 0V11", "M13 11V5.5a1.5 1.5 0 0 1 3 0V12", "M16 12V8.5a1.5 1.5 0 0 1 3 0V15c0 4-3 6-6 6-3.5 0-5-2-7-5l-2-3a1.5 1.5 0 0 1 2.5-1.5L7 13"],
  flag: ["M5 21V4", "M5 4h12l-2.5 4 2.5 4H5"],
  link: ["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1", "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"],
  bulb: ["M9 18h6", "M10 21h4", "M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"],
  rocket: ["M12 2c3.5 2 5 6 5 10l-2 3H9l-2-3c0-4 1.5-8 5-10z", "M12 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z", "M7 13l-3 3 1 3 3-1", "M17 13l3 3-1 3-3-1", "M10 18l2 4 2-4"],
  scroll: ["M6 3h10a2 2 0 0 1 2 2v14a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2z", "M9 8h6", "M9 12h6", "M9 16h4"],
  key: ["M7.5 9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z", "M11 12.5h10", "M18 12.5v3", "M15 12.5v2.5"],
  umbrella: ["M3 12a9 9 0 0 1 18 0z", "M12 12v6a2 2 0 0 0 4 0", "M12 3v1"],
  mountain: ["M2 20l7-12 4 6 3-4 6 10z", "M9 8V3", "M9 3h4l-1 1.5L13 6H9"],
  magnifier: ["M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15z", "M16 16l5 5"],
  chart: ["M3 20h18", "M5 16l5-5 4 3 6-7", "M15 7h5v5"],
  infinity: ["M12 12c-2-3-3.5-4-5.5-4a4 4 0 0 0 0 8c2 0 3.5-1 5.5-4 2 3 3.5 4 5.5 4a4 4 0 0 0 0-8c-2 0-3.5 1-5.5 4z"],
  trophy: ["M8 4h8v6a4 4 0 0 1-8 0z", "M8 6H4v2a4 4 0 0 0 4 4", "M16 6h4v2a4 4 0 0 1-4 4", "M12 14v4", "M8 21h8", "M10 18h4"],
  flame: ["M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z"],
  star: ["M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"],
  megaphone: ["M3 10v4h4l8 4V6L7 10z", "M18 9a4 4 0 0 1 0 6", "M7 14l1.5 6H11l-1-5"],
  compass: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M15.5 8.5l-2 5-5 2 2-5z"],
  globe: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M3 12h18", "M12 3c3 3 3 15 0 18", "M12 3c-3 3-3 15 0 18"],
  cadenas: ["M6 11h12v10H6z", "M8.5 11V8a3.5 3.5 0 0 1 7 0v3"]
};

const GLYPHE_PAR_BADGE = {
  "BDG-001": "sprout", "BDG-002": "eye", "BDG-003": "eyePlus", "BDG-004": "ear", "BDG-005": "bolt", "BDG-006": "shield",
  "BDG-007": "shieldCheck", "BDG-008": "crown", "BDG-009": "eye", "BDG-010": "calendar", "BDG-011": "sun", "BDG-012": "radar",
  "BDG-013": "wave", "BDG-014": "heart", "BDG-015": "hand", "BDG-016": "earCheck", "BDG-017": "flag", "BDG-018": "link",
  "BDG-019": "bulb", "BDG-020": "rocket", "BDG-021": "shieldHeart", "BDG-022": "scroll", "BDG-023": "key", "BDG-024": "umbrella",
  "BDG-025": "bolt", "BDG-026": "mountain", "BDG-027": "magnifier", "BDG-028": "chart", "BDG-029": "infinity", "BDG-030": "trophy",
  "BDG-031": "flame", "BDG-032": "star", "BDG-033": "megaphone", "BDG-034": "compass", "BDG-035": "heart", "BDG-036": "globe"
};

function formeBadge(type) {
  const pts = (n, r, rot) => Array.from({ length: n }, (_, i) => {
    const a = (rot + i * 360 / n) * Math.PI / 180;
    return (50 + r * Math.cos(a)).toFixed(1) + " " + (50 + r * Math.sin(a)).toFixed(1);
  });
  switch (type) {
    case "ecu": return "M50 5L88 18V50C88 74 71 88 50 96 29 88 12 74 12 50V18Z";
    case "hexa": return "M" + pts(6, 45, -90).join("L") + "Z";
    case "octo": return "M" + pts(8, 45, -67.5).join("L") + "Z";
    case "losange": return "M50 5L95 50L50 95L5 50Z";
    case "etoile": {
      const p = Array.from({ length: 16 }, (_, i) => {
        const a = (-90 + i * 22.5) * Math.PI / 180, r = i % 2 ? 38 : 47;
        return (50 + r * Math.cos(a)).toFixed(1) + " " + (50 + r * Math.sin(a)).toFixed(1);
      });
      return "M" + p.join("L") + "Z";
    }
    default: return "M50 5a45 45 0 1 0 0 90 45 45 0 0 0 0-90z";
  }
}

let compteurMedaille = 0;
// info : { id, nom, famille } ; obtenu : true/false
function medaille(info, obtenu) {
  const fam = FAMILLES_BADGES[info.famille] || FAMILLES_BADGES["Commun"];
  const n = ++compteurMedaille;
  const forme = formeBadge(fam.forme);
  const glyphe = GLYPHES[GLYPHE_PAR_BADGE[info.id]] || GLYPHES.star;
  const bord1 = obtenu ? fam.clair : "#3B5285", bord2 = obtenu ? fam.c : "#1F3363";
  const f1 = obtenu ? "#1C4393" : "#0E2552", f2 = "#051534";
  const trait = obtenu ? fam.clair : "#6C82B0";
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("class", "medaille " + (obtenu ? "obtenue" : "verrouillee"));
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", (obtenu ? "Badge obtenu : " : "Badge à obtenir : ") + info.nom);
  svg.style.setProperty("--c", fam.c);
  svg.innerHTML =
    '<defs><linearGradient id="r' + n + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + bord1 + '"/><stop offset="1" stop-color="' + bord2 + '"/></linearGradient>' +
    '<radialGradient id="f' + n + '" cx="50%" cy="32%" r="80%"><stop offset="0" stop-color="' + f1 + '"/><stop offset="1" stop-color="' + f2 + '"/></radialGradient></defs>' +
    '<path d="' + forme + '" fill="url(#r' + n + ')" stroke="url(#r' + n + ')" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="' + forme + '" transform="translate(50 50) scale(.82) translate(-50 -50)" fill="url(#f' + n + ')" stroke="' + bord2 + '" stroke-width="1" stroke-linejoin="round"/>' +
    (fam.forme === "double" ? '<circle cx="50" cy="50" r="33" fill="none" stroke="' + bord1 + '" stroke-opacity=".5" stroke-width="1"/>' : "") +
    '<g transform="translate(27 27) scale(2)" fill="none" stroke="' + trait + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="' + (obtenu ? 1 : .55) + '">' +
    glyphe.map(d => '<path d="' + d + '"/>').join("") + '</g>' +
    (obtenu ? '<path d="M22 28C30 16 46 11 62 13" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="3" stroke-linecap="round"/>' : "") +
    (obtenu ? "" : '<circle cx="78" cy="78" r="13" fill="#031536" stroke="#3B5285" stroke-width="2"/><g transform="translate(70 70) scale(.68)" fill="none" stroke="#A9B8D6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + GLYPHES.cadenas.map(d => '<path d="' + d + '"/>').join("") + "</g>");
  return svg;
}

// Catalogue des badges (feuille BADGES), lu une fois.
let CATALOGUE_BADGES = null;
async function catalogueBadges() {
  if (CATALOGUE_BADGES) return CATALOGUE_BADGES;
  const lignes = await lireFeuille("BADGES");
  CATALOGUE_BADGES = (lignes || []).map(l => ({ id: l.ID_Badge, nom: l.Nom, famille: l.Famille, type: l.Type, description: l.Description }));
  return CATALOGUE_BADGES;
}

// Annonce d’un ou plusieurs badges qui viennent d’être gagnés.
async function annonceBadges(noms, conteneur) {
  if (!noms || !noms.length) return;
  let cat = [];
  try { cat = await catalogueBadges(); } catch (e) { cat = []; }
  const zone = el("div", "annonce-badge");
  zone.setAttribute("role", "status");
  noms.forEach(nom => {
    const info = cat.filter(b => b.nom === nom)[0] || { id: "", nom: nom, famille: "Commun" };
    const carte = el("div", "annonce-carte");
    carte.append(medaille(info, true));
    const t = el("div");
    t.append(el("span", "annonce-titre", "Nouveau badge !"), el("strong", null, nom));
    if (info.description) t.append(el("span", "annonce-desc", info.description));
    carte.append(t);
    zone.append(carte);
  });
  conteneur.append(zone);
}

// Mur des badges, groupé par famille : obtenus en couleur, à venir en grisé.
async function murBadges(zone, obtenus) {
  let cat;
  try { cat = await catalogueBadges(); } catch (e) { cat = null; }
  if (!cat || !cat.length) {
    zone.replaceChildren(...(obtenus.length ? obtenus.map(b => el("p", null, b)) : [el("p", "vide", "Aucun badge pour l’instant.")]));
    return;
  }
  const frag = document.createDocumentFragment();
  const total = cat.length;
  const gagnes = cat.filter(b => obtenus.indexOf(b.nom) >= 0).length;
  const barre = el("div", "mur-bilan");
  barre.append(el("strong", null, gagnes + " / " + total + " badges"));
  const jauge = el("div", "jauge"); const rempli = el("span"); rempli.style.width = Math.round(100 * gagnes / total) + "%";
  jauge.append(rempli); barre.append(jauge);
  frag.append(barre);
  ORDRE_FAMILLES.forEach(f => {
    const liste = cat.filter(b => b.famille === f);
    if (!liste.length) return;
    const sec = el("section", "mur-famille");
    sec.append(el("h3", null, f));
    const g = el("ul", "mur");
    liste.forEach(b => {
      const ok = obtenus.indexOf(b.nom) >= 0;
      const li = el("li", ok ? "badge ok" : "badge");
      li.append(medaille(b, ok), el("strong", null, b.nom));
      li.append(el("span", null, ok ? b.description : (b.type === "Référent" ? "Décerné par un référent" : b.description)));
      g.append(li);
    });
    sec.append(g);
    frag.append(sec);
  });
  zone.replaceChildren(frag);
}
