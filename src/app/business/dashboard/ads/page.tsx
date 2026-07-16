import Link from "next/link";
import type { CSSProperties } from "react";
import { Plus, Eye, MousePointer, TrendingUp, Clock, CheckCircle, XCircle, PauseCircle, Copy, ArrowLeft, CreditCard } from "lucide-react";
import { getBusinessCampaigns } from "@/lib/actions/ads";
import { PayCampaignButton } from "./PayCampaignButton";
import { AdImage } from "./AdImage";

const STATUS_CONFIG = {
  payment_pending: { label: "Paiement requis", color: "#ef4444", bg: "rgba(239,68,68,0.1)",    icon: <CreditCard size={12} />, dot: "#ef4444" },
  pending:         { label: "En révision",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   icon: <Clock size={12} />,      dot: "#f59e0b" },
  active:          { label: "Active",          color: "#10b981", bg: "rgba(16,185,129,0.1)",    icon: <CheckCircle size={12} />,dot: "#10b981" },
  paused:          { label: "Pausée",          color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",    icon: <PauseCircle size={12} />,dot: "#8b5cf6" },
  completed:       { label: "Terminée",        color: "#6b7280", bg: "rgba(107,114,128,0.1)",   icon: <CheckCircle size={12} />,dot: "#6b7280" },
  rejected:        { label: "Rejetée",         color: "#ef4444", bg: "rgba(239,68,68,0.1)",     icon: <XCircle size={12} />,    dot: "#ef4444" },
} as const;

function daysRemaining(endDate: string | null): { label: string; urgent: boolean } {
  if (!endDate) return { label: "Sans limite", urgent: false };
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: "Expirée", urgent: true };
  if (diff === 0) return { label: "Dernier jour", urgent: true };
  return { label: `${diff}j restants`, urgent: diff <= 3 };
}

function ctr(imp: number, clk: number) {
  if (!imp) return "–";
  return `${((clk / imp) * 100).toFixed(1)}%`;
}

function budgetPct(spent: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((spent / total) * 100));
}

export default async function AdsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [{ campaigns = [], error }, sp] = await Promise.all([getBusinessCampaigns(), searchParams]);
  const activeTab = sp.tab ?? "all";
  const paymentSuccess = sp.payment === "success";
  const paymentCanceled = sp.payment === "canceled";

  const counts = {
    all: campaigns.length,
    payment_pending: campaigns.filter(c => c.status === "payment_pending").length,
    active: campaigns.filter(c => c.status === "active").length,
    pending: campaigns.filter(c => c.status === "pending").length,
    paused: campaigns.filter(c => c.status === "paused").length,
    completed: campaigns.filter(c => c.status === "completed").length,
    rejected: campaigns.filter(c => c.status === "rejected").length,
  };

  const totalImpressions = campaigns.reduce((s, c) => s + Number(c.impression_count), 0);
  const totalClicks = campaigns.reduce((s, c) => s + Number(c.click_count), 0);
  const totalSpent = campaigns.reduce((s, c) => s + (Number(c.spent_chf) || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active");

  return (
    <div className="biz-page" style={{ maxWidth: 960 }}>

        {/* ── Header ── */}
        <Link href="/business/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 20 }}>
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>Publicités</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              {campaigns.length === 0 ? "Aucune campagne · Lancez votre première pub" : `${campaigns.length} campagne${campaigns.length > 1 ? "s" : ""} · ${activeCampaigns.length} active${activeCampaigns.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <Link href="/business/dashboard/ads/new" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "11px 22px", borderRadius: 12,
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
          }}>
            <Plus size={16} /> Nouvelle pub
          </Link>
        </div>

        {paymentSuccess && (
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "14px 18px", color: "#10b981", fontSize: 14, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={16} /> Paiement reçu ! Votre campagne est en cours de vérification par notre équipe (24h ouvrées).
          </div>
        )}
        {paymentCanceled && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 18px", color: "#ef4444", fontSize: 14, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <XCircle size={16} /> Paiement annulé. La campagne existe mais n&apos;est pas activée. Vous pouvez compléter le paiement depuis la liste.
          </div>
        )}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {!error && campaigns.length === 0 ? (
          /* ── Empty state ── */
          <div style={{ textAlign: "center", padding: "80px 24px 60px" }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(249,115,22,0.1))", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 32 }}>
              📣
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Aucune campagne pour l&apos;instant</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.7 }}>
              Sponsorisez votre marque auprès de milliers de candidats actifs en Suisse.
            </p>
            <Link href="/business/dashboard/ads/new" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 26px", borderRadius: 12,
              background: "linear-gradient(135deg, #8b5cf6, #f97316)",
              color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
            }}>
              <Plus size={16} /> Créer ma première pub
            </Link>
          </div>
        ) : (
          <>
            {/* ── Global KPIs ── */}
            {campaigns.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
                {[
                  { label: "Vues totales", value: totalImpressions.toLocaleString("fr-CH"), icon: <Eye size={14} />, color: "#8b5cf6" },
                  { label: "Clics totaux", value: totalClicks.toLocaleString("fr-CH"), icon: <MousePointer size={14} />, color: "#f97316" },
                  { label: "CTR moyen", value: ctr(totalImpressions, totalClicks), icon: <TrendingUp size={14} />, color: "#10b981" },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>{icon}</div>
                    <div>
                      <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{value}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalSpent > 0 && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
                Budget total dépensé : <strong style={{ color: "var(--text)" }}>CHF {totalSpent.toFixed(2)}</strong>
              </p>
            )}

            {/* ── Status tabs ── */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {([
                ["all", "Toutes", counts.all],
                ["payment_pending", "À payer", counts.payment_pending],
                ["pending", "En révision", counts.pending],
                ["active", "Actives", counts.active],
                ["paused", "Pausées", counts.paused],
                ["completed", "Terminées", counts.completed],
                ["rejected", "Rejetées", counts.rejected],
              ] as [string, string, number][]).filter(([status, , n]) => status === "all" || n > 0).map(([status, label, n]) => {
                const isActive = activeTab === status;
                return (
                <a key={status} href={`?tab=${status}`} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 50, fontSize: 13, fontWeight: 600,
                  textDecoration: "none",
                  border: isActive ? "1px solid #8b5cf6" : "1px solid var(--border2)",
                  background: isActive ? "rgba(139,92,246,0.12)" : "transparent",
                  color: isActive ? "#8b5cf6" : "var(--text-muted)",
                }}>
                  {status !== "all" && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.dot ?? "#6b7280", display: "inline-block" }} />
                  )}
                  {label}
                  {n > 0 && <span style={{ fontSize: 11, background: "rgba(255,255,255,0.07)", padding: "1px 6px", borderRadius: 50 }}>{n}</span>}
                </a>
              )})}
            </div>

            {/* ── Campaign list ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {campaigns.filter(c => activeTab === "all" || c.status === activeTab).map(c => {
                const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending;
                const pct = budgetPct(Number(c.spent_chf), Number(c.total_budget_chf));
                const remaining = Math.max(0, Number(c.total_budget_chf) - Number(c.spent_chf));

                const cardStyle: CSSProperties = { position: "relative", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", transition: "border-color 0.15s" };
                return (
                  <div key={c.id} style={cardStyle}>
                    {/* Full-card link — action buttons sit above via z-index */}
                    <Link href={`/business/dashboard/ads/${c.id}`} style={{ position: "absolute", inset: 0, zIndex: 0 }} aria-label={c.headline} />
                    <div style={{ display: "flex", gap: 0, alignItems: "stretch", position: "relative", zIndex: 1 }}>

                      {/* Thumbnail */}
                      <div style={{ width: 90, flexShrink: 0, position: "relative", overflow: "hidden", background: "var(--surface2)" }}>
                        <AdImage src={c.image_url} />
                        <div style={{ position: "absolute", bottom: 6, left: 6, fontSize: 9, fontWeight: 800, background: "rgba(0,0,0,0.7)", color: "#fff", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {c.format === "square" ? "⬛" : "📱"} {c.format}
                        </div>
                      </div>

                      {/* Main content */}
                      <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                              <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "min(280px, 100%)" }}>{c.headline}</h2>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 50, background: st.bg, color: st.color, flexShrink: 0 }}>
                                {st.icon} {st.label}
                              </span>
                            </div>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                              CHF {Number(c.daily_budget_chf).toFixed(2)}/j · CPM CHF {Number(c.cpm_chf).toFixed(2)}
                              {c.target_cantons.length > 0 && ` · 📍 ${c.target_cantons.slice(0, 3).join(", ")}${c.target_cantons.length > 3 ? ` +${c.target_cantons.length - 3}` : ""}`}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="ads-card-stats" style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                            <div style={{ textAlign: "right" }}>
                              <p style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{Number(c.impression_count).toLocaleString("fr-CH")}</p>
                              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end" }}><Eye size={10} /> vues</p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <p style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{Number(c.click_count).toLocaleString("fr-CH")}</p>
                              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end" }}><MousePointer size={10} /> clics</p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <p style={{ fontSize: 16, fontWeight: 900, color: "#10b981", lineHeight: 1 }}>{ctr(Number(c.impression_count), Number(c.click_count))}</p>
                              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end" }}><TrendingUp size={10} /> CTR</p>
                            </div>
                          </div>
                        </div>

                        {/* Budget bar */}
                        <div>
                          <div style={{ height: 4, borderRadius: 50, background: "var(--surface2)", overflow: "hidden", marginBottom: 4 }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? "#ef4444" : "linear-gradient(90deg, #8b5cf6, #f97316)", borderRadius: 50 }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                            <span>CHF {Number(c.spent_chf).toFixed(2)} dépensé · {pct}%</span>
                            <span>CHF {remaining.toFixed(2)} restant</span>
                          </div>
                        </div>

                        {c.admin_note && c.status === "rejected" && (
                          <p style={{ fontSize: 11, color: "#ef4444", marginTop: 8, background: "rgba(239,68,68,0.06)", padding: "5px 10px", borderRadius: 7 }}>
                            ⚠ {c.admin_note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action bar */}
                    <div style={{ borderTop: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.01)", position: "relative", zIndex: 1 }}>
                      {c.status === "payment_pending" ? (
                        <PayCampaignButton campaignId={c.id} totalBudget={Number(c.total_budget_chf)} />
                      ) : (
                        <Link href={`/business/dashboard/ads/${c.id}`} style={{
                          fontSize: 12, fontWeight: 700, color: "#8b5cf6", textDecoration: "none",
                          padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(139,92,246,0.25)", background: "rgba(139,92,246,0.06)",
                        }}>
                          Voir les stats
                        </Link>
                      )}
                      <Link
                        href={`/business/dashboard/ads/new?dup=${c.id}&headline=${encodeURIComponent(c.headline)}&format=${c.format}&cta_label=${encodeURIComponent(c.cta_label)}&cta_url=${encodeURIComponent(c.cta_url)}&daily=${c.daily_budget_chf}&image=${encodeURIComponent(c.image_url)}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textDecoration: "none",
                          padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border2)", background: "transparent",
                        }}
                      >
                        <Copy size={11} /> Dupliquer
                      </Link>
                      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {c.start_date}{c.end_date ? ` → ${c.end_date}` : ""}
                        </span>
                        {(() => {
                          const { label, urgent } = daysRemaining(c.end_date);
                          return (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 50,
                              background: urgent ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.08)",
                              color: urgent ? "#ef4444" : "#10b981",
                            }}>
                              {label}
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Quick new campaign CTA ── */}
            <Link href="/business/dashboard/ads/new" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginTop: 16, padding: "16px", borderRadius: 16,
              border: "1.5px dashed rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.03)",
              color: "#8b5cf6", fontWeight: 700, fontSize: 14, textDecoration: "none",
              transition: "all 0.2s",
            }}>
              <Plus size={18} /> Lancer une nouvelle campagne
            </Link>
          </>
        )}

        {/* Info box */}
        <div style={{ marginTop: 28, background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 14, padding: "16px 20px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Comment ça fonctionne</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { step: "1", text: "Créez votre campagne avec visuel et ciblage" },
              { step: "2", text: "Paiement sécurisé du budget total via Stripe" },
              { step: "3", text: "Notre équipe valide la campagne sous 24h ouvrées" },
              { step: "4", text: "Votre pub apparaît sur Workie selon votre budget" },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#8b5cf6", flexShrink: 0, marginTop: 1 }}>{step}</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}

