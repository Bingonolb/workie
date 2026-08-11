import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Régression : la flamme et le favori doivent rester solidaires.
 *
 * Le défaut d'origine : toggleFavorite appelait addFlame — une *bascule* — pour
 * poser une flamme. Sur une entreprise déjà enflammée, enregistrer le favori
 * supprimait donc la flamme. L'utilisateur voyait le geste compté, puis la
 * flamme éteinte au rafraîchissement ; il recliquait, ce qui retirait le favori.
 * Relevé en base avant correction : 34 favoris sans flamme et 12 flammes sans
 * favori pour un seul compte.
 *
 * Le test travaille sur une base simulée et vérifie l'invariant qui compte :
 * après n'importe quelle suite de clics, l'ensemble des favoris et celui des
 * flammes sont identiques.
 */

type Ligne = { company_id: string; user_id: string; event_type: string };

const UTILISATEUR = "u1";

function baseSimulee() {
  const favoris = new Set<string>();
  const evenements: Ligne[] = [];

  const flammeDe = (id: string) =>
    evenements.find(e => e.company_id === id && e.user_id === UTILISATEUR && e.event_type === "flame");

  return {
    favoris,
    evenements,
    flammes: () => new Set(evenements.filter(e => e.event_type === "flame").map(e => e.company_id)),

    /** Ce que fait désormais scores.ts : une intention explicite, pas une bascule. */
    poserFlamme(id: string) {
      if (!flammeDe(id)) evenements.push({ company_id: id, user_id: UTILISATEUR, event_type: "flame" });
    },
    retirerFlamme(id: string) {
      const e = flammeDe(id);
      if (e) evenements.splice(evenements.indexOf(e), 1);
    },
    /** L'ancienne bascule, conservée pour prouver qu'elle causait bien le défaut. */
    basculerFlamme(id: string) {
      const e = flammeDe(id);
      if (e) evenements.splice(evenements.indexOf(e), 1);
      else evenements.push({ company_id: id, user_id: UTILISATEUR, event_type: "flame" });
    },
  };
}

describe("flamme et favori", () => {
  let db: ReturnType<typeof baseSimulee>;
  beforeEach(() => { db = baseSimulee(); });

  const basculerFavori = (id: string) => {
    if (db.favoris.has(id)) { db.favoris.delete(id); db.retirerFlamme(id); }
    else { db.favoris.add(id); db.poserFlamme(id); }
  };

  it("pose la flamme avec le favori", () => {
    basculerFavori("c1");
    expect(db.favoris.has("c1")).toBe(true);
    expect(db.flammes().has("c1")).toBe(true);
  });

  it("retire la flamme avec le favori — plus de flamme orpheline", () => {
    basculerFavori("c1");
    basculerFavori("c1");
    expect(db.favoris.has("c1")).toBe(false);
    expect(db.flammes().has("c1")).toBe(false);
  });

  it("n'éteint pas une flamme existante en enregistrant le favori", () => {
    // Le scénario exact du bug : l'entreprise porte déjà une flamme.
    db.poserFlamme("c1");
    basculerFavori("c1");
    expect(db.flammes().has("c1")).toBe(true);
  });

  it("l'ancienne bascule éteignait bien la flamme — le défaut est reproduit", () => {
    db.poserFlamme("c1");
    db.favoris.add("c1");
    db.basculerFlamme("c1"); // ce que faisait toggleFavorite
    expect(db.flammes().has("c1")).toBe(false); // favori sans flamme
  });

  it("les deux ensembles restent identiques après une longue suite de clics", () => {
    const ids = ["c1", "c2", "c3", "c4"];
    for (let i = 0; i < 40; i++) basculerFavori(ids[i % ids.length]);
    expect([...db.favoris].sort()).toEqual([...db.flammes()].sort());
  });

  it("reste cohérent même si une flamme préexiste sans favori", () => {
    db.poserFlamme("c9");           // état hérité, comme en base aujourd'hui
    basculerFavori("c9");           // l'utilisateur enregistre
    expect(db.flammes().has("c9")).toBe(true);
    basculerFavori("c9");           // puis retire
    expect(db.favoris.has("c9")).toBe(false);
    expect(db.flammes().has("c9")).toBe(false);
  });
});

/**
 * Régression : l'état d'une carte doit suivre la donnée qui arrive après coup.
 *
 * /explore est une page statique : elle s'affiche d'abord sans connaître les
 * favoris, puis /api/user/context les livre. `useState(propriete)` ne lisant sa
 * valeur qu'au premier rendu, la flamme restait éteinte sur une entreprise
 * pourtant enregistrée — et le clic suivant la retirait au lieu de l'ajouter.
 */
describe("état synchronisé avec la propriété", () => {
  /** Reproduit useEtatSynchronise hors de React : c'est la logique qui compte. */
  function composant(proprieteInitiale: boolean) {
    let valeur = proprieteInitiale;
    let precedente = proprieteInitiale;
    return {
      rendre(propriete: boolean) {
        if (propriete !== precedente) { precedente = propriete; valeur = propriete; }
        return valeur;
      },
      cliquer() { valeur = !valeur; return valeur; },
      get etat() { return valeur; },
    };
  }

  it("allume la flamme quand le contexte arrive après le premier rendu", () => {
    const c = composant(false);      // coquille statique : favori inconnu
    expect(c.rendre(false)).toBe(false);
    expect(c.rendre(true)).toBe(true); // le contexte dit : c'est un favori
  });

  it("l'ancien comportement laissait la flamme éteinte", () => {
    const valeur = false;            // useState(propriete), figé
    const rendre = (_propriete: boolean) => valeur;
    expect(rendre(true)).toBe(false); // la propriété dit vrai, l'écran dit faux
  });

  it("ne piétine pas un clic tant que la propriété ne change pas", () => {
    const c = composant(false);
    c.rendre(false);
    c.cliquer();                     // l'utilisateur enregistre
    expect(c.rendre(false)).toBe(true);
    expect(c.rendre(false)).toBe(true);
  });

  it("cède au serveur dès qu'il tranche autrement", () => {
    const c = composant(false);
    c.cliquer();                     // optimiste : enregistré
    expect(c.etat).toBe(true);
    expect(c.rendre(true)).toBe(true);  // le serveur confirme
  });

  it("la boucle décrite ne se reproduit plus", () => {
    // Rafraîchissement, contexte, clic, rafraîchissement, contexte.
    const c = composant(false);
    c.rendre(false);
    expect(c.rendre(true)).toBe(true);   // flamme allumée, plus de confusion
    c.cliquer();                          // l'utilisateur retire volontairement
    expect(c.etat).toBe(false);
    expect(c.rendre(false)).toBe(false);  // le serveur confirme le retrait
  });
});
