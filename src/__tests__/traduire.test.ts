import { describe, it, expect } from "vitest";
import { creerTraducteur, type Messages } from "@/i18n/traduire";
import fr from "@/i18n/messages/fr.json";

/**
 * Le socle de traduction : jamais une clé brute à l'écran, un repli sur le
 * français pour toute clé non encore traduite, des pluriels et des nombres
 * selon la langue.
 */
const essai = { ...fr, essai: { bonjour: "Bonjour {nom}", offres: { one: "{n} offre", other: "{n} offres" } } } as unknown as Messages;
type T = (cle: string, vars?: Record<string, string | number>) => string;

describe("traduction", () => {
  it("rend le texte d'une clé", () => {
    expect(creerTraducteur("fr", fr)("menu.explorer")).toBe("Explorer");
  });

  it("remplace les variables", () => {
    const t = creerTraducteur("fr", essai) as unknown as T;
    expect(t("essai.bonjour", { nom: "Luc" })).toBe("Bonjour Luc");
  });

  it("accorde le pluriel selon la langue, nombres au format suisse", () => {
    const t = creerTraducteur("fr", essai) as unknown as T;
    expect(t("essai.offres", { n: 1 })).toBe("1 offre");
    expect(t("essai.offres", { n: 0 })).toBe("0 offre"); // en français, 0 est singulier
    expect(t("essai.offres", { n: 1448 })).toMatch(/^1.448 offres$/);
    const de = creerTraducteur("de", essai) as unknown as T;
    expect(de("essai.offres", { n: 0 })).toBe("0 offres"); // en allemand, 0 est pluriel
  });

  it("retombe sur le français quand une langue n'a pas la clé", () => {
    const allemandIncomplet = { menu: { explorer: "Entdecken" } } as unknown as Messages;
    const t = creerTraducteur("de", allemandIncomplet, fr);
    expect(t("menu.explorer")).toBe("Entdecken");
    expect(t("menu.favoris")).toBe("Favoris");
  });
});
