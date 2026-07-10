import Link from "next/link";
import { ArrowLeft, Plus, Eye, MousePointer, TrendingUp, Clock, CheckCircle, XCircle, PauseCircle } from "lucide-react";
import { getBusinessCampaigns } from "@/lib/actions/ads";
import { Navbar } from "@/components/Navbar";

const STATUS_CONFIG = {
  pending:   { label: "En attente",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: <Clock size={13} /> },
  active:    { label: "Active",      color: "#10b981", bg: "rgba(16,185,129,0.12)",   icon: <CheckCircle size={13} /> },
  paused:    { label: "Pausée",      color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",   icon: <PauseCircle size={13} /> },
  completed: { label: "Terminée",    color: "#6b7280", bg: "rgba(107,114,128,0.12)",  icon: <CheckCircle size={13} /> },
  rejected:  { label: "Rejetée",     color: "#ef4444", bg: "rgba(239,68,68,0.12)",    icon: <XCircle size={13} /> },
} as const;

const FORMAT_LABEL: Record<string, string> = { square: "Carré", swipe: "Swipe" };

function ctr(impressions: number, clicks: number) {
  if (!impressions) return "–";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

export default async function AdsPage() {
  const { campaigns = [], error } = await getBusinessCampaigns();

  return (
    <div className="page-root">
      <Navbar />
      <div className="biz-page" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          <div>
            <Link href="/business/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 12 }}>
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em" }}>Mes publicités</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
              Créez des campagnes sponsorisées visibles sur Workie.
            </p>
          </div>
          <Link href="/business/dashboard/ads/new" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 22px", borderRadius: 12,
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}>
            <Plus size={16} /> Nouvelle campagne
          </Link>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {campaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>📣</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Aucune campagne</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 420, margin: "0 auto 28px", lineHeight: 1.7 }}>
              Lancez votre première campagne publicitaire et touchez des milliers de candidats actifs sur Workie.
            </p>
            <Link href="/business/dashboard/ads/new" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 12,
              background: "linear-gradient(135deg, #8b5cf6, #f97316)",
              color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
            }}>
              <Plus size={16} /> Créer ma première pub
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {campaigns.map(c => {
              const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending;
              const budgetPct = c.total_budget_chf > 0 ? Math.min(100, Math.round((c.spent_chf / c.total_budget_chf) * 100)) : 0;
              return (
                <div key={c.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
                  {/* Top row */}
                  <div style={{ display: "flex", gap: 16, padding: "18px 20px", alignItems: "flex-start", flexWrap: "wrap" }}>
                    {/* Thumbnail */}
                    <div style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--surface2)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: 0 }}>{c.headline}</h2>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 50, background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                          {FORMAT_LABEL[c.format] ?? c.format}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 50, background: st.bg, color: st.color }}>
                          {st.icon} {st.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        CHF {c.daily_budget_chf}/j · CPM CHF {Number(c.cpm_chf).toFixed(2)}
                        {c.target_cantons.length > 0 && ` · ${c.target_cantons.join(", ")}`}
                        {c.target_sectors.length > 0 && ` · ${c.target_sectors.join(", ")}`}
                      </p>
                      {c.admin_note && c.status === "rejected" && (
                        <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6, background: "rgba(239,68,68,0.06)", padding: "6px 10px", borderRadius: 8 }}>
                          ⚠ {c.admin_note}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>{c.impression_count.toLocaleString("fr-CH")}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3, justifyContent: "center" }}><Eye size={11} /> Vues</p>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>{c.click_count.toLocaleString("fr-CH")}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3, justifyContent: "center" }}><MousePointer size={11} /> Clics</p>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 18, fontWeight: 900, color: "#10b981" }}>{ctr(c.impression_count, c.click_count)}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3, justifyContent: "center" }}><TrendingUp size={11} /> CTR</p>
                      </div>
                    </div>
                  </div>

                  {/* Budget bar */}
                  <div style={{ padding: "0 20px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>
                      <span>Budget utilisé</span>
                      <span>CHF {Number(c.spent_chf).toFixed(2)} / {Number(c.total_budget_chf).toFixed(2)}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 50, background: "var(--surface2)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${budgetPct}%`, background: budgetPct >= 90 ? "#ef4444" : "linear-gradient(90deg, #8b5cf6, #f97316)", borderRadius: 50, transition: "width 0.4s" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        <div style={{ marginTop: 36, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 16, padding: "20px 24px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Comment ça fonctionne ?</p>
          <ul style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8, paddingLeft: 18 }}>
            <li>Créez votre campagne (format, visuel, ciblage, budget)</li>
            <li>Notre équipe valide votre annonce sous 24h ouvrées</li>
            <li>Une fois active, votre pub apparaît dans les résultats Workie</li>
            <li>Paiement par virement bancaire après validation — coordonnées fournies par email</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
