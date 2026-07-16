"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "24px", textAlign: "center",
    }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>
        Quelque chose s&apos;est mal passé
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28, maxWidth: 400, lineHeight: 1.6 }}>
        Une erreur inattendue s&apos;est produite. Nos équipes en sont informées.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14,
            background: "#8b5cf6", color: "#fff", border: "none", cursor: "pointer",
          }}
        >
          Réessayer
        </button>
        <Link href="/explore" style={{
          padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14,
          background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border2)",
          textDecoration: "none",
        }}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
