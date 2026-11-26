import { NextResponse } from "next/server";
import Stripe from "stripe";
import { SITE_URL } from "@/lib/siteUrl";
import { getUser, createClient } from "@/lib/supabase/server";
import { tRequete, langueRequete } from "@/i18n/requete";

export async function POST(request: Request) {
  const baseUrl = SITE_URL;

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: (await tRequete())("pubs.eStripe") }, { status: 500 });
    }

    const user = await getUser();
    if (!user) return NextResponse.json({ error: (await tRequete())("pubs.eAuth") }, { status: 401 });

    const { campaign_id } = await request.json() as { campaign_id?: string };
    if (!campaign_id) return NextResponse.json({ error: "campaign_id requis" }, { status: 400 });

    const supabase = await createClient();

    const { data: campaign } = await supabase
      .from("ad_campaigns")
      .select("id, headline, total_budget_chf, status, user_id")
      .eq("id", campaign_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!campaign) return NextResponse.json({ error: (await tRequete())("pubs.eIntrouvable2") }, { status: 404 });
    if (campaign.status !== "payment_pending") {
      return NextResponse.json({ error: (await tRequete())("pubs.eDejaPayee") }, { status: 409 });
    }

    const totalCents = Math.round(Number(campaign.total_budget_chf) * 100);
    if (totalCents < 500) {
      // Garde-fou : Stripe refuse les montants dérisoires, et un forfait
      // valide vaut au moins vingt et un francs.
      return NextResponse.json({ error: (await tRequete())("pubs.eMontant") }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const [tr, langue] = await Promise.all([tRequete(), langueRequete()]);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: langue === "de" ? "de" : "fr",
      customer_email: user.email ?? undefined,
      line_items: [{
        price_data: {
          currency: "chf",
          product_data: {
            name: tr("stripe.pubNom", { titre: campaign.headline }),
            description: tr("stripe.pubDescription"),
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      client_reference_id: campaign_id,
      metadata: {
        type: "ad_campaign",
        campaign_id,
        user_id: user.id,
      },
      payment_intent_data: {
        metadata: { type: "ad_campaign", campaign_id },
      },
      success_url: `${baseUrl}/profile/ads?payment=success&session={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/profile/ads?payment=canceled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: (await tRequete())("pubs.eStripeUrl") }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[user/ads/checkout]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur inconnue" }, { status: 500 });
  }
}
