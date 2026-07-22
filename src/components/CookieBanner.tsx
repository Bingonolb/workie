"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_KEY = "workie_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_KEY)) setVisible(true);
    } catch { /* private browsing */ }
  }, []);

  const accept = () => {
    try { localStorage.setItem(COOKIE_KEY, "accepted"); } catch { /* */ }
    setVisible(false);
  };

  const decline = () => {
    try { localStorage.setItem(COOKIE_KEY, "declined"); } catch { /* */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
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
