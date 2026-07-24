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
    <>
      {/* Teaser: blurred but still recognisable */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div
          aria-hidden="true"
          style={{
            filter: "blur(3px)",
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.72,
            maxHeight: 220,
            overflow: "hidden",
          }}
        >
          {children}
        </div>
        {/* Quick fade into the background */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent 25%, var(--bg) 82%)",
          pointerEvents: "none",
        }} />
      </div>

      {/* CTA — normal flow, no empty space, always visible */}
      <div className="guest-gate-cta">
        <p style={{ fontSize: 21, fontWeight: 900, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.025em" }}>
          Accède aux avis complets
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, maxWidth: 300, lineHeight: 1.65 }}>
          Salaires réels, retours d&apos;anciens employés — gratuit et 100% anonyme.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
          <Link href="/signup" style={{
            display: "block", padding: "13px 20px", borderRadius: 12,
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}>
            Créer un compte — gratuit
          </Link>
          <Link href="/login" style={{
            display: "block", padding: "12px 20px", borderRadius: 12,
            border: "1px solid var(--border2)",
            color: "var(--text-sub)", fontWeight: 600, fontSize: 13, textDecoration: "none",
          }}>
            Se connecter
          </Link>
        </div>
      </div>
    </>
  );
}
