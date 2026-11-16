import { describe, it, expect } from "vitest";
import { domaineOfficiel, emailDuDomaine } from "@/lib/domaineEntreprise";

/**
 * Cette règle décide si une revendication se valide seule par code. Si elle
 * laissait passer une messagerie publique ou un domaine voisin, n'importe qui
 * pourrait prendre la gestion d'une fiche. Corriger la règle, jamais le test.
 */
describe("vérification par domaine officiel", () => {
  it("tire le domaine enregistrable du site", () => {
    expect(domaineOfficiel("https://www.omega.ch/fr/carriere")).toBe("omega.ch");
    expect(domaineOfficiel("jobs.swatchgroup.com")).toBe("swatchgroup.com");
    expect(domaineOfficiel(null)).toBeNull();
    expect(domaineOfficiel("pas une url")).toBeNull();
  });

  it("accepte le domaine et ses sous-domaines", () => {
    expect(emailDuDomaine("rh@omega.ch", "omega.ch")).toBe(true);
    expect(emailDuDomaine("a.b@rh.omega.ch", "omega.ch")).toBe(true);
    expect(emailDuDomaine("RH@OMEGA.CH", "omega.ch")).toBe(true);
  });

  it("refuse les domaines voisins et les imitations", () => {
    expect(emailDuDomaine("x@omega.ch.pirate.com", "omega.ch")).toBe(false);
    expect(emailDuDomaine("x@fauxomega.ch", "omega.ch")).toBe(false);
    expect(emailDuDomaine("x@omega.com", "omega.ch")).toBe(false);
  });

  it("refuse les messageries publiques, même si le site y pointait", () => {
    expect(domaineOfficiel("https://sites.google.com/gmail.com")).toBe("google.com");
    expect(emailDuDomaine("rh@gmail.com", "gmail.com")).toBe(false);
    expect(emailDuDomaine("rh@bluewin.ch", "bluewin.ch")).toBe(false);
  });

  it("refuse une adresse mal formée", () => {
    expect(emailDuDomaine("omega.ch", "omega.ch")).toBe(false);
    expect(emailDuDomaine("@omega.ch", "omega.ch")).toBe(false);
  });
});
