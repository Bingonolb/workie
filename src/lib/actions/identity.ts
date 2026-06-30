"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function startIdentityVerification(): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { user_id: user.id },
      options: {
        document: {
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      return_url: `${siteUrl}/matches?identity=pending`,
    });

    await supabase
      .from("profiles")
      .update({ stripe_verification_session_id: session.id })
      .eq("id", user.id);

    return { url: session.url ?? undefined };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur Stripe Identity." };
  }
}
