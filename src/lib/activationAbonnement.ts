import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAbonnementActif } from "@/lib/email";
import { creerFicheDepuisDemande } from "@/lib/creationFiche";

/**
 * Active l'abonnement entreprise d'une session Stripe payée.
 *
 * Appelée par deux chemins, qui peuvent se croiser : le webhook de Stripe, et
 * la page de retour après paiement (qui interroge Stripe elle-même pour ne pas
 * laisser un client qui vient de payer devant une page d'attente). L'opération
 * est donc idempotente : la demande ne passe à « active » qu'une fois, et seul
 * ce passage envoie l'e-mail de confirmation.
 *
 * Rend l'identifiant de la fiche activée, ou null si la session ne correspond
 * à rien d'activable.
 */
export async function activerAbonnementDepuisSession(stripe: Stripe, session: Stripe.Checkout.Session): Promise<string | null> {
  if (session.mode !== "subscription" || !session.subscription) return null;
  // Payée, ou sans montant dû (essai) : rien d'autre n'ouvre l'espace.
  if (session.status !== "complete" || (session.payment_status !== "paid" && session.payment_status !== "no_payment_required")) return null;

  const supabase = createAdminClient();
  const revId = session.metadata?.revendication_id;
  const userId = session.metadata?.user_id;
  let companyId = session.client_reference_id;

  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sub = await stripe.subscriptions.retrieve(subId) as any;

  // Création d'entreprise : la fiche naît maintenant, payée, une seule fois.
  if (session.metadata?.type === "creation_entreprise") {
    companyId = sub.metadata?.company_id || (revId && userId ? await creerFicheDepuisDemande(revId, userId) : null);
    if (!companyId) {
      console.error("[abonnement] création : fiche introuvable pour la demande", revId);
      return null;
    }
    if (sub.metadata?.company_id !== companyId) {
      sub = await stripe.subscriptions.update(sub.id, { metadata: { ...sub.metadata, company_id: companyId } });
    }
  }
  if (!companyId) return null;

  const periodEnd: number = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? 0;
  const { error: subErr } = await supabase.from("companies").update({
    is_subscribed: true,
    is_verified: true,
    stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
    stripe_subscription_id: sub.id,
    subscription_ends_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    subscription_cancel_at_period_end: false,
  }).eq("id", companyId);
  if (subErr) console.error("[abonnement] activation échouée :", subErr.message);

  if (revId && userId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const revs = supabase.from("revendications" as any) as any;
    const { data: rev } = await revs.select("prenom, email_pro, user_id, company_id, langue, statut").eq("id", revId).maybeSingle();
    if (rev && rev.user_id === userId && (rev.company_id === companyId || session.metadata?.type === "creation_entreprise")) {
      await supabase.from("profiles").update({ claimed_company_id: companyId }).eq("id", userId);
      // Le passage à « active » ne réussit qu'une fois : il décide de l'e-mail.
      const { data: passee } = await revs.update({ statut: "active", activee_le: new Date().toISOString() })
        .eq("id", revId).neq("statut", "active").select("id");
      if (passee?.length) {
        const { data: c } = await supabase.from("companies").select("name").eq("id", companyId).maybeSingle();
        await sendAbonnementActif(rev.email_pro, rev.prenom, c?.name ?? "Workie", rev.langue);
      }
    }
  }
  return companyId;
}

/**
 * Paiement d'une campagne : elle part en diffusion. Même double chemin que
 * l'abonnement (webhook et retour de paiement), même idempotence : seule une
 * campagne encore « à payer » change d'état.
 */
export async function activerCampagneDepuisSession(session: Stripe.Checkout.Session, userId?: string): Promise<boolean> {
  if (session.mode !== "payment" || session.metadata?.type !== "ad_campaign" || session.payment_status !== "paid") return false;
  const campaignId = session.metadata.campaign_id ?? session.client_reference_id;
  if (!campaignId) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (createAdminClient().from("ad_campaigns") as any).update({
    status: "active", stripe_session_id: session.id, paid_at: new Date().toISOString(),
  }).eq("id", campaignId).eq("status", "payment_pending");
  if (userId) q = q.eq("user_id", userId);
  const { error } = await q;
  if (error) console.error("[campagne] activation échouée :", error.message);
  return !error;
}
