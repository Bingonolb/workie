import { describe, it, expect } from "vitest";
import { synthetiser, partDeOui, texteSynthese, SEUIL_POURCENTAGE, type Synthese } from "@/lib/synthese";

/** Construit la liste de réponses correspondant à un triplet de comptes. */
function reponses(oui: number, non: number, mitiges: number, absents = 0): (string | null)[] {
  return [
    ...Array<string>(oui).fill("oui"),
    ...Array<string>(non).fill("non"),
    ...Array<string>(mitiges).fill("peut_etre"),
    ...Array<null>(absents).fill(null),
  ];
}

const s = (oui: number, non: number, mitiges: number, absents = 0) =>
  synthetiser(reponses(oui, non, mitiges, absents), "oui", "non");

describe("synthetiser — les cas qui ont produit des affirmations fausses", () => {
  it("Running : 1 oui et 1 peut-être ne font pas 100 %", () => {
    const r = s(1, 0, 1);
    expect(r).toEqual({ forme: "fraction", oui: 1, total: 2, mitiges: 1 });
    expect(partDeOui(r)).toBe(0.5);
  });

  it("KPMG : un seul peut-être ne fait pas 0 %", () => {
    const r = s(0, 0, 1);
    expect(r).toEqual({ forme: "partagee", total: 1, mitiges: 1 });
    expect(partDeOui(r)).toBeNull();
  });

  it("aucune réponse : rien n'est affirmé", () => {
    expect(s(0, 0, 0)).toEqual({ forme: "aucune" });
    expect(s(0, 0, 0, 5)).toEqual({ forme: "aucune" });
  });
});

describe("synthetiser — formes", () => {
  it("un unanime franc reste une fraction tant que l'échantillon est petit", () => {
    expect(s(1, 0, 0)).toEqual({ forme: "fraction", oui: 1, total: 1, mitiges: 0 });
    expect(s(3, 0, 0)).toEqual({ forme: "fraction", oui: 3, total: 3, mitiges: 0 });
  });

  it("au seuil, le pourcentage prend le relais", () => {
    expect(s(4, 0, 0)).toEqual({ forme: "pourcentage", pct: 100, total: 4, mitiges: 0 });
    expect(s(3, 1, 0)).toEqual({ forme: "pourcentage", pct: 75, total: 4, mitiges: 0 });
  });

  it("les nuances entrent au dénominateur sans compter comme des oui", () => {
    // 12 oui, 6 peut-être : 12/18, et non 12/12.
    expect(s(12, 0, 6)).toEqual({ forme: "pourcentage", pct: 67, total: 18, mitiges: 6 });
  });

  it("que des nuances, quel qu'en soit le nombre, reste « partagé »", () => {
    expect(s(0, 0, 9)).toEqual({ forme: "partagee", total: 9, mitiges: 9 });
  });

  it("les réponses absentes ne pèsent sur rien", () => {
    expect(s(4, 0, 0, 100)).toEqual({ forme: "pourcentage", pct: 100, total: 4, mitiges: 0 });
  });

  it("une valeur inconnue est traitée comme une nuance, pas ignorée", () => {
    // « ca_depend » pour would_recommend, ou toute valeur ajoutée plus tard.
    const r = synthetiser(["oui", "ca_depend"], "oui", "non");
    expect(r).toEqual({ forme: "fraction", oui: 1, total: 2, mitiges: 1 });
  });

  it("la chaîne vide compte comme une absence de réponse", () => {
    expect(synthetiser(["", "", undefined], "oui", "non")).toEqual({ forme: "aucune" });
  });
});

describe("texteSynthese — ce qui est réellement écrit à l'écran", () => {
  it("les petits nombres restent lisibles", () => {
    expect(texteSynthese(s(1, 0, 1))).toEqual({ valeur: "1/2", detail: "1 mitigé" });
    expect(texteSynthese(s(0, 0, 1))).toEqual({ valeur: "partagé", detail: "1 avis sans réponse tranchée" });
    expect(texteSynthese(s(0, 0, 0))).toEqual({ valeur: "—", detail: null });
    expect(texteSynthese(s(2, 0, 0))).toEqual({ valeur: "2/2", detail: null });
  });

  it("à mille réponses, les milliers sont séparés", () => {
    const r = texteSynthese(s(700, 50, 250));
    expect(r.valeur).toBe("70%");
    // Le séparateur de milliers suisse est l'apostrophe, pas l'espace : c'est
    // « 1'000 » qu'on lit ici, et c'est déjà ce qu'affiche la page d'accueil.
    expect(r.detail).toBe("sur 1'000 avis · 250 mitigés");
    expect(r.detail).not.toContain("1000");
  });

  it("aucun texte ne comporte de mot assez long pour déborder d'un écran étroit", () => {
    // Un conteneur peut renvoyer un texte à la ligne, jamais couper un mot.
    // C'est donc le mot le plus long qui fixe la largeur minimale. Vingt-cinq
    // caractères en 11,5 px font environ 160 px : cela tient dans 320 px.
    for (const cas of [s(1, 0, 1), s(0, 0, 1), s(0, 0, 0), s(700, 50, 250), s(999999, 1, 0)]) {
      const { valeur, detail } = texteSynthese(cas);
      for (const mot of `${valeur} ${detail ?? ""}`.split(/\s+/)) {
        expect(mot.length).toBeLessThanOrEqual(25);
      }
    }
  });

  it("le nombre mis en avant reste court quel que soit le volume", () => {
    // C'est lui qui ne peut pas être renvoyé à la ligne : il doit tenir.
    for (const cas of [s(1, 0, 1), s(3, 0, 0), s(700, 50, 250), s(999999, 1, 0), s(0, 0, 9)]) {
      expect(texteSynthese(cas).valeur.length).toBeLessThanOrEqual(8);
    }
  });

  it("le singulier et le pluriel suivent le compte", () => {
    expect(texteSynthese(s(1, 0, 1)).detail).toBe("1 mitigé");
    expect(texteSynthese(s(4, 0, 2)).detail).toContain("2 mitigés");
  });
});

describe("synthetiser — invariants sur tout le cube", () => {
  const CUBE: { oui: number; non: number; mitiges: number; r: Synthese }[] = [];
  for (let oui = 0; oui <= 6; oui++)
    for (let non = 0; non <= 6; non++)
      for (let mitiges = 0; mitiges <= 6; mitiges++)
        CUBE.push({ oui, non, mitiges, r: s(oui, non, mitiges) });

  it("couvre bien 343 combinaisons", () => {
    expect(CUBE).toHaveLength(343);
  });

  it("100 % n'est annoncé que si personne n'a dit autre chose que oui", () => {
    for (const { oui, non, mitiges, r } of CUBE) {
      if (r.forme === "pourcentage" && r.pct === 100) {
        expect({ non, mitiges }).toEqual({ non: 0, mitiges: 0 });
        expect(oui).toBeGreaterThan(0);
      }
    }
  });

  it("0 % n'est annoncé que si quelqu'un a réellement dit non", () => {
    for (const { oui, non, r } of CUBE) {
      if (r.forme === "pourcentage" && r.pct === 0) {
        expect(oui).toBe(0);
        expect(non).toBeGreaterThan(0);
      }
    }
  });

  it("le taux annoncé ne dépasse jamais la part réelle de oui", () => {
    for (const { oui, non, mitiges, r } of CUBE) {
      const total = oui + non + mitiges;
      if (total === 0) continue;
      const reel = oui / total;
      const part = partDeOui(r);
      if (part === null) continue;
      // Tolérance d'un demi-point : le pourcentage est arrondi à l'entier.
      expect(part).toBeLessThanOrEqual(reel + 0.005);
      expect(part).toBeGreaterThanOrEqual(reel - 0.005);
    }
  });

  it("le total annoncé est toujours le nombre de gens qui ont répondu", () => {
    for (const { oui, non, mitiges, r } of CUBE) {
      if (r.forme === "aucune") {
        expect(oui + non + mitiges).toBe(0);
        continue;
      }
      expect(r.total).toBe(oui + non + mitiges);
      expect(r.mitiges).toBe(mitiges);
    }
  });

  it("une fraction n'est jamais montrée quand un pourcentage serait lisible", () => {
    for (const { r } of CUBE) {
      if (r.forme === "fraction") expect(r.total).toBeLessThan(SEUIL_POURCENTAGE);
      if (r.forme === "pourcentage") expect(r.total).toBeGreaterThanOrEqual(SEUIL_POURCENTAGE);
    }
  });

  it("aucune forme ne prétend à un taux quand personne n'a tranché", () => {
    for (const { oui, non, r } of CUBE) {
      if (oui === 0 && non === 0) {
        expect(r.forme === "aucune" || r.forme === "partagee").toBe(true);
      }
    }
  });
});
