// Le QG des Sentinelles : service worker.
// Garde uniquement les fichiers du site (pages, styles, scripts, images) pour un lancement rapide
// et un accès hors connexion aux pages. Aucune donnée personnelle ni réponse du serveur n'est conservée.
const VERSION = "qg-v1";
const COQUILLE = [
  "./", "index.html", "missions.html", "parcours.html", "faq.html", "portfolio.html", "urgence.html",
  "ressources.html", "fiches.html", "mentions-legales.html", "styles.css", "app.js", "badges.js",
  "manifest.webmanifest", "img/icone.svg", "img/icone-192.png", "img/icone-512.png",
  "img/apple-touch-icon.png", "img/mission-sentinelle.jpg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(COQUILLE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(noms => Promise.all(noms.filter(n => n !== VERSION).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  // Seulement les fichiers du site, en lecture. Tout le reste (serveur Google, liens externes) passe sans cache.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  const image = /\.(png|jpe?g|svg|webp|ico)$/i.test(url.pathname);
  if (image) {
    // Les images changent rarement : cache d'abord, mise à jour en arrière-plan.
    e.respondWith(caches.open(VERSION).then(async c => {
      const gardee = await c.match(req);
      const frais = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
      return gardee || (await frais) || Response.error();
    }));
    return;
  }
  // Pages, styles et scripts : le réseau d'abord (toujours à jour), le cache si hors connexion.
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const copie = r.clone(); caches.open(VERSION).then(c => c.put(req, copie)); }
    return r;
  }).catch(async () => (await caches.match(req)) || (await caches.match(url.pathname.endsWith("/") ? "index.html" : req.mode === "navigate" ? "index.html" : req)) || Response.error()));
});
