import { describe, it, expect } from "vitest";
import { SECTORS, SECTOR_COLORS } from "@/lib/types";
import { SECTOR_WEIGHTS } from "@/lib/ads/pricing";

/**
 * Trois listes décrivaient les secteurs, chacune dans son coin : les couleurs,
 * le filtre d'exploration et les poids d'audience publicitaire. Elles avaient
 * divergé sans que rien ne le signale, et quatre secteurs proposés au filtre
 * n'existaient nulle part ailleurs : ils s'affichaient en violet par défaut et
 * une campagne qui les ciblait calculait une audience nulle, donc un prix faux.
 *
 * Ces tests ne vérifient pas un calcul, ils vérifient qu'un secteur ajouté
 * quelque part l'est partout.
 */
describe("secteurs", () => {
  it("chaque secteur proposé a une couleur", () => {
    const sans = SECTORS.filter(s => !(s in SECTOR_COLORS));
    expect(sans).toEqual([]);
  });

  it("chaque secteur proposé pèse dans le calcul d'audience publicitaire", () => {
    const sans = SECTORS.filter(s => !(s in SECTOR_WEIGHTS));
    expect(sans).toEqual([]);
  });

  it("aucun poids ne porte sur un secteur qui n'existe plus", () => {
    const orphelins = Object.keys(SECTOR_WEIGHTS).filter(s => !(SECTORS as readonly string[]).includes(s));
    expect(orphelins).toEqual([]);
  });

  it("la liste ne comporte pas de doublon", () => {
    expect(new Set(SECTORS).size).toBe(SECTORS.length);
  });

  it("les trois nouveaux secteurs sont présents", () => {
    expect(SECTORS).toContain("ONG");
    expect(SECTORS).toContain("Fondation");
    expect(SECTORS).toContain("Association");
  });
});
