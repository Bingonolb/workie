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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // One-time penalty pass purchase
        if (session.mode === "payment" && session.metadata?.type === "penalty_pass") {
          const userId = session.metadata.user_id ?? session.client_reference_id;
          if (userId) {
            const { error } = await supabase.from("profiles").update({ has_penalty_pass: true }).eq("id", userId);
            if (error) console.error("[webhook] penalty_pass update failed:", error.message);
          }
          break;
        }

        // Ad campaign payment — activate for admin review
        if (session.mode === "payment" && session.metadata?.type === "ad_campaign") {
          const campaignId = session.metadata.campaign_id ?? session.client_reference_id;
          if (campaignId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("ad_campaigns") as any).update({
              status: "pending",
              stripe_session_id: session.id,
              paid_at: new Date().toISOString(),
            }).eq("id", campaignId).eq("status", "payment_pending");
            if (error) console.error("[webhook] ad_campaign payment update failed:", error.message);
          }
          break;
        }

        // Business subscription
        const companyId = session.client_reference_id;
        if (!companyId || session.mode !== "subscription") break;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = await stripe.subscriptions.retrieve(session.subscription as string) as any;
        const periodEnd: number = sub.current_period_end ?? sub.billing_cycle_anchor ?? 0;
        const endsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

        const { error: subErr } = await supabase.from("companies").update({
          is_subscribed: true,
          stripe_subscription_id: sub.id,
          subscription_ends_at: endsAt,
          subscription_cancel_at_period_end: false,
        }).eq("id", companyId);
        if (subErr) console.error("[webhook] subscription activate failed:", subErr.message);
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
          stripe_subscription_id: null,
          subscription_ends_at: null,
        }).eq("id", companyId);
        if (error) console.error("[webhook] subscription.deleted failed:", error.message);
        break;
      }
    }
  } catch (e) {
    console.error("[webhook] handler error:", e);
    // Return 200 to Stripe anyway — avoid infinite retries for non-retriable errors
  }

  return NextResponse.json({ received: true });
}
