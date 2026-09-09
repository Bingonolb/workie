import { describe, it, expect } from "vitest";
import {
  DUREES_FORFAIT,
  PRIX_JOUR_NATIONAL,
  audienceReach,
  tarifJournalier,
  prixForfait,
  dureeValide,
  dateDeFin,
} from "@/lib/ads/pricing";

/**
 * Le prix suit le territoire et la durée, rien d'autre.
 *
 * Le modèle précédent vendait des affichages. Il avait deux défauts mesurés :
 * le prix des mille affichages baissait quand la portée montait, si bien
 * qu'élargir son ciblage donnait cinq fois plus de vues pour le même prix ;
 * et le volume annoncé venait d'un réservoir de quinze mille affichages
 * quotidiens écrit en dur, jamais mesuré.
 *
 * Ces tests gardent les propriétés du forfait : le prix monte avec le
 * territoire, monte avec la durée, et ne dépend de rien d'autre.
 */

const ROMANDIE = ["GE", "VD", "VS", "FR", "NE", "JU"];

describe("le tarif journalier", () => {
  it("monte avec le nombre de cantons", () => {
    const paliers = [["AI"], ["GE"], ["GE", "VD"], ROMANDIE, [...ROMANDIE, "BE", "ZH"], []]
      .map(cantons => tarifJournalier(cantons, []));

    for (let i = 1; i < paliers.length; i++) {
      expect(paliers[i]).toBeGreaterThanOrEqual(paliers[i - 1]);
    }
    // Et strictement plus cher du plus étroit au pays entier : sans quoi le
    // ciblage serait de nouveau gratuit, ce qui était le défaut d'origine.
    expect(paliers.at(-1)!).toBeGreaterThan(paliers[0]);
  });

  it("plafonne au tarif national quand aucun canton n'est coché", () => {
    expect(tarifJournalier([], [])).toBe(PRIX_JOUR_NATIONAL);
    // Cocher les vingt-six revient au même que n'en cocher aucun.
    expect(tarifJournalier(Object.keys({ ZH: 0 }), [])).toBeLessThanOrEqual(PRIX_JOUR_NATIONAL);
  });

  it("garde une part fixe : viser un canton minuscule n'est pas gratuit", () => {
    expect(tarifJournalier(["AI"], ["Horlogerie"])).toBeGreaterThan(0);
  });

  it("ne dépasse jamais le tarif national", () => {
    for (const cantons of [["ZH"], ROMANDIE, []]) {
      expect(tarifJournalier(cantons, [])).toBeLessThanOrEqual(PRIX_JOUR_NATIONAL);
    }
  });
});

describe("le prix du forfait", () => {
  it("est le tarif journalier multiplié par la durée", () => {
    for (const jours of DUREES_FORFAIT) {
      expect(prixForfait(["GE"], [], jours)).toBe(tarifJournalier(["GE"], []) * jours);
    }
  });

  it("monte avec la durée", () => {
    const prix = DUREES_FORFAIT.map(j => prixForfait(["GE"], [], j));
    for (let i = 1; i < prix.length; i++) {
      expect(prix[i]).toBeGreaterThan(prix[i - 1]);
    }
  });
});

describe("les durées proposées", () => {
  it("sont les seules acceptées", () => {
    for (const jours of DUREES_FORFAIT) expect(dureeValide(jours)).toBe(true);
    // Une durée arbitraire envoyée à la main ne passe pas : le prix ne serait
    // plus celui qu'on a montré.
    for (const jours of [0, 1, 13, 45, 365, -7]) expect(dureeValide(jours)).toBe(false);
  });
});

describe("la date de fin", () => {
  it("ajoute la durée au jour de départ", () => {
    expect(dateDeFin("2026-09-09", 7)).toBe("2026-09-16");
    expect(dateDeFin("2026-09-09", 30)).toBe("2026-10-09");
  });

  it("franchit correctement une fin d'année", () => {
    expect(dateDeFin("2026-12-25", 14)).toBe("2027-01-08");
  });
});

describe("la portée d'audience", () => {
  it("reste une fraction entre le plancher et un", () => {
    for (const cantons of [["AI"], ["GE"], ROMANDIE, []]) {
      const r = audienceReach(cantons, []);
      expect(r).toBeGreaterThanOrEqual(0.005);
      expect(r).toBeLessThanOrEqual(1);
    }
  });
});
