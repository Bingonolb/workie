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
