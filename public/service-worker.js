/*
 * Ce service worker existe pour en faire disparaître un autre.
 *
 * Une ancienne version du site en installait un, avec sa propre page hors
 * ligne : le logo en dégradé, le tutoiement, un bouton violet. Il est resté
 * installé dans les navigateurs qui l'avaient reçu, et il continuait à servir
 * cette page, des mois après que le site a changé d'identité. Constaté le
 * 2026-09-23 sur workie.ch, dans Edge.
 *
 * Un service worker ne se retire pas depuis le serveur : le navigateur
 * revérifie son fichier, et c'est ce fichier-là qui doit demander son propre
 * retrait. Celui-ci vide les caches, se désinscrit, et recharge les pages
 * ouvertes pour qu'elles reviennent au vrai site.
 *
 * À garder en place : le retirer ferait échouer la revérification, et
 * l'ancien service worker survivrait chez ceux qui ne sont pas encore
 * repassés.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(noms.map(n => caches.delete(n)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: "window" });
    for (const client of clients) client.navigate(client.url);
  })());
});

// Plus rien n'est servi depuis le cache : chaque requête part au réseau.
self.addEventListener("fetch", () => {});
