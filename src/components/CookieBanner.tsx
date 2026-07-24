"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Cookie-based consent: persists on iOS Safari even after localStorage is cleared (ITP).
const CONSENT_COOKIE = "wk_consent";
const MAX_AGE = 365 * 24 * 60 * 60;

function readConsent(): string | null {
  const match = document.cookie.split(";").find(c => c.trim().startsWith(`${CONSENT_COOKIE}=`));
  return match ? (match.split("=")[1]?.trim() ?? null) : null;
}
function writeConsent(value: string) {
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${MAX_AGE}; SameSite=Lax; path=/`;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
  }, []);

  const accept = () => { writeConsent("accepted"); setVisible(false); };
  const decline = () => { writeConsent("declined"); setVisible(false); };

  if (!visible) return null;

  return (
    <div role="dialog" aria-label="Consentement aux cookies" aria-live="polite" style={{
      position: "fixed",
      bottom: "calc(env(safe-area-inset-bottom) + 74px)",
      left: 16, right: 16,
      maxWidth: 560,
      margin: "0 auto",
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 16, padding: "16px 20px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      zIndex: 10050,
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12,
    }}>
      <p style={{ flex: 1, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, margin: 0, minWidth: 200 }}>
        Workie utilise uniquement des cookies essentiels (session, thème).{" "}
        <Link href="/confidentialite" style={{ color: "#8b5cf6", textDecoration: "none", fontWeight: 600 }}>
          En savoir plus
        </Link>
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button type="button" onClick={decline} style={{
          fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
          background: "none", border: "1px solid var(--border)",
          borderRadius: 8, padding: "7px 14px", cursor: "pointer",
        }}>
          Refuser
        </button>
        <button type="button" onClick={accept} style={{
          fontSize: 12, fontWeight: 700, color: "#fff",
          background: "#8b5cf6", border: "none",
          borderRadius: 8, padding: "7px 16px", cursor: "pointer",
        }}>
          Accepter
        </button>
      </div>
    </div>
  );
}
