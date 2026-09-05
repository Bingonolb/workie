/**
 * Fabrique l'image que montrent les liens partagés.
 *
 * `node scripts/og-image.mjs`
 *
 * Les métadonnées pointaient sur `/og-default.png`, un fichier qui n'existait
 * pas : mesuré en production, l'adresse répondait 404. Chaque partage d'un lien
 * Workie, sur WhatsApp, LinkedIn ou Slack, affichait un cadre vide.
 *
 * L'image est produite ici plutôt que dessinée à la main, pour deux raisons.
 * Elle reprend le tracé exact du logo, `public/workie-mot.svg`, donc elle ne
 * peut pas dériver de la marque. Et le jour où le logo ou la phrase changent,
 * on relance ce script au lieu de rouvrir un éditeur : l'image précédente avait
 * justement gardé l'ancienne identité avant de disparaître.
 *
 * Pourquoi un fichier et non une génération à la volée par `opengraph-image.tsx` :
 * le moteur de Next passe par sharp pour l'encodage, et sur cette installation
 * il refuse le tampon qu'il reçoit, « Input buffer contains unsupported image
 * format », avec ou sans logo. Un fichier rendu une fois ne dépend d'aucune
 * chaîne au moment où un robot demande l'aperçu, ce qui est de toute façon le
 * moment le plus mauvais pour découvrir une panne.
 */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const RACINE = process.cwd();
const LARGEUR = 1200;
const HAUTEUR = 630;

const TITRE = "Les entreprises suisses,\navant d’y postuler.";
const SOUS_TITRE = "Notes, salaires et conditions de travail, publiés anonymement.";

// Le tracé du mot, découpé dans le fichier du logo. On ne garde que l'attribut
// `d` : le reste du fichier porte des commentaires et des attributs qui ne
// servent qu'au navigateur.
const source = await readFile(join(RACINE, "public", "workie-mot.svg"), "utf-8");
const traces = [...source.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1]);
if (traces.length === 0) throw new Error("Aucun tracé trouvé dans workie-mot.svg");

// Le mot mesure 3849 sur 1384 dans son repère ; on le pose à 420 de large.
const LOGO_L = 420;
const LOGO_H = Math.round((LOGO_L * 1384) / 3849);
const echelle = LOGO_L / 3849;

const lignesTitre = TITRE.split("\n")
  .map((ligne, i) => `<tspan x="80" dy="${i === 0 ? 0 : 76}">${ligne}</tspan>`)
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGEUR}" height="${HAUTEUR}" viewBox="0 0 ${LARGEUR} ${HAUTEUR}">
  <rect width="${LARGEUR}" height="${HAUTEUR}" fill="#101319"/>

  <!-- Le fichier du mot est le tracé complet du logo, recadré par son viewBox
       sur la seule partie « workie ». Un viewBox ne s'emporte pas dans une
       translation : sans la découpe ci-dessous, le symbole réapparaissait par
       la gauche de l'image. -->
  <defs>
    <clipPath id="mot">
      <rect x="80" y="72" width="${LOGO_L}" height="${LOGO_H}"/>
    </clipPath>
  </defs>
  <g clip-path="url(#mot)">
    <g transform="translate(80, 72) scale(${echelle}) translate(-1319, 0)" fill="#ffffff">
      ${traces.map(d => `<path d="${d}"/>`).join("\n      ")}
    </g>
  </g>

  <text x="80" y="${72 + LOGO_H + 150}" fill="#ffffff"
        font-family="Segoe UI, Helvetica Neue, Arial, sans-serif"
        font-size="62" font-weight="700" letter-spacing="-1.5">${lignesTitre}</text>

  <text x="80" y="${72 + LOGO_H + 150 + 76 + 56}" fill="#9aa3b2"
        font-family="Segoe UI, Helvetica Neue, Arial, sans-serif"
        font-size="29">${SOUS_TITRE}</text>

  <rect x="80" y="${HAUTEUR - 80}" width="120" height="8" rx="4" fill="#8b5cf6"/>
</svg>`;

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
const destination = join(RACINE, "src", "app", "opengraph-image.png");
await writeFile(destination, png);

const { width, height } = await sharp(png).metadata();
console.log(`écrit : ${destination}`);
console.log(`${width}x${height}, ${(png.length / 1024).toFixed(1)} Ko`);
