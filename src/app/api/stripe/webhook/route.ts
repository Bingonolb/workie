import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature invalide: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  if (
    event.type === "identity.verification_session.verified" ||
    event.type === "identity.verification_session.requires_input"
  ) {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.user_id;

    if (userId) {
      const admin = createAdminClient();
      const verified = event.type === "identity.verification_session.verified";
      await admin
        .from("profiles")
        .update({
          identity_verified: verified,
          identity_verified_at: verified ? new Date().toISOString() : null,
        })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
