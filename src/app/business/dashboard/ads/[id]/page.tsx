import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, MousePointer, TrendingUp, ExternalLink, Clock, CheckCircle, XCircle, PauseCircle } from "lucide-react";
import { getBusinessCampaigns, getCampaignDailyStats } from "@/lib/actions/ads";
import { Navbar } from "@/components/Navbar";
import { AdStatsChart } from "../AdStatsChart";

const STATUS_CONFIG = {
  pending:   { label: "En attente",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: <Clock size={14} /> },
  active:    { label: "Active",      color: "#10b981", bg: "rgba(16,185,129,0.12)",   icon: <CheckCircle size={14} /> },
  paused:    { label: "Pausée",      color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",   icon: <PauseCircle size={14} /> },
  completed: { label: "Terminée",    color: "#6b7280", bg: "rgba(107,114,128,0.12)",  icon: <CheckCircle size={14} /> },
  rejected:  { label: "Rejetée",     color: "#ef4444", bg: "rgba(239,68,68,0.12)",    icon: <XCircle size={14} /> },
} as const;

function ctr(imp: number, clk: number) {
  if (!imp) return "0.0%";
  return `${((clk / imp) * 100).toFixed(2)}%`;
}

function cpc(clk: number, spent: number) {
  if (!clk) return "–";
  return `CHF ${(spent / clk).toFixed(2)}`;
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { campaigns = [] } = await getBusinessCampaigns();
  const campaign = campaigns.find(c => c.id === id);
  if (!campaign) notFound();

  const stats = await getCampaignDailyStats(id);

  const st = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.pending;
  const budgetPct = campaign.total_budget_chf > 0
    ? Math.min(100, Math.round((campaign.spent_chf / campaign.total_budget_chf) * 100))
    : 0;

  const last7 = stats.slice(-7);
  const last7Imp = last7.reduce((s, d) => s + d.impressions, 0);
  const last7Clk = last7.reduce((s, d) => s + d.clicks, 0);
  const today = stats.find(d => d.day === new Date().toISOString().slice(0, 10));

  const durationDays = campaign.start_date
    ? Math.max(1, Math.round((Date.now() - new Date(campaign.start_date).getTime()) / 86400000))
    : 1;
  const avgDailyImp = Math.round(campaign.impression_count / durationDays);
  const avgDailyClk = Math.round(campaign.click_count / durationDays);

  return (
    <div className="page-root">
      <Navbar />
      <div className="biz-page" style={{ maxWidth: 860 }}>
        <Link href="/business/dashboard/ads" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 20 }}>
          <ArrowLeft size={14} /> Mes publicités
        </Link>

        {/* Header card */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 20, padding: "22px 24px", flexWrap: "wrap" }}>
            <div style={{ width: 100, height: 100, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "var(--surface2)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={campaign.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", margin: 0 }}>{campaign.headline}</h1>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 50, background: st.bg, color: st.color }}>
                  {st.icon} {st.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 50, background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                  {campaign.format === "square" ? "⬛ Carré" : "📱 Swipe"}
                </span>
              </div>
              {campaign.body_text && <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.5 }}>{campaign.body_text}</p>}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
                <span>🗓 Début : {campaign.start_date}</span>
                {campaign.end_date && <span>→ Fin : {campaign.end_date}</span>}
                {campaign.target_cantons.length > 0 && <span>📍 {campaign.target_cantons.join(", ")}</span>}
                {campaign.target_sectors.length > 0 && <span>🏭 {campaign.target_sectors.join(", ")}</span>}
              </div>
              <a href={campaign.cta_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10, fontSize: 13, color: "#8b5cf6", textDecoration: "none" }}>
                {campaign.cta_label} <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {campaign.admin_note && campaign.status === "rejected" && (
            <div style={{ margin: "0 24px 16px", padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, fontSize: 13, color: "#ef4444" }}>
              ⚠ Raison du rejet : {campaign.admin_note}
            </div>
          )}
        </div>

        {/* KPI grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
          {/* Left col: totals */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>Performance totale</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Impressions", value: campaign.impression_count.toLocaleString("fr-CH"), icon: <Eye size={14} />, color: "#8b5cf6" },
                  { label: "Clics", value: campaign.click_count.toLocaleString("fr-CH"), icon: <MousePointer size={14} />, color: "#f97316" },
                  { label: "CTR", value: ctr(campaign.impression_count, campaign.click_count), icon: <TrendingUp size={14} />, color: "#10b981" },
                  { label: "CPC moyen", value: cpc(campaign.click_count, Number(campaign.spent_chf)), icon: <TrendingUp size={14} />, color: "#6b7280" },
                ].map(({ label, value, icon, color }) => (
                  <div key={label}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, color, marginBottom: 3 }}>{icon}<span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span></div>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>Période récente</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: "Aujourd'hui", imp: today?.impressions ?? 0, clk: today?.clicks ?? 0 },
                  { label: "7 derniers jours", imp: last7Imp, clk: last7Clk },
                  { label: "Moy./jour", imp: avgDailyImp, clk: avgDailyClk },
                ].map(({ label, imp, clk }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>{label}</p>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>{imp.toLocaleString("fr-CH")}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>vues</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#f97316", marginTop: 4 }}>{clk}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>clics</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right col: budget */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Budget</p>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: "var(--text-muted)" }}>Dépensé</span>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>CHF {Number(campaign.spent_chf).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 12 }}>
                <span style={{ color: "var(--text-muted)" }}>Total alloué</span>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>CHF {Number(campaign.total_budget_chf).toFixed(2)}</span>
              </div>
              <div style={{ height: 8, borderRadius: 50, background: "var(--surface2)", overflow: "hidden", marginBottom: 6 }}>
                <div style={{
                  height: "100%", width: `${budgetPct}%`,
                  background: budgetPct >= 90 ? "#ef4444" : "linear-gradient(90deg, #8b5cf6, #f97316)",
                  borderRadius: 50, transition: "width 0.5s",
                }} />
              </div>
              <p style={{ fontSize: 12, color: budgetPct >= 90 ? "#ef4444" : "var(--text-muted)", textAlign: "right" }}>{budgetPct}% utilisé</p>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Budget journalier", value: `CHF ${campaign.daily_budget_chf}/j` },
                { label: "CPM", value: `CHF ${Number(campaign.cpm_chf).toFixed(4)}` },
                { label: "Budget restant", value: `CHF ${Math.max(0, Number(campaign.total_budget_chf) - Number(campaign.spent_chf)).toFixed(2)}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 30-day chart */}
        {stats.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 20px 4px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4, paddingLeft: 0 }}>Évolution sur 30 jours</p>
            <AdStatsChart stats={stats} />
          </div>
        )}
      </div>
    </div>
  );
}
