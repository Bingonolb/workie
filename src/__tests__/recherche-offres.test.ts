import { describe, it, expect } from "vitest";
import { analyser, corriger, pertinence } from "@/lib/rechercheOffres";

const vocab = new Set(["vendeuse", "verkaufer", "developer", "comptable", "koch", "infirmiere"]);

describe("recherche d'offres", () => {
  it("traduit le métier dans les quatre langues", () => {
    const r = analyser("vendeur", vocab);
    expect(r.groupes[0]).toEqual(expect.arrayContaining(["vend", "verkauf", "sales", "vendit"]));
    const b = analyser("Buchhalter", vocab);
    expect(b.groupes[0]).toEqual(expect.arrayContaining(["comptab", "accountant"]));
  });
  it("ignore accents et majuscules", () => {
    expect(analyser("Développeur", vocab).groupes[0]).toEqual(expect.arrayContaining(["entwickler", "developer"]));
  });
  it("comprend le taux, la langue, le contrat", () => {
    const r = analyser("comptable CDI anglais 80%", vocab);
    expect(r.taux).toBe(80);
    expect(r.langues).toEqual(["en"]);
    expect(r.contrats).toEqual(["CDI"]);
    expect(r.groupes).toHaveLength(1);
    expect(analyser("infirmière 60-80 %", vocab).taux).toBe(80);
    expect(analyser("vente temps partiel", vocab).partiel).toBe(true);
    expect(analyser("Lehrstelle Koch", vocab).contrats).toEqual(["Apprentissage"]);
  });
  it("classe le mot tapé avant ses équivalents", () => {
    const r = analyser("manager", vocab);
    const titres = ["head of dach", "payroll manager 80-100%", "manager operations", "teamleiter verkauf"];
    const classes = [...titres].sort((a, b) => pertinence(b, r) - pertinence(a, r));
    expect(classes.slice(0, 2)).toEqual(["manager operations", "payroll manager 80-100%"]);
  });
  it("corrige une faute de frappe", () => {
    expect(corriger("vendeue", vocab)).toBe("vendeuse");
    expect(corriger("comptabel", vocab)).toBe("comptable");
  });
  it("ne garde que des caractères sûrs pour la base", () => {
    const r = analyser("dev'); drop table --", vocab);
    for (const g of r.groupes) for (const v of g) expect(v).toMatch(/^[a-z0-9 -]+$/);
  });
});
