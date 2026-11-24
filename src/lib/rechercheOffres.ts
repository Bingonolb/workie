/**
 * Recherche d'offres « intelligente » : un mot tapé dans une langue trouve
 * les offres écrites dans les trois autres.
 *
 * La Suisse publie ses offres en français, allemand, anglais et italien, et
 * souvent pas dans la langue de celui qui cherche : un Romand qui tape
 * « vendeur » doit trouver « Verkäufer:in » à Zurich et « Sales Advisor » à
 * Genève. Chaque groupe ci-dessous réunit les racines d'un même métier dans
 * les quatre langues. Ce sont des débuts de mots (sans accents, en
 * minuscules) : « vend » prend vendeur, vendeuse, vente ; « verkauf » prend
 * Verkäufer, Verkäuferin, Verkauf.
 *
 * Un mot hors dictionnaire est cherché par sa racine (« boulangerie » →
 * « boulang »), et une faute de frappe est rapprochée du mot le plus proche
 * qui existe vraiment dans les titres (voir `corriger`).
 */

/** Groupes de racines équivalentes. La première sert d'étiquette. */
const GROUPES: string[][] = [
  ["vend", "verkauf", "verkaeuf", "sales", "vendit", "detailhandel", "retail", "conseiller de vente"],
  ["caissi", "kassier", "kasse", "cashier", "cassier"],
  ["comptab", "buchhalt", "accountant", "accounting", "contabil", "finanzbuchhalt"],
  ["controll", "controleur de gestion", "controller"],
  ["finan", "finanz", "finance", "finanzia"],
  ["developpeu", "developer", "entwickler", "programmeu", "programmier", "software engineer", "software develop", "sviluppator", "fullstack", "full stack", "frontend", "backend"],
  ["informati", "informatik", "ict", " it ", "it-", "systemtechni", "system engineer", "ingegnere informatico"],
  ["ingenieur", "ingenieu", "engineer", "ingegner"],
  ["technici", "techniker", "technician", "tecnic"],
  ["mecani", "mechanik", "mechanic", "meccanic", "polymechan", "automatik", "automaticien"],
  ["electric", "elektr", "electrician", "elettric", "elektroinstall"],
  ["infirmi", "pflegefach", "pflegehelf", "pflegeassist", "pflegeexpert", "dipl. pflege", "pflegepersonal", "nurse", "nursing", "infermier", "fage", "assc", "soins"],
  ["medec", "arzt", "aerzt", "doctor", "physician", "medic"],
  ["pharmac", "apothek", "pharma", "farmac"],
  ["cuisin", "koch", "koech", "cook", "chef de cuisine", "cuoc", "commis de cuisine", "kuech"],
  ["serveu", "kellner", "waiter", "waitress", "chef de rang", "cameriere", "restaurationsfach"],
  ["recept", "rezeption", "front office", "receptionist", "ricevim"],
  ["hotel", "hotell", "hospitality", "albergh", "housekeeping", "etage", "gouvernant"],
  ["boulang", "baecker", "backer", "baker", "panettier", "patissi", "konditor"],
  ["bouch", "metzger", "fleisch", "butcher", "macellai"],
  ["logisti", "lager", "magasini", "warehouse", "magazzin", "entrepot", "kommission"],
  ["chauffeur", "fahrer", "driver", "autista", "lkw", "camion", "livreur", "zustell"],
  ["mainten", "unterhalt", "instandhalt", "wartung", "manutenz", "facility", "concierge", "hauswart"],
  ["nettoy", "reinig", "clean", "pulizi", "entretien"],
  ["juris", "jurist", "lawyer", "avocat", "rechtsanw", "legal", "giurist", "notar", "paralegal"],
  ["assist", "assistent", "assistant", "assistente", "sekretar", "secretar", "segretar"],
  ["administ", "verwalt", "sachbearbeit", "kaufm", "employe de commerce", "kv ", "impiegat"],
  ["ressources humaines", "rh ", "hr ", "human resources", "personal", "recrut", "recruit", "talent acquisition", "risorse umane"],
  ["market", "marketing", "communication", "kommunikation", "comunicazion", "content", "social media"],
  ["projet", "projekt", "project", "progett"],
  ["chef", "leiter", "leitung", "manager", "head of", "responsable", "direct", "direktor", "responsabil", "teamlead", "team lead"],
  ["conseil", "berat", "advisor", "consult", "consulen", "berater"],
  ["client", "kunden", "customer", "clienti", "service client", "kundendienst"],
  ["analys", "analyst", "analist", "data", "daten"],
  ["achat", "einkauf", "purchas", "procurement", "acquist", "buyer", "approvision"],
  ["qualit", "quality", "qualita"],
  ["securit", "sicherheit", "security", "sicurezz", "surveil", "bewach"],
  ["construct", "bau", "construction", "costruz", "chantier", "baustell", "macon", "maurer", "polier", "contremaitre"],
  ["architect", "architekt", "architett", "dessinat", "zeichner", "draftsman"],
  ["menuis", "schrein", "tischler", "carpent", "falegnam", "charpent", "zimmer"],
  ["peintr", "maler", "painter", "pittor"],
  ["plombi", "sanitaer", "sanitar", "plumber", "idraulic", "installat"],
  ["coiff", "coiffeu", "friseu", "hairdress", "parrucch"],
  ["enseign", "lehrer", "lehrperson", "teacher", "insegnant", "professeur", "dozent", "professor"],
  ["educat", "erzieh", "sozialpaed", "social", "sozial", "kinderbetreu", "educator", "assistant socio"],
  ["apprenti", "lehrstelle", "lehre", "lernend", "apprentice", "apprendist", "efz", "cfc", "eba", "afp", "berufslehre"],
  ["stag", "praktik", "intern", "tirocin", "trainee"],
  ["etudiant", "werkstudent", "working student", "studente", "student"],
  ["horlog", "uhrmacher", "watchmak", "orologi"],
  ["bijout", "joaill", "goldschmied", "jewel", "gioiell"],
  ["laborant", "labor", "laboratoire", "laboratory", "laborator", "chimist", "chemik", "chemist"],
  ["recherch", "forsch", "research", "ricerc", "scientifi", "wissenschaft", "scientist", "postdoc", "phd", "doktorand", "doctorant"],
  ["banqu", "bank", "banca", "banker", "bancari"],
  ["assur", "versicher", "insurance", "assicur", "underwrit"],
  ["immobili", "immobil", "real estate", "gerance", "bewirtschaft", "facility manag"],
  ["juridique", "rechts", "legal", "compliance"],
  ["product", "produktion", "production", "produzion", "fabricat", "fertigung", "operat", "opérat"],
  ["agricul", "landwirt", "farm", "agricol", "jardini", "gaertner", "gardener", "giardin", "paysag"],
  ["vehicul", "automobil", "fahrzeug", "auto", "garag", "carrossi", "karosser"],
  ["design", "graphi", "grafik", "ux ", "user experience"],
  ["traduct", "uebersetz", "translat", "tradutt", "interpret", "dolmetsch"],
  ["pilot", "aviation", "luftfahrt", "flight", "cabin", "flugbegleit", "aircraft", "avion"],
];

const SANS_ACCENT = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Racine d'un mot hors dictionnaire : terminaisons courantes retirées, 4 lettres au moins. */
function racine(mot: string): string {
  const r = mot
    .replace(/(euses?|eurs?|rices?|iennes?|iens?|innen|erin|ers?|in|en|es|e|s)$/, "");
  return r.length >= 4 ? r : mot;
}

/**
 * Mot inconnu des titres : on prend le mot existant le plus proche (une ou
 * deux lettres d'écart selon la longueur). « vendeue » → « vendeuse ».
 */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prec = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let min = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prec[j] + 1, cur[j - 1] + 1, prec[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < min) min = cur[j];
    }
    if (min > max) return max + 1;
    prec = cur;
  }
  return prec[b.length];
}
export function corriger(mot: string, vocabulaire: Set<string>): string {
  if (mot.length < 4 || vocabulaire.has(mot)) return mot;
  // Un mot qui commence déjà un mot des titres est bon (« develop »).
  for (const v of vocabulaire) if (v.startsWith(mot)) return mot;
  const max = mot.length >= 8 ? 2 : 1;
  let meilleur = mot, d = max + 1;
  for (const v of vocabulaire) {
    const e = distance(mot, v, max);
    if (e < d) { d = e; meilleur = v; if (e === 1 && max === 1) break; }
  }
  return d <= max ? meilleur : mot;
}

/** Mots vides : ils ne disent rien du métier. */
const VIDES = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "a", "au", "un", "une", "pour", "der", "die", "das", "und", "fur", "im", "in", "mit", "the", "of", "and", "for", "il", "lo", "per", "con", "h", "f", "m", "w", "d", "job", "jobs", "emploi", "stelle", "poste"]);

export type Recherche = {
  /** Groupes de variantes : une offre doit correspondre à chaque groupe (ET), à une variante au moins (OU). */
  groupes: string[][];
  /** Ce qu'on montre à la personne : « vendeur → Verkauf, Sales… ». */
  equivalences: { mot: string; aussi: string[] }[];
  /** Taux voulu (« 80% ») : l'offre doit le permettre. « temps partiel » : moins de 100 %. */
  taux?: number;
  partiel?: boolean;
  /** Langue de l'annonce (« anglais », « Deutsch »). */
  langues: string[];
  /** Contrat (« CDI », « stage », « Lehrstelle »). */
  contrats: string[];
  /** Ce que la saisie a compris comme filtre, à montrer : « 80 % », « Anglais », « Stage ». */
  compris: string[];
};

/** Mots qui désignent une langue d'annonce, dans les quatre langues. */
const LANGUES_MOTS: [RegExp, string, string][] = [
  [/^(francais|french|franzosisch|francese|franz)$/, "fr", "Français"],
  [/^(allemand|deutsch|german|tedesco)$/, "de", "Allemand"],
  [/^(anglais|english|englisch|inglese)$/, "en", "Anglais"],
  [/^(italien|italiano|italian|italienisch)$/, "it", "Italien"],
];
/** Mots qui désignent un contrat. */
const CONTRATS_MOTS: [RegExp, string][] = [
  [/^(cdi|festanstellung|unbefristet|permanent|fixe)$/, "CDI"],
  [/^(cdd|befristet|temporary|fixed-term|determinee)$/, "CDD"],
  [/^(stage|stages|stagiaire|praktikum|praktikant|praktikantin|internship|intern|tirocinio)$/, "Stage"],
  [/^(apprentissage|apprenti|apprentie|lehrstelle|lehre|lernende|lernender|apprenticeship|apprentice|apprendistato|apprendista)$/, "Apprentissage"],
  [/^(temporaire|temporar|aushilfe|interim)$/, "Temporaire"],
];

/**
 * Transforme la saisie en groupes de variantes à chercher dans les titres.
 * Les variantes ne contiennent que des lettres, chiffres, espaces et tirets :
 * elles vont dans un filtre de base de données.
 */
export function analyser(saisie: string, vocabulaire: Set<string> = new Set()): Recherche {
  let texte = SANS_ACCENT(saisie);
  const compris: string[] = [];
  const langues: string[] = [];
  const contrats: string[] = [];
  let taux: number | undefined, partiel = false;
  // Taux : « 80% », « 80 % », « 60-80% » (on garde le plus haut), « 100 ».
  const t = texte.match(/(?:(\d{2,3})\s*-\s*)?(\d{2,3})\s*%/) ?? texte.match(/(?:^|\s)(100|[1-9]0)(?=\s|$)/);
  if (t) {
    const v = Number(t[2] ?? t[1]);
    if (v >= 10 && v <= 100) { taux = v; compris.push(`${v} %`); }
    texte = texte.replace(t[0], " ");
  }
  if (/temps partiel|teilzeit|part[- ]time|tempo parziale/.test(texte)) {
    partiel = true; compris.push("Temps partiel");
    texte = texte.replace(/temps partiel|teilzeit|part[- ]time|tempo parziale/g, " ");
  }
  const mots = texte.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(m => m.length >= 2 && !VIDES.has(m)).slice(0, 6);
  const groupes: string[][] = [];
  const equivalences: Recherche["equivalences"] = [];
  for (const brut of mots) {
    const langue = LANGUES_MOTS.find(([re]) => re.test(brut));
    if (langue) { if (!langues.includes(langue[1])) { langues.push(langue[1]); compris.push(langue[2]); } continue; }
    const contrat = CONTRATS_MOTS.find(([re]) => re.test(brut));
    if (contrat) { if (!contrats.includes(contrat[1])) { contrats.push(contrat[1]); compris.push(contrat[1]); } continue; }
    const mot = corriger(brut, vocabulaire);
    const groupe = GROUPES.find(g => g.some(r => {
      const rr = r.trim();
      return rr.length >= 2 && (mot.startsWith(rr) || (mot.length >= 4 && rr.startsWith(mot)));
    }));
    // Métier reconnu : ses racines seules (la racine du mot tapé,
    // « developp », prendrait aussi « Development »). Sinon, la racine du mot.
    const variantes = new Set<string>(groupe ? groupe : [racine(mot)]);
    const propres = [...variantes].map(v => v.replace(/[^a-z0-9 -]/g, "")).filter(v => v.trim().length >= 2);
    groupes.push(propres);
    if (groupe || mot !== brut) {
      equivalences.push({ mot: brut, aussi: [...new Set([...(mot !== brut ? [mot] : []), ...(groupe ?? []).map(r => r.trim()).filter(r => !mot.startsWith(r))])].slice(0, 5) });
    }
  }
  return { groupes, equivalences, taux, partiel, langues, contrats, compris };
}

/** Mots d'un titre normalisé, pour le vocabulaire de correction. */
export function motsDe(titreNorm: string): string[] {
  return titreNorm.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(m => m.length >= 4);
}
