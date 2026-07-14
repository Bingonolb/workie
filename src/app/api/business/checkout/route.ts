import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getUser, createClient } from "@/lib/supabase/server";

const PRICE_IDS: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  annual:  process.env.STRIPE_PRICE_ID_ANNUAL,
};

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const formData = await request.formData();
  const price = String(formData.get("price") || "monthly");
  const priceId = PRICE_IDS[price];

  if (!priceId) {
    return NextResponse.json(
      { error: `Prix non configuré. Ajoutez STRIPE_PRICE_ID_${price.toUpperCase()} dans vos variables d'environnement.` },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("claimed_company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.claimed_company_id) {
    return NextResponse.json({ error: "Aucune entreprise revendiquée" }, { status: 400 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, stripe_customer_id")
    .eq("id", profile.claimed_company_id)
    .maybeSingle();

  if (!company) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });

  // Reuse or create Stripe customer
  let customerId = company.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: company.name,
      metadata: { company_id: company.id, user_id: user.id },
    });
    customerId = customer.id;
    // Persist customer ID so future sessions reuse it
    await supabase.from("companies").update({ stripe_customer_id: customerId }).eq("id", company.id);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/business/dashboard?checkout=success`,
    cancel_url:  `${baseUrl}/business/checkout?checkout=cancelled`,
    metadata: { company_id: company.id, user_id: user.id },
    subscription_data: {
      metadata: { company_id: company.id, user_id: user.id },
    },
  });

  return NextResponse.redirect(session.url!, 303);
}
