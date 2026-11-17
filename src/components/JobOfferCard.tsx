"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, ExternalLink } from "lucide-react";
import { trackJobApplyClick } from "@/lib/actions/analytics";
import { libelleTaux, nomLangue } from "@/lib/offres";

type Job = {
  id: string;
  title: string;
  location: string | null;
  contract_type: string | null;
  work_mode: string | null;
  experience_level: string | null;
  salary_range?: string | null;
  apply_url: string | null;
  description?: string | null;
  missions?: string | null;
  requirements?: string | null;
  avantages?: string | null;
  taux_min?: number | null;
  taux_max?: number | null;
  entree?: string | null;
  langues?: string[] | null;
  created_at: string;
};

/** Un texte saisi une ligne par point devient une liste ; un paragraphe reste un paragraphe. */
function Section({ titre, texte }: { titre: string; texte: string | null | undefined }) {
  const lignes = (texte ?? "").split("\n").map(l => l.replace(/^\s*[-•*·]\s*/, "").trim()).filter(Boolean);
  if (lignes.length === 0) return null;
  return (
    <section style={{ marginBottom: 22 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>{titre}</h3>
      {lignes.length === 1 ? (
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>{lignes[0]}</p>
      ) : (
        <ul style={{ display: "grid", gap: 6, paddingLeft: 18, margin: 0 }}>
          {lignes.map((l, i) => <li key={i} style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{l}</li>)}
        </ul>
      )}
    </section>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 50,
      background: `${color}18`, color, border: `1px solid ${color}33`,
    }}>{label}</span>
  );
}

export function JobOfferCard({ job, companyName, companyId }: { job: Job; companyName: string; companyId: string }) {
  const [open, setOpen] = useState(false);
  const taux = libelleTaux(job.taux_min, job.taux_max);
  // Le clic sur « Postuler » compte pour l'entreprise (statistiques) et pour le
  // classement (une fois par compte). Rien n'est attendu : le site s'ouvre aussitôt.
  const auClicPostuler = () => {
    trackJobApplyClick(job.id, companyId).catch(() => {});
    fetch(`/api/company/${companyId}/offres`, { method: "POST", keepalive: true }).catch(() => {});
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const [mounted, setMounted] = useState(false);
  // Portail : il n'a pas d'équivalent dans le HTML du serveur.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      {/* Card — clickable to open modal */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Voir l'offre : ${job.title}`}
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
          {taux && <Badge label={taux} color="#0ea5e9" />}
          {job.contract_type && <Badge label={job.contract_type} color="#8b5cf6" />}
          {job.work_mode && <Badge label={job.work_mode} color="#10b981" />}
          {job.location && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
              <MapPin size={10} aria-hidden="true" /> {job.location}
            </span>
          )}
        </div>
        <p style={{ fontSize: 11, color: "#8b5cf6", marginTop: 8, fontWeight: 600 }}>Voir l&apos;offre →</p>
      </button>

      {/* Modal — portaled to document.body to escape sticky/transform stacking contexts */}
      {open && mounted && createPortal(
        <div
          className="job-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 10200,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.18s ease",
          }}
        >
          <div className="job-modal" role="dialog" aria-modal="true" aria-label="Offre d'emploi" style={{
            background: "var(--surface)", borderRadius: 20,
            border: "1px solid var(--border2)",
            width: "100%", maxWidth: 520, maxHeight: "85vh",
            overflowY: "auto", padding: "28px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            animation: "slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            scrollbarWidth: "thin",
            scrollbarColor: "var(--border2) transparent",
          } as React.CSSProperties}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{companyName}</p>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{job.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0, marginLeft: 12 }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {taux && <Badge label={taux} color="#0ea5e9" />}
              {job.contract_type && <Badge label={job.contract_type} color="#8b5cf6" />}
              {job.work_mode && <Badge label={job.work_mode} color="#10b981" />}
              {job.experience_level && <Badge label={job.experience_level} color="#f97316" />}
              {job.location && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", background: "var(--surface2)", borderRadius: 50, padding: "3px 12px", border: "1px solid var(--border2)" }}>
                  <MapPin size={12} aria-hidden="true" /> {job.location}
                </span>
              )}
            </div>

            {/* Aucun salaire affiché : décision de Luc du 2026-11-16. */}

            {/* Description */}
            {job.description && (
              <p style={{ fontSize: 14.5, color: "var(--text)", lineHeight: 1.7, marginBottom: 22, whiteSpace: "pre-wrap" }}>{job.description}</p>
            )}
            <Section titre="Vos missions" texte={job.missions} />
            <Section titre="Votre profil" texte={job.requirements} />
            <Section titre="Ce que nous offrons" texte={job.avantages} />
            {(job.entree || (job.langues?.length ?? 0) > 0) && (
              <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: 14, marginBottom: 22 }}>
                {job.entree && <><dt style={{ color: "var(--text-muted)" }}>Entrée en fonction</dt><dd style={{ margin: 0, fontWeight: 600 }}>{job.entree}</dd></>}
                {(job.langues?.length ?? 0) > 0 && <><dt style={{ color: "var(--text-muted)" }}>Langues</dt><dd style={{ margin: 0, fontWeight: 600 }}>{job.langues!.map(nomLangue).join(", ")}</dd></>}
              </dl>
            )}
            {!job.description && !job.missions && !job.requirements && !job.avantages && (
              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
                Cliquez sur « Postuler » pour lire l&apos;offre complète et envoyer votre candidature directement à l&apos;entreprise.
              </p>
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
                onClick={auClicPostuler}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "14px 0", borderRadius: 12,
                  background: "var(--brand)",
                  color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "1"}
              >
                Postuler <ExternalLink size={15} aria-hidden="true" />
              </a>
            ) : (
              <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                Aucun lien de candidature disponible pour le moment.
              </p>
            )}
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px) scale(0.97); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
        .job-modal::-webkit-scrollbar { width: 4px; }
        .job-modal::-webkit-scrollbar-track { background: transparent; }
        .job-modal::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
      `}</style>
    </>
  );
}
