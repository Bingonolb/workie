import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { BadgeCheck, ArrowRight, Shield, CheckCircle } from "lucide-react";

export default async function CheckoutPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/business/checkout");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("claimed_company_id")
    .eq("id", user.id)
    .maybeSingle();

  // Already subscribed → go to dashboard
  if (profile?.claimed_company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("is_subscribed")
      .eq("id", profile.claimed_company_id)
      .maybeSingle();
    if (company?.is_subscribed) redirect("/business/dashboard");
  }

  const hasStripe = !!process.env.STRIPE_SECRET_KEY;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>

      <Link href="/" style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textDecoration: "none", marginBottom: 48, display: "block", textAlign: "center" }}>
        workie
      </Link>

      <div style={{ width: "100%", maxWidth: 500 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 50, padding: "6px 16px", marginBottom: 20, fontSize: 13, fontWeight: 700, color: "#8b5cf6" } as React.CSSProperties}>
            <BadgeCheck size={14} /> Offre Fondateurs · Places limitées
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 12 }}>
            Activez votre compte entreprise
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7 }}>
            Votre demande a été validée. Il ne reste plus qu&apos;à activer votre abonnement.
          </p>
        </div>

        {/* Plan card */}
        <div style={{ background: "var(--surface)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 24, padding: "36px 32px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 14, right: 14, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 50, letterSpacing: "0.05em" }}>
            FONDATEUR · PRIX GARANTI À VIE
          </div>

          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Compte Entreprise Vérifié</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-0.04em" }}>99</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-muted)" }}>CHF/mois</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 28 }}>ou 890 CHF/an — 2 mois offerts</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
            {[
              "Répondre aux avis de vos employés",
              "Dashboard analytics complet",
              "Publication d'offres d'emploi",
              "Gestion logo, photos, description",
              "Badge « Entreprise vérifiée » bleu",
              "Voir votre fiche comme vos employés",
              "Support prioritaire",
            ].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text)" }}>
                <CheckCircle size={16} color="#10b981" /> {f}
              </div>
            ))}
          </div>

          {hasStripe ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <form action="/api/business/checkout" method="POST">
                <input type="hidden" name="price" value="monthly" />
                <button type="submit" style={{ width: "100%", padding: "16px 0", borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 8px 24px rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  Payer 99 CHF/mois <ArrowRight size={18} />
                </button>
              </form>
              <form action="/api/business/checkout" method="POST">
                <input type="hidden" name="price" value="annual" />
                <button type="submit" style={{ width: "100%", padding: "13px 0", borderRadius: 12, background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border2)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Payer 890 CHF/an (–2 mois)
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>⚙️</span>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Le paiement en ligne sera disponible prochainement. Pour activer votre compte dès maintenant, contactez-nous directement.
                </p>
              </div>
              <a href="mailto:hello@workie.ch?subject=Activation compte entreprise" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px 0", borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                Nous contacter pour activer <ArrowRight size={16} />
              </a>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
          <Shield size={13} /> Sans engagement · Annulation à tout moment · Données sécurisées
        </div>
      </div>
    </main>
  );
}
