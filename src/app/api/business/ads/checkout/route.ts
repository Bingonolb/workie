import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getUser, createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
    }

    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { campaign_id } = await request.json() as { campaign_id?: string };
    if (!campaign_id) return NextResponse.json({ error: "campaign_id requis" }, { status: 400 });

    const supabase = await createClient();

    // Verify the campaign belongs to this user's company
    const { data: profile } = await supabase
      .from("profiles")
      .select("claimed_company_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.claimed_company_id) {
      return NextResponse.json({ error: "Aucune entreprise liée" }, { status: 403 });
    }

    const { data: campaign } = await supabase
      .from("ad_campaigns")
      .select("id, headline, total_budget_chf, status, company_id")
      .eq("id", campaign_id)
      .eq("company_id", profile.claimed_company_id)
      .maybeSingle();

    if (!campaign) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
    if (campaign.status !== "payment_pending") {
      return NextResponse.json({ error: "Cette campagne a déjà été payée" }, { status: 409 });
    }

    const totalCents = Math.round(Number(campaign.total_budget_chf) * 100);
    if (totalCents < 500) {
      return NextResponse.json({ error: "Budget minimum CHF 5" }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [{
        price_data: {
          currency: "chf",
          product_data: {
            name: `Workie Ads — ${campaign.headline}`,
            description: `Budget total campagne publicitaire`,
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
        company_id: profile.claimed_company_id,
      },
      payment_intent_data: {
        metadata: {
          type: "ad_campaign",
          campaign_id,
        },
      },
      success_url: `${baseUrl}/business/dashboard/ads?payment=success`,
      cancel_url:  `${baseUrl}/business/dashboard/ads?payment=canceled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe n'a pas retourné d'URL" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[ads/checkout]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur inconnue" }, { status: 500 });
  }
}
