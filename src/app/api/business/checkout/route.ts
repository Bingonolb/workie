import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getUser, createClient } from "@/lib/supabase/server";

const PLANS = {
  monthly: { amount: 9900, interval: "month" as const, label: "Workie Business · Mensuel" },
  annual:  { amount: 89000, interval: "year"  as const, label: "Workie Business · Annuel"  },
};

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const formData = await request.formData();
  const planKey = String(formData.get("price") || "monthly") as "monthly" | "annual";
  const plan = PLANS[planKey] ?? PLANS.monthly;

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
    await supabase.from("companies").update({ stripe_customer_id: customerId }).eq("id", company.id);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "chf",
        product_data: { name: plan.label },
        unit_amount: plan.amount,
        recurring: { interval: plan.interval },
      },
      quantity: 1,
    }],
    client_reference_id: company.id,
    subscription_data: { metadata: { company_id: company.id, user_id: user.id } },
    success_url: `${baseUrl}/business/dashboard?checkout=success`,
    cancel_url:  `${baseUrl}/business/checkout?canceled=1`,
    allow_promotion_codes: true,
  });

  return NextResponse.redirect(session.url!, 303);
}
