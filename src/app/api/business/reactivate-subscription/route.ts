import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getUser, createClient } from "@/lib/supabase/server";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${baseUrl}/auth/login`, 303);

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("claimed_company_id").eq("id", user.id).maybeSingle();
  if (!profile?.claimed_company_id) return NextResponse.redirect(`${baseUrl}/business/dashboard?error=no_company`, 303);

  const { data: company } = await supabase.from("companies").select("stripe_subscription_id, is_subscribed").eq("id", profile.claimed_company_id).maybeSingle();
  if (!company?.stripe_subscription_id || !company.is_subscribed) {
    return NextResponse.redirect(`${baseUrl}/business/dashboard/subscription?error=no_sub`, 303);
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.subscriptions.update(company.stripe_subscription_id, { cancel_at_period_end: false });

    await supabase.from("companies").update({ subscription_cancel_at_period_end: false }).eq("id", profile.claimed_company_id);

    return NextResponse.redirect(`${baseUrl}/business/dashboard/subscription?reactivated=1`, 303);
  } catch (e) {
    console.error("[reactivate-subscription]", e);
    return NextResponse.redirect(`${baseUrl}/business/dashboard/subscription?error=stripe`, 303);
  }
}
