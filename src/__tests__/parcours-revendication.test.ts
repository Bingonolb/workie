import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

/**
 * Demande de gestion d'une fiche : où en est la personne qui revient.
 *
 * Le 26 novembre 2026, une demande acceptée rouvrait un formulaire vide quand
 * la personne revenait par le lien de l'e-mail sans être connectée au bon
 * compte. La page doit toujours la ramener à son étape, ou lui dire avec quel
 * compte se connecter, sans rien révéler à quelqu'un d'autre.
 *
 * Et au retour de Stripe, seule la personne qui a payé peut déclencher
 * l'activation. Si l'un de ces tests tombe, corriger le code, pas le test.
 */

type Ligne = Record<string, unknown>;
const tables: Record<string, Ligne[]> = {};
function requete(nom: string) {
  const filtres: ((l: Ligne) => boolean)[] = [];
  const lignes = () => (tables[nom] ?? []).filter(l => filtres.every(f => f(l)));
  const q = {
    select: () => q,
    eq: (c: string, v: unknown) => { filtres.push(l => l[c] === v); return q; },
    order: () => q, limit: () => q,
    maybeSingle: async () => ({ data: lignes()[0] ?? null, error: null }),
  };
  return q;
}
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: (t: string) => requete(t) }) }));

let utilisateur: { id: string } | null = null;
vi.mock("@/lib/supabase/server", () => ({ getUser: async () => utilisateur, createClient: async () => ({}) }));
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (k: string) => (jar.has(k) ? { value: jar.get(k) } : undefined), set: vi.fn(), delete: vi.fn() }),
  headers: async () => new Map(),
}));
vi.mock("@/lib/email", () => ({ sendCodeRevendication: vi.fn(), sendRevendicationAValider: vi.fn() }));
vi.mock("@/i18n/requete", () => ({ langueRequete: async () => "fr", tRequete: async () => (k: string) => k }));
const activer = vi.fn(async () => "fiche");
vi.mock("@/lib/activationAbonnement", () => ({ activerAbonnementDepuisSession: activer }));
const sessionStripe = { retrieve: vi.fn(), list: vi.fn() };
vi.mock("stripe", () => ({ default: class { checkout = { sessions: sessionStripe }; } }));

const FICHE = "c0000000-0000-4000-8000-000000000001";
const DEMANDE = "d0000000-0000-4000-8000-000000000001";
const PERSONNE = "a0000000-0000-4000-8000-000000000001";
const AUTRE = "a0000000-0000-4000-8000-000000000002";

let rev: typeof import("@/lib/actions/revendication");
beforeAll(async () => { rev = await import("@/lib/actions/revendication"); }, 60_000);

beforeEach(() => {
  utilisateur = null; jar.clear(); activer.mockClear();
  sessionStripe.retrieve.mockReset(); sessionStripe.list.mockReset();
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  tables.companies = [{ id: FICHE, slug: "wevenz-sarl", name: "Wevenz Sàrl", website_url: null, is_subscribed: false }];
  tables.revendications = [{ id: DEMANDE, company_id: FICHE, user_id: PERSONNE, statut: "verifiee", email_pro: "luc.bertrand@exemple.ch", cree_le: "2026-11-26" }];
});

describe("retour sur la page de demande", () => {
  it("connecté au compte de la demande acceptée : l'étape du paiement", async () => {
    utilisateur = { id: PERSONNE };
    expect((await rev.etatRevendication(FICHE)).etape).toBe("paiement");
  });

  it("lien de l'e-mail sans être connecté : demande de connexion, adresse masquée", async () => {
    const e = await rev.etatRevendication(FICHE, DEMANDE);
    expect(e).toMatchObject({ etape: "connexion", autreCompte: false });
    const email = (e as { email: string }).email;
    expect(email).not.toContain("luc.bertrand");
    expect(email.endsWith("@exemple.ch")).toBe(true);
  });

  it("lien de l'e-mail connecté à un autre compte : il faut changer de compte", async () => {
    utilisateur = { id: AUTRE };
    expect(await rev.etatRevendication(FICHE, DEMANDE)).toMatchObject({ etape: "connexion", autreCompte: true });
  });

  it("lien de l'e-mail avec le bon compte : directement le paiement", async () => {
    utilisateur = { id: PERSONNE };
    expect((await rev.etatRevendication(FICHE, DEMANDE)).etape).toBe("paiement");
  });

  it("numéro de demande inconnu ou malformé : le formulaire, sans rien révéler", async () => {
    expect((await rev.etatRevendication(FICHE, "00000000-0000-4000-8000-000000000000")).etape).toBe("formulaire");
    expect((await rev.etatRevendication(FICHE, "pas-un-numero")).etape).toBe("formulaire");
  });

  it("numéro d'une demande pour une autre fiche : ignoré", async () => {
    tables.revendications[0].company_id = "c0000000-0000-4000-8000-000000000999";
    expect((await rev.etatRevendication(FICHE, DEMANDE)).etape).toBe("formulaire");
  });

  it("demande refusée : pas d'écran de connexion, la page normale", async () => {
    tables.revendications[0].statut = "refusee";
    expect((await rev.etatRevendication(FICHE, DEMANDE)).etape).toBe("formulaire");
  });

  it("fiche déjà gérée : personne ne peut la redemander", async () => {
    tables.companies[0].is_subscribed = true;
    expect((await rev.etatRevendication(FICHE, DEMANDE)).etape).toBe("deja_geree");
  });
});

describe("retour de paiement", () => {
  it("sans compte connecté, rien n'est activé", async () => {
    expect((await rev.confirmerPaiement("cs_live_abcdefghijkl")).ok).toBe(false);
    expect(activer).not.toHaveBeenCalled();
  });

  it("la session d'un autre compte n'active rien", async () => {
    utilisateur = { id: AUTRE };
    sessionStripe.retrieve.mockResolvedValue({ id: "cs_1", mode: "subscription", status: "complete", metadata: { user_id: PERSONNE } });
    expect((await rev.confirmerPaiement("cs_live_abcdefghijkl")).ok).toBe(false);
    expect(activer).not.toHaveBeenCalled();
  });

  it("la session de la personne connectée active son abonnement", async () => {
    utilisateur = { id: PERSONNE };
    sessionStripe.retrieve.mockResolvedValue({ id: "cs_1", mode: "subscription", status: "complete", metadata: { user_id: PERSONNE } });
    expect((await rev.confirmerPaiement("cs_live_abcdefghijkl")).ok).toBe(true);
    expect(activer).toHaveBeenCalledTimes(1);
  });

  it("adresse de retour perdue : le paiement de la personne est retrouvé, pas celui d'un autre", async () => {
    utilisateur = { id: PERSONNE };
    sessionStripe.list.mockResolvedValue({ data: [
      { id: "cs_autre", mode: "subscription", status: "complete", metadata: { user_id: AUTRE } },
      { id: "cs_sien", mode: "subscription", status: "complete", metadata: { user_id: PERSONNE } },
    ] });
    expect((await rev.confirmerPaiement("")).ok).toBe(true);
    expect(activer).toHaveBeenCalledTimes(1);
    expect((activer.mock.calls[0] as unknown[])[1]).toMatchObject({ id: "cs_sien" });
  });
});
