import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { CheckCircle, AlertCircle, XCircle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string; reactivated?: string; error?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/api/auth/signout?next=/login");

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("claimed_company_id").eq("id", user.id).maybeSingle();
  if (!profile?.claimed_company_id) redirect("/business/dashboard");

  const { data: company } = await supabase
    .from("companies")
    .select("name, is_subscribed, subscription_ends_at, stripe_subscription_id, subscription_cancel_at_period_end")
    .eq("id", profile.claimed_company_id)
    .maybeSingle();

  if (!company) redirect("/business/dashboard");

  const { canceled, reactivated, error } = await searchParams;

  const endsAt = company.subscription_ends_at ? new Date(company.subscription_ends_at) : null;
  const endsAtStr = endsAt
    ? endsAt.toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const isCanceling = company.subscription_cancel_at_period_end;
  const isActive = company.is_subscribed;

  return (
    <div className="biz-page" style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/business/dashboard" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
          ← Retour au dashboard
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 6 }}>
          Mon abonnement
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Gérez votre abonnement Workie Business.
        </p>
      </div>

      {/* Flash messages */}
      {canceled && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", gap: 10, alignItems: "center" }}>
          <AlertCircle size={18} color="#f59e0b" />
          <p style={{ fontSize: 14, color: "var(--text)" }}>
            Résiliation programmée. Votre accès reste actif jusqu&apos;à la fin de la période en cours.
          </p>
        </div>
      )}
      {reactivated && (
        <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", gap: 10, alignItems: "center" }}>
          <CheckCircle size={18} color="#10b981" />
          <p style={{ fontSize: 14, color: "var(--text)" }}>
            Abonnement réactivé. Votre accès continue normalement.
          </p>
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", gap: 10, alignItems: "center" }}>
          <XCircle size={18} color="#ef4444" />
          <p style={{ fontSize: 14, color: "var(--text)" }}>
            Une erreur est survenue. Réessaie ou contacte <a href="mailto:hello@workie.ch" style={{ color: "#8b5cf6" }}>hello@workie.ch</a>.
          </p>
        </div>
      )}

      {/* Subscription card */}
      <div style={{ background: "var(--surface2)", border: `1px solid ${isCanceling ? "rgba(245,158,11,0.3)" : isActive ? "rgba(16,185,129,0.3)" : "var(--border)"}`, borderRadius: 20, padding: "28px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: isCanceling ? "rgba(245,158,11,0.1)" : isActive ? "rgba(16,185,129,0.1)" : "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isCanceling
              ? <AlertCircle size={22} color="#f59e0b" />
              : isActive
                ? <CheckCircle size={22} color="#10b981" />
                : <XCircle size={22} color="#ef4444" />
            }
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Workie Business</p>
            <p style={{ fontSize: 13, color: isCanceling ? "#f59e0b" : isActive ? "#10b981" : "var(--text-muted)", fontWeight: 600 }}>
              {isCanceling ? "Résiliation programmée" : isActive ? "Actif" : "Inactif"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "var(--text-muted)" }}>Plan</span>
            <span style={{ fontWeight: 700, color: "var(--text)" }}>99 CHF / mois</span>
          </div>
          {endsAtStr && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--text-muted)" }}>{isCanceling ? "Accès jusqu'au" : "Prochain renouvellement"}</span>
              <span style={{ fontWeight: 700, color: isCanceling ? "#f59e0b" : "var(--text)" }}>{endsAtStr}</span>
            </div>
          )}
        </div>

        {isActive && (
          isCanceling ? (
            /* Reactivate */
            <form action="/api/business/reactivate-subscription" method="POST">
              <button type="submit" style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <RefreshCw size={16} /> Réactiver mon abonnement
              </button>
              <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
                Votre abonnement continuera normalement et ne sera pas résilié.
              </p>
            </form>
          ) : (
            /* Cancel */
            <form action="/api/business/cancel-subscription" method="POST">
              <button type="submit" style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Résilier l&apos;abonnement
              </button>
              <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
                {endsAtStr
                  ? `Sans engagement. Votre accès reste actif jusqu'au ${endsAtStr}.`
                  : "Sans engagement. Votre accès reste actif jusqu'à la fin de la période en cours."}
              </p>
            </form>
          )
        )}

        {!isActive && (
          <Link href="/business/checkout" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
            Réactiver mon abonnement <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {/* Info box */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Comment fonctionne la résiliation ?</p>
        <ul style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
          <li>Votre abonnement reste actif jusqu&apos;à la fin de la période déjà payée.</li>
          <li>Aucun prélèvement supplémentaire ne sera effectué.</li>
          <li>Vous pouvez réactiver à tout moment avant la date de fin.</li>
          <li>Pour toute question : <a href="mailto:hello@workie.ch" style={{ color: "#8b5cf6" }}>hello@workie.ch</a></li>
        </ul>
      </div>
    </div>
  );
}
