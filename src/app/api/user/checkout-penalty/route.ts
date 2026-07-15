import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getUser } from "@/lib/supabase/server";

export async function POST() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [{
        price_data: {
          currency: "chf",
          product_data: {
            name: "Workie — Pass Pénalité",
            description: "Accès à vie au bouton -100 pts pour signaler les entreprises toxiques",
          },
          unit_amount: 500, // 5.00 CHF
        },
        quantity: 1,
      }],
      client_reference_id: user.id,
      metadata: { type: "penalty_pass", user_id: user.id },
      success_url: `${baseUrl}/explore?view=swipe&penalty_success=1`,
      cancel_url:  `${baseUrl}/explore?view=swipe`,
    });

    if (!session.url) return NextResponse.json({ error: "Stripe n'a pas retourné d'URL" }, { status: 500 });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
