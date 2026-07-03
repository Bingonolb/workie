"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100dvh", background: "var(--bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 24px", textAlign: "center",
    }}>

      <Link href="/" style={{ textDecoration: "none", marginBottom: 48 }}>
        <span style={{
          fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          workie
        </span>
      </Link>

      <div style={{
        width: 64, height: 64, borderRadius: 16, marginBottom: 24,
        background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28,
      }}>
        ⚡
      </div>

      <h1 style={{
        fontSize: 24, fontWeight: 900, color: "var(--text)",
        letterSpacing: "-0.03em", marginBottom: 12,
      }}>
        Une erreur s&apos;est produite
      </h1>

      <p style={{
        fontSize: 15, color: "var(--text-muted)", maxWidth: 380,
        lineHeight: 1.6, marginBottom: 40,
      }}>
        Quelque chose s&apos;est mal passé de notre côté. Tu peux réessayer ou revenir à l&apos;accueil.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={reset} style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "13px 28px", borderRadius: 12, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          color: "#fff", fontWeight: 700, fontSize: 14,
        }}>
          Réessayer
        </button>
        <Link href="/explore" style={{
          display: "inline-flex", alignItems: "center",
          padding: "13px 24px", borderRadius: 12,
          background: "var(--surface)", border: "1px solid var(--border)",
          color: "var(--text-muted)", fontWeight: 600, fontSize: 14, textDecoration: "none",
        }}>
          Retour à l&apos;accueil
        </Link>
      </div>

    </div>
  );
}
