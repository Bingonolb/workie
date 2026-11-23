// Règles de mise en forme des offres synchronisées : titre propre, aperçu du
// poste, taux, contrat, pays. Séparées du script pour être testées
// (src/__tests__/regles-offres.test.ts). Modèle validé : Kellerhals Carrard.

const NOMMEES = { nbsp: " ", amp: "&", quot: '"', lt: "<", gt: ">", apos: "’", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»", euro: "€", deg: "°", middot: "·", bull: "•", reg: "®", copy: "©", trade: "™", sup1: "¹", sup2: "²", sup3: "³", frac12: "½", frac14: "¼", frac34: "¾", times: "×", divide: "÷", plusmn: "±", shy: "", sect: "§", para: "¶", micro: "µ", pound: "£", yen: "¥", cent: "¢", iexcl: "¡", iquest: "¿", lsaquo: "‹", rsaquo: "›", sbquo: "‚", bdquo: "„", dagger: "†", permil: "‰", thinsp: " ", ensp: " ", emsp: " ", zwnj: "", zwj: "", lrm: "", rlm: "", ordf: "ª", ordm: "º", acute: "´", cedil: "¸", macr: "¯", uml: "¨", not: "¬", brvbar: "¦", curren: "¤", minus: "−", larr: "←", rarr: "→", check: "✓", eacute: "é", egrave: "è", agrave: "à", uuml: "ü", ouml: "ö", auml: "ä", szlig: "ß" };
// Toutes les lettres accentuées écrites en code HTML (« &acirc; », « &Eacute; »,
// « &ccedil; ») : la lettre de base plus son accent, recomposés en un caractère.
const ACCENTS = { caron: "̌", acute: "́", grave: "̀", circ: "̂", uml: "̈", cedil: "̧", tilde: "̃", ring: "̊" };
const LIGATURES = { aelig: "æ", AElig: "Æ", oelig: "œ", OElig: "Œ", oslash: "ø", Oslash: "Ø", eszett: "ß" };
const entites = s => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-zA-Z])(acute|grave|circ|uml|cedil|tilde|ring|caron);/g, (_, l, a) => (l + ACCENTS[a]).normalize("NFC"))
  .replace(/&(aelig|AElig|oelig|OElig|oslash|Oslash);/g, (_, n) => LIGATURES[n])
  .replace(/&([a-z][a-z0-9]*);/gi, (m, n) => NOMMEES[n] ?? NOMMEES[n.toLowerCase()] ?? m)
  .replace(/ /g, " ");
// Les éléments de liste deviennent des phrases : sans ponctuation, deux puces
// mises bout à bout se lisaient comme une seule phrase sans fin.
const texte = html => entites((html ?? "")
  // Un bloc qui s'ouvre commence une ligne : sans cela, « <strong>Deine
  // Aufgaben</strong><ul><li>Du betreust… » collait l'intertitre au premier
  // élément, et la rubrique des tâches passait inaperçue.
  .replace(/<(ul|ol|li|p|h\d|div|table|tr)(\s[^>]*)?>/gi, "\n")
  .replace(/<\/li>/gi, "¶\n").replace(/<\/(p|h\d|div|ul|ol)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
  .replace(/[ \t]+/g, " ").split("\n").map(s => s.trim())
  .map(s => s.endsWith("¶") ? s.slice(0, -1).trim().replace(/[,;]$/, "").replace(/([^.!?:…])$/, "$1.").replace(/^\p{Ll}/u, c => c.toUpperCase()) : s)
  .filter(Boolean);

// Une candidature spontanée, un événement de recrutement : ce ne sont pas des offres.
const CANDIDATURE_SPONTANEE = /initiativ|wildcard|spontan|unsolicited|open application|blindbewerbung|talent pool|talentpool|workshop|brown bag|webinar|info.?(session|abend|anlass)|career (day|event)|meets? |\bx\b.*\b(club|society)\b|recruiting event|messe|\bclub\b|boost your|pipeline posting|talent pipeline|talent community/i;

/**
 * Titre propre : sans code de référence (« REF297441C »), sans mention de genre
 * (« (w/m/div.) », « (all genders) », « (h/f/d) »), sans appel à postuler
 * collé au titre. Le taux reste : il fait partie du poste.
 */
function titrePropre(t) {
  // Titre tout en capitales : remis en casse normale (« INTERNATIONAL TRAINEES »).
  // Les lieux après « - » ou « / » gardent leur majuscule (« - Geneva/Zurich »).
  // Retour à la ligne dans le titre (« Gesamtleistungen<br/>für die Region… ») :
  // une espace ; autres balises retirées ; virgule finale retirée.
  t = entites(t).replace(/\s*<br\s*\/?>\s*/gi, " ").replace(/<[^>]+>/g, "").replace(/[\s,;]+$/, "");
  if (t === t.toUpperCase() && /[A-Z]{4}/.test(t)) {
    t = t.toLowerCase().replace(/^\p{L}/u, c => c.toUpperCase());
    t = t.replace(/(\s[-–]\s+)([^()]+)$/u, (_, sep, lieux) => sep + lieux.replace(/(^|\/)\s*(\p{L})/gu, (m, a, c) => a + c.toUpperCase()));
  }
  return t
    .replace(/\s*[-–]?\s*\bREF\s?\d+[A-Z]?\b/gi, "")
    // « Consultant, Switzerland », « … BCG Platinion Zurich, Switzerland » :
    // le lieu s'affiche à part.
    .replace(/\s*(?:\b(?:Zurich|Zürich|Geneva|Genève|Basel|Bern|Lausanne|Zug)\s*)?,\s*(?:Switzerland|Schweiz|Suisse)\s*$/i, "")
    // Annonce dupliquée dans l'outil : « … - copy ».
    .replace(/\s*[-–]\s*(copy|copie|kopie)\s*$/i, "")
    .replace(/\s*\((?:[mwfhdx]\s*\/\s*){1,3}[mwfhdx]+\.?(?:iv\.?)?\/?\)|\s*\((?:all|alle)(?: genders?)?\)|\s*\(m\/w\/div\.?\)|\s*\(f\/m\/div\.?\)|\s*\(w\/m\/div\.?\)|\s*\(gn\)|\s*\(all\)/gi, "")
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
    // Raison sociale en fin de titre : « … - Eberhard Bau AG » (la fiche dit déjà qui recrute).
    .replace(/\s+[-–]\s+[^-–()]{2,50}\s(AG|SA|GmbH|Sàrl|Ltd|S\.A\.|SE)\s*$/, "")
    .replace(/\s+([,.)])/g, "$1").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ")
    .replace(/[\s.]*[-–|:]?\s*$/, "").replace(/%\.$/, "%").trim();
}
// Suisse : nom du pays dans les langues usuelles, ou une ville suisse connue.
// Mots entiers seulement : « Bern » ne doit pas prendre « Bernalillo », ni
// « Wil » « Wilmington ». Fribourg seul (Freiburg est aussi en Allemagne).
const SUISSE = /(?<![\p{L}])(switzerland|schweiz|suisse|svizzera|svizra|zürich|zurich|genève|geneva|genf|lausanne|bern|berne|basel|bâle|lugano|luzern|lucerne|st\.? ?gallen|winterthur|zug|fribourg|neuchâtel|sion|aarau|thun|chur|biel|bienne|schaffhausen|solothurn|olten|yverdon|montreux|vevey|nyon|morges|meyrin|plan-les-ouates|renens|locarno|bellinzona|rapperswil|frauenfeld|kloten|opfikon|dübendorf|schlieren|allschwil|pratteln|muttenz|graubünden|grisons|grigioni|wallis|valais|vallese|tessin|ticino|aargau|argovie|thurgau|thurgovie|st.? ?moritz|arosa|davos|klosters|zermatt|saas-fee|gstaad|interlaken|grindelwald|wengen|verbier|crans-montana|villars-sur-ollon|engelberg|flims|laax|lenzerheide|pontresina|samedan|ascona|brissago|bürgenstock|nottwil|uzwil|sursee|emmen|kriens|baar|cham|wädenswil|uster|wetzikon|dietikon|bülach|kloten|wallisellen|zollikon|küsnacht|meilen|thalwil|adliswil|liestal|reinach|münchenstein|binningen|riehen|langenthal|burgdorf|köniz|ostermundigen|spiez|brig|visp|monthey|martigny|sierre|bulle|delémont|porrentruy|la chaux-de-fonds|le locle|yverdon-les-bains|pully|prilly|ecublens|carouge|lancy|vernier|onex|thônex|chêne-bourg|mendrisio|chiasso|zofingen|wohlen|lenzburg|brugg|rheinfelden|wil|gossau|herisau|appenzell|rorschach|arbon|kreuzlingen|weinfelden|amriswil|schwyz|einsiedeln|altdorf|stans|sarnen|glarus|näfels|buchs|sargans|rapperswil-jona|pfäffikon|freienbach|lachen|gland|crissier|horgen|rotkreuz|hünenberg|steinhausen|zuchwil)(?![\p{L}])|,\s*CH\b|\bCH-\d{4}/iu;

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
const TACHES = /t[âa]ches|missions?|votre r[ôo]le|le poste|vos responsabilit|aufgaben|ihre rolle|die stelle|your (role|challenge|tasks|responsibilities|mission|impact)|the role|responsibilit|what you.ll do|compiti|mansioni|das erwartet dich|das erwartet sie|dein neuer job|il tuo nuovo (lavoro|posto|impiego)|i tuoi compiti|le tue mansioni|i suoi compiti|le sue mansioni|ihr neuer job|deine neue (rolle|stelle)|votre nouveau poste|ton nouveau (poste|job)|your new (job|role)|deine herausforderungen?|ihre herausforderungen?|ce qui t.attend|ce qui vous attend|vos défis|what awaits you/i;
// Phrase d'accroche publicitaire, qui ne dit rien du travail.
const ACCROCHE = /^(wir bieten|nous (vous )?offrons|we offer)|genau richtig|au bon endroit|right place|willkommen|bienvenue|welcome|dann suchen wir sie|alors rejoignez|then join us|perfekte kombination|passion|^kick.?start|^are you (ready|about|looking)|^do you (thrive|love|want)|^bist du bereit|^êtes-vous prêt|^envie de|^lust auf|^in this role, you.ll help run what runs|seeking candidates for the following position|^et si (votre|vous)|^what if you|^mettez vos (ambitions|compétences|talents)|^envie d.un nouveau défi|^lust auf eine neue|^lust,|^werde teil|^deviens? (membre|partie)|^become part of|^join (our|the) team|^rejoins?(-nous| notre)|^möchtest du teil|^zur verstärkung unseres? teams?|^zur erweiterung unseres? teams?|^schliessen sie sich|^épanouissez-vous|^join [A-Z]{2,}|^de nouveaux collaborateurs|das ist unsere mission|^das sagt [^:]{3,80}(zur stelle|über die stelle)|^voici ce qu.en dit|^here.s what [^:]{3,60} says|^[«"„“]|c.est notre mission|that.s our mission|^der traum vom|^le rêve de|offers a wide range of|propose un large éventail|bietet eine vielzahl (an|von) (attraktiven )?stellen|^we partner with|^nous accompagnons nos clients|^wir begleiten unsere kunden/i;
// Profil demandé (« Real- oder Sekundarschulabschluss », « Abgeschlossene
// kaufmännische Berufsbildung », « Sehr gute Deutschkenntnisse ») : ce que le
// poste exige, pas ce qu'il est. Écarté en tête d'aperçu.
const PROFIL = /^(du hast (eine|einen|ein) [^.]{0,40}(matur|ausbildung|abschluss|lehre|studium|erfahrung)|sie haben (eine|einen|ein) [^.]{0,40}(ausbildung|abschluss|studium|erfahrung)|vous (avez|disposez d.une?) [^.]{0,30}(formation|diplôme|expérience)|you have (a|an) [^.]{0,30}(degree|diploma|experience)|abgeschlossene|erfolgreich abgeschlossene|real- oder sekundarschul|sekundarschul|matura|berufserfahrung|mehrjährige (berufs)?erfahrung|sehr gute (deutsch|englisch|französisch|kenntnisse)|gute (deutsch|englisch|französisch)kenntnisse|fliessende|fundierte|diplôme|cfc de|formation (de base|commerciale|terminée)|expérience (de|d.au moins|confirmée|professionnelle)|maîtrise (du|de la|des)|excellentes connaissances|bonnes connaissances|completed (degree|apprenticeship|vocational)|degree in|bachelor|master.s degree|several years of experience|\d+\+? (years|jahre|ans) )/i;
// Avantages offerts (« 6 Wochen Ferien pro Jahr », « CHF 1'500.- für deine
// Fahrstunden », « une aide pour tes leçons de conduite ») : utiles, mais pas
// le rôle. Écartés en tête d'aperçu.
const AVANTAGE = /(?<![\p{L}\d])(\d+\s*wochen ferien|ferientage|semaines de vacances|jours de vacances|weeks? of (holiday|vacation)|fahrstunden|leçons de conduite|driving lessons|mitarbeiterrabatt|personalrabatt|rabais|réduction(s)? (sur|pour le personnel)|staff discount|gratis|kostenlos|gratuit|vergünstigung|mentoring.?programm|programme de mentorat|talent förderprogramm|life long learning|wir beteiligen uns an deiner weiterbildung|nous participons à ta formation|übernahme (deiner|der|von) [^.]{0,30}kosten|prise en charge (de vos|de tes|des) frais|travailler sur les (marques|véhicules)|arbeit an den modernsten|work(ing)? on the (latest|most modern)|flache(n)? hierarchien|familiäre teams?|digitales lernen|persönlicher kundenkontakt|selbständiges arbeiten.|flat hierarch|hiérarchie(s)? plate|bodenständigen umfeld|chf\s*[\d']+\.?-?\s*(für|pour|for))/iu;
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
    // « Als eines der vier Häuser der Tschuggen Collection… », « Wir ermöglichen
    // unseren Versicherten… » : l'entreprise parle d'elle, pas du poste.
    || /^(als (eines|einer|eine|ein) der|en tant que l.un des|as one of the)\b/.test(b)
    || /^wir (ermöglichen|verzaubern|begeistern|gestalten|stehen|sind stolz|entwickeln und produzieren|produzieren|bieten unseren kunden|vereinen|setzen uns|sind ein|sind eine|sind das|sind die|zählen zu|gehören zu)/.test(b)
    || /^(nous (réunissons|sommes un|sommes une|comptons parmi)|we (are a|are an|are one of|combine|unite))\b/.test(b)
    // « The Swiss Federal Institute … WSL is part of the ETH Domain ».
    || (/\b(is part of the|fait partie (du|de la|des)|ist teil (der|des)|gehört zu(r|m)?)\b/.test(b) && !/\b(you|your|vous|votre|du|dich|dein|sie werden)\b/.test(b))
    // Un groupe ou une coopérative qui se décrit, sans un mot pour le candidat :
    // « Die LANDI Genossenschaften unterstützen die Schweizer Bäuerinnen… ».
    || (/^(die|der|das|le|la|les|the) [^.]{0,40}(genossenschaft|gruppe|group|groupe|unternehmen|konzern|firma|holding|coopérative|société)/.test(b)
      && !/\b(du|dich|dein|sie werden|deine|you|your|vous|votre|tu|ton|ta)\b/.test(b))
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
const ADMINISTRATIF = /^(deadline for applications|hardship level|family type|residential location|grade\b|job location|location\b|lieu\b|standort\b|reference|référence|job id|req(uisition)? id|posting date|date de publication|no\.? du poste|vacancy (no|notice)|date de clôture|closing date|arbeitsort|einsatzort|lieu de travail|place of work|luogo di lavoro|online seit|en ligne depuis|online since|publiziert am|publié le)/i;
// Citation d'un responsable sur le poste, sur toute sa ligne : « Das sagt Daniel
// Eberhard, Leiter Bau zur Stelle: "Bauen ist deine Leidenschaft? …" ».
const CITATION = /^(das sagt|voici ce qu.en dit|here.s what)[^:]{3,90}:/i;
// En-tête de page d'offre : « Graubündner Kantonalbank | online seit: 16.04.2026 ».
const EN_TETE = l => /\|\s*(online seit|en ligne depuis|online since|publiziert|publié)/i.test(l);
// Ligne-fiche en tête d'annonce : « 138104 | 80 - 100% | Oerlikon | Hybrid »,
// « Versicherung / Baden / Unbefristet / 80% », « 📍 Aarau, Chur… ».
const LIGNE_FICHE = l => (l.match(/\s\|\s/g) ?? []).length >= 2 || (l.match(/\s\/\s/g) ?? []).length >= 3 || /^\p{Extended_Pictographic}/u.test(l);
// Signature d'un recruteur : « Christian Sturm People & Transformation Lead ».
const SIGNATURE = l => l.length < 70 && !/[.!?:]/.test(l) && /^\p{Lu}\p{Ll}+ \p{Lu}\p{Ll}+(-\p{Lu}\p{Ll}+)? .*(lead|manager|recruit|talent|partner|hr|personal|rh|consultant)/iu.test(l);
// Intitulé de rubrique collé au texte qui suit.
const RUBRIQUE_COLLEE = /^(introduction|deine rolle|ihre rolle|deine aufgaben|ihre aufgaben|your role|the role|votre rôle|vos missions|vos tâches|description|nous allons réaliser ensemble|was dich erwartet|was sie erwartet|what you will do|ce que vous ferez)\s*:?\s+(?=\p{Lu})/iu;
// Découpe en phrases : pas après une abréviation courte (« ca. », « No. », « Dr. »).
const phrasesDe = l => l.split(/(?<=(?:\p{L}{3,}|\d|[)»”"])[.!?]|[!?])\s+(?=[\p{Lu}\d«“"])/u);
// Clé d'une phrase, pour la reconnaître d'une offre à l'autre.
const clePhrase = p => p.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").slice(0, 140);
// Une phrase qui décrit le poste à la deuxième personne (« Du berätst… »,
// « Vous gérez… ») reste, même répétée : des postes voisins partagent leurs tâches.
const DIT_LE_POSTE = /^(du|sie|vous|tu|you|ti|lei)\s+\p{L}+(st|en|ez|es|s|e|i)?\b/iu;

/**
 * Phrases « communes » d'une entreprise : répétées mot pour mot dans au moins
 * quatre offres de titres différents. Ce sont des avantages (« 6 Wochen
 * Ferien »), des slogans (« Entdecke die Vielfalt von über 100 Berufen »), des
 * en-têtes (« People & Transformation Lead ») ou la présentation de la maison :
 * jamais le rôle. L'aperçu les saute et prend la phrase suivante.
 */
function phrasesCommunes(offres) {
  const vues = new Map(); // clé → titres distincts
  for (const { html, titre } of offres) {
    if (!html) continue;
    // Le métier, pas le lieu : « Verkäufer/in Volg Herznach » et « … Zermatt »
    // sont le même poste ; leurs tâches communes sont bien le rôle.
    const t = clePhrase(titre ?? "").slice(0, 12);
    for (const l of texte(html).slice(0, 40)) for (const p of phrasesDe(l)) {
      // Un intertitre (« Deine Aufgaben », « Tes tâches : ») revient dans toutes
      // les offres : c'est un repère, pas du remplissage. Il ne doit jamais
      // être écarté, sinon la rubrique des tâches devient introuvable.
      if (p.length < 12 || DIT_LE_POSTE.test(p) || (p.split(/\s+/).length <= 6 && !/[.!]$/.test(p))) continue;
      const k = clePhrase(p);
      if (!vues.has(k)) vues.set(k, new Set());
      vues.get(k).add(t);
    }
  }
  return new Set([...vues].filter(([, titres]) => titres.size >= 4).map(([k]) => k));
}

/**
 * @param {string} html
 * @param {string} entreprise
 * @param {string} [titre]
 * @param {Set<string> | null} [communes] phrases communes de l'entreprise, écartées
 */
function resume(html, entreprise, titre = "", communes = null) {
  const norm = x => x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  // Phrases communes retirées partout, avant tout le reste.
  const sansCommunes = l => (communes?.size ? phrasesDe(l).filter(p => !communes.has(clePhrase(p))).join(" ") : l);
  const lignes = texte(html)
    .filter(l => !ADMINISTRATIF.test(l) && !LIGNE_FICHE(l) && !SIGNATURE(l) && !EN_TETE(l) && !CITATION.test(l))
    // Ligne qui commence par le titre de l'offre suivi de ses conditions
    // (« Key Account Manager Retail 100% Lenzburg, AG Du willst… », « Senior
    // IT/OT Systems Engineer (w/m/d) 80% - 100% Du möchtest… ») : on garde ce
    // qui vient après, à partir de la première vraie phrase. Le titre est
    // comparé nettoyé, sans mention de genre ni taux.
    .map(l => {
      if (!titre) return l;
      const debut = norm(titrePropre(l)).slice(0, Math.max(12, norm(titre).length - 6));
      if (!norm(titre).startsWith(debut.slice(0, 12)) || !norm(titrePropre(l)).startsWith(norm(titre).slice(0, Math.min(norm(titre).length, 30)))) return l;
      return l.match(/\s((?:Du|Sie|Wir|Vous|Tu|Nous|You|We|In|Als|En|As|Bei|Chez|At)\s.*)$/)?.[1] ?? "";
    })
    .map(l => sansCommunes(l.replace(RUBRIQUE_COLLEE, "")))
    .filter(Boolean);
  // Intertitre : en capitales, terminé par « : », annonçant les tâches, ou
  // ligne très courte sans ponctuation (« Introduction », « Responsabilités »).
  // Les éléments de liste, eux, reçoivent un point dans texte() : ils ne sont
  // jamais pris pour des intertitres.
  const intertitre = l => l.length < 70 && (l === l.toUpperCase() || /[:?]$/.test(l) || TACHES.test(l) && l.split(" ").length <= 6 || (l.split(/\s+/).length <= 3 && !/[.!?,;…]$/.test(l)));
  let depart = lignes.findIndex(l => intertitre(l) && TACHES.test(l));
  depart = depart >= 0 ? depart + 1 : 0;
  const out = [];
  const suite = lignes.slice(depart);
  for (let i = 0; i < suite.length; i++) {
    let l = suite[i];
    // Fiche technique : « Arbeitsort: » puis « Basel », « Stellenantritt: »
    // puis « 01.12.2026 oder nach Vereinbarung ». La valeur courte sous une
    // étiquette n'est pas du texte. Débris sans lettre (« --> ») ignorés.
    if (!/\p{L}{2}/u.test(l)) continue;
    if (i > 0 && /:$/.test(suite[i - 1]) && suite[i - 1].length < 40 && l.length < 50 && !/[.!?]$/.test(l)) continue;
    if (intertitre(l)) { if (out.length) break; else continue; }
    if (!out.length) {
      const phrases = phrasesDe(l);
      // … et le débris d'une phrase coupée (« 1 for its customers… »).
      while (phrases.length && (presenteEntreprise(phrases[0], entreprise) || ACCROCHE.test(phrases[0]) || AVANTAGE.test(phrases[0]) || PROFIL.test(phrases[0]) || /\?[»”"]?$/.test(phrases[0].trim()) || /^\d+\s+\p{Ll}/u.test(phrases[0]))) phrases.shift();
      l = phrases.join(" ");
      if (!l) continue;
    }
    // Débris en tête : puce, numérotation (« 1. »), intitulé de rubrique collé.
    out.push(l.replace(/^[-•·]\s*/, "").replace(/^(\d+|[a-z])[.)]\s+/, "").replace(/^(job description|description du poste|stellenbeschreibung)\s*:?\s*/i, ""));
    if (out.join(" ").length > 300) break;
  }
  // Espace avant une virgule ou un point (« (H/F) , prêt ») : faute de frappe de la source.
  let r = out.join(" ").replace(/\s+/g, " ").replace(/\s+([,.](?:\s|$))/g, "$1").trim();
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
  // Apprentissage : dit explicitement (titre ou outil de recrutement). Un
  // diplôme seul (« Elektroinstallateur EFZ 80-100% ») est une exigence du
  // poste, pas un apprentissage ; il ne l'est qu'avec une année de début et
  // sans taux (« Logistiker:in EFZ 2027 »).
  const titreSeul = titre.toLowerCase();
  // Ce que dit le titre passe avant les filtres de l'outil : « Praktikant:in »
  // est un stage, même si l'offre est rangée sous « Stage / Trainee / alternance ».
  if (/praktik|stagiaire|\bintern\b|internship|\bstage\b/.test(titreSeul) && !/apprenti|lehrstelle|lernende/.test(titreSeul)) return "Stage";
  if (/apprenti|lehrstelle|lehre\b|lernende|lernender|apprentice|azubi|berufslehre|apprendista|tirocinio/.test(t)) return "Apprentissage";
  if (/\b(cfc|efz|eba|afp)\b/.test(titreSeul) && /\b20\d\d\b|ab (august|sommer)|rentrée/.test(titreSeul) && !/\d\s*%/.test(titreSeul)) return "Apprentissage";
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
  // Débris : « --> Consultant » (flèche de menu), lieu générique sans ville.
  if (/^[-=>\s]+/.test(l) && !/^\p{L}/u.test(l)) return villeEntreprise ?? null;
  if (/^(central|zentral|diverse|divers|various|plusieurs|mehrere|schweiz ?weit|toute la suisse|ganze schweiz)$/i.test(l)) return villeEntreprise ?? null;
  // « Hauptsitz Chur », « Region Arosa », « Grossraum Zürich », « Rüfenacht b. Bern ».
  l = l.replace(/^(hauptsitz|siège( de)?|headquarters|region|région|grossraum|raum|kanton|canton|bezirk)\s+/i, "")
    .replace(/\s+(b\.|bei|près de|près)\s+.+$/i, "");
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
  // Nom de magasin ou de quartier après la ville : « Aarau City Restaurant »,
  // « Bern Bahnhof to go », « Bellinzona Nord », « Basel Aeschenplatz ».
  // On retire les mots de magasin en fin, puis, si le début est une ville
  // suisse connue, on garde la ville seule.
  // Préfixes de magasin ou d'annonce : « Neueröffnung Andermatt », « Coop City
  // Fusterie », « VZ Castione ». Un nom d'hôtel seul n'est pas un lieu.
  if (/^hotel\s/i.test(l)) return villeEntreprise ?? null;
  const magasin = /^(coop city|coop pronto|coop|filiale|magasin|store)\s+/i.test(l);
  l = l.replace(/^(neueröffnung|eröffnung|nouvelle ouverture|coop city|coop pronto|coop|vz|filiale|magasin|store)\s+/i, "");
  // « Coop City Fusterie » : ce qui reste est le nom du magasin, pas une ville.
  if (magasin && !SUISSE.test(l)) return villeEntreprise ?? null;
  l = l.replace(/\s+(ipermercato|supermercato|personalrestaurant|stadtgarten|einkaufszentrum)\b.*$/i, "");
  l = l.replace(/(\s+(restaurant|to go|city|nord|sud|süd|ost|west|est|ouest|dorf|zentrum|center|centre|bahnhof|gare|bhf|shop|filiale|markt|telli|pfauen|reuss|fusterie))+$/i, "").trim();
  const mots = l.split(/\s+/);
  for (let n = Math.min(mots.length, 4); n >= 1 && mots.length > 1; n--) {
    const debut = mots.slice(0, n).join(" ");
    if (n < mots.length && new RegExp(`^(?:${SUISSE.source})$`, "iu").test(debut)) { l = debut; break; }
  }
  // Débris sans ville (« Am », « Bahnhof ») ou service itinérant.
  if (/^(am|an|im|in|bahnhof|gare|zentrale|centrale)$/i.test(l)) return villeEntreprise ?? null;
  if (/aussendienst|service externe|field service|mobile/i.test(l)) return "Service externe";
  return VILLES_FR[l.toLowerCase()] ?? (l || villeEntreprise || null);
}
// Le site est en français : une même ville s'écrit d'une seule façon, sinon
// « Geneva » et « Genève » apparaîtraient comme deux lieux.
const VILLES_FR = {
  geneva: "Genève", genf: "Genève", ginebra: "Genève", genebra: "Genève", wintethur: "Winterthur", winterhur: "Winterthur", ginevra: "Genève", "genève": "Genève",
  "zürich": "Zurich", zuerich: "Zurich", zurigo: "Zurich", zug: "Zoug", zugo: "Zoug", "st. moritz": "Saint-Moritz", "st.moritz": "Saint-Moritz", "sankt moritz": "Saint-Moritz", tessin: "Tessin", ticino: "Tessin",
  bern: "Berne", berna: "Berne", basel: "Bâle", basilea: "Bâle",
  luzern: "Lucerne", lucerna: "Lucerne", "st. gallen": "Saint-Gall", "st.gallen": "Saint-Gall", "sankt gallen": "Saint-Gall",
  freiburg: "Fribourg", "neuenburg": "Neuchâtel", "biel": "Bienne", "biel/bienne": "Bienne", "solothurn": "Soleure",
  "schaffhausen": "Schaffhouse", "chur": "Coire", "sitten": "Sion",
  remote: "Télétravail", westschweiz: "Suisse romande", romandie: "Suisse romande", zentralschweiz: "Suisse centrale", ostschweiz: "Suisse orientale", nordwestschweiz: "Suisse du Nord-Ouest", deutschschweiz: "Suisse alémanique", tessin: "Tessin", "home office": "Télétravail", "homeoffice": "Télétravail",
};
const offre = (o, entreprise, villeEntreprise, communes = null) => {
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
    description: o.html !== undefined ? resume(o.html, entreprise, titre, communes) : undefined,
    apply_url: o.url,
    // Date illisible (« Invalid Date ») : ignorée plutôt que de faire échouer l'offre.
    created_at: o.date && !Number.isNaN(new Date(o.date).getTime()) ? new Date(o.date).toISOString() : undefined,
  };
};

export { phrasesCommunes, clePhrase, lieuEnSuisse, CANTONS, lieuPropre, ADMINISTRATIF, NOMMEES, entites, texte, CANDIDATURE_SPONTANEE, titrePropre, SUISSE, TACHES, ACCROCHE, presenteEntreprise, resume, taux, contrat, offre };
