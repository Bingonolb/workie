"use client";

import { useState, useEffect } from "react";
import { Eye, MousePointer, CheckCircle, XCircle, PauseCircle, ArrowLeft, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";
import { getAdminCampaigns, adminSetCampaignStatus } from "@/lib/actions/ads";
import type { AdCampaign } from "@/lib/actions/ads";

function daysRemaining(endDate: string | null): { label: string; urgent: boolean } {
  if (!endDate) return { label: "Sans limite", urgent: false };
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: "Expirée", urgent: true };
  if (diff === 0) return { label: "Dernier jour", urgent: true };
  return { label: `${diff}j restants`, urgent: diff <= 3 };
}

type Campaign = AdCampaign & { company_name: string; company_logo: string | null };

const STATUS_CONFIG = {
  pending:   { label: "En attente",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  active:    { label: "Active",      color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  paused:    { label: "Pausée",      color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  completed: { label: "Terminée",    color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  rejected:  { label: "Rejetée",     color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
} as const;

const FORMAT_LABEL: Record<string, string> = { square: "Carré", swipe: "Swipe" };

export function AdminAdsClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("pending");

  useEffect(() => {
    getAdminCampaigns()
      .then(r => { if (r.error) setError(r.error); else setCampaigns(r.campaigns ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id: string, status: "active" | "paused" | "rejected") => {
    setBusy(id);
    setActionError(null);
    try {
      const res = await adminSetCampaignStatus(id, status, actionNote[id]);
      if (res.error) setActionError(res.error);
      else setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status, admin_note: actionNote[id] ?? c.admin_note } : c));
    } finally {
      setBusy(null);
    }
  };

  const filtered = campaigns.filter(c => filter === "all" || c.status === filter);
  const counts: Record<string, number> = { all: campaigns.length };
  campaigns.forEach(c => { counts[c.status] = (counts[c.status] ?? 0) + 1; });

  return (
    <div className="biz-page" style={{ maxWidth: 1000 }}>
      <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={14} /> Admin
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>Modération des publicités</h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>Validez, pausez ou rejetez les campagnes soumises par les entreprises.</p>

      {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 20 }}>{error}</div>}
      {actionError && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 20 }}>⚠ {actionError}</div>}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          { v: "pending", label: "En attente" },
          { v: "active", label: "Actives" },
          { v: "paused", label: "Pausées" },
          { v: "rejected", label: "Rejetées" },
          { v: "all", label: "Toutes" },
        ].map(({ v, label }) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{
              padding: "7px 16px", borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: filter === v ? "1.5px solid #8b5cf6" : "1px solid var(--border2)",
              background: filter === v ? "rgba(139,92,246,0.12)" : "transparent",
              color: filter === v ? "#8b5cf6" : "var(--text-muted)",
            }}>
            {label}{counts[v] ? ` (${counts[v]})` : ""}
          </button>
        ))}
      </div>

      {loading && <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Chargement…</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: 14 }}>
          Aucune campagne dans ce statut.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map(c => {
          const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending;
          return (
            <div key={c.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 16, padding: "18px 20px", flexWrap: "wrap" }}>
                <div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--surface2)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{c.company_name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 50, background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                      {FORMAT_LABEL[c.format] ?? c.format}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 50, background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>

                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{c.headline}</h2>
                  {c.body_text && <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>{c.body_text}</p>}

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                    <span>CHF {c.daily_budget_chf}/j · Total CHF {c.total_budget_chf}</span>
                    <span>CPM CHF {Number(c.cpm_chf).toFixed(2)}</span>
                    {c.target_cantons.length > 0 && <span>📍 {c.target_cantons.join(", ")}</span>}
                    {c.target_sectors.length > 0 && <span>🏭 {c.target_sectors.join(", ")}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
                      <Calendar size={11} /> {c.start_date}{c.end_date ? ` → ${c.end_date}` : ""}
                    </span>
                    {(() => {
                      const { label, urgent } = daysRemaining(c.end_date);
                      return (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 50,
                          background: urgent ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                          color: urgent ? "#ef4444" : "#10b981",
                          border: `1px solid ${urgent ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
                        }}>
                          {label}
                        </span>
                      );
                    })()}
                  </div>

                  <a href={c.cta_url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#8b5cf6", textDecoration: "none" }}>
                    {c.cta_label} → {c.cta_url.slice(0, 40)}{c.cta_url.length > 40 ? "…" : ""}
                    <ExternalLink size={11} />
                  </a>
                </div>

                <div style={{ display: "flex", gap: 16, flexShrink: 0, alignItems: "flex-start" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>{Number(c.impression_count).toLocaleString("fr-CH")}</p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 2 }}><Eye size={10} /> vues</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>{Number(c.click_count).toLocaleString("fr-CH")}</p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 2 }}><MousePointer size={10} /> clics</p>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", padding: "12px 20px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={actionNote[c.id] ?? ""}
                  onChange={e => setActionNote(prev => ({ ...prev, [c.id]: e.target.value }))}
                  placeholder="Note admin (optionnel, visible si rejeté)"
                  style={{
                    flex: 1, minWidth: 200, background: "var(--surface2)", border: "1px solid var(--border2)",
                    borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--text)", outline: "none",
                  }}
                />
                {c.status !== "active" && (
                  <button disabled={busy === c.id} onClick={() => handleStatus(c.id, "active")}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: busy === c.id ? 0.6 : 1 }}>
                    <CheckCircle size={14} /> Activer
                  </button>
                )}
                {c.status === "active" && (
                  <button disabled={busy === c.id} onClick={() => handleStatus(c.id, "paused")}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#8b5cf6", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: busy === c.id ? 0.6 : 1 }}>
                    <PauseCircle size={14} /> Pauser
                  </button>
                )}
                {c.status !== "rejected" && (
                  <button disabled={busy === c.id} onClick={() => handleStatus(c.id, "rejected")}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: busy === c.id ? 0.6 : 1 }}>
                    <XCircle size={14} /> Rejeter
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
