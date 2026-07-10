export const BASE_CPM_CHF = 4.0;

export const AD_FORMATS = ["square", "swipe"] as const;
export type AdFormat = (typeof AD_FORMATS)[number];

const FORMAT_MULT: Record<AdFormat, number> = { square: 1.0, swipe: 1.5 };

function cantonMult(cantons: string[]): number {
  if (cantons.length === 0) return 1.0;
  if (cantons.length >= 3) return 1.2;
  if (cantons.length === 2) return 1.5;
  return 2.0;
}

function sectorMult(sectors: string[]): number {
  if (sectors.length === 0) return 1.0;
  if (sectors.length >= 2) return 1.2;
  return 1.5;
}

export function calculateCPM(format: AdFormat, cantons: string[], sectors: string[]): number {
  return +(BASE_CPM_CHF * FORMAT_MULT[format] * cantonMult(cantons) * sectorMult(sectors)).toFixed(4);
}

export function estimateDailyImpressions(dailyBudget: number, cpm: number): number {
  if (!cpm) return 0;
  return Math.floor((dailyBudget / cpm) * 1000);
}

export function estimateDailyReach(dailyBudget: number, cpm: number): number {
  return Math.floor(estimateDailyImpressions(dailyBudget, cpm) * 0.72);
}
