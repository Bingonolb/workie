// ── Tarification publicitaire de Workie ───────────────────────────────────────
//
// On vend une durée d'affichage, pas un volume.
//
//   1. couverture = part de l'audience visée par le ciblage (cantons × secteurs).
//      → Aucun filtre sur une dimension = 100 % sur cette dimension.
//
//   2. tarif journalier = PRIX_JOUR_NATIONAL × (part fixe + part variable × couverture)
//      → Une part reste fixe : relire une annonce genevoise coûte autant qu'une
//        annonce nationale, et la servir aussi.
//
//   3. prix = tarif journalier × durée choisie (7, 14 ou 30 jours).
//      → Rien à consommer, rien à rembourser : c'est du temps qui s'écoule.
//
// Poids des cantons : OFS, actifs occupés par canton (2022).
// Poids des secteurs : répartition approximative de la population active.

export const BASE_CPM_CHF = 4.0;

export const AD_FORMATS = ["square", "swipe"] as const;
export type AdFormat = (typeof AD_FORMATS)[number];

// Les deux formats sont au même tarif.
//
// Le swipe était facturé une fois et demie le carré, au motif qu'il occupe
// tout l'écran. Rien ne l'établit : personne n'a mesuré qu'une impression y
// vaille davantage, et deux prix pour un service dont on ignore encore le
// rendement se défend mal auprès d'un annonceur. On repart d'un tarif unique ;
// il sera temps de les distinguer quand les chiffres le justifieront.
const FORMAT_MULT: Record<AdFormat, number> = { square: 1.0, swipe: 1.0 };

// ── Swiss workforce distribution by canton (OFS 2022) ─────────────────────────
// Proportional weights — need not sum to 100; reach normalises by CANTON_TOTAL.
export const CANTON_WEIGHTS: Record<string, number> = {
  ZH: 18.5, BE: 12.1, VD:  9.8, AG:  7.3, GE:  6.1, SG:  6.0, LU:  4.7,
  TI:  3.8, VS:  3.3, SO:  3.2, FR:  3.1, BL:  2.8, TG:  2.8, BS:  2.7,
  GR:  2.1, NE:  2.0, ZG:  1.7, SZ:  1.5, JU:  0.8, SH:  0.8, AR:  0.5,
  GL:  0.4, OW:  0.4, NW:  0.4, UR:  0.3, AI:  0.2,
};
const CANTON_TOTAL = Object.values(CANTON_WEIGHTS).reduce((a, b) => a + b, 0);

// ── Sector distribution of Swiss workforce (approximate, OFS + Workie data) ───
export const SECTOR_WEIGHTS: Record<string, number> = {
  "Tech":                   14,
  "Finance":                10,
  "Conseil":                 9,
  "Santé":                   8,
  "Commerce":                7,
  "Industrie":               7,
  "Pharma":                  6,
  "Assurances":              5,
  "Éducation & Recherche":   5,
  "Transport":               5,
  "Alimentation":            5,
  "Horlogerie":              4,
  "Automobile":              4,
  "Énergie":                 4,
  "Sport":                   4,
  "Mode":                    3,
  "Agriculture":             3,
  // Ajoutés en même temps que leur arrivée au catalogue. Sans poids, une
  // campagne qui ne visait qu'eux calculait une audience nulle, donc un prix
  // et une portée faux.
  "Droit":                   4,
  "Bâtiment":                4,
  "Beauté":                  3,
  "Administration publique": 5,
  "ONG":                     3,
  "Organisations internationales": 3,
  "Fondation":               2,
  "Association":             2,
  "Commerce de détail":      8,
  "Hôtellerie & Restauration": 6,
  "Immobilier":              4,
  "Médias & Communication":  4,
  "Chimie":                  5,
  "Télécoms":                5,
  // Ajoutes en meme temps que leur arrivee au catalogue. Sans poids, une
  // campagne qui ne visait qu'eux calculait une audience nulle, donc un prix
  // et une portee faux.
  "Biens de consommation":     5,
  "Logistique & Supply Chain": 6,
  "Aéronautique & Spatial":    1,
  "Défense & Sécurité":        2,
};
const SECTOR_TOTAL = Object.values(SECTOR_WEIGHTS).reduce((a, b) => a + b, 0);

// ── Daily impression capacity ─────────────────────────────────────────────────
// Conservative estimate of total impressions Workie can serve per day across all
// active campaigns. Updated as the platform grows.
export const DAILY_IMPRESSION_POOL = 15_000;

// ── Audience reach (0–1) ──────────────────────────────────────────────────────

function cantonReach(cantons: string[]): number {
  if (cantons.length === 0) return 1.0;
  const selected = cantons.reduce((acc, c) => acc + (CANTON_WEIGHTS[c] ?? 0), 0);
  return Math.min(selected / CANTON_TOTAL, 1.0);
}

function sectorReach(sectors: string[]): number {
  if (sectors.length === 0) return 1.0;
  const selected = sectors.reduce((acc, s) => acc + (SECTOR_WEIGHTS[s] ?? 0), 0);
  return Math.min(selected / SECTOR_TOTAL, 1.0);
}

// La part d'audience visée par les deux filtres à la fois.
// Plancher à 0,5 % : sans lui, un croisement très étroit ferait tomber le
// tarif journalier sur sa seule part fixe, et deux ciblages très différents
// se retrouveraient au même prix.
export function audienceReach(cantons: string[], sectors: string[]): number {
  return Math.max(cantonReach(cantons) * sectorReach(sectors), 0.005);
}

// ── Le prix ───────────────────────────────────────────────────────────────────

/** Les durées proposées, en jours. */
export const DUREES_FORFAIT = [7, 14, 30] as const;
export type DureeForfait = (typeof DUREES_FORFAIT)[number];

/** Le tarif journalier d'une campagne qui vise toute la Suisse. */
export const PRIX_JOUR_NATIONAL = 8;

// Part du tarif qui ne dépend pas du territoire. Relire une annonce, la
// stocker et la servir coûtent la même chose qu'elle vise un canton ou vingt-six.
const PART_FIXE = 0.3;

/**
 * Ce que coûte une journée d'affichage, selon le territoire visé.
 *
 * Entre un canton et le pays entier, le rapport est d'environ un à trois.
 * L'inventaire, lui, varie d'un à seize : facturer proportionnellement
 * rendrait les ciblages étroits presque gratuits, alors qu'ils demandent le
 * même travail.
 */
export function tarifJournalier(cantons: string[], sectors: string[]): number {
  const couverture = audienceReach(cantons, sectors);
  return Math.ceil(PRIX_JOUR_NATIONAL * (PART_FIXE + (1 - PART_FIXE) * couverture));
}

/** Le prix d'une campagne : un tarif journalier, une durée. */
export function prixForfait(cantons: string[], sectors: string[], jours: number): number {
  return tarifJournalier(cantons, sectors) * jours;
}

/** Vrai si la durée fait partie de celles qu'on propose. */
export function dureeValide(jours: number): jours is DureeForfait {
  return (DUREES_FORFAIT as readonly number[]).includes(jours);
}

/** La date de fin d'une campagne qui démarre le jour donné. */
export function dateDeFin(debut: string, jours: number): string {
  const d = new Date(`${debut}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}
