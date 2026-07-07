"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          workie
        </span>
      </Link>

      <div style={{ width: "100%", maxWidth: 400, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Nouveau mot de passe</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
              Nouveau mot de passe
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="••••••••"
              style={{
                width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)",
                borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "var(--text)",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {state?.error && (
            <p style={{ fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(239,68,68,0.2)" }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{
              width: "100%", background: "linear-gradient(135deg, #8b5cf6, #f97316)",
              color: "#fff", fontWeight: 700, fontSize: 15, border: "none",
              borderRadius: 10, padding: "13px 0", cursor: "pointer", opacity: pending ? 0.6 : 1,
            }}
          >
            {pending ? "Enregistrement..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </main>
  );
}
