import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

/**
 * Offres enregistrées (signet) : cloisonnement et robustesse.
 *
 * Mêmes exigences que pour les autres données personnelles (voir
 * cloisonnement-comptes.test.ts) : la route ne se met jamais en cache et
 * déclare son destinataire, et le navigateur refuse une réponse adressée à un
 * autre compte. Si l'un de ces tests tombe, corriger le code, pas le test.
 */

// ── Environnement navigateur minimal ────────────────────────────────────────
let cookie = "";
const stockage = new Map<string, string>();
let stockageEnPanne = false;
vi.stubGlobal("document", { get cookie() { return cookie; } });
vi.stubGlobal("window", { addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() });
vi.stubGlobal("localStorage", {
  getItem: (k: string) => { if (stockageEnPanne) throw new Error("refusé"); return stockage.get(k) ?? null; },
  setItem: (k: string, v: string) => { if (stockageEnPanne) throw new Error("refusé"); stockage.set(k, v); },
  removeItem: (k: string) => { stockage.delete(k); },
});

function connecter(sub: string | null) {
  if (sub === null) { cookie = ""; return; }
  const charge = Buffer.from(JSON.stringify({ sub })).toString("base64url");
  const valeur = Buffer.from(JSON.stringify({ access_token: `e.${charge}.s` })).toString("base64");
  cookie = `sb-projet-auth-token=base64-${valeur}`;
}

const actions = { enregistrerOffre: vi.fn(), retirerOffre: vi.fn(), importerOffresAppareil: vi.fn() };
vi.mock("@/lib/actions/offresEnregistrees", () => actions);

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

async function magasin() {
  vi.resetModules();
  return import("@/lib/offresEnregistrees");
}
function repondre(statut: number, corps: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ status: statut, ok: statut >= 200 && statut < 300, json: async () => corps })));
}

describe("signets : magasin du navigateur", () => {
  // Premier chargement (compilation) fait à part : quand toute la suite tourne
  // en parallèle, il dépassait les 5 s du premier test, qui échouait au hasard.
  beforeAll(async () => { await import("@/lib/offresEnregistrees"); }, 60_000);
  beforeEach(() => {
    cookie = ""; stockage.clear(); stockageEnPanne = false;
    for (const f of Object.values(actions)) f.mockReset();
  });

  it("charge la liste du compte quand la réponse lui est adressée", async () => {
    connecter("compte-A");
    repondre(200, { compte: "compte-A", ids: [ID_A] });
    const m = await magasin();
    await m.chargerSignets();
    expect(m.lireSignets().mode).toBe("compte");
    expect([...m.lireSignets().ids]).toEqual([ID_A]);
  });

  it("ignore une réponse adressée à un autre compte", async () => {
    connecter("compte-A");
    repondre(200, { compte: "compte-B", ids: [ID_A] });
    const m = await magasin();
    await m.chargerSignets();
    expect(m.lireSignets().mode).toBe("inconnu");
    expect(m.lireSignets().ids.size).toBe(0);
  });

  it("ignore une réponse quand aucun compte n'est identifiable", async () => {
    connecter(null);
    repondre(200, { compte: "compte-A", ids: [ID_A] });
    const m = await magasin();
    await m.chargerSignets();
    expect(m.lireSignets().ids.size).toBe(0);
  });

  it("sans session, passe en mode visiteur (signets sur l'appareil)", async () => {
    repondre(401, { authentifie: false });
    const m = await magasin();
    await m.chargerSignets();
    expect(m.lireSignets().mode).toBe("appareil");
    await m.poserSignet(ID_A, true);
    expect(m.idsOffresAppareil()).toEqual([ID_A]);
    expect(actions.enregistrerOffre).not.toHaveBeenCalled();
  });

  it("annule le geste si le serveur le refuse", async () => {
    connecter("compte-A");
    repondre(200, { compte: "compte-A", ids: [] });
    const m = await magasin();
    await m.chargerSignets();
    actions.enregistrerOffre.mockResolvedValue(false);
    await m.poserSignet(ID_A, true);
    expect(m.lireSignets().ids.has(ID_A)).toBe(false);
  });

  it("garde le geste si le serveur l'accepte, et retire par une intention explicite", async () => {
    connecter("compte-A");
    repondre(200, { compte: "compte-A", ids: [ID_B] });
    const m = await magasin();
    await m.chargerSignets();
    actions.enregistrerOffre.mockResolvedValue(true);
    actions.retirerOffre.mockResolvedValue(true);
    await m.poserSignet(ID_A, true);
    await m.poserSignet(ID_B, false);
    expect([...m.lireSignets().ids]).toEqual([ID_A]);
    expect(actions.retirerOffre).toHaveBeenCalledWith(ID_B);
  });

  it("reprend dans le compte les offres gardées comme visiteur", async () => {
    stockage.set("workie_offres_appareil_v1", JSON.stringify([ID_A]));
    connecter("compte-A");
    repondre(200, { compte: "compte-A", ids: [] });
    actions.importerOffresAppareil.mockResolvedValue({ ajoutees: 1 });
    const m = await magasin();
    await m.chargerSignets();
    expect(actions.importerOffresAppareil).toHaveBeenCalledWith([ID_A]);
    expect(m.lireSignets().ids.has(ID_A)).toBe(true);
    expect(stockage.has("workie_offres_appareil_v1")).toBe(false);
  });

  it("un stockage refusé n'empêche rien (mémoire de la visite)", async () => {
    stockageEnPanne = true;
    repondre(401, {});
    const m = await magasin();
    await m.chargerSignets();
    await m.poserSignet(ID_A, true);
    expect(m.idsOffresAppareil()).toEqual([ID_A]);
  });

  it("n'accepte que des identifiants d'offre valides", async () => {
    repondre(401, {});
    const m = await magasin();
    await m.chargerSignets();
    await m.poserSignet("pas-un-uuid", true);
    expect(m.idsOffresAppareil()).toEqual([]);
  });
});

// ── Route privée ────────────────────────────────────────────────────────────
const serveur = { user: null as null | { id: string }, lignes: [] as { job_offer_id: string }[] };
vi.mock("@/lib/supabase/server", () => ({
  getUser: async () => serveur.user,
  createClient: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: serveur.lignes, error: null }) }) }) }),
  }),
}));
vi.mock("@/lib/offresAffichage", () => ({ offresParIds: async (ids: string[]) => ids.map(id => ({ id })) }));

describe("signets : route privée", () => {
  beforeEach(() => { serveur.user = null; serveur.lignes = []; });

  it("répond 401 sans session, jamais une liste vide", async () => {
    const { GET } = await import("@/app/api/user/offres-enregistrees/route");
    const r = await GET();
    expect(r.status).toBe(401);
    expect(r.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("déclare son destinataire et ne se met jamais en cache", async () => {
    serveur.user = { id: "compte-A" };
    serveur.lignes = [{ job_offer_id: ID_A }];
    const { GET } = await import("@/app/api/user/offres-enregistrees/route");
    const r = await GET();
    const corps = await r.json();
    expect(corps.compte).toBe("compte-A");
    expect(corps.ids).toEqual([ID_A]);
    expect(r.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
