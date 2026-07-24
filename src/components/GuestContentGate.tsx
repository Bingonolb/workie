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
      {/* Blurred content underneath */}
      <div
        aria-hidden="true"
        style={{
          filter: "blur(7px)",
          pointerEvents: "none",
          userSelect: "none",
          opacity: 0.55,
          maxHeight: 480,
          overflow: "hidden",
        }}
      >
        {children}
      </div>

      {/* Gradient fade from content to overlay */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "linear-gradient(to bottom, transparent 0%, var(--bg) 55%)",
        pointerEvents: "none",
      }} />

      {/* Signup CTA */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 24px 32px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.02em" }}>
          Connecte-toi pour tout lire
        </p>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24, maxWidth: 340 }}>
          Avis complets, salaires réels, retours d&apos;anciens employés — gratuit et 100% anonyme.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
          <Link href="/signup" style={{
            display: "block", padding: "14px", borderRadius: 14,
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none",
          }}>
            Créer un compte — gratuit
          </Link>
          <Link href="/login" style={{
            display: "block", padding: "13px",
            borderRadius: 14, border: "1.5px solid rgba(139,92,246,0.35)",
            color: "#8b5cf6", fontWeight: 600, fontSize: 14, textDecoration: "none",
          }}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
