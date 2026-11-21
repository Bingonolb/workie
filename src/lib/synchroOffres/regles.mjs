// Règles de mise en forme des offres synchronisées : titre propre, aperçu du
// poste, taux, contrat, pays. Séparées du script pour être testées
// (src/__tests__/regles-offres.test.ts). Modèle validé : Kellerhals Carrard.

const NOMMEES = { nbsp: " ", amp: "&", quot: '"', lt: "<", gt: ">", apos: "’", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»", euro: "€", eacute: "é", egrave: "è", agrave: "à", uuml: "ü", ouml: "ö", auml: "ä", szlig: "ß" };
const entites = s => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => NOMMEES[n.toLowerCase()] ?? m)
  .replace(/ /g, " ");
// Les éléments de liste deviennent des phrases : sans ponctuation, deux puces
// mises bout à bout se lisaient comme une seule phrase sans fin.
const texte = html => entites((html ?? "")
  .replace(/<\/li>/gi, "¶\n").replace(/<\/(p|h\d|div|ul|ol)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
  .replace(/[ \t]+/g, " ").split("\n").map(s => s.trim())
  .map(s => s.endsWith("¶") ? s.slice(0, -1).trim().replace(/[,;]$/, "").replace(/([^.!?:…])$/, "$1.").replace(/^\p{Ll}/u, c => c.toUpperCase()) : s)
  .filter(Boolean);

// Une candidature spontanée, un événement de recrutement : ce ne sont pas des offres.
const CANDIDATURE_SPONTANEE = /initiativ|wildcard|spontan|unsolicited|open application|blindbewerbung|talent pool|talentpool|workshop|brown bag|webinar|info.?(session|abend|anlass)|career (day|event)|meets? |\bx\b.*\b(club|society)\b|recruiting event|messe|bclubb|boost your/i;

/**
 * Titre propre : sans code de référence (« REF297441C »), sans mention de genre
 * (« (w/m/div.) », « (all genders) », « (h/f/d) »), sans appel à postuler
 * collé au titre. Le taux reste : il fait partie du poste.
 */
function titrePropre(t) {
  // Titre tout en capitales : remis en casse normale (« INTERNATIONAL TRAINEES »).
  // Les lieux après « - » ou « / » gardent leur majuscule (« - Geneva/Zurich »).
  t = entites(t);
  if (t === t.toUpperCase() && /[A-Z]{4}/.test(t)) {
    t = t.toLowerCase().replace(/^\p{L}/u, c => c.toUpperCase());
    t = t.replace(/(\s[-–]\s+)([^()]+)$/u, (_, sep, lieux) => sep + lieux.replace(/(^|\/)\s*(\p{L})/gu, (m, a, c) => a + c.toUpperCase()));
  }
  return t
    .replace(/\s*[-–]?\s*\bREF\s?\d+[A-Z]?\b/gi, "")
    .replace(/\s*\((?:[mwfhdx]\s*\/\s*){1,3}[mwfhdx]+\.?(?:iv\.?)?\)|\s*\((?:all|alle)(?: genders?)?\)|\s*\(m\/w\/div\.?\)|\s*\(f\/m\/div\.?\)|\s*\(w\/m\/div\.?\)|\s*\(gn\)|\s*\(all\)/gi, "")
    .replace(/\s*[-–]\s*(bewirb dich|apply|postulez).*$/i, "")
    // Longue parenthèse de conditions en fin de titre (« - (Contract through our
    // external payroll partner…) ») : le badge de contrat le dit déjà.
    .replace(/\s*[-–]?\s*\((?=[^()]{25,}\)\s*$)[^()]*(contract|payroll|befristet|temporary|limited|maternity|mutterschaft|remplacement|start|until|bis)[^()]*\)\s*$/i, "")
    // « f/m/d » sans parenthèses, crochets de conditions, « - Switzerland » final.
    .replace(/\s+\(?[mwfhd](?:\s*\/\s*[mwfhdx]+){1,3}\.?\)?(?=\s|$)/gi, "")
    .replace(/\s*[-–]?\s*\[[^\]]*\]\s*$/, "")
    // Marque en tête : « [Universal Genève] - Client Advisor » (la fiche dit déjà qui recrute).
    .replace(/^\s*\[[^\]]*\]\s*[-–]?\s*/, "")
    // Villes en fin de titre : « (Zurich, Bern oder Basel) » (le lieu s'affiche à part).
    .replace(/\s*\(([^()]+)\)\s*$/, (m, dedans) => dedans.split(/\s*(?:,|\/|\boder\b|\bund\b|\bou\b|\bet\b|\bor\b|\band\b)\s*/).filter(Boolean).every(v => SUISSE.test(v)) ? "" : m)
    // Lieu collé en fin de titre : « (Geneva (GVA), CH, 33999) », « (Lausanne, CH) ».
    .replace(/\s*\((?:[^()]|\([^()]*\))*,\s*(?:CH|[A-Z]{2})\b(?:[^()]|\([^()]*\))*\)\s*$/, "")
    .replace(/\s*[-–]\s*(switzerland|schweiz|suisse|svizzera)\s*$/i, "")
    .replace(/\s+([,.)])/g, "$1").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ")
    .replace(/[\s.]*[-–|:]?\s*$/, "").replace(/%\.$/, "%").trim();
}
// Suisse : nom du pays dans les langues usuelles, ou une ville suisse connue.
// Mots entiers seulement : « Bern » ne doit pas prendre « Bernalillo », ni
// « Wil » « Wilmington ». Fribourg seul (Freiburg est aussi en Allemagne).
const SUISSE = /(?<![\p{L}])(switzerland|schweiz|suisse|svizzera|svizra|zürich|zurich|genève|geneva|genf|lausanne|bern|berne|basel|bâle|lugano|luzern|lucerne|st\.? ?gallen|winterthur|zug|fribourg|neuchâtel|sion|aarau|thun|chur|biel|bienne|schaffhausen|solothurn|olten|yverdon|montreux|vevey|nyon|morges|meyrin|plan-les-ouates|renens|locarno|bellinzona|rapperswil|frauenfeld|kloten|opfikon|dübendorf|schlieren|allschwil|pratteln|muttenz|rotkreuz|gland|crissier|steinhausen|zuchwil|horgen)(?![\p{L}])|,\s*CH\b|\bCH-\d{4}/iu;

/**
 * Lieu structuré « Ville, CH, 8152 », « Ville, TI », « Ville, CH » : suisse
 * si un segment est le code pays CH ou un code de canton, sans autre pays.
 * Sinon, on retombe sur la reconnaissance des noms (SUISSE).
 */
const CANTONS = new Set("AG AI AR BE BL BS FR GE GL GR JU LU NE NW OW SG SH SO SZ TG TI UR VD VS ZG ZH".split(" "));
// Codes de canton qui ne sont le code d'aucun pays : sans ambiguïté.
const CANTONS_SURS = new Set("JU NW OW TI UR VD VS ZG ZH".split(" "));
// `cantons: true` pour une entreprise présente seulement en Suisse : tout
// code de canton y désigne un canton.
function lieuEnSuisse(lieu, { cantons = false } = {}) {
  const segments = (lieu ?? "").split(",").map(s => s.trim()).filter(Boolean);
  if (!segments.length) return false;
  // Le pays est le dernier code à deux lettres (avant un éventuel code postal) :
  // « Berlin, BE, DE, 10117 » est en Allemagne même si « BE » est aussi Berne.
  const codes = segments.filter(s => /^[A-Z]{2}$/.test(s));
  const pays = codes.at(-1);
  if (/^(switzerland|schweiz|suisse|svizzera)$/i.test(segments.at(-1)) || pays === "CH") return true;
  if (pays) {
    // Le dernier code est un canton (« Lugano, TI ») : beaucoup de codes de
    // canton sont aussi des pays (BE, AR, FR, GE, AG, GR, LU, SG…), donc la
    // ville doit être reconnue comme suisse.
    return CANTONS.has(pays) && (cantons || CANTONS_SURS.has(pays) || SUISSE.test(segments[0]));
  }
  return SUISSE.test(lieu ?? "");
}

// Intertitres qui annoncent le poste lui-même, dans les langues des offres suisses.
const TACHES = /t[âa]ches|missions?|votre r[ôo]le|le poste|vos responsabilit|aufgaben|ihre rolle|die stelle|your (role|challenge|tasks|responsibilities|mission|impact)|the role|responsibilit|what you.ll do|compiti|mansioni/i;
// Phrase d'accroche publicitaire, qui ne dit rien du travail.
const ACCROCHE = /^(wir bieten|nous (vous )?offrons|we offer)|genau richtig|au bon endroit|right place|willkommen|bienvenue|welcome|dann suchen wir sie|alors rejoignez|then join us|perfekte kombination|passion|^kick.?start|^are you (ready|about|looking)|^do you (thrive|love|want)|^bist du bereit|^êtes-vous prêt|^envie de|^lust auf|^in this role, you.ll help run what runs|seeking candidates for the following position|^et si (votre|vous)|^what if you|^mettez vos (ambitions|compétences|talents)|^envie d.un nouveau défi|^lust auf eine neue/i;
// Présentation de l'entreprise : déjà faite par sa fiche Workie.
function presenteEntreprise(l, entreprise) {
  const nom = entreprise.split(/[\s(]/)[0].toLowerCase();
  const b = l.toLowerCase();
  // Phrase qui commence par le nom de l'entreprise (« Weleda stands at… »,
  // « Sulzer est une entreprise… ») : c'est elle qui se présente. Sauf
  // « Vitol is seeking an engineer… », qui parle du poste.
  const nomEchappe = nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const commenceParLeNom = new RegExp(`^(the |die |der |das |le |la |les |l[’']|le groupe |la société )?${nomEchappe}`).test(b);
  if (nom.length >= 3 && commenceParLeNom && !/^\S+(?: \S+)? (is|ist|est) (seeking|looking|searching|hiring|à la recherche|auf der suche)/.test(b)) return true;
  if (/^(über uns|about us|à propos|qui sommes-nous|wer wir sind|who we are|en tant qu.entreprise|as a (family|global|leading|world)|als (familienunternehmen|führende|global)|faire carrière chez|working at|arbeiten bei|travailler chez)/.test(b)) return true;
  return (b.includes(nom) && /^(at |chez |bei |join |über |about |depuis |seit |founded|fondée|gegründet)|est l[’']une? des|ist eine?r? der|is one of|est un[e]? (leader|acteur|entreprise)|ist (ein|eine) (führend|internation|unternehmen|tochter)|is a (leading|global|company)|est une entreprise/.test(b))
    || /^(wir sind|nous sommes|we are|bei uns|chez nous|at our company)[ ,]/.test(b)
    || /^(unser (hauptsitz|unternehmen|team besteht)|notre (siège|entreprise)|our (headquarters|company) )/.test(b)
    || /^(our|unsere|nos|notre) (holistic |)(products|produkte|produits|offerings|angebote|mission|vision|purpose|values|werte|valeurs|history|geschichte|histoire|brands|marken|marques)\b/.test(b)
    // Histoire et taille de l'entreprise, sans un mot pour le candidat :
    // « Since 1967, Jet Aviation… », « Mit ca. 63.000 Mitarbeitenden… ».
    || (!/\b(du|dich|dein|sie werden|ihre aufgabe|you|your|vous|votre|tu|ton)\b/.test(b)
      && (/\b(since|seit|depuis|founded in|gegründet|fondée? en) \d{4}\b/.test(b) || /\d[\d.,' ]*\s*(mitarbeitende|mitarbeiter|employees|collaborat|salariés|beschäftigte)/.test(b)));
}

/**
 * Aperçu du poste : la partie qui décrit le travail (tâches, rôle), jamais la
 * présentation de l'entreprise ni l'accroche. Deux ou trois phrases, coupées
 * proprement.
 */
// Lignes administratives sans rapport avec le travail (organisations internationales…).
const ADMINISTRATIF = /^(deadline for applications|hardship level|family type|residential location|grade\b|job location|location\b|lieu\b|standort\b|reference|référence|job id|req(uisition)? id|posting date|date de publication|no\.? du poste|vacancy (no|notice)|date de clôture|closing date)/i;
// Ligne-fiche en tête d'annonce : « 138104 | 80 - 100% | Oerlikon | Hybrid »,
// « Versicherung / Baden / Unbefristet / 80% », « 📍 Aarau, Chur… ».
const LIGNE_FICHE = l => (l.match(/\s\|\s/g) ?? []).length >= 2 || (l.match(/\s\/\s/g) ?? []).length >= 3 || /^\p{Extended_Pictographic}/u.test(l);
// Signature d'un recruteur : « Christian Sturm People & Transformation Lead ».
const SIGNATURE = l => l.length < 70 && !/[.!?:]/.test(l) && /^\p{Lu}\p{Ll}+ \p{Lu}\p{Ll}+(-\p{Lu}\p{Ll}+)? .*(lead|manager|recruit|talent|partner|hr|personal|rh|consultant)/iu.test(l);
// Intitulé de rubrique collé au texte qui suit.
const RUBRIQUE_COLLEE = /^(introduction|deine rolle|ihre rolle|deine aufgaben|ihre aufgaben|your role|the role|votre rôle|vos missions|vos tâches|description|nous allons réaliser ensemble|was dich erwartet|was sie erwartet|what you will do|ce que vous ferez)\s*:?\s+(?=\p{Lu})/iu;
function resume(html, entreprise, titre = "") {
  const norm = x => x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const lignes = texte(html)
    .filter(l => !ADMINISTRATIF.test(l) && !LIGNE_FICHE(l) && !SIGNATURE(l))
    // Ligne qui commence par le titre de l'offre suivi de ses conditions
    // (« Key Account Manager Retail 100% Lenzburg, AG Du willst… ») : on
    // garde ce qui vient après, à partir de la première vraie phrase.
    .map(l => titre && norm(l).startsWith(norm(titre)) ? (l.match(/\s((?:Du|Sie|Wir|Vous|Tu|Nous|You|We|In|Als|En|As)\s.*)$/)?.[1] ?? "") : l)
    .map(l => l.replace(RUBRIQUE_COLLEE, ""))
    .filter(Boolean);
  // Intertitre : en capitales, terminé par « : », annonçant les tâches, ou
  // ligne très courte sans ponctuation (« Introduction », « Responsabilités »).
  // Les éléments de liste, eux, reçoivent un point dans texte() : ils ne sont
  // jamais pris pour des intertitres.
  const intertitre = l => l.length < 70 && (l === l.toUpperCase() || /[:?]$/.test(l) || TACHES.test(l) && l.split(" ").length <= 6 || (l.split(/\s+/).length <= 3 && !/[.!?,;…]$/.test(l)));
  let depart = lignes.findIndex(l => intertitre(l) && TACHES.test(l));
  depart = depart >= 0 ? depart + 1 : 0;
  const out = [];
  for (let l of lignes.slice(depart)) {
    if (intertitre(l)) { if (out.length) break; else continue; }
    if (!out.length) {
      // Fin de phrase : pas après une abréviation courte (« ca. », « No. », « Dr. »).
      const phrases = l.split(/(?<=(?:\p{L}{3,}|\d|[)»”"])[.!?]|[!?])\s+(?=[\p{Lu}\d«“"])/u);
      // … et le débris d'une phrase coupée (« 1 for its customers… »).
      while (phrases.length && (presenteEntreprise(phrases[0], entreprise) || ACCROCHE.test(phrases[0]) || /^\d+\s+\p{Ll}/u.test(phrases[0]))) phrases.shift();
      l = phrases.join(" ");
      if (!l) continue;
    }
    // Débris en tête : puce, numérotation (« 1. »), intitulé de rubrique collé.
    out.push(l.replace(/^[-•·]\s*/, "").replace(/^(\d+|[a-z])[.)]\s+/, "").replace(/^(job description|description du poste|stellenbeschreibung)\s*:?\s*/i, ""));
    if (out.join(" ").length > 300) break;
  }
  let r = out.join(" ").replace(/\s+/g, " ").trim();
  if (r.length > 420) {
    const coupe = r.slice(0, 420);
    const fin = Math.max(coupe.lastIndexOf(". "), coupe.lastIndexOf("! "));
    r = fin > 200 ? coupe.slice(0, fin + 1) : coupe.replace(/\s+\S*$/, "") + "…";
  }
  // Une liste reprise en cours (« zur Weiterentwicklung… ») commence en minuscule.
  r = r.replace(/^\p{Ll}/u, c => c.toUpperCase());
  // Trop court pour dire quoi que ce soit, ou simple répétition du titre :
  // mieux vaut pas d'aperçu (la fenêtre invite alors à lire l'offre complète).
  if (r.length < 25 || (titre && norm(r).startsWith(norm(titre)) && r.length < titre.length + 30)) return null;
  return r || null;
}
function taux(titre) {
  // « 80-100% », « 100% ou 80% », « 50% » : le plus petit et le plus grand taux cités.
  const n = [...titre.matchAll(/(\d{2,3})\s*(?=%|\s*[-–]\s*\d{2,3}\s*%)/g)].map(m => Number(m[1])).filter(x => x >= 10 && x <= 100);
  return n.length ? [Math.min(...n), Math.max(...n)] : [null, null];
}
function contrat(titre, indice) {
  const t = `${titre} ${indice ?? ""}`.toLowerCase();
  if (/apprenti|lehrstelle|lernende|apprentice|\bcfc\b|\befz\b|\beba\b/.test(t)) return "Apprentissage";
  if (/intern\b|internship|\bstage\b|stagiaire|praktik|praktikum|trainee|substitut|volontariat/.test(t)) return "Stage";
  if (/freelance|freiberuf/.test(t)) return "Freelance";
  if (/working student|werkstudent|job étudiant|studentenjob/.test(t)) return "Temporaire";
  if (/temporary|temporär|temporaire|tempor/.test(t)) return "Temporaire";
  if (/contract|fixed.term|befristet|\bcdd\b|limited|durée déterminée/.test(t)) return "CDD";
  // « Temps plein » ne dit rien de la durée du contrat : pas de CDI deviné.
  if (/permanent|unbefristet|\bcdi\b|festanstellung|indéterminée?/.test(t)) return "CDI";
  return null;
}
/**
 * Lieu lisible : « CHE-Zurich-Zurich » → « Zurich », « Bern, Canton de Berne,
 * Switzerland » → « Bern », « Zürich / Genferstrasse 27 » → « Zürich »,
 * « GENEVA BUSINESS CENTER » → « Geneva ». Un code interne inconnu (« CWR »)
 * cède la place à la ville de l'entreprise.
 */
function lieuPropre(lieu, villeEntreprise) {
  let l = entites(lieu ?? "").trim();
  if (!l) return villeEntreprise ?? null;
  // Pays seul (« CH ») : on ne sait pas où, et la ville du siège induirait en erreur.
  if (/^(CH|switzerland|schweiz|suisse)$/i.test(l)) return null;
  l = l.replace(/^CHE?-([^-]+)-.*$/i, "$1")
    .split(/\s*(?:,|\s*\/\s+|\s[-–]\s|\(|\s(?:oder|und|sowie|ou|et|or|and|o)\s)\s*/)[0]
    .replace(/^\d{4}\s+/, "")
    .replace(/^(paketzentrum|briefzentrum|logistikzentrum|distributionsbasis|filiale|agence de|succursale de)\s+/i, "")
    .replace(/\s+(AG|AI|AR|BE|BL|BS|FR|GE|GL|GR|JU|LU|NE|NW|OW|SG|SH|SO|SZ|TG|TI|UR|VD|VS|ZG|ZH)$/, "")
    .replace(/\s+(business center|campus|office|headquarters|hq|site)$/i, "")
    .trim();
  if (l === l.toUpperCase() && l.length > 3) l = l.toLowerCase().replace(/(^|[\s-])\p{L}/gu, c => c.toUpperCase());
  // Une adresse de rue (« Salinenstrasse 70 ») n'est pas une ville.
  if (/\d/.test(l) && /(strasse|str\.|weg|gasse|platz|rue |avenue|chemin|route |via )/i.test(l)) return villeEntreprise ?? null;
  // Centre commercial ou bâtiment après la ville : « Luzern Bahnhofshopping »,
  // « Volketswil Volkiland », « Root D4 », « Lugano e home ».
  l = l.replace(/\s+(\S*(shopping|center|centre|park|land|markt|city|zentrum|galerie|bahnhof)\S*|[A-Z]\d+|e home|und home|et home|\+ home)$/i, "").trim();
  if (/^\d+ (locations|standorte|lieux)/i.test(l)) return villeEntreprise ?? null;
  // Code interne en capitales (« CWR ») : pas une ville. « Root » en est une.
  if (!SUISSE.test(l) && l === l.toUpperCase()) return villeEntreprise ?? null;
  return VILLES_FR[l.toLowerCase()] ?? (l || villeEntreprise || null);
}
// Le site est en français : une même ville s'écrit d'une seule façon, sinon
// « Geneva » et « Genève » apparaîtraient comme deux lieux.
const VILLES_FR = {
  geneva: "Genève", genf: "Genève", ginevra: "Genève", "genève": "Genève",
  "zürich": "Zurich", zuerich: "Zurich", zurigo: "Zurich",
  bern: "Berne", berna: "Berne", basel: "Bâle", basilea: "Bâle",
  luzern: "Lucerne", lucerna: "Lucerne", "st. gallen": "Saint-Gall", "st.gallen": "Saint-Gall", "sankt gallen": "Saint-Gall",
  freiburg: "Fribourg", "neuenburg": "Neuchâtel", "biel": "Bienne", "biel/bienne": "Bienne", "solothurn": "Soleure",
  "schaffhausen": "Schaffhouse", "chur": "Coire", "sitten": "Sion",
  remote: "Télétravail", "home office": "Télétravail", "homeoffice": "Télétravail",
};
const offre = (o, entreprise, villeEntreprise) => {
  const titre = titrePropre(o.titre);
  // Taux fourni par l'outil quand il le donne, sinon lu dans le titre.
  const [tmin, tmax] = o.taux ?? taux(titre);
  return {
    source_ref: String(o.ref),
    title: titre,
    location: lieuPropre(o.lieu, villeEntreprise),
    // Le contrat se lit sur le titre complet, avant nettoyage.
    contract_type: contrat(entites(o.titre), o.contrat),
    taux_min: tmin, taux_max: tmax,
    description: o.html !== undefined ? resume(o.html, entreprise, titre) : undefined,
    apply_url: o.url,
    created_at: o.date ? new Date(o.date).toISOString() : undefined,
  };
};

export { lieuEnSuisse, CANTONS, lieuPropre, ADMINISTRATIF, NOMMEES, entites, texte, CANDIDATURE_SPONTANEE, titrePropre, SUISSE, TACHES, ACCROCHE, presenteEntreprise, resume, taux, contrat, offre };
