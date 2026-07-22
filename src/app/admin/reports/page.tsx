"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Flag, CheckCircle, XCircle, Clock, MessageSquare, Building2, User, ExternalLink, Trash2, Mail } from "lucide-react";
import { getReports, updateReportStatus, deleteReportedContent, type Report, type ReportStatus } from "@/lib/actions/reports";

const TYPE_CONFIG = {
  review:  { label: "Avis",       icon: <MessageSquare size={13} />, bg: "rgba(139,92,246,0.1)",  color: "#8b5cf6" },
  company: { label: "Entreprise", icon: <Building2 size={13} />,     bg: "rgba(249,115,22,0.1)",  color: "#f97316" },
  profile: { label: "Profil",     icon: <User size={13} />,          bg: "rgba(16,185,129,0.1)",  color: "#10b981" },
} as const;

const STATUS_CONFIG = {
  pending:   { label: "En attente",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  reviewed:  { label: "Examiné",     color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
  dismissed: { label: "Ignoré",      color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
} as const;

type FilterTab = "pending" | "reviewed" | "dismissed" | "all";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [feedback, setFeedback] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    setLoadError(null);
    getReports()
      .then(r => {
        if (r.error) { setLoadError(r.error); return; }
        if (r.reports) setReports(r.reports);
      })
      .catch(e => setLoadError((e as Error).message ?? "Erreur"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handle = (id: string, status: "reviewed" | "dismissed") => {
    startTransition(async () => {
      const res = await updateReportStatus(id, status);
      if (res.error) {
        setFeedback({ id, text: res.error, ok: false });
      } else {
        setFeedback({ id, text: status === "reviewed" ? "Marqué examiné ✓" : "Ignoré ✓", ok: true });
        load();
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  };

  const handleDelete = (report: Report) => {
    if (!confirm(`Supprimer définitivement ce contenu (${report.target_type}) ? Cette action est irréversible.`)) return;
    startTransition(async () => {
      const res = await deleteReportedContent(report.id, report.target_type, report.target_id);
      if (res.error) {
        setFeedback({ id: report.id, text: res.error, ok: false });
      } else {
        setFeedback({ id: report.id, text: "Contenu supprimé — signalement marqué examiné ✓", ok: true });
        load();
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  };

  const counts = {
    pending:   reports.filter(r => r.status === "pending").length,
    reviewed:  reports.filter(r => r.status === "reviewed").length,
    dismissed: reports.filter(r => r.status === "dismissed").length,
  };
  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", padding: "40px 32px 80px", maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>
          <ArrowLeft size={15} /> Admin
        </Link>
        <div style={{ width: 1, height: 16, background: "var(--border)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Flag size={16} color="#ef4444" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em" }}>Signalements</h1>
        </div>
        {counts.pending > 0 && (
          <span style={{ fontSize: 12, fontWeight: 800, background: "#ef4444", color: "#fff", borderRadius: 50, padding: "2px 8px" }}>
            {counts.pending} en attente
          </span>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "En attente",  value: counts.pending,   color: "#f59e0b" },
          { label: "Examinés",    value: counts.reviewed,  color: "#10b981" },
          { label: "Ignorés",     value: counts.dismissed, color: "#6b7280" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px" }}>
            <p style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: "-0.02em" }}>{value}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {([
          { v: "pending",   l: `En attente (${counts.pending})`   },
          { v: "reviewed",  l: `Examinés (${counts.reviewed})`    },
          { v: "dismissed", l: `Ignorés (${counts.dismissed})`    },
          { v: "all",       l: `Tous (${reports.length})`         },
        ] as const).map(({ v, l }) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid",
            borderColor: filter === v ? "#8b5cf6" : "var(--border2)",
            background: filter === v ? "rgba(139,92,246,0.1)" : "var(--surface2)",
            color: filter === v ? "#8b5cf6" : "var(--text-muted)",
          }}>
            {l}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Chargement…</p>
      ) : loadError ? (
        <div style={{ padding: "20px 24px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#ef4444", fontSize: 14 }}>
          ⚠ {loadError}
          <button onClick={load} style={{ marginLeft: 12, color: "#8b5cf6", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Réessayer</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
          <Clock size={40} style={{ opacity: 0.2, display: "block", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, fontWeight: 600 }}>Aucun signalement {filter !== "all" ? STATUS_CONFIG[filter as ReportStatus]?.label?.toLowerCase() : ""}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(report => {
            const tc = TYPE_CONFIG[report.target_type];
            const sc = STATUS_CONFIG[report.status];
            const isThis = feedback?.id === report.id;
            const date = new Date(report.created_at).toLocaleDateString("fr-CH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

            return (
              <div key={report.id} style={{
                background: "var(--surface)", border: `1px solid ${report.status === "pending" ? "rgba(245,158,11,0.25)" : "var(--border)"}`,
                borderRadius: 16, padding: "20px 24px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                  {/* Type + Category */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 50, background: tc.bg, color: tc.color }}>
                      {tc.icon} {tc.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                      {report.category}
                    </span>
                  </div>
                  {/* Status + Date */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 50, background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{date}</span>
                  </div>
                </div>

                {/* Reporter info */}
                {(report.reporter_email || report.reporter_name) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.12)", marginBottom: 10, flexWrap: "wrap" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User size={13} color="#8b5cf6" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {report.reporter_name && (
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 1 }}>
                          {report.reporter_name}
                        </p>
                      )}
                      {report.reporter_email && (
                        <a href={`mailto:${report.reporter_email}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
                          <Mail size={11} /> {report.reporter_email}
                        </a>
                      )}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Signalé par</span>
                  </div>
                )}

                {/* Target label */}
                {report.target_label && (
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)", marginBottom: 10, fontSize: 13, color: "var(--text)", lineHeight: 1.5, borderLeft: "3px solid var(--border2)" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Contenu signalé</span>
                    {report.target_label}
                  </div>
                )}

                {/* Explanation */}
                {report.explanation && (
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)", marginBottom: 10, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Explication du signalement</span>
                    {report.explanation}
                  </div>
                )}

                {/* Target ID + navigate link */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: report.status === "pending" ? 14 : 0, flexWrap: "wrap" }}>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                    ID cible : <span style={{ fontFamily: "monospace" }}>{report.target_id}</span>
                  </p>
                  {report.target_url && (
                    <Link href={report.target_url} target="_blank" style={{
                      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
                      color: "#8b5cf6", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
                      borderRadius: 8, padding: "5px 12px", textDecoration: "none",
                    }}>
                      <ExternalLink size={12} /> Voir le contenu
                    </Link>
                  )}
                </div>

                {/* Feedback */}
                {isThis && (
                  <p style={{ fontSize: 13, fontWeight: 600, color: feedback.ok ? "#10b981" : "#ef4444", marginTop: 8 }}>
                    {feedback.ok ? "✓ " : "✗ "}{feedback.text}
                  </p>
                )}

                {/* Actions */}
                {report.status === "pending" && (
                  <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                    <button onClick={() => handle(report.id, "reviewed")} disabled={isPending} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9,
                      background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                      color: "#10b981", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: isPending ? 0.6 : 1,
                    }}>
                      <CheckCircle size={15} /> Marquer examiné
                    </button>
                    <button onClick={() => handle(report.id, "dismissed")} disabled={isPending} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9,
                      background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.2)",
                      color: "#6b7280", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: isPending ? 0.6 : 1,
                    }}>
                      <XCircle size={15} /> Ignorer
                    </button>
                    <button onClick={() => handleDelete(report)} disabled={isPending} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9,
                      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                      color: "#ef4444", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: isPending ? 0.6 : 1,
                      marginLeft: "auto",
                    }}>
                      <Trash2 size={15} /> Supprimer le contenu
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
