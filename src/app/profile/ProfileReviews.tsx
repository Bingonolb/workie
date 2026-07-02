"use client";

import Link from "next/link";
import { Star } from "lucide-react";

const EMPLOYMENT_LABELS: Record<string, string> = {
  cdi: "CDI", cdd: "CDD", stage: "Stage", alternance: "Alternance", freelance: "Freelance",
};

type ReviewRow = {
  id: string;
  company_id: string;
  company_name: string;
  rating_overall: number;
  job_title: string | null;
  employment_type: string | null;
  salary_chf: number | null;
  is_current: boolean;
  start_year: number | null;
  end_year: number | null;
  title: string | null;
  content: string;
  created_at: string;
};

export function ProfileReviews({ reviews }: { reviews: ReviewRow[] }) {
  if (reviews.length === 0) {
    return (
      <div style={{ padding: "56px 24px", textAlign: "center", color: "var(--text-muted)" }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Aucun avis posté</p>
        <p style={{ fontSize: 13, marginBottom: 24 }}>Partage ton expérience pour aider la communauté.</p>
        <Link href="/explore" style={{
          display: "inline-block", padding: "10px 24px", borderRadius: 6,
          background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 13,
        }}>
          Explorer les entreprises
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Table header */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 90px 80px 80px 80px",
        padding: "8px 20px", borderBottom: "1px solid var(--border)",
      }}>
        {["Entreprise / Poste", "Contrat", "Note", "Salaire", "Date"].map((h, i) => (
          <span key={h} style={{
            fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
            letterSpacing: "0.06em", textTransform: "uppercase",
            textAlign: i >= 2 ? "right" : "left",
          }}>{h}</span>
        ))}
      </div>

      {reviews.map(r => {
        const duration = r.is_current
          ? r.start_year ? `${r.start_year} → auj.` : "En poste"
          : r.start_year && r.end_year ? `${r.start_year} – ${r.end_year}` : null;

        return (
          <Link key={r.id} href={`/company/${r.company_id}`} style={{ textDecoration: "none" }}>
            <div
              style={{
                display: "grid", gridTemplateColumns: "1fr 90px 80px 80px 80px",
                alignItems: "center", padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                transition: "background 0.12s", cursor: "pointer",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {/* Company + job */}
              <div style={{ minWidth: 0, paddingRight: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.company_name}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {r.job_title && (
                    <span style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.job_title}
                    </span>
                  )}
                  {duration && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, opacity: 0.6 }}>· {duration}</span>
                  )}
                </div>
                {r.title && (
                  <p style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 2, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    "{r.title}"
                  </p>
                )}
              </div>

              {/* Contract */}
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: "var(--text-sub)", background: "var(--surface3)",
                border: "1px solid var(--border)", borderRadius: 4,
                padding: "3px 8px", display: "inline-block",
                textAlign: "center", whiteSpace: "nowrap",
              }}>
                {r.employment_type ? (EMPLOYMENT_LABELS[r.employment_type] ?? r.employment_type) : "—"}
              </span>

              {/* Rating */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                <Star size={11} fill="#f59e0b" color="#f59e0b" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
                  {Number(r.rating_overall).toFixed(1)}
                </span>
              </div>

              {/* Salary */}
              <div style={{ textAlign: "right" }}>
                {r.salary_chf ? (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981", fontVariantNumeric: "tabular-nums" }}>
                    {Math.round(r.salary_chf / 1000)}k
                  </span>
                ) : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>}
              </div>

              {/* Date */}
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {new Date(r.created_at).toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
