import { revaliderPage } from "@/lib/revaliderPage";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAbonnementActif } from "@/lib/email";
import { creerFicheDepuisDemande } from "@/lib/creationFiche";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[webhook] Stripe env vars missing");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Le pass penalite n'existe plus.
        //
        // La route qui creait la session est supprimee, donc plus aucune ne
        // peut arriver ici. La branche qui creditait le compte part avec : un
        // encaissement sans produit est le genre de code qu'on retrouve un
        // jour en production, paye par quelqu'un.

        // Paiement d'une campagne : elle part en diffusion immédiatement.
        //
        // Elle passait auparavant en « pending », c'est-à-dire en attente d'une
        // relecture humaine sans date annoncée. L'annonceur payait puis
        // attendait, ce qui est le meilleur moyen de le perdre. Le risque qui
        // justifiait ce blocage, une image inacceptable, se traite après coup :
        // deux signalements distincts mettent l'annonce en pause et préviennent
        // l'administration.
        if (session.mode === "payment" && session.metadata?.type === "ad_campaign") {
          const campaignId = session.metadata.campaign_id ?? session.client_reference_id;
          if (campaignId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("ad_campaigns") as any).update({
              status: "active",
              stripe_session_id: session.id,
              paid_at: new Date().toISOString(),
            }).eq("id", campaignId).eq("status", "payment_pending");
            if (error) console.error("[webhook] ad_campaign payment update failed:", error.message);
          }
          break;
        }

        // Abonnement entreprise : la revendication vérifiée devient active.
        if (session.mode !== "subscription") break;
        const revId = session.metadata?.revendication_id;
        const userId = session.metadata?.user_id;
        let companyId = session.client_reference_id;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let sub = await stripe.subscriptions.retrieve(session.subscription as string) as any;

        // Création d'entreprise : la fiche naît maintenant, payée. L'abonnement
        // reçoit son identifiant, pour que renouvellements et résiliation la
        // retrouvent ensuite.
        if (session.metadata?.type === "creation_entreprise") {
          companyId = revId && userId ? await creerFicheDepuisDemande(revId, userId) : null;
          if (!companyId) {
            console.error("[webhook] creation: fiche introuvable pour la demande", revId);
            break;
          }
          sub = await stripe.subscriptions.update(sub.id, { metadata: { ...sub.metadata, company_id: companyId } });
        }
        if (!companyId) break;
        const periodEnd: number = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? 0;
        const endsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

        const { error: subErr } = await supabase.from("companies").update({
          is_subscribed: true,
          is_verified: true,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id: sub.id,
          subscription_ends_at: endsAt,
          subscription_cancel_at_period_end: false,
        }).eq("id", companyId);
        if (subErr) console.error("[webhook] subscription activate failed:", subErr.message);

        if (revId && userId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const revs = supabase.from("revendications" as any) as any;
          const { data: rev } = await revs.select("prenom, email_pro, user_id, company_id")
            .eq("id", revId).maybeSingle();
          if (rev && rev.user_id === userId && rev.company_id === companyId) {
            await revs.update({ statut: "active", activee_le: new Date().toISOString() }).eq("id", revId);
            await supabase.from("profiles").update({ claimed_company_id: companyId }).eq("id", userId);
            const { data: c } = await supabase.from("companies").select("name").eq("id", companyId).maybeSingle();
            await sendAbonnementActif(rev.email_pro, rev.prenom, c?.name ?? "votre entreprise");
          }
        }
        break;
      }
      case "customer.subscription.updated": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const companyId = sub.metadata?.company_id;
        if (!companyId) break;

        const active = sub.status === "active" || sub.status === "trialing";
        const periodEnd: number = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? 0;
        const endsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

        const { error } = await supabase.from("companies").update({
          is_subscribed: active,
          stripe_subscription_id: sub.id,
          subscription_ends_at: endsAt,
          subscription_cancel_at_period_end: sub.cancel_at_period_end ?? false,
        }).eq("id", companyId);
        if (error) console.error("[webhook] subscription.updated failed:", error.message);
        break;
      }

      case "customer.subscription.deleted": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const companyId = sub.metadata?.company_id;
        if (!companyId) break;

        const { error } = await supabase.from("companies").update({
          is_subscribed: false,
          // Le badge dit « tenue par l'entreprise » : il part avec l'abonnement.
          is_verified: false,
          stripe_subscription_id: null,
          subscription_ends_at: null,
        }).eq("id", companyId);
        if (error) console.error("[webhook] subscription.deleted failed:", error.message);

        // L'accès se ferme : la revendication s'arrête et le compte est délié.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const revs = supabase.from("revendications" as any) as any;
        await revs.update({ statut: "annulee" }).eq("company_id", companyId).eq("statut", "active");
        await supabase.from("profiles").update({ claimed_company_id: null }).eq("claimed_company_id", companyId);
        break;
      }
    }
    // Badge et fiche publique : sans ceci, ils restaient figés dans le cache
    // jusqu'à la prochaine invalidation, après un abonnement comme après une
    // résiliation. Événements rares, coût négligeable.
    if (event.type.startsWith("customer.subscription.") || event.type === "checkout.session.completed") {
      revalidateTag("companies", {});
      revaliderPage("/entreprise/[slug]", "page");
    }
  } catch (e) {
    console.error("[webhook] handler error:", e);
    // Return 200 to Stripe anyway — avoid infinite retries for non-retriable errors
  }

  return NextResponse.json({ received: true });
}
