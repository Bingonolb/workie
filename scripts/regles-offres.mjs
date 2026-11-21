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
  .map(s => s.endsWith("¶") ? s.slice(0, -1).trim().replace(/([^.!?:;,…])$/, "$1.") : s)
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
    .replace(/\s*[-–]\s*(switzerland|schweiz|suisse|svizzera)\s*$/i, "")
    .replace(/\s+([,.)])/g, "$1").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ")
    .replace(/[\s.]*[-–|:]?\s*$/, "").replace(/%\.$/, "%").trim();
}
// Suisse : nom du pays dans les langues usuelles, ou une ville suisse connue.
// Mots entiers seulement : « Bern » ne doit pas prendre « Bernalillo », ni
// « Wil » « Wilmington ». Fribourg seul (Freiburg est aussi en Allemagne).
const SUISSE = /(?<![\p{L}])(switzerland|schweiz|suisse|svizzera|svizra|zürich|zurich|genève|geneva|genf|lausanne|bern|berne|basel|bâle|lugano|luzern|lucerne|st\.? ?gallen|winterthur|zug|fribourg|neuchâtel|sion|aarau|thun|chur|biel|bienne|schaffhausen|solothurn|olten|yverdon|montreux|vevey|nyon|morges|meyrin|plan-les-ouates|renens|locarno|bellinzona|rapperswil|frauenfeld|kloten|opfikon|dübendorf|schlieren|allschwil|pratteln|muttenz|rotkreuz|gland|crissier|steinhausen|zuchwil|horgen)(?![\p{L}])|,\s*CH\b|\bCH-\d{4}/iu;

// Intertitres qui annoncent le poste lui-même, dans les langues des offres suisses.
const TACHES = /t[âa]ches|missions?|votre r[ôo]le|le poste|vos responsabilit|aufgaben|ihre rolle|die stelle|your (role|challenge|tasks|responsibilities|mission|impact)|the role|responsibilit|what you.ll do|compiti|mansioni/i;
// Phrase d'accroche publicitaire, qui ne dit rien du travail.
const ACCROCHE = /^(wir bieten|nous (vous )?offrons|we offer)|genau richtig|au bon endroit|right place|willkommen|bienvenue|welcome|dann suchen wir sie|alors rejoignez|then join us|perfekte kombination|passion|^kick.?start|^are you (ready|about|looking)|^do you (thrive|love|want)|^bist du bereit|^êtes-vous prêt|^envie de|^lust auf|^in this role, you.ll help run what runs|seeking candidates for the following position/i;
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
    || /^(unser (hauptsitz|unternehmen|team besteht)|notre (siège|entreprise)|our (headquarters|company) )/.test(b);
}

/**
 * Aperçu du poste : la partie qui décrit le travail (tâches, rôle), jamais la
 * présentation de l'entreprise ni l'accroche. Deux ou trois phrases, coupées
 * proprement.
 */
// Lignes administratives sans rapport avec le travail (organisations internationales…).
const ADMINISTRATIF = /^(deadline for applications|hardship level|family type|residential location|grade\b|job location|location\b|lieu\b|standort\b|reference|référence|job id|req(uisition)? id|posting date|date de publication)/i;
function resume(html, entreprise, titre = "") {
  const lignes = texte(html).filter(l => !ADMINISTRATIF.test(l));
  const intertitre = l => l.length < 70 && (l === l.toUpperCase() || /[:?]$/.test(l) || TACHES.test(l) && l.split(" ").length <= 6);
  let depart = lignes.findIndex(l => intertitre(l) && TACHES.test(l));
  depart = depart >= 0 ? depart + 1 : 0;
  const out = [];
  for (let l of lignes.slice(depart)) {
    if (intertitre(l)) { if (out.length) break; else continue; }
    if (!out.length) {
      const phrases = l.split(/(?<=[.!?])\s+/);
      while (phrases.length && (presenteEntreprise(phrases[0], entreprise) || ACCROCHE.test(phrases[0]))) phrases.shift();
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
  // Trop court pour dire quoi que ce soit, ou simple répétition du titre :
  // mieux vaut pas d'aperçu (la fenêtre invite alors à lire l'offre complète).
  const norm = x => x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
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
  if (/permanent|unbefristet|\bcdi\b|festanstellung/.test(t)) return "CDI";
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
  l = l.replace(/^CHE?-([^-]+)-.*$/i, "$1")
    .split(/\s*(?:,|\s*\/\s+|\s[-–]\s|\()\s*/)[0]
    .replace(/\s+(business center|campus|office|headquarters|hq|site)$/i, "")
    .trim();
  if (l === l.toUpperCase() && l.length > 3) l = l.toLowerCase().replace(/(^|[\s-])\p{L}/gu, c => c.toUpperCase());
  if (/^\d+ (locations|standorte|lieux)/i.test(l)) return villeEntreprise ?? null;
  if (!SUISSE.test(l) && (l.length <= 4 || l === l.toUpperCase())) return villeEntreprise ?? null;
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
  const [tmin, tmax] = taux(titre);
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

export { lieuPropre, ADMINISTRATIF, NOMMEES, entites, texte, CANDIDATURE_SPONTANEE, titrePropre, SUISSE, TACHES, ACCROCHE, presenteEntreprise, resume, taux, contrat, offre };
