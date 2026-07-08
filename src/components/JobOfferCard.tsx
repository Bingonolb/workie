"use client";

import { useState } from "react";
import { X, MapPin, ExternalLink } from "lucide-react";

type Job = {
  id: string;
  title: string;
  location: string | null;
  contract_type: string | null;
  work_mode: string | null;
  experience_level: string | null;
  salary_range: string | null;
  apply_url: string | null;
  description?: string | null;
  created_at: string;
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 50,
      background: `${color}18`, color, border: `1px solid ${color}33`,
    }}>{label}</span>
  );
}

export function JobOfferCard({ job, companyName }: { job: Job; companyName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Card — clickable to open modal */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%", textAlign: "left", borderRadius: 10,
          background: "var(--surface2)", padding: "12px 14px",
          border: "1px solid var(--border2)", cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.4)";
          (e.currentTarget as HTMLButtonElement).style.background = "var(--surface3,var(--surface2))";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border2)";
          (e.currentTarget as HTMLButtonElement).style.background = "var(--surface2)";
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{job.title}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {job.contract_type && <Badge label={job.contract_type} color="#8b5cf6" />}
          {job.work_mode && <Badge label={job.work_mode} color="#10b981" />}
          {job.location && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
              <MapPin size={10} /> {job.location}
            </span>
          )}
        </div>
        {job.salary_range && (
          <p style={{ fontSize: 11, color: "#10b981", fontWeight: 700, marginTop: 6 }}>💰 {job.salary_range}</p>
        )}
        <p style={{ fontSize: 11, color: "#8b5cf6", marginTop: 8, fontWeight: 600 }}>Voir l'offre →</p>
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.18s ease",
          }}
        >
          <div style={{
            background: "var(--surface)", borderRadius: 20,
            border: "1px solid var(--border2)",
            width: "100%", maxWidth: 520, maxHeight: "85vh",
            overflowY: "auto", padding: "28px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            animation: "slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{companyName}</p>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{job.title}</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0, marginLeft: 12 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {job.contract_type && <Badge label={job.contract_type} color="#8b5cf6" />}
              {job.work_mode && <Badge label={job.work_mode} color="#10b981" />}
              {job.experience_level && <Badge label={job.experience_level} color="#f97316" />}
              {job.location && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", background: "var(--surface2)", borderRadius: 50, padding: "3px 12px", border: "1px solid var(--border2)" }}>
                  <MapPin size={12} /> {job.location}
                </span>
              )}
            </div>

            {/* Salary */}
            {job.salary_range && (
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Salaire</p>
                <p style={{ fontSize: 18, fontWeight: 900, color: "#10b981" }}>{job.salary_range}</p>
              </div>
            )}

            {/* Description */}
            {job.description ? (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Description du poste</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{job.description}</p>
              </div>
            ) : (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  Clique sur "Postuler" pour voir tous les détails et envoyer ta candidature directement à l'entreprise.
                </p>
              </div>
            )}

            {/* Date */}
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 24 }}>
              Publiée le {new Date(job.created_at).toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            {/* CTA */}
            {job.apply_url ? (
              <a
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "14px 0", borderRadius: 12,
                  background: "linear-gradient(135deg, #8b5cf6, #f97316)",
                  color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "1"}
              >
                Postuler <ExternalLink size={15} />
              </a>
            ) : (
              <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                Aucun lien de candidature disponible pour le moment.
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px) scale(0.97); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
      `}</style>
    </>
  );
}
