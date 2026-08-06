/**
 * Remplace les bannières d'entreprise par des photos qui montrent réellement
 * leur métier.
 *
 * Avant : 1029 fiches sur 1033 pointaient sur picsum.photos, qui renvoie une
 * image au hasard à partir d'une graine. Une manufacture horlogère et une
 * caisse maladie recevaient des photos sans aucun rapport avec ce qu'elles font.
 *
 * Le terme de recherche vient du sous-titre de la fiche (« Implants dentaires »,
 * « Hydroélectricité », « Chaussures de sport ») et non du nom de l'entreprise :
 * chercher « Straumann » sur une banque d'images ne donne rien, chercher
 * « dental implant » donne une photo d'implants.
 *
 * Deux garde-fous sur la pertinence :
 *   - le dictionnaire est ordonné du plus précis au plus général, et la
 *     première correspondance gagne. Sans cet ordre, « banque privée »
 *     tomberait sur la règle « privé » plutôt que sur la règle « banque ».
 *   - à défaut de correspondance, on retombe sur le secteur. Jamais sur une
 *     image générique de bureau : mieux vaut une photo du secteur qu'une photo
 *     qui ne veut rien dire.
 *
 * Les entreprises partageant un même terme reçoivent des photos différentes
 * (rotation dans les résultats), sinon les 23 banques privées afficheraient
 * toutes la même image.
 *
 * Usage :
 *   node scripts/images-pexels.mjs --essai --max=30
 *   node scripts/images-pexels.mjs
 *
 * Variable requise dans .env.local : PEXELS_API_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const ESSAI = process.argv.includes("--essai");
const MAX = Number(process.argv.find(a => a.startsWith("--max="))?.split("=")[1] ?? Infinity);
const PAR_REQUETE = 40;      // 20 laissait passer des photos de marque situées plus loin dans les résultats
const PAUSE_MS = 350;        // Pexels : 200 requêtes/heure

function chargerEnv() {
  try {
    for (const l of readFileSync(".env.local", "utf8").split("\n")) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* déjà dans l'environnement */ }
}
chargerEnv();

const CLE = process.env.PEXELS_API_KEY;
if (!CLE) { console.error("PEXELS_API_KEY manquante dans .env.local"); process.exit(1); }

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });

/**
 * Motif français → requête Pexels en anglais.
 *
 * L'anglais n'est pas un détail : Pexels indexe très majoritairement des
 * mots-clés anglais, et « horlogerie » ne rend presque rien là où
 * « watchmaker workshop » rend des ateliers.
 *
 * ORDRE SIGNIFICATIF : la première correspondance l'emporte.
 */
const TERMES = [
  // — Horlogerie, joaillerie, précision
  [/haute horlogerie|manufacture horlog|montres? de luxe|ultra-luxe/i, "luxury watch movement macro"],
  [/horlog|montres?|chronographe|cadran/i, "watchmaker workshop tweezers"],
  [/joaill|bijou/i, "fine jewellery craftsmanship"],
  [/microtechnique|micro-?composants|décolletage|usinage|machines?-outils|découpe|formage|fraisage/i, "cnc machining metal precision"],

  // — Santé, pharma, laboratoire
  [/implants? dentaire|dentaire|bucco-dentaire/i, "dental implant laboratory"],
  [/ophtalmo|lentilles|chirurgie de l.oeil/i, "ophthalmology eye examination"],
  [/hôpital|hospitalier|clinique|urgences|maternité/i, "hospital corridor nurse"],
  [/psychiatr|santé mentale/i, "therapy consultation room"],
  [/réadaptation|physio|paraplég/i, "physiotherapy rehabilitation patient"],
  [/soins à domicile|spitex/i, "home care nurse elderly"],
  [/vaccin|médicaments?|pharmaceutique|principes actifs|galénique|générique|oncolog|immunolog|maladies rares|biotech|anticorps|peptide|thérapie|neurolog|cardiolog/i,
    "pharmaceutical laboratory research scientist"],
  [/diagnostic|analyses? médicales|laboratoire/i, "laboratory microscope samples"],
  [/dispositifs? médica|technologie médicale|matériel médical|perfusion|injection|auto-injecteur/i, "medical device manufacturing"],
  [/télémédecine|santé numérique/i, "telemedicine video consultation"],

  // — Finance, assurance, droit
  [/banque privée|gestion de fortune|gestion d.actifs|family office/i, "private banking advisor meeting"],
  [/banque cantonale|banque de détail|banque régionale|banque universelle|hypothè/i, "bank branch counter"],
  [/banque en ligne|banque mobile|néobanque|courtage|trading|produits structurés|placement automatisé/i, "stock trading screens charts"],
  [/crypto|blockchain|actifs numériques|tokenis/i, "cryptocurrency blockchain screen"],
  [/paiement|carte de paiement|crédit à la consommation/i, "contactless payment terminal"],
  [/réassurance|assurance/i, "insurance contract signing desk"],
  [/prévoyance|caisse de pensions|retraite/i, "retirement planning documents"],
  [/avocat|droit|juridi|arbitrage|fiscal|notaire|juridiction/i, "law books gavel office"],
  [/audit|fiduciaire|comptab/i, "accounting audit spreadsheets"],

  // — Industrie, énergie, construction
  [/hydroélectric|barrage/i, "hydroelectric dam turbine"],
  [/photovolta|solaire/i, "solar panels rooftop installation"],
  [/éolien/i, "wind turbine field"],
  [/biogaz|biomasse/i, "biogas plant renewable"],
  [/électricité|réseaux? électrique|compteurs? intelligent|distribution d.électricité/i, "electrical grid power lines"],
  [/gaz naturel|distribution de gaz/i, "gas pipeline industrial"],
  [/services (industriels|collectifs)/i, "utility infrastructure worker"],
  [/ascenseurs?|escaliers? mécanique/i, "elevator shaft modern building"],
  [/ciment|béton|matériaux de construction|isolation|laine de pierre|fibres-ciment/i, "concrete construction materials"],
  [/génie civil|travaux souterrains|tunnel|terrassement|travaux routiers/i, "civil engineering tunnel construction"],
  [/construction|entreprise générale|bâtiment|chantier/i, "construction site crane workers"],
  [/immobili|gérance|promotion immobilière/i, "modern apartment building facade"],
  [/architect|ingénierie|bureau d.études/i, "architect blueprints drafting"],
  [/robot|automatisation|automation|robotique/i, "industrial robot arm factory"],
  [/capteurs?|instrumentation|mesure|métrolog/i, "precision measurement instrument lab"],
  [/semi-?conducteur|électronique|microélectron/i, "semiconductor wafer electronics"],
  [/turbo|compresseur|pompes?|turbine|moteur/i, "industrial turbine machinery"],
  [/textile technique|filtration|tissus? technique/i, "industrial textile weaving machine"],
  [/emballage|plasturgie|tubes? souples/i, "packaging production line"],
  [/métaux précieux|affinage|lingot|or\b/i, "gold bars refinery"],
  [/chimie|revêtements?|traitement de surface|adhésifs?/i, "chemical industry plant"],
  [/défense|armement/i, "aerospace defence engineering"],
  [/électroménager|appareils? ménagers/i, "modern kitchen appliances"],
  [/mobilier|ameublement|design/i, "designer furniture interior"],
  [/outillage|visserie|fixation|couteaux?/i, "hand tools workshop bench"],
  [/industri|fabrication|manufactur|production/i, "factory production line workers"],

  // — Transport, logistique
  [/ferroviaire|chemins? de fer|train|bahn/i, "swiss train mountain railway"],
  [/transports? urbains?|tram|trolleybus|bus/i, "city tram street"],
  [/aérien|compagnie aérienne|aviation|aéroport/i, "airplane airport runway"],
  [/navigation|lacustre|bateau/i, "lake boat swiss"],
  [/remontées? mécaniques?|téléphérique/i, "ski lift cable car mountain"],
  [/fret|logistique|transport de marchandises|entreposage|colis|courrier|express/i, "logistics warehouse trucks"],
  [/transport de fonds/i, "security van cash transport"],
  [/autopartage|leasing|flotte/i, "car fleet parking"],
  [/importation automobile|concession|garage|pièces détachées|automobile/i, "car dealership showroom"],

  // — Alimentation, agriculture
  [/chocolat/i, "chocolate making artisan"],
  [/fromage|laitier|lait/i, "cheese wheels dairy cellar"],
  [/brasserie|bière/i, "brewery beer tanks"],
  [/vin|viticult|cave|oenolog|négoce de vins/i, "vineyard wine cellar barrels"],
  [/boulangerie|viennoiserie|biscuit|pâtisserie/i, "bakery bread oven"],
  [/confiserie|snacks?|café|boissons?|eaux? minérale|jus/i, "food beverage production"],
  [/viande|charcuterie|volaille|porc/i, "butcher meat processing"],
  [/grossiste|distribution alimentaire|restauration/i, "food wholesale warehouse"],
  [/agricol|agronom|céréales|semences|fruits?|betail|bétail|élevage|coopérative agricole/i, "swiss farm field agriculture"],
  [/agriculture biologique|bio\b|biodynam/i, "organic vegetables farm"],
  [/aliments? pour le bétail|fourrage/i, "livestock feed farm"],
  [/horticol|jardin|paysag/i, "garden nursery plants"],

  // — Commerce, mode, sport, beauté
  [/grande distribution|supermarché|discount|commerces? rural|proximité/i, "supermarket aisle groceries"],
  [/commerce en ligne|e-?commerce|vente en ligne|mode en ligne/i, "online shopping parcel laptop"],
  [/parfum|cosmétique|soins|beauté|hygiène/i, "cosmetics beauty products flatlay"],
  [/lingerie|sous-vêtements/i, "lingerie fabric textile"],
  [/chaussures? de course|chaussures? de sport/i, "running shoes trail"],
  [/chaussures?/i, "shoes store display"],
  [/ski|sports? d.hiver|montagne|alpinisme|randonnée/i, "ski slope alps mountain"],
  [/vélo|cycl/i, "road bicycle cycling"],
  [/vêtements?|prêt-à-porter|mode|textile|plein air|outdoor/i, "clothing rack fashion store"],
  [/articles? de sport|magasins? de sport|équipement sportif/i, "sports equipment store"],
  [/club de football|fédération sportive|football/i, "football stadium crowd"],
  [/bagager|maroquiner|cuir/i, "leather bags craftsmanship"],
  [/librairie|livres?|édition|impression/i, "bookstore shelves books"],
  [/bricolage|jardinage/i, "hardware store tools aisle"],
  [/électronique grand public|informatique et impression/i, "electronics store devices"],
  [/kiosque|convenience/i, "newsstand kiosk street"],
  [/fournitures de bureau/i, "office supplies stationery"],
  [/grands magasins|premium|luxe/i, "luxury boutique interior"],

  // — Tech, conseil, services
  [/cybersécurité|sécurité (du cloud|des postes|réseau|numérique)|pare-feu|intrusion|chiffr|messagerie chiffrée/i,
    "cybersecurity code screen dark"],
  [/cloud|infrastructure|centre de (calcul|données)|hébergement/i, "server room data center"],
  [/données|data|analyse|analytique|intelligence artificielle|\bia\b|apprentissage/i, "data visualization dashboard screen"],
  [/logiciel|software|développement|ingénierie logicielle|applications?|plateforme|saas|progiciel|erp/i,
    "software developer coding screen"],
  [/télécommunication|réseau|connectivité|fibre/i, "network fiber optic cables"],
  [/objets connectés|iot|drones?/i, "drone technology flying"],
  [/robo|fintech/i, "fintech mobile app phone"],
  [/publicité|communication|marketing|média|agence/i, "creative agency brainstorming"],
  [/recrutement|ressources humaines|talents?|\brh\b/i, "job interview handshake office"],
  [/formation|école|université|enseignement|pédagog|cours|académie|internat|campus/i, "university lecture hall students"],
  [/physique|r&d|calcul haute performance|recherche fondamentale/i, "particle physics research facility"],
  [/recherche|institut|laboratoire de recherche|science/i, "research laboratory scientists"],
  [/conseil|consulting|stratégie|management|transformation/i, "business consulting meeting whiteboard"],
  [/administration (cantonale|communale|fédérale)|service public|office fédéral|statistique|migration|politique économique/i,
    "government building administration"],
  [/humanitaire|aide|croix-rouge|handicap|social/i, "humanitarian volunteers aid"],
  [/tourisme|voyagiste|hôtel|hôteller/i, "hotel lobby travel"],
  [/sécurité|surveillance|gardiennage/i, "security guard building"],
  [/nettoyage|propreté/i, "cleaning service professional"],
];

/**
 * Marques pour lesquelles Pexels détient de vraies photos du produit.
 *
 * Vérifié marque par marque avant d'entrer dans cette liste : une recherche par
 * nom renvoie toujours des centaines de résultats, même pour « Holdigaz » (614)
 * ou « Sefar » (461), donc le nombre de résultats ne prouve rien. Le seul signal
 * fiable est le texte alternatif de la photo, qui doit contenir le nom en mot
 * entier.
 *
 * Ce contrôle écarte aussi des homonymes qui passeraient autrement : « Cartier »
 * renvoie le pont Jacques-Cartier de Montréal, « Zurich » la ville plutôt que
 * l'assureur, « Patagonia » la région plutôt que la marque, et « Roche » des
 * formations rocheuses. C'est pourquoi la liste est écrite à la main plutôt que
 * déduite du nom de l'entreprise.
 *
 * Les autres entreprises gardent leur image de métier, qui fait déjà sens : un
 * laboratoire pour Roche, un rayon de supermarché pour Migros.
 *
 * Forme : "nom exact en base": ["requête Pexels", "mot à retrouver dans l'alt"]
 */
const MARQUES = {
  // Horlogerie
  "Rolex SA":                  ["Rolex watch", "rolex"],
  "Omega":                     ["Omega watch", "omega"],
  "Breitling SA":              ["Breitling watch", "breitling"],
  "Tissot SA":                 ["Tissot watch", "tissot"],
  "Longines SA":               ["Longines watch", "longines"],
  // Automobile
  "Porsche Suisse":            ["Porsche 911", "porsche"],
  "Mercedes-Benz Schweiz AG":  ["Mercedes-Benz car", "mercedes"],
  "BMW (Schweiz) AG":          ["BMW car", "bmw"],
  "Tesla Suisse":              ["Tesla car", "tesla"],
  "Toyota (Suisse) SA":        ["Toyota car", "toyota"],
  "Renault Suisse SA":         ["Renault car", "renault"],
  "Peugeot Suisse SA":         ["Peugeot car", "peugeot"],
  "Volvo Car Suisse":          ["Volvo car", "volvo"],
  "Subaru Suisse SA":          ["Subaru car", "subaru"],
  "Hyundai (Suisse) SA":       ["Hyundai car", "hyundai"],
  "Honda Suisse":              ["Honda motorcycle", "honda"],
  "Citroën Suisse SA":         ["Citroen car", "citroen"],
  // Sport et mode
  "Nike Switzerland GmbH":     ["Nike shoes", "nike"],
  "Adidas Switzerland AG":     ["Adidas shoes", "adidas"],
  "Puma SE Switzerland Branch":["Puma shoes", "puma"],
  "New Balance Switzerland AG":["New Balance sneakers", "new balance"],
  // Alimentation et finance
  "Lindt & Sprüngli AG":       ["Lindt chocolate", "lindt"],
  "UBS":                       ["UBS bank building", "ubs"],
};

/** Repli par secteur : jamais d'image générique de bureau. */
const PAR_SECTEUR = {
  "Horlogerie": "watchmaker workshop tweezers",
  "Pharma": "pharmaceutical laboratory research scientist",
  "Santé": "hospital medical care",
  "Finance": "bank finance office charts",
  "Assurances": "insurance contract signing desk",
  "Tech": "software developer coding screen",
  "Industrie": "factory production line workers",
  "Énergie": "power plant energy infrastructure",
  "Transport": "logistics transport swiss",
  "Automobile": "car dealership showroom",
  "Alimentation": "food production swiss",
  "Agriculture": "swiss farm field agriculture",
  "Commerce": "retail store shopping",
  "Bâtiment": "construction site crane workers",
  "Beauté": "cosmetics beauty products flatlay",
  "Droit": "law books gavel office",
  "Conseil": "business consulting meeting whiteboard",
  "Éducation & Recherche": "university lecture hall students",
  "Administration publique": "government building administration",
  "Sports & Fashion": "sports lifestyle apparel",
};

function requetePour(sousTitre, secteur) {
  const texte = `${sousTitre ?? ""}`;
  for (const [motif, terme] of TERMES) if (motif.test(texte)) return terme;
  return PAR_SECTEUR[secteur] ?? "swiss business";
}

const dormir = ms => new Promise(r => setTimeout(r, ms));

const cache = new Map();

async function chercher(terme) {
  if (cache.has(terme)) return cache.get(terme);
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(terme)}`
            + `&per_page=${PAR_REQUETE}&orientation=landscape&size=large`;
  try {
    const r = await fetch(url, { headers: { Authorization: CLE } });
    if (!r.ok) { console.log(`  ! Pexels ${r.status} pour « ${terme} »`); cache.set(terme, []); return []; }
    const j = await r.json();
    // On garde les photos réellement grandes : le hero fait 1200 px de large.
    const photos = (j.photos ?? []).filter(p => p.width >= 1600);
    cache.set(terme, photos);
    await dormir(PAUSE_MS);
    return photos;
  } catch (e) {
    console.log(`  ! ${terme} : ${e.message}`);
    cache.set(terme, []);
    return [];
  }
}

/**
 * URL de référence, recadrée au format de la bannière.
 *
 * On stocke une largeur de 1600 et non l'original : c'est la taille utile pour
 * un hero en écran large à densité double, et le poids téléchargé compte
 * davantage que des pixels que personne ne verra. Les cartes, elles, dérivent
 * des largeurs plus petites de cette même URL en changeant `w` — le CDN Pexels
 * redimensionne à la volée, sans passer par l'optimiseur d'images.
 */
function urlHD(photo) {
  return `${photo.src.original}?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900`;
}

/**
 * Vérifie que la photo est réellement servie.
 *
 * Une photo retirée du catalogue reste dans les résultats de recherche, mais
 * son fichier est remplacé par un petit PNG de substitution servi en 200 — donc
 * invisible pour un contrôle par code de statut. Porsche Suisse affichait ainsi
 * une image cassée : 10 Ko de PNG au lieu d'un JPEG de 200 Ko.
 */
async function servieVraiment(photo) {
  const url = `${photo.src.original}?auto=compress&cs=tinysrgb&fit=crop&w=1280&h=720`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; workie.ch/1.0)" } });
    if (!r.ok) return false;
    const type = r.headers.get("content-type") ?? "";
    const poids = (await r.arrayBuffer()).byteLength;
    if (/\.jpe?g/i.test(photo.src.original) && type.includes("png")) return false;
    return poids >= 25_000;
  } catch { return false; }
}

async function main() {
  // PostgREST plafonne toute réponse à 1000 lignes, sans erreur ni avertissement.
  // Un premier passage avait donc laissé 33 fiches sur 1033 avec leur ancienne
  // image, sans que le décompte final le signale. On pagine explicitement.
  const entreprises = [];
  const PAGE = 500;
  for (let de = 0; ; de += PAGE) {
    // --manquantes : ne retraite que les fiches sans bannière, par exemple
    // après que verifier-images.mjs a vidé celles dont la photo a disparu du
    // catalogue. Sans ce filtre, chaque passage revérifie les mille photos.
    let q = db.from("companies").select("id, name, sector, subsector, cover_url");
    if (process.argv.includes("--manquantes")) q = q.is("cover_url", null);
    const { data, error } = await q.order("score", { ascending: false }).range(de, de + PAGE - 1);
    if (error) { console.error(error.message); process.exit(1); }
    entreprises.push(...data);
    if (data.length < PAGE) break;
  }

  const aTraiter = entreprises.slice(0, MAX);
  console.log(`${aTraiter.length} fiches à traiter${ESSAI ? " (SIMULATION)" : ""}.\n`);

  // Compteur par terme : deux entreprises au même métier n'auront pas la même photo.
  const rang = new Map();
  let ecrites = 0, sansPhoto = 0;

  /** Première photo réellement servie d'une liste, en tournant sur le compteur. */
  async function premiereServie(liste, terme, nom) {
    for (let essai = 0; essai < Math.min(liste.length, 6); essai++) {
      const i = rang.get(terme) ?? 0;
      rang.set(terme, i + 1);
      const candidate = liste[i % liste.length];
      if (await servieVraiment(candidate)) return candidate;
      console.log(`  · ${nom} — photo ${candidate.id} indisponible, on passe à la suivante`);
    }
    return null;
  }

  for (const e of aTraiter) {
    const termeMetier = requetePour(e.subsector, e.sector);
    let terme = termeMetier;
    let photo = null;

    // Une photo de la marque quand elle existe et qu'elle est réellement
    // servie. Le repli sur le métier doit aussi couvrir le cas où la marque a
    // bien des photos mais qu'aucune n'est disponible : Porsche n'avait qu'une
    // seule correspondance stricte, et c'est précisément celle qui avait
    // disparu du catalogue.
    const marque = MARQUES[e.name];
    if (marque) {
      const [requete, mot] = marque;
      const re = new RegExp(`\\b${mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const vraies = (await chercher(requete)).filter(p => re.test(p.alt ?? ""));
      if (vraies.length > 0) {
        photo = await premiereServie(vraies, requete, e.name);
        if (photo) terme = requete;
      }
      if (!photo) console.log(`  · ${e.name} — pas de photo de marque disponible, repli sur « ${termeMetier} »`);
    }

    if (!photo) {
      const photos = await chercher(termeMetier);
      if (photos.length === 0) {
        sansPhoto++;
        console.log(`  ✗ ${e.name} — aucune photo pour « ${termeMetier} »`);
        continue;
      }
      photo = await premiereServie(photos, termeMetier, e.name);
      if (!photo) { sansPhoto++; console.log(`  ✗ ${e.name} — aucune photo servie pour « ${termeMetier} »`); continue; }
    }

    if (!ESSAI) {
      const { error: err } = await db.from("companies").update({
        cover_url: urlHD(photo),
        cover_color: photo.avg_color,
        cover_credit: photo.photographer,
        cover_credit_url: photo.url,
        cover_source: "pexels",
        cover_query: terme,
      }).eq("id", e.id);
      if (err) { console.log(`  ! ${e.name} : ${err.message}`); continue; }
    }

    ecrites++;
    if (ecrites % 50 === 0 || ESSAI) {
      console.log(`  ✓ ${e.name}\n      « ${terme} » → ${photo.photographer} (${photo.width}×${photo.height})`);
    }
  }

  console.log(`\n─────────────────────────────`);
  console.log(`  Images posées : ${ecrites}`);
  console.log(`  Sans résultat : ${sansPhoto}`);
  console.log(`  Termes distincts interrogés : ${cache.size}`);
  console.log(`─────────────────────────────`);
  if (ESSAI) console.log(`\nSimulation : rien écrit.`);
}

main().catch(e => { console.error(e); process.exit(1); });
