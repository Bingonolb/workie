import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // One-time penalty pass purchase
      if (session.mode === "payment" && session.metadata?.type === "penalty_pass") {
        const userId = session.metadata.user_id ?? session.client_reference_id;
        if (userId) {
          await supabase.from("profiles").update({ has_penalty_pass: true }).eq("id", userId);
        }
        break;
      }

      const companyId = session.client_reference_id;
      if (!companyId || session.mode !== "subscription") break;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = await stripe.subscriptions.retrieve(session.subscription as string) as any;
      const periodEnd: number = sub.current_period_end ?? sub.billing_cycle_anchor ?? 0;
      const endsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

      await supabase.from("companies").update({
        is_subscribed: true,
        stripe_subscription_id: sub.id,
        subscription_ends_at: endsAt,
      }).eq("id", companyId);
      break;
    }

    case "customer.subscription.updated": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = event.data.object as any;
      const companyId = sub.metadata?.company_id;
      if (!companyId) break;

      const active = sub.status === "active" || sub.status === "trialing";
      const periodEnd: number = sub.current_period_end ?? 0;
      const endsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

      await supabase.from("companies").update({
        is_subscribed: active,
        stripe_subscription_id: sub.id,
        subscription_ends_at: endsAt,
      }).eq("id", companyId);
      break;
    }

    case "customer.subscription.deleted": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = event.data.object as any;
      const companyId = sub.metadata?.company_id;
      if (!companyId) break;

      await supabase.from("companies").update({
        is_subscribed: false,
        stripe_subscription_id: null,
        subscription_ends_at: null,
      }).eq("id", companyId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
