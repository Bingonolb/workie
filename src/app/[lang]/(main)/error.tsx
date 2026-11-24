"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";

export default function MainError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div style={{
      minHeight: "60vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px", textAlign: "center",
    }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.02em" }}>
        Quelque chose s&apos;est mal passé
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24, maxWidth: 360, lineHeight: 1.6 }}>
        Une erreur inattendue s&apos;est produite. Notre équipe a été notifiée.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "11px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14,
            background: "#8b5cf6", color: "#fff", border: "none", cursor: "pointer",
          }}
        >
          Réessayer
        </button>
        <Link href="/explore" style={{
          padding: "11px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14,
          background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border2)",
          textDecoration: "none",
        }}>
          Explorer
        </Link>
      </div>
    </div>
  );
}
