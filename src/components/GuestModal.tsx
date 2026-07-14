"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signInWithGoogle } from "@/lib/actions/auth";

export function GuestModal({ reviewCount, open }: { reviewCount: number; open?: boolean }) {
  const [timerVisible, setTimerVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  const visible = !dismissed && (open !== undefined ? open : timerVisible);

  useEffect(() => {
    if (open !== undefined) return;
    const timer = setTimeout(() => setTimerVisible(true), 800);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <>
      {/* Overlay — click to dismiss */}
      <div
        onClick={() => setDismissed(true)}
        style={{
          position: "fixed", inset: 0, zIndex: 10002,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: visible ? "auto" : "none",
          cursor: "pointer",
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10003,
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
      }}>
        <div style={{
          background: "var(--surface)",
          borderRadius: "24px 24px 0 0",
          borderTop: "1px solid var(--border2)",
          padding: "12px 24px 40px",
          maxWidth: 560,
          margin: "0 auto",
        }}>
          {/* Handle */}
          <div style={{
            width: 40, height: 4, borderRadius: 2,
            background: "var(--border2)",
            margin: "0 auto 28px",
          }} />

          {/* Header */}
          <div style={{ marginBottom: 8 }}>
            <p style={{
              fontSize: 22, fontWeight: 900, color: "var(--text)",
              letterSpacing: "-0.03em", marginBottom: 8,
            }}>
              Connecte-toi pour continuer
            </p>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {reviewCount > 1
                ? `Encore ${reviewCount - 1} avis à lire — salaires, retours d'expérience et conseils d'anciens employés.`
                : "Accède aux avis complets, salaires réels et donne le tien — c'est 100% anonyme."}
            </p>
          </div>

          <div style={{ margin: "24px 0 0", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Google */}
            <form action={signInWithGoogle}>
              <input type="hidden" name="next" value={pathname} />
              <button type="submit" style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 14,
                padding: "14px 20px", fontWeight: 600, fontSize: 15, color: "#111",
                cursor: "pointer",
              }}>
                <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.05l3.02-2.33z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
                </svg>
                Continuer avec Google
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border2)" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>ou</span>
              <div style={{ flex: 1, height: 1, background: "var(--border2)" }} />
            </div>

            {/* Email signup */}
            <Link href="/signup" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, #8b5cf6, #f97316)",
              color: "#fff", fontWeight: 700, fontSize: 15,
              borderRadius: 14, padding: "14px 20px", textDecoration: "none",
            }}>
              Créer un compte — gratuit
            </Link>

            {/* Login */}
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Déjà un compte ?{" "}
              <Link href="/login" style={{ color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
