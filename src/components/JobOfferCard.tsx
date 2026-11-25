"use client";

import { useT, useLangue } from "@/i18n/FournisseurLangue";
import { LOCALE_INTL } from "@/i18n/config";
import { libelleContrat } from "@/i18n/contrat";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, ExternalLink, ChevronRight } from "lucide-react";
import { trackJobApplyClick } from "@/lib/actions/analytics";
import { libelleTaux, nomLangue } from "@/lib/offres";
import { useVerrouDefilement } from "@/lib/useVerrouDefilement";
import { texteRiche, lignesRiches } from "@/lib/texteRiche";
import { BoutonSignet } from "@/components/offres/BoutonSignet";

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
  source?: string | null;
};

const PUCE = /^\s*[-•*·–]\s+/;

/**
 * Le texte s'affiche tel que l'entreprise l'a saisi : ses retours à la ligne
 * et ses lignes vides sont gardés. Seules les lignes qu'elle a commencées par
 * « - » ou « • » deviennent des puces. Transformer chaque ligne en puce
 * coupait les phrases collées depuis un autre site en morceaux sans sens.
 */
function Section({ titre, texte }: { titre: string; texte: string | null | undefined }) {
  const blocs = (texte ?? "").replace(/\r/g, "").split(/\n\s*\n/).map(b => b.split("\n").filter(l => l.trim())).filter(b => b.length);
  if (blocs.length === 0) return null;
  const txt: React.CSSProperties = { fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.65 };
  return (
    <section style={{ marginBottom: 26 }}>
      <h3 className="jo-h3" style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>{titre}</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {blocs.map((lignes, i) => {
          // Lignes consécutives à puce : une liste ; le reste : du texte, retours gardés.
          const morceaux: { puces: boolean; lignes: string[] }[] = [];
          for (const l of lignes) {
            const puce = PUCE.test(l);
            const dernier = morceaux[morceaux.length - 1];
            if (dernier && dernier.puces === puce) dernier.lignes.push(puce ? l.replace(PUCE, "") : l);
            else morceaux.push({ puces: puce, lignes: [puce ? l.replace(PUCE, "") : l] });
          }
          return morceaux.map((m, j) => m.puces ? (
            <ul key={`${i}-${j}`} style={{ display: "grid", gap: 6, paddingLeft: 20, margin: 0 }}>
              {m.lignes.map((l, k) => <li key={k} style={txt}>{texteRiche(l)}</li>)}
            </ul>
          ) : (
            <p key={`${i}-${j}`} style={{ ...txt, margin: 0 }}>{lignesRiches(m.lignes.join("\n"))}</p>
          ));
        })}
      </div>
    </section>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="jo-badge" style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 50,
      background: `${color}18`, color, border: `1px solid ${color}33`,
    }}>{label}</span>
  );
}

/**
 * `ligne` : forme compacte, pour les longues listes (une ligne par offre,
 * séparées par un filet), comme sur les grands sites d'emploi.
 */
/**
 * `declencheur` : un autre élément pour ouvrir l'aperçu (la carte d'offre
 * d'Explorer). L'aperçu est le même partout : on lit l'offre chez Workie,
 * puis « En savoir plus » mène au site de l'employeur.
 */
export function JobOfferCard({ job, companyName, companyId, ligne = false, declencheur, ouvert, onFermer }: {
  job: Job; companyName: string; companyId: string; ligne?: boolean;
  declencheur?: (ouvrir: () => void) => React.ReactNode;
  /** Mode contrôlé (swipe) : l'appelant décide de l'ouverture, et est prévenu de la fermeture. */
  ouvert?: boolean; onFermer?: () => void;
}) {
  const t = useT();
  const langue = useLangue();
  const [ouvertInterne, setOuvertInterne] = useState(false);
  const controle = ouvert !== undefined;
  const open = controle ? ouvert : ouvertInterne;
  const setOpen = useCallback((v: boolean) => {
    if (controle) { if (!v) onFermer?.(); } else setOuvertInterne(v);
  }, [controle, onFermer]);
  const taux = libelleTaux(job.taux_min, job.taux_max, langue);
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
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);
  useVerrouDefilement(open);

  const [mounted, setMounted] = useState(false);
  // Portail : il n'a pas d'équivalent dans le HTML du serveur.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      {declencheur ? declencheur(() => setOpen(true)) : ligne ? (
        <button type="button" className="jo-ligne" onClick={() => setOpen(true)} aria-label={t("fiche.voirOffre", { titre: job.title })}>
          <span className="jo-ligne-texte">
            <span className="jo-ligne-titre">{job.title}</span>
            <span className="jo-ligne-meta">
              {[job.location, job.contract_type, taux].filter(Boolean).join(" · ")}
            </span>
          </span>
          <ChevronRight size={18} aria-hidden="true" className="jo-ligne-fleche" />
        </button>
      ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("fiche.voirOffre", { titre: job.title })}
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
        <p className="jo-titre" style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{job.title}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {taux && <Badge label={taux} color="#0ea5e9" />}
          {job.contract_type && <Badge label={libelleContrat(t, job.contract_type)!} color="#8b5cf6" />}
          {job.work_mode && <Badge label={job.work_mode} color="#10b981" />}
          {job.location && (
            <span className="jo-lieu" style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
              <MapPin size={11} aria-hidden="true" /> {job.location}
            </span>
          )}
        </div>
        <p className="jo-lien" style={{ fontSize: 11, color: "#8b5cf6", marginTop: 8, fontWeight: 600 }}>Voir l&apos;offre →</p>
      </button>
      )}

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
                <p className="jo-entreprise" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{companyName}</p>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{job.title}</h2>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 12 }}>
              <BoutonSignet offreId={job.id} titre={job.title} className="jo-signet" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("fiche.fermer")}
                style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}
              >
                <X size={16} aria-hidden="true" />
              </button>
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {taux && <Badge label={taux} color="#0ea5e9" />}
              {job.contract_type && <Badge label={libelleContrat(t, job.contract_type)!} color="#8b5cf6" />}
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
              <p className="jo-texte" style={{ fontSize: 14.5, color: "var(--text)", lineHeight: 1.7, marginBottom: 22 }}>{lignesRiches(job.description)}</p>
            )}
            <Section titre={t("fiche.missions")} texte={job.missions} />
            <Section titre={t("fiche.profil")} texte={job.requirements} />
            <Section titre={t("fiche.offrons")} texte={job.avantages} />
            {(job.entree || (job.langues?.length ?? 0) > 0) && (
              <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: 14, marginBottom: 22 }}>
                {job.entree && <><dt style={{ color: "var(--text-muted)" }}>{t("fiche.entree")}</dt><dd style={{ margin: 0, fontWeight: 600 }}>{job.entree}</dd></>}
                {(job.langues?.length ?? 0) > 0 && <><dt style={{ color: "var(--text-muted)" }}>{t("fiche.langues")}</dt><dd style={{ margin: 0, fontWeight: 600 }}>{job.langues!.map(l => nomLangue(l, langue)).join(", ")}</dd></>}
              </dl>
            )}
            {!job.description && !job.missions && !job.requirements && !job.avantages && (
              <p className="jo-texte" style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
                {job.source
                  ? <>{t("fiche.detailSite")}</>
                  : <>{t("fiche.detailPostuler")}</>}
              </p>
            )}

            {/* Date */}
            <p className="jo-date" style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 24 }}>
              {t("fiche.publiee", { date: new Date(job.created_at).toLocaleDateString(LOCALE_INTL[langue], { day: "numeric", month: "long", year: "numeric" }) })}
            </p>

            {/* CTA : collé en bas de la fenêtre, toujours à portée du pouce. */}
            <div className="job-cta" style={{ position: "sticky", bottom: -28, margin: "0 -28px -28px", padding: "14px 28px calc(20px + env(safe-area-inset-bottom))", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
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
                {/* Offre synchronisée : Workie n'en montre qu'un résumé, la
                    suite (et la candidature) est chez l'employeur. */}
                {job.source ? t("fiche.enSavoirPlus") : t("fiche.postuler")} <ExternalLink size={15} aria-hidden="true" />
              </a>
            ) : (
              <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                {t("fiche.aucunLien")}
              </p>
            )}
            </div>
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
        .job-modal { overscroll-behavior: contain; }
        /* Le signet, même forme que la croix voisine. */
        .jo-signet { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border2); background: var(--surface2); color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .jo-signet svg { width: 17px; height: 17px; }
        .jo-signet[aria-pressed="true"] { color: var(--brand); border-color: color-mix(in srgb, var(--brand) 45%, transparent); }
        .jo-signet:disabled { opacity: .4; cursor: default; }
        /* Sur téléphone, tailles des sites d'emploi ; l'ordinateur garde les tailles compactes. */
        @media (max-width: 640px) {
          .jo-titre { font-size: 15.5px !important; line-height: 1.35; margin-bottom: 8px !important; }
          .jo-badge { font-size: 12.5px !important; padding: 4px 11px !important; }
          .jo-lieu { font-size: 13px !important; gap: 4px !important; }
          .jo-lien { font-size: 13.5px !important; margin-top: 10px !important; }
          .jo-texte { font-size: 16px !important; }
          .jo-h3 { font-size: 17px !important; }
          .jo-date { font-size: 13px !important; }
          .jo-entreprise { font-size: 12.5px !important; }
          .job-modal li, .job-modal dl { font-size: 16px !important; }
          .job-cta a { font-size: 16px !important; }
        }
        /* Sur téléphone, l'offre prend tout l'écran : rien d'autre à voir ni à toucher. */
        @media (max-width: 640px) {
          .job-modal-overlay { padding: 0 !important; align-items: stretch !important; }
          .job-modal { max-width: none !important; max-height: none !important; height: 100% !important; height: 100dvh !important; border-radius: 0 !important; border: none !important; padding: calc(20px + env(safe-area-inset-top)) 20px 28px !important; animation: fadeIn 0.18s ease !important; }
          .job-cta { margin: 0 -20px -28px !important; padding-left: 20px !important; padding-right: 20px !important; }
          .job-modal button[aria-label={t("fiche.fermer")}], .job-modal .jo-signet { width: 44px !important; height: 44px !important; }
        }
      `}</style>
    </>
  );
}
