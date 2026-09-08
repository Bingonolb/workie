import { describe, it, expect } from "vitest";
import {
  BASE_CPM_CHF,
  BUDGET_JOURNALIER_PLANCHER,
  DAILY_IMPRESSION_POOL,
  audienceReach,
  budgetJournalierMinimum,
  calculateCPM,
  estimateDailyImpressions,
} from "@/lib/ads/pricing";

/**
 * Le prix doit suivre le territoire acheté.
 *
 * Une « prime de précision » faisait baisser le prix des mille affichages
 * quand la portée montait. À budget journalier égal, mesuré à CHF 20, Genève
 * seule donnait neuf cent quarante affichages par jour et toute la Suisse cinq
 * mille : élargir son ciblage rapportait cinq fois plus sans rien coûter.
 *
 * Ces tests gardent les deux propriétés qui corrigent l'inversion : le prix
 * unitaire ne dépend plus du ciblage, et l'engagement minimum, lui, en dépend.
 */

const ROMANDIE = ["GE", "VD", "VS", "FR", "NE", "JU"];

describe("le prix des mille affichages", () => {
  it("ne dépend pas du ciblage", () => {
    const large = calculateCPM("square", [], []);
    const etroit = calculateCPM("square", ["AI"], ["Horlogerie"]);
    expect(etroit).toBe(large);
    expect(large).toBe(BASE_CPM_CHF);
  });

  it("ne dépend pas du format", () => {
    expect(calculateCPM("swipe", [], [])).toBe(calculateCPM("square", [], []));
  });
});

describe("le budget journalier minimum", () => {
  it("monte quand on ajoute des cantons", () => {
    const minimums = [
      ["GE"],
      ["GE", "VD"],
      ROMANDIE,
      [...ROMANDIE, "BE", "ZH"],
      [],
    ].map(cantons => budgetJournalierMinimum(cantons, []));

    // Croissance au sens large : les petits cantons restent sous le plancher,
    // qui les ramène tous à la même valeur.
    for (let i = 1; i < minimums.length; i++) {
      expect(minimums[i]).toBeGreaterThanOrEqual(minimums[i - 1]);
    }
    // Et strictement plus cher entre le plus étroit et le pays entier, sans
    // quoi le ciblage resterait gratuit.
    expect(minimums.at(-1)!).toBeGreaterThan(minimums[0]);
  });

  it("ne descend jamais sous le plancher", () => {
    expect(budgetJournalierMinimum(["AI"], ["Horlogerie"])).toBe(BUDGET_JOURNALIER_PLANCHER);
  });

  it("achète la moitié de l'inventaire visé", () => {
    const attendu = Math.ceil((DAILY_IMPRESSION_POOL * 0.5 / 1000) * BASE_CPM_CHF);
    expect(budgetJournalierMinimum([], [])).toBe(attendu);
  });
});

describe("les affichages estimés", () => {
  it("restent bornés par l'audience du segment", () => {
    // Un gros budget sur un canton minuscule ne peut pas acheter plus
    // d'affichages qu'il n'y a de lecteurs.
    const cantons = ["AI"];
    const reach = audienceReach(cantons, []);
    const cpm = calculateCPM("square", cantons, []);
    const affichages = estimateDailyImpressions(500, cpm, reach);
    expect(affichages).toBeLessThanOrEqual(Math.floor(DAILY_IMPRESSION_POOL * reach));
  });
});
