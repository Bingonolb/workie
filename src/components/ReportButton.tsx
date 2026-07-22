"use client";

import { useState, useTransition, useEffect } from "react";
import { Flag, X, ChevronRight, CheckCircle } from "lucide-react";
import { submitReport, type ReportTargetType } from "@/lib/actions/reports";

const CATEGORIES: Record<ReportTargetType, string[]> = {
  review: [
    "Faux avis / avis fictif",
    "Contenu offensant ou haineux",
    "Harcèlement ou menaces",
    "Spam ou publicité",
    "Informations incorrectes",
    "Conflit d'intérêts",
    "Autre",
  ],
  company: [
    "Informations incorrectes",
    "Entreprise fictive ou frauduleuse",
    "Contenu offensant",
    "Spam",
    "Autre",
  ],
  profile: [
    "Faux profil",
    "Usurpation d'identité",
    "Contenu inapproprié",
    "Spam",
    "Autre",
  ],
};

const TYPE_LABELS: Record<ReportTargetType, string> = {
  review: "cet avis",
  company: "cette entreprise",
  profile: "ce profil",
};

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  isLoggedIn?: boolean;
  variant?: "icon" | "link" | "button";
}

export function ReportButton({
  targetType,
  targetId,
  targetLabel,
  isLoggedIn = false,
  variant = "link",
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [explanation, setExplanation] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const categories = CATEGORIES[targetType];

  function openModal() {
    if (!isLoggedIn) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    setOpen(true);
    setDone(false);
    setCategory("");
    setExplanation("");
    setError("");
  }

  function close() {
    if (isPending) return;
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isPending]);

  function submit() {
    if (!category) { setError("Veuillez sélectionner une catégorie."); return; }
    setError("");
    startTransition(async () => {
      const res = await submitReport({ targetType, targetId, targetLabel, category, explanation });
      if (res.error) { setError(res.error); return; }
      setDone(true);
    });
  }

  const trigger = variant === "icon" ? (
    <button type="button" onClick={openModal} title="Signaler" aria-label="Signaler ce contenu" style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      width: 32, height: 32, borderRadius: 8, border: "none",
      background: "transparent", cursor: "pointer", color: "var(--text-muted)",
      transition: "color 0.15s, background 0.15s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <Flag size={14} aria-hidden="true" />
    </button>
  ) : variant === "button" ? (
    <button type="button" onClick={openModal} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "8px 16px", borderRadius: 9, border: "1px solid var(--border2)",
      background: "var(--surface2)", color: "var(--text-muted)", fontSize: 13,
      fontWeight: 600, cursor: "pointer",
    }}>
      <Flag size={13} aria-hidden="true" /> Signaler
    </button>
  ) : (
    <button type="button" onClick={openModal} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "none", border: "none", cursor: "pointer",
      fontSize: 12, color: "var(--text-muted)", fontWeight: 500, padding: 0,
      opacity: 0.7, transition: "opacity 0.15s, color 0.15s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
    >
      <Flag size={11} aria-hidden="true" /> Signaler
    </button>
  );

  return (
    <>
      {trigger}

      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) close(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 10200,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Signaler un contenu"
            style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 20, width: "100%", maxWidth: 480,
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
              overflow: "hidden",
            }}>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px 0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(239,68,68,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Flag size={16} color="#ef4444" aria-hidden="true" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>
                    Signaler {TYPE_LABELS[targetType]}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
                    Votre signalement sera examiné par notre équipe
                  </p>
                </div>
              </div>
              <button type="button" onClick={close} disabled={isPending} aria-label="Fermer" style={{
                width: 32, height: 32, borderRadius: 8, border: "none",
                background: "var(--surface2)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-muted)", flexShrink: 0,
              }}>
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            <div style={{ padding: "20px 24px 24px" }}>
              {done ? (
                /* ── Confirmation ── */
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                  }}>
                    <CheckCircle size={24} color="#10b981" aria-hidden="true" />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
                    Signalement envoyé
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
                    Merci. Notre équipe examinera ce signalement et prendra les mesures appropriées.
                  </p>
                  <button type="button" onClick={close} style={{
                    padding: "10px 28px", borderRadius: 10,
                    background: "var(--surface2)", border: "1px solid var(--border2)",
                    color: "var(--text)", fontWeight: 600, fontSize: 14, cursor: "pointer",
                  }}>
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  {/* ── Catégorie ── */}
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                    Motif du signalement *
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
                    {categories.map(cat => (
                      <button key={cat} type="button" onClick={() => setCategory(cat)} aria-pressed={category === cat} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "11px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                        border: category === cat
                          ? "1.5px solid #8b5cf6"
                          : "1px solid var(--border2)",
                        background: category === cat
                          ? "rgba(139,92,246,0.08)"
                          : "var(--surface2)",
                        transition: "all 0.12s",
                      }}>
                        <span style={{ fontSize: 13, fontWeight: category === cat ? 700 : 500, color: category === cat ? "#8b5cf6" : "var(--text)" }}>
                          {cat}
                        </span>
                        {category === cat && (
                          <div style={{
                            width: 18, height: 18, borderRadius: "50%", background: "#8b5cf6",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 3.5L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* ── Explication optionnelle ── */}
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Détails <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· optionnel</span>
                  </p>
                  <textarea
                    value={explanation}
                    onChange={e => setExplanation(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Expliquez brièvement pourquoi vous signalez ce contenu…"
                    style={{
                      width: "100%", borderRadius: 10, padding: "10px 14px", fontSize: 13,
                      border: "1px solid var(--border2)", background: "var(--surface2)",
                      color: "var(--text)", outline: "none", resize: "none", lineHeight: 1.55,
                      boxSizing: "border-box", fontFamily: "inherit",
                    }}
                  />
                  <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right", marginTop: 4, marginBottom: 16 }}>
                    {explanation.length}/500
                  </p>

                  {error && (
                    <p role="alert" style={{ fontSize: 13, color: "#ef4444", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      ⚠ {error}
                    </p>
                  )}

                  {/* ── Actions ── */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" onClick={close} disabled={isPending} style={{
                      flex: 0, padding: "12px 20px", borderRadius: 10,
                      border: "1px solid var(--border2)", background: "var(--surface2)",
                      color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}>
                      Annuler
                    </button>
                    <button type="button" onClick={submit} disabled={isPending || !category} style={{
                      flex: 1, padding: "12px 20px", borderRadius: 10, border: "none",
                      background: !category || isPending
                        ? "var(--surface2)"
                        : "linear-gradient(135deg, #ef4444, #f97316)",
                      color: !category || isPending ? "var(--text-muted)" : "#fff",
                      fontWeight: 700, fontSize: 14, cursor: !category ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      transition: "all 0.15s",
                    }}>
                      {isPending ? "Envoi…" : <><span>Envoyer le signalement</span><ChevronRight size={15} aria-hidden="true" /></>}
                    </button>
                  </div>

                  <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
                    Les signalements abusifs peuvent entraîner une suspension de compte.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
