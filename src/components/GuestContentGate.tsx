"use client";

import Link from "next/link";

export function GuestContentGate({
  isGuest,
  children,
}: {
  isGuest: boolean;
  children: React.ReactNode;
}) {
  if (!isGuest) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      {/* Blurred teaser */}
      <div
        aria-hidden="true"
        style={{
          filter: "blur(5px)",
          pointerEvents: "none",
          userSelect: "none",
          opacity: 0.45,
          maxHeight: 300,
          overflow: "hidden",
        }}
      >
        {children}
      </div>

      {/* Gradient: transparent → bg, fades the blurred content out quickly */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "linear-gradient(to bottom, transparent 0%, var(--bg) 42%)",
        pointerEvents: "none",
      }} />

      {/* CTA card — sits below the blurred area, fully in view */}
      <div style={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 24px 48px",
        textAlign: "center",
      }}>
        {/* Lock badge */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, marginBottom: 20,
          background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(139,92,246,0.35)",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.025em" }}>
          Connecte-toi pour tout voir
        </p>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28, maxWidth: 340, lineHeight: 1.6 }}>
          Avis complets, salaires réels, retours d&apos;anciens employés — gratuit et 100% anonyme.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}>
          <Link href="/signup" style={{
            display: "block", padding: "14px", borderRadius: 12,
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none",
            boxShadow: "0 4px 16px rgba(139,92,246,0.3)",
          }}>
            Créer un compte — gratuit
          </Link>
          <Link href="/login" style={{
            display: "block", padding: "13px", borderRadius: 12,
            border: "1.5px solid var(--border2)",
            color: "var(--text)", fontWeight: 600, fontSize: 14, textDecoration: "none",
          }}>
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
