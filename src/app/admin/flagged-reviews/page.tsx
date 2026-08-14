"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft, ShieldAlert, CheckCircle, Trash2, Clock,
  Globe, AlertTriangle,
} from "lucide-react";
import { getFlaggedReviews, approveReview, removeFlaggedReview, type FlaggedReview } from "@/lib/actions/reviews";

const FLAG_REASON_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ip_abuse: {
    label: "IP suspecte",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    icon: <Globe size={13} aria-hidden="true" />,
  },
  similar_content: {
    label: "Contenu similaire",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    icon: <AlertTriangle size={13} aria-hidden="true" />,
  },
};

export default function FlaggedReviewsPage() {
  const [reviews, setReviews] = useState<FlaggedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    setLoadError(null);
    getFlaggedReviews()
      .then(r => {
        if (r.error) { setLoadError(r.error); return; }
        if (r.reviews) setReviews(r.reviews);
      })
      .catch(e => setLoadError((e as Error).message ?? "Erreur"))
      .finally(() => setLoading(false));
  };

  // Chargement au montage : la liste vient d'une action serveur réservée aux
  // administrateurs, elle ne peut pas être rendue côté serveur ici.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const res = await approveReview(id);
      if (res.error) {
        setFeedback({ id, text: res.error, ok: false });
      } else {
        setFeedback({ id, text: "Avis publié ✓", ok: true });
        setReviews(prev => prev.filter(r => r.id !== id));
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  };

  const handleRemove = (r: FlaggedReview) => {
    if (!confirm(`Supprimer définitivement cet avis pour "${r.company_name}" ? Cette action est irréversible.`)) return;
    startTransition(async () => {
      const res = await removeFlaggedReview(r.id);
      if (res.error) {
        setFeedback({ id: r.id, text: res.error, ok: false });
      } else {
        setFeedback({ id: r.id, text: "Avis supprimé ✓", ok: true });
        setReviews(prev => prev.filter(x => x.id !== r.id));
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", padding: "40px 32px 80px", maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>
          <ArrowLeft size={15} aria-hidden="true" /> Admin
        </Link>
        <div style={{ width: 1, height: 16, background: "var(--border)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldAlert size={16} color="#f59e0b" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em" }}>Avis flaggés</h1>
        </div>
        {reviews.length > 0 && (
          <span style={{ fontSize: 12, fontWeight: 800, background: "#f59e0b", color: "#fff", borderRadius: 50, padding: "2px 8px" }}>
            {reviews.length} en attente
          </span>
        )}
      </div>

      {/* Explanation */}
      <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Ces avis ont été soumis mais retenus automatiquement avant publication. Deux raisons possibles :<br />
          <strong style={{ color: "var(--text)" }}>IP suspecte</strong> : même IP a déjà soumis un avis pour la même entreprise depuis un compte différent dans les 48h.<br />
          <strong style={{ color: "var(--text)" }}>Contenu similaire</strong> : similarité Jaccard ≥ 0.45 avec un avis existant sur la même entreprise.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Chargement…</p>
      ) : loadError ? (
        <div style={{ padding: "20px 24px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#ef4444", fontSize: 14 }}>
          ⚠ {loadError}
          <button type="button" onClick={load} style={{ marginLeft: 12, color: "#8b5cf6", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            Réessayer
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
          <Clock size={40} style={{ opacity: 0.2, display: "block", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, fontWeight: 600 }}>Aucun avis en attente de modération</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Tous les avis ont été traités.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {reviews.map(r => {
            const flagConfig = FLAG_REASON_CONFIG[r.flag_reason] ?? {
              label: r.flag_reason, color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: null,
            };
            const isThis = feedback?.id === r.id;
            const date = new Date(r.created_at).toLocaleDateString("fr-CH", {
              day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
            });

            return (
              <div key={r.id} style={{
                background: "var(--surface)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 16, padding: "20px 24px",
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 50,
                      background: flagConfig.bg, color: flagConfig.color,
                    }}>
                      {flagConfig.icon} {flagConfig.label}
                    </span>
                    <Link href={`/company/${r.company_id}`} target="_blank" style={{
                      fontSize: 14, fontWeight: 800, color: "var(--text)", textDecoration: "none",
                    }}>
                      {r.company_name} ↗
                    </Link>
                    {r.job_title && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· {r.job_title}</span>
                    )}
                    <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>★ {r.rating_overall}/5</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {r.submitter_ip && (
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)", background: "var(--surface2)", padding: "3px 8px", borderRadius: 6 }}>
                        {r.submitter_ip}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{date}</span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", marginBottom: 10, fontSize: 13, color: "var(--text-sub)", lineHeight: 1.7 }}>
                  {r.content}
                </div>

                {/* Pros / Cons */}
                {(r.pros || r.cons) && (
                  <div className="admin-grille-2" style={{ marginBottom: 10 }}>
                    {r.pros && (
                      <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8, padding: "10px 12px" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>👍 Points positifs</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{r.pros}</p>
                      </div>
                    )}
                    {r.cons && (
                      <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "10px 12px" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>👎 Points négatifs</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{r.cons}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback */}
                {isThis && (
                  <p style={{ fontSize: 13, fontWeight: 600, color: feedback.ok ? "#10b981" : "#ef4444", marginBottom: 10 }}>
                    {feedback.ok ? "✓ " : "✗ "}{feedback.text}
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleApprove(r.id)}
                    disabled={isPending}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
                      borderRadius: 9, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                      color: "#10b981", fontWeight: 700, fontSize: 13, cursor: "pointer",
                      opacity: isPending ? 0.6 : 1,
                    }}
                  >
                    <CheckCircle size={15} aria-hidden="true" /> Approuver et publier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(r)}
                    disabled={isPending}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
                      borderRadius: 9, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                      color: "#ef4444", fontWeight: 700, fontSize: 13, cursor: "pointer",
                      opacity: isPending ? 0.6 : 1, marginLeft: "auto",
                    }}
                  >
                    <Trash2 size={15} aria-hidden="true" /> Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
