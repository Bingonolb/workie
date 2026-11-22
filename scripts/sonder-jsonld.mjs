// Sonde les pages carrière « maison » : y a-t-il des offres au format JobPosting ?
//
//   node scripts/sonder-jsonld.mjs   → scripts/sonde-jsonld.json
//
// Pour chaque entreprise sans outil reconnu : on lit sa page carrière, on
// relève les liens qui ressemblent à des offres (même site), on en ouvre
// quelques-uns et l'on regarde s'ils portent un bloc JobPosting situé en
// Suisse. Une requête à la fois par site, six sites en parallèle.

import fs from "node:fs";
import https from "node:https";
import http from "node:http";
import zlib from "node:zlib";

const AGENT = "Mozilla/5.0 (compatible; WorkieSync/1.0; +https://www.workie.ch)";
const PROTEGEES = new Set(["Administration fédérale suisse", "État de Genève", "État de Vaud", "Office fédéral de la santé publique (OFSP)", "Office fédéral de la statistique (OFS)", "PUBLICA", "SECO", "Secrétariat d'État aux migrations (SEM)", "Tribunal fédéral", "Ville de Berne", "Ville de Genève", "Ville de Lausanne", "Ville de Zurich", "Anicom AG", "Agroscope", "Biofarm Genossenschaft", "Bio Suisse", "Demeter Suisse", "LANDI Suisse SA", "Helvetia Nostra"]);

function lire(url, n = 5) {
  return new Promise(ok => {
    let u; try { u = new URL(url); } catch { return ok({ statut: 0, texte: "", finale: url }); }
    const req = (u.protocol === "http:" ? http : https).get(u, { headers: { "User-Agent": AGENT, "Accept-Encoding": "gzip, deflate, br", "Accept-Language": "fr-CH,fr;q=0.9,de;q=0.8,en;q=0.7" }, timeout: 15000 }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && n > 0) { r.resume(); return ok(lire(new URL(r.headers.location, u).href, n - 1)); }
      const enc = r.headers["content-encoding"];
      const f = enc === "gzip" ? r.pipe(zlib.createGunzip()) : enc === "deflate" ? r.pipe(zlib.createInflate()) : enc === "br" ? r.pipe(zlib.createBrotliDecompress()) : r;
      const m = []; let taille = 0;
      f.on("data", d => { taille += d.length; if (taille < 3_000_000) m.push(d); });
      f.on("error", () => ok({ statut: r.statusCode, texte: "", finale: url }));
      f.on("end", () => ok({ statut: r.statusCode, texte: Buffer.concat(m).toString("utf8"), finale: url }));
    });
    req.on("timeout", () => req.destroy());
    req.on("error", () => ok({ statut: 0, texte: "", finale: url }));
  });
}

function jobPostings(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let o; try { o = JSON.parse(m[1].trim()); } catch { continue; }
    const tous = [].concat(o, o?.["@graph"] ?? []).flat();
    for (const x of tous) if (x && [].concat(x["@type"]).includes("JobPosting")) out.push(x);
  }
  return out;
}
const enSuisse = jp => [].concat(jp.jobLocation ?? []).some(l => /^(CH|CHE|switzerland|schweiz|suisse|svizzera)$/i.test(l?.address?.addressCountry?.name ?? l?.address?.addressCountry ?? ""));

const r = JSON.parse(fs.readFileSync(new URL("./outils-recrutement.json", import.meta.url), "utf8"))
  .filter(x => !x.outils.length && !PROTEGEES.has(x.nom) && typeof x.statut === "number" && x.statut < 400 && !x.protege);
console.log(`${r.length} entreprises à sonder`);

const resultats = [];
let i = 0;
const occupes = new Set();
await Promise.all(Array.from({ length: 6 }, async () => {
  while (i < r.length) {
    const x = r[i++];
    const hote = new URL(x.finale).host;
    while (occupes.has(hote)) await new Promise(z => setTimeout(z, 300));
    occupes.add(hote);
    try {
      const page = await lire(x.url);
      const base = page.finale;
      const origine = new URL(base).origin;
      // La page elle-même porte des offres ?
      const surPage = jobPostings(page.texte);
      // Liens qui ressemblent à des offres, sur le même site.
      const liens = [...new Set([...page.texte.matchAll(/href="([^"#]+)"/g)].map(m => { try { return new URL(m[1].replace(/&amp;/g, "&"), base).href; } catch { return null; } }).filter(Boolean))]
        .filter(u => u.startsWith(origine) && u !== base)
        .filter(u => /job|stelle|offre|emploi|vacanc|position|karriere\/.+\/.+|career.+\/.+|poste|annonce|ausschreibung|lavoro|\/\d{3,}/i.test(new URL(u).pathname))
        .filter(u => !/\.(pdf|jpg|png|svg|css|js)$|login|register|alert|abo|newsletter|initiativ|spontan|datenschutz|privacy|cookie/i.test(u));
      let trouves = [], ouverts = 0;
      for (const u of liens.slice(0, 6)) {
        const p = await lire(u); ouverts++;
        const jp = jobPostings(p.texte).filter(enSuisse);
        if (jp.length) trouves.push({ u, titre: jp[0].title });
        if (trouves.length >= 2) break;
        await new Promise(z => setTimeout(z, 250));
      }
      resultats.push({ id: x.id, nom: x.nom, url: x.url, base, liens: liens.length, surPage: surPage.filter(enSuisse).length, trouves, exemples: liens.slice(0, 3) });
      if (resultats.length % 50 === 0) console.log(`${resultats.length}/${r.length}`);
    } catch (e) { resultats.push({ id: x.id, nom: x.nom, url: x.url, erreur: e.message }); }
    finally { occupes.delete(hote); }
  }
}));
fs.writeFileSync(new URL("./sonde-jsonld.json", import.meta.url), JSON.stringify(resultats, null, 1));
const ok = resultats.filter(x => x.trouves?.length || x.surPage);
console.log(`\n${ok.length} entreprises avec des offres JobPosting en Suisse sur ${resultats.length}`);
for (const x of ok) console.log(`  ${x.nom.padEnd(34)} ${x.surPage ? `${x.surPage} sur la page` : ""} ${x.trouves.map(t => t.titre).slice(0, 1).join("").slice(0, 50)}`);
