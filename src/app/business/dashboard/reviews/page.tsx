"use client";

import { useEffect, useState, useActionState } from "react";
import { getBusinessReviews } from "@/lib/actions/business";
import { replyToReview } from "@/lib/actions/business";
import { Star, MessageCircle, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

type Review = {
  id: string;
  job_title: string;
  employment_type: string;
  is_current: boolean;
  rating_overall: number;
  rating_management: number;
  rating_worklife: number;
  rating_culture: number;
  rating_career: number;
  would_recommend: string;
  title: string;
  pros: string;
  cons: string;
  content: string;
  created_at: string;
  company_replies: { id: string; content: string; created_at: string }[];
};

function StarRow({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ fontSize: 12, opacity: n <= Math.round(value) ? 1 : 0.2 }}>⭐</span>
      ))}
    </div>
  );
}

function ReplyForm({ reviewId, existing, onSuccess }: { reviewId: string; existing?: string; onSuccess?: () => void }) {
  const [state, action, pending] = useActionState(replyToReview, undefined);
  const [open, setOpen] = useState(!!existing);
  const [text, setText] = useState(existing ?? "");

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      onSuccess?.();
    }
  }, [state?.success]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#8b5cf6", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
        <MessageCircle size={14} /> {existing ? "Modifier la réponse" : "Répondre à cet avis"}
      </button>
    );
  }

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input type="hidden" name="review_id" value={reviewId} />
      {state?.success && (
        <p style={{ fontSize: 12, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
          <CheckCircle size={13} /> Réponse publiée
        </p>
      )}
      {state?.error && <p style={{ fontSize: 12, color: "#ef4444" }}>{state.error}</p>}
      <textarea
        name="content"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        placeholder="Rédigez votre réponse officielle en tant qu'employeur. Elle sera visible publiquement sous l'avis."
        style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--text)", resize: "vertical", boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={pending || text.trim().length < 10} style={{ padding: "9px 20px", borderRadius: 8, background: text.trim().length >= 10 ? "linear-gradient(135deg, #8b5cf6, #f97316)" : "var(--surface2)", color: text.trim().length >= 10 ? "#fff" : "var(--text-muted)", border: "none", fontWeight: 700, fontSize: 13, cursor: text.trim().length >= 10 ? "pointer" : "not-allowed", opacity: pending ? 0.6 : 1 }}>
          {pending ? "Publication..." : "Publier la réponse"}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ padding: "9px 16px", borderRadius: 8, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Annuler
        </button>
      </div>
      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Votre réponse sera affichée publiquement sous l'avis. Restez professionnel et constructif.</p>
    </form>
  );
}

function ReviewCard({ review, onReload }: { review: Review; onReload: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const reply = review.company_replies?.[0];
  const recColor = review.would_recommend === "oui" ? "#10b981" : review.would_recommend === "non" ? "#ef4444" : "#f59e0b";

  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
            <StarRow value={review.rating_overall} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{review.rating_overall?.toFixed(1)}/5</span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 50, background: `${recColor}22`, color: recColor, fontWeight: 600 }}>
              {review.would_recommend === "oui" ? "👍 Recommande" : review.would_recommend === "non" ? "👎 Ne recommande pas" : "🤔 Ça dépend"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{review.job_title}</span>
            {review.employment_type && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· {review.employment_type.toUpperCase()}</span>}
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· {review.is_current ? "Employé actuel" : "Ancien employé"}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· {new Date(review.created_at).toLocaleDateString("fr-CH", { month: "short", year: "numeric" })}</span>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0, padding: 4 }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border)" }}>
          {review.title && <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginTop: 16, marginBottom: 10 }}>"{review.title}"</p>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {review.pros && (
              <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginBottom: 6 }}>👍 Points positifs</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{review.pros}</p>
              </div>
            )}
            {review.cons && (
              <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>👎 Points négatifs</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{review.cons}</p>
              </div>
            )}
          </div>

          {review.content && <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 16 }}>{review.content}</p>}

          {/* Ratings breakdown */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { l: "Management", v: review.rating_management },
              { l: "Vie pro/perso", v: review.rating_worklife },
              { l: "Culture", v: review.rating_culture },
              { l: "Évolution", v: review.rating_career },
            ].filter(x => x.v).map(({ l, v }) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{l}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{Number(v).toFixed(1)}</span>
              </div>
            ))}
          </div>

          {/* Existing reply */}
          {reply && (
            <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6", marginBottom: 8 }}>✉️ Votre réponse officielle</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{reply.content}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{new Date(reply.created_at).toLocaleDateString("fr-CH")}</p>
            </div>
          )}

          <ReplyForm reviewId={review.id} existing={reply?.content} onSuccess={onReload} />
        </div>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unanswered">("all");

  const load = () => {
    getBusinessReviews().then(r => {
      setReviews((r.reviews as Review[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "unanswered"
    ? reviews.filter(r => !r.company_replies?.length)
    : reviews;

  return (
    <div style={{ padding: "36px 40px", maxWidth: 860 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 6 }}>Avis & Réponses</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Répondez aux avis pour montrer que vous êtes à l'écoute. Vos réponses sont visibles publiquement.</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[{ v: "all", l: `Tous (${reviews.length})` }, { v: "unanswered", l: `Sans réponse (${reviews.filter(r => !r.company_replies?.length).length})` }].map(({ v, l }) => (
          <button key={v} onClick={() => setFilter(v as "all" | "unanswered")} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: filter === v ? "#8b5cf6" : "var(--border2)", background: filter === v ? "rgba(139,92,246,0.1)" : "var(--surface2)", color: filter === v ? "#8b5cf6" : "var(--text-muted)" }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 80, background: "var(--surface2)", borderRadius: 16, border: "1px solid var(--border)" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <Star size={40} style={{ opacity: 0.3, margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, fontWeight: 600 }}>Aucun avis pour le moment</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>Les avis de vos employés apparaîtront ici.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(r => <ReviewCard key={r.id} review={r} onReload={load} />)}
        </div>
      )}
    </div>
  );
}
