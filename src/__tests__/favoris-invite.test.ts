import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

/**
 * Favoris d'un visiteur sans compte, gardés dans le navigateur.
 * Promesses : jamais d'erreur (stockage cassé, contenu illisible), jamais de
 * doublon, seulement des identifiants valides, et un plafond.
 * Si un test tombe, corriger le module, jamais le test.
 */

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const CLE = "workie_favoris_invite_v1";

function stockage(initial: Record<string, string> = {}, casse = false) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => { if (casse) throw new Error("bloqué"); return m.get(k) ?? null; },
    setItem: (k: string, v: string) => { if (casse) throw new Error("bloqué"); m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
    m,
  };
}

async function charger(s: ReturnType<typeof stockage>) {
  vi.resetModules();
  const evenements: string[] = [];
  vi.stubGlobal("window", { dispatchEvent: (e: Event) => evenements.push(e.type), addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal("localStorage", s);
  const mod = await import("@/lib/favorisInvite");
  return { mod, evenements };
}

describe("favoris de visiteur", () => {
  // Premier chargement (compilation) fait à part : en parallèle avec toute la
  // suite, il pouvait dépasser les 5 s du premier test.
  beforeAll(async () => { await import("@/lib/favorisInvite"); }, 60_000);
  beforeEach(() => { vi.unstubAllGlobals(); });

  it("ajoute, bascule et retire, sans doublon, le plus récent en tête", async () => {
    const s = stockage();
    const { mod } = await charger(s);
    mod.ajouterFavoriInvite(A);
    mod.ajouterFavoriInvite(B);
    mod.ajouterFavoriInvite(A);
    expect(mod.idsFavorisInvite()).toEqual([A, B]);
    expect(mod.basculerFavoriInvite(B)).toBe(false);
    expect(mod.idsFavorisInvite()).toEqual([A]);
    expect(JSON.parse(s.m.get(CLE)!)).toEqual([A]);
  });

  it("ignore un identifiant invalide", async () => {
    const { mod } = await charger(stockage());
    expect(mod.ajouterFavoriInvite("pas-un-uuid")).toBe(false);
    expect(mod.ajouterFavoriInvite("<script>")).toBe(false);
    expect(mod.idsFavorisInvite()).toEqual([]);
  });

  it("un contenu illisible ou d'un autre format est ignoré, sans erreur", async () => {
    for (const brut of ["{pas du json", '{"a":1}', '[1, null, "x", "' + A + '"]']) {
      const { mod } = await charger(stockage({ [CLE]: brut }));
      expect(() => mod.idsFavorisInvite()).not.toThrow();
      expect(mod.idsFavorisInvite()).toEqual(brut.includes(A) ? [A] : []);
    }
  });

  it("stockage bloqué (navigation privée) : fonctionne en mémoire le temps de la visite", async () => {
    const { mod } = await charger(stockage({}, true));
    expect(() => mod.ajouterFavoriInvite(A)).not.toThrow();
    expect(mod.estFavoriInvite(A)).toBe(true);
  });

  it("plafonné à 300", async () => {
    const { mod } = await charger(stockage());
    for (let i = 0; i < 320; i++) mod.ajouterFavoriInvite(`00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    expect(mod.idsFavorisInvite().length).toBe(300);
  });

  it("vider efface tout et prévient l'interface", async () => {
    const s = stockage();
    const { mod, evenements } = await charger(s);
    mod.ajouterFavoriInvite(A);
    mod.viderFavorisInvite();
    expect(mod.idsFavorisInvite()).toEqual([]);
    expect(s.m.has(CLE)).toBe(false);
    expect(evenements.length).toBeGreaterThanOrEqual(2);
  });
});
