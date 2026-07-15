"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryTestPage() {
  const [sent, setSent] = useState<string | null>(null);

  function triggerClientError() {
    try {
      throw new Error("[Workie Sentry Test] Client-side error intentionnelle");
    } catch (e) {
      Sentry.captureException(e);
      setSent("✅ Erreur client envoyée à Sentry");
    }
  }

  async function triggerServerError() {
    const res = await fetch("/api/sentry-test");
    if (res.ok) setSent("✅ Erreur serveur envoyée à Sentry");
    else setSent("❌ Route API manquante");
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>Sentry — page de test</h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Ces boutons envoient des erreurs de test dans ton dashboard Sentry.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={triggerClientError}
          style={{ padding: "12px 24px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          Envoyer erreur client
        </button>
        <button
          onClick={triggerServerError}
          style={{ padding: "12px 24px", background: "#f97316", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          Envoyer erreur serveur
        </button>
      </div>
      {sent && <p style={{ fontSize: 14, color: "#10b981", fontWeight: 700 }}>{sent}</p>}
    </main>
  );
}
