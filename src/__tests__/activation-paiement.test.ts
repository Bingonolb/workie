import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

/**
 * Activation après paiement : abonnement entreprise et campagne publicitaire.
 *
 * Le 26 novembre 2026, un vrai paiement est passé sans que l'espace entreprise
 * ne s'ouvre : l'avis de Stripe était refusé (clé de signature différente) et
 * rien d'autre n'activait l'abonnement. Depuis, deux chemins appellent la même
 * activation : le webhook et le retour de paiement. Ces tests gardent ses
 * règles. Si l'un tombe, corriger le code, pas le test.
 *
 *  - une session non payée n'active rien ;
 *  - une session payée active la fiche, lie le compte, passe la demande à
 *    « active » et envoie UN e-mail, même si les deux chemins se croisent ;
 *  - une session au nom d'un autre compte n'active rien depuis le retour de
 *    paiement ;
 *  - une campagne ne passe en diffusion que si elle était « à payer ».
 */

// ── Base en mémoire : juste ce que l'activation utilise ─────────────────────
type Ligne = Record<string, unknown>;
const tables: Record<string, Ligne[]> = {};
function requete(nom: string) {
  const filtres: ((l: Ligne) => boolean)[] = [];
  let maj: Ligne | null = null;
  const lignes = () => (tables[nom] ?? []).filter(l => filtres.every(f => f(l)));
  const q = {
    select: () => q,
    update: (v: Ligne) => { maj = v; return q; },
    eq: (c: string, v: unknown) => { filtres.push(l => l[c] === v); return q; },
    neq: (c: string, v: unknown) => { filtres.push(l => l[c] !== v); return q; },
    maybeSingle: async () => ({ data: lignes()[0] ?? null, error: null }),
    then: (ok: (r: { data: Ligne[]; error: null }) => unknown) => {
      const touchees = lignes();
      if (maj) for (const l of touchees) Object.assign(l, maj);
      return Promise.resolve({ data: touchees.map(l => ({ ...l })), error: null }).then(ok);
    },
  };
  return q;
}
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: (t: string) => requete(t) }) }));

const envoyerEmail = vi.fn(async () => {});
vi.mock("@/lib/email", () => ({ sendAbonnementActif: envoyerEmail }));
vi.mock("@/lib/creationFiche", () => ({ creerFicheDepuisDemande: vi.fn(async () => null) }));

const FICHE = "c0000000-0000-4000-8000-000000000001";
const DEMANDE = "d0000000-0000-4000-8000-000000000001";
const PERSONNE = "u0000000-0000-4000-8000-000000000001";
const AUTRE = "u0000000-0000-4000-8000-000000000002";

const stripe = {
  subscriptions: {
    retrieve: vi.fn(async () => ({ id: "sub_1", metadata: {}, current_period_end: 1_900_000_000 })),
    update: vi.fn(),
    cancel: vi.fn(async () => ({})),
  },
} as never;

function sessionAbonnement(champs: Record<string, unknown> = {}) {
  return {
    id: "cs_live_test", mode: "subscription", status: "complete", payment_status: "paid",
    subscription: "sub_1", customer: "cus_1", client_reference_id: FICHE,
    metadata: { type: "abonnement_entreprise", company_id: FICHE, revendication_id: DEMANDE, user_id: PERSONNE },
    ...champs,
  } as never;
}

let activer: typeof import("@/lib/activationAbonnement");
beforeAll(async () => { activer = await import("@/lib/activationAbonnement"); }, 60_000);

beforeEach(() => {
  envoyerEmail.mockClear();
  tables.companies = [{ id: FICHE, name: "Wevenz Sàrl", is_subscribed: false }];
  tables.revendications = [{ id: DEMANDE, user_id: PERSONNE, company_id: FICHE, statut: "verifiee", prenom: "Luc", email_pro: "luc@exemple.ch", langue: "fr" }];
  tables.profiles = [{ id: PERSONNE, claimed_company_id: null }];
  tables.ad_campaigns = [{ id: "camp-1", user_id: PERSONNE, status: "payment_pending" }];
});

describe("abonnement entreprise", () => {
  it("n'active rien tant que la session n'est pas payée", async () => {
    const r = await activer.activerAbonnementDepuisSession(stripe, sessionAbonnement({ payment_status: "unpaid" }));
    expect(r).toBeNull();
    expect(tables.companies[0].is_subscribed).toBe(false);
    expect(envoyerEmail).not.toHaveBeenCalled();
  });

  it("n'active rien pour une session pas terminée", async () => {
    const r = await activer.activerAbonnementDepuisSession(stripe, sessionAbonnement({ status: "open" }));
    expect(r).toBeNull();
    expect(tables.revendications[0].statut).toBe("verifiee");
  });

  it("active la fiche, lie le compte et passe la demande à « active »", async () => {
    const r = await activer.activerAbonnementDepuisSession(stripe, sessionAbonnement());
    expect(r).toBe(FICHE);
    expect(tables.companies[0]).toMatchObject({ is_subscribed: true, stripe_subscription_id: "sub_1", stripe_customer_id: "cus_1" });
    expect(tables.profiles[0].claimed_company_id).toBe(FICHE);
    expect(tables.revendications[0].statut).toBe("active");
    expect(envoyerEmail).toHaveBeenCalledTimes(1);
  });

  it("n'envoie qu'un e-mail quand le webhook et le retour de paiement se croisent", async () => {
    await activer.activerAbonnementDepuisSession(stripe, sessionAbonnement());
    await activer.activerAbonnementDepuisSession(stripe, sessionAbonnement());
    expect(envoyerEmail).toHaveBeenCalledTimes(1);
    expect(tables.companies[0].is_subscribed).toBe(true);
  });

  it("résilie un second abonnement sur une fiche déjà abonnée", async () => {
    tables.companies[0] = { ...tables.companies[0], is_subscribed: true, stripe_subscription_id: "sub_premier" };
    await activer.activerAbonnementDepuisSession(stripe, sessionAbonnement());
    expect((stripe as unknown as { subscriptions: { cancel: ReturnType<typeof vi.fn> } }).subscriptions.cancel).toHaveBeenCalledWith("sub_1");
    expect(tables.companies[0].stripe_subscription_id).toBe("sub_premier");
    expect(envoyerEmail).not.toHaveBeenCalled();
  });

  it("ne lie pas un compte qui n'est pas celui de la demande", async () => {
    await activer.activerAbonnementDepuisSession(stripe, sessionAbonnement({
      metadata: { type: "abonnement_entreprise", revendication_id: DEMANDE, user_id: AUTRE },
    }));
    expect(tables.profiles[0].claimed_company_id).toBeNull();
    expect(tables.revendications[0].statut).toBe("verifiee");
    expect(envoyerEmail).not.toHaveBeenCalled();
  });
});

describe("campagne publicitaire", () => {
  it("ne diffuse pas une campagne non payée", async () => {
    const ok = await activer.activerCampagneDepuisSession({ mode: "payment", payment_status: "unpaid", metadata: { type: "ad_campaign", campaign_id: "camp-1" } } as never);
    expect(ok).toBe(false);
    expect(tables.ad_campaigns[0].status).toBe("payment_pending");
  });

  it("diffuse une campagne payée par son auteur", async () => {
    await activer.activerCampagneDepuisSession({ id: "cs_1", mode: "payment", payment_status: "paid", metadata: { type: "ad_campaign", campaign_id: "camp-1" } } as never, PERSONNE);
    expect(tables.ad_campaigns[0]).toMatchObject({ status: "active", stripe_session_id: "cs_1" });
  });

  it("ne touche pas la campagne d'un autre compte depuis le retour de paiement", async () => {
    await activer.activerCampagneDepuisSession({ id: "cs_1", mode: "payment", payment_status: "paid", metadata: { type: "ad_campaign", campaign_id: "camp-1" } } as never, AUTRE);
    expect(tables.ad_campaigns[0].status).toBe("payment_pending");
  });

  it("ne remet pas en diffusion une campagne déjà arrêtée", async () => {
    tables.ad_campaigns[0].status = "paused";
    await activer.activerCampagneDepuisSession({ id: "cs_1", mode: "payment", payment_status: "paid", metadata: { type: "ad_campaign", campaign_id: "camp-1" } } as never);
    expect(tables.ad_campaigns[0].status).toBe("paused");
  });
});
