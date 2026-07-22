// ── Workie Ads Pricing Engine ─────────────────────────────────────────────────
//
// Model: audience-reach CPM with precision premium.
//
//   1. audienceReach = fraction of Workie user base that matches the targeting.
//      → No filter on a dimension means 100% reach for that dimension.
//      → Selecting all cantons = selecting none = 100% reach (same thing).
//
//   2. CPM = BASE × formatMult × (1 + 0.4 × (1 − reach))
//      → Narrow targeting: slightly higher CPM (more relevant audience = more valuable)
//      → Broad / no targeting: base CPM (no premium)
//
//   3. dailyImpressions = min(budget÷CPM × 1000, DAILY_POOL × reach)
//      → Audience size caps impressions: a micro-segment can't absorb an unlimited budget.
//
// Source for canton weights: OFS statistique des actifs occupés par canton (2022).
// Sector weights: approximate distribution of Swiss working population.

export const BASE_CPM_CHF = 4.0;

export const AD_FORMATS = ["square", "swipe"] as const;
export type AdFormat = (typeof AD_FORMATS)[number];

const FORMAT_MULT: Record<AdFormat, number> = { square: 1.0, swipe: 1.5 };

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
  "Sports & Fashion":        4,
  "Agriculture":             3,
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

// Combined reach: fraction of Workie's audience that matches both canton AND sector filters.
// Minimum 0.5% to keep CPM and impression estimates sensible for micro-segments.
export function audienceReach(cantons: string[], sectors: string[]): number {
  return Math.max(cantonReach(cantons) * sectorReach(sectors), 0.005);
}

// ── CPM ───────────────────────────────────────────────────────────────────────
// Precision premium: 0% for broad targeting, up to +40% for the narrowest segment.
// This mirrors Facebook/LinkedIn Ads: a specific, high-intent audience costs more per view.
export function calculateCPM(format: AdFormat, cantons: string[], sectors: string[]): number {
  const reach = audienceReach(cantons, sectors);
  const precisionPremium = 1 + 0.4 * (1 - reach);
  return +(BASE_CPM_CHF * FORMAT_MULT[format] * precisionPremium).toFixed(4);
}

// ── Impression estimates ──────────────────────────────────────────────────────

// Daily impressions = the lower of:
//   - What the budget can buy (budget ÷ CPM × 1000)
//   - What the targeted audience pool can absorb (DAILY_POOL × reach)
export function estimateDailyImpressions(dailyBudget: number, cpm: number, reach: number): number {
  if (!cpm || !reach) return 0;
  const fromBudget = Math.floor((dailyBudget / cpm) * 1000);
  const segmentPool = Math.floor(DAILY_IMPRESSION_POOL * reach);
  return Math.min(fromBudget, segmentPool);
}

// Estimated unique people reached per day.
// Frequency factor: 1 / 0.72 ≈ 1.39 impressions per unique person on average.
export function estimateDailyReach(dailyBudget: number, cpm: number, reach: number): number {
  return Math.floor(estimateDailyImpressions(dailyBudget, cpm, reach) * 0.72);
}

// True when the daily budget exceeds what the audience pool can absorb.
// Used to display a "budget dépasse l'audience ciblée" warning in the form.
export function isBudgetCapped(dailyBudget: number, cpm: number, reach: number): boolean {
  if (!cpm || !reach) return false;
  const fromBudget = Math.floor((dailyBudget / cpm) * 1000);
  const segmentPool = Math.floor(DAILY_IMPRESSION_POOL * reach);
  return fromBudget > segmentPool;
}
