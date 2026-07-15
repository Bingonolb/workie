"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ background: "#0f0e13", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh", margin: 0, fontFamily: "-apple-system, sans-serif" }}>
        <div style={{ textAlign: "center", padding: "40px 24px" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>⚠️</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f5f4f8", marginBottom: 10 }}>
            Une erreur inattendue s&apos;est produite
          </h1>
          <p style={{ fontSize: 14, color: "#9590a8", marginBottom: 28, lineHeight: 1.6 }}>
            Notre équipe a été notifiée automatiquement.
          </p>
          <button
            onClick={reset}
            style={{ padding: "12px 28px", background: "linear-gradient(135deg,#8b5cf6,#f97316)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
