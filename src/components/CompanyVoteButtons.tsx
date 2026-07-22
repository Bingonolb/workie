"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Skull } from "lucide-react";
import { addBoost, addPenalty } from "@/lib/actions/scores";

export function CompanyVoteButtons({
  companyId,
  isLoggedIn,
  isAdmin,
  isBusiness,
  penaltyCredits: initialCredits,
  initialBoosted,
  initialPenalized,
  initialScore,
  variant = "banner",
}: {
  companyId: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isBusiness: boolean;
  penaltyCredits: number;
  initialBoosted: boolean;
  initialPenalized: boolean;
  initialScore?: number;
  variant?: "banner" | "card";
}) {
  const [boosted, setBoosted] = useState(initialBoosted);
  const [penalized, setPenalized] = useState(initialPenalized);
  const [credits, setCredits] = useState(initialCredits);
  const [score, setScore] = useState(initialScore ?? null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showGuest, setShowGuest] = useState(false);
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const hadCreditsOnMount = useRef(initialCredits > 0);
  const router = useRouter();

  useEffect(() => {
    const anyOpen = showGuest || showUpgrade;
    if (!anyOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowGuest(false); setShowUpgrade(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showGuest, showUpgrade]);

  if (isBusiness) return null;

  const showToast = (msg: string, color: string) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 1800);
  };

  const handleBoost = async () => {
    if (!isLoggedIn) { setShowGuest(true); return; }
    const prev = boosted;
    const prevScore = score;
    const next = !boosted;
    setBoosted(next);
    if (score !== null) setScore(s => (s ?? 0) + (next ? 100 : -100));
    showToast(next ? "⚡ +100 pts ajoutés !" : "⚡ Boost retiré", "#8b5cf6");
    try {
      await addBoost(companyId);
      router.refresh();
    } catch {
      setBoosted(prev);
      setScore(prevScore);
      showToast("Erreur réseau — réessaie", "#ef4444");
    }
  };

  const handlePenalty = async () => {
    if (!isLoggedIn) { setShowGuest(true); return; }
    const unlocked = isAdmin || credits > 0;
    if (!unlocked) { setShowUpgrade(true); return; }
    const prev = penalized;
    const prevScore = score;
    const prevCredits = credits;
    const next = !penalized;
    setPenalized(next);
    if (score !== null) setScore(s => (s ?? 0) + (next ? -100 : 100));
    if (!isAdmin) {
      const newCredits = next ? credits - 1 : credits + 1;
      setCredits(newCredits);
      if (newCredits === 0 && next) setTimeout(() => setShowUpgrade(true), 1800);
    }
    showToast(next ? "💀 -100 pts appliqués" : "💀 Pénalité retirée", "#ef4444");
    try {
      await addPenalty(companyId);
      router.refresh();
    } catch {
      setPenalized(prev);
      setScore(prevScore);
      setCredits(prevCredits);
      showToast("Erreur réseau — réessaie", "#ef4444");
    }
  };

  const penaltyUnlocked = isAdmin || credits > 0;

  const boostStyle = variant === "card" ? {
    background: boosted ? "rgba(139,92,246,0.12)" : "var(--surface2)",
    border: boosted ? "1px solid rgba(139,92,246,0.4)" : "1px solid var(--border)",
    color: boosted ? "#8b5cf6" : "var(--text)",
    backdropFilter: "none", WebkitBackdropFilter: "none",
  } : {
    background: boosted ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.08)",
    border: boosted ? "1px solid rgba(139,92,246,0.6)" : "1px solid rgba(255,255,255,0.15)",
    color: boosted ? "#a78bfa" : "rgba(255,255,255,0.8)",
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
  };

  const penaltyStyle = variant === "card" ? {
    background: penalized ? "rgba(239,68,68,0.1)" : "var(--surface2)",
    border: penalized ? "1px solid rgba(239,68,68,0.4)" : "1px solid var(--border)",
    color: penalized ? "#ef4444" : penaltyUnlocked ? "var(--text)" : "var(--text-muted)",
    backdropFilter: "none", WebkitBackdropFilter: "none",
  } : {
    background: penalized ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.08)",
    border: penalized ? "1px solid rgba(239,68,68,0.55)" : "1px solid rgba(255,255,255,0.15)",
    color: penalized ? "#f87171" : penaltyUnlocked ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.45)",
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
          background: toast.color, color: "#fff", fontWeight: 800, fontSize: 14,
          padding: "9px 22px", borderRadius: 50, zIndex: 10020,
          boxShadow: `0 6px 24px ${toast.color}88`,
          animation: "companyVoteToast 1.8s cubic-bezier(0.34,1.56,0.64,1) forwards",
          whiteSpace: "nowrap", pointerEvents: "none",
        }}>
          {toast.msg}
        </div>
      )}

      {/* -100 button */}
      <button
        onClick={handlePenalty}
        title={penaltyUnlocked ? (penalized ? "Retirer la pénalité" : "-100 pts — pénaliser cette entreprise") : "Acheter des crédits pénalité"}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 16px", borderRadius: 12, cursor: "pointer",
          fontWeight: 700, fontSize: 13,
          minHeight: 44, transition: "all 0.18s",
          position: "relative",
          ...penaltyStyle,
        }}
      >
        <Skull size={14} />
        -100 pts
        {!isAdmin && credits > 0 && (
          <span style={{
            position: "absolute", top: -6, right: -6,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "#ef4444", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 900, padding: "0 3px",
          }}>{credits}</span>
        )}
        {!penaltyUnlocked && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            width: 16, height: 16, borderRadius: "50%",
            background: "rgba(15,15,20,0.85)", border: "1px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9,
          }}>🔒</span>
        )}
      </button>

      {/* +100 button */}
      <button
        onClick={handleBoost}
        title={boosted ? "Retirer le boost" : "+100 pts — booster cette entreprise"}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 16px", borderRadius: 12, cursor: "pointer",
          fontWeight: 700, fontSize: 13,
          minHeight: 44, transition: "all 0.18s",
          position: "relative",
          ...boostStyle,
        }}
      >
        <Zap size={14} fill={boosted ? (variant === "card" ? "#8b5cf6" : "#a78bfa") : "none"} />
        +100 pts
      </button>

      {/* Guest modal */}
      {showGuest && (
        <>
          <div onClick={() => setShowGuest(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 10010 }} />
          <div role="dialog" aria-modal="true" aria-label="Connexion requise" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 10011, width: "min(380px, 92vw)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Connecte-toi pour voter</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.6 }}>Les votes +100 et -100 pts impactent le classement des entreprises. Crée un compte gratuitement pour participer.</p>
            <a href="/login" style={{ display: "block", padding: "13px 0", borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none", marginBottom: 10 }}>Se connecter</a>
            <button onClick={() => setShowGuest(false)} style={{ background: "none", border: "none", fontSize: 13, color: "var(--text-muted)", cursor: "pointer", padding: "6px 0" }}>Fermer</button>
          </div>
        </>
      )}

      {/* Penalty upgrade modal */}
      {showUpgrade && (
        <>
          <div onClick={() => setShowUpgrade(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 10010 }} />
          <div role="dialog" aria-modal="true" aria-label="Débloquer le vote pénalité" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 10011, width: "min(420px, 92vw)", background: "var(--surface)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 24, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(249,115,22,0.07))", borderBottom: "1px solid rgba(239,68,68,0.15)", padding: "28px 28px 24px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>💀</div>
              <h2 style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: 6 }}>
                {credits === 0 && hadCreditsOnMount.current
                  ? <>Crédits <span style={{ color: "#ef4444" }}>-100 pts</span> épuisés</>
                  : <>Débloquer le vote <span style={{ color: "#ef4444" }}>-100 pts</span></>}
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {credits === 0 && hadCreditsOnMount.current
                  ? "Vous avez utilisé tous vos crédits. Rechargez pour continuer à signaler les entreprises toxiques."
                  : "Signalez les entreprises toxiques et impactez directement leur score sur Workie."}
              </p>
            </div>
            <div style={{ padding: "22px 28px 28px" }}>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  "10 utilisations — 1 CHF par entreprise",
                  "Impact direct sur leur score de réputation",
                  "1 pénalité max par entreprise (annulable)",
                  "Paiement sécurisé via Stripe",
                ].map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text)" }}>
                    <span style={{ width: 18, height: 18, borderRadius: 5, background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, color: "#10b981", fontWeight: 900 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              {checkoutError && (
                <p style={{ fontSize: 12, color: "#ef4444", textAlign: "center", marginBottom: 12, background: "rgba(239,68,68,0.06)", padding: "8px 12px", borderRadius: 8 }}>{checkoutError}</p>
              )}
              <button
                disabled={checkoutLoading}
                onClick={async () => {
                  setCheckoutError("");
                  setCheckoutLoading(true);
                  try {
                    const res = await fetch("/api/user/checkout-penalty", { method: "POST" });
                    const data = await res.json();
                    if (!res.ok || !data.url) { setCheckoutError(data.error ?? "Erreur lors du paiement."); return; }
                    window.location.href = data.url;
                  } catch { setCheckoutError("Erreur réseau. Réessaie."); }
                  finally { setCheckoutLoading(false); }
                }}
                style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: checkoutLoading ? "var(--surface2)" : "linear-gradient(135deg, #ef4444, #f97316)", color: checkoutLoading ? "var(--text-muted)" : "#fff", border: "none", fontWeight: 800, fontSize: 15, cursor: checkoutLoading ? "not-allowed" : "pointer" }}
              >
                {checkoutLoading ? "Redirection vers Stripe…" : "10 utilisations · 10 CHF"}
              </button>
              <button onClick={() => setShowUpgrade(false)} style={{ display: "block", width: "100%", background: "none", border: "none", fontSize: 13, color: "var(--text-muted)", cursor: "pointer", padding: "10px 0 0", textAlign: "center" }}>
                Pas maintenant
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes companyVoteToast {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.9); }
          18%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          75%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-4px) scale(0.97); }
        }
      `}</style>
    </>
  );
}
