"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/actions/auth";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, undefined);

  const sent = state !== undefined && !state?.error;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          workie
        </span>
      </Link>

      <div style={{ width: "100%", maxWidth: 400, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px" }}>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Mail size={24} color="#8b5cf6" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Email envoyé</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 24 }}>
              Si cette adresse est associée à un compte, vous recevrez un lien pour réinitialiser votre mot de passe dans les prochaines minutes.
            </p>
            <Link href="/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#8b5cf6", textDecoration: "none" }}>
              <ArrowLeft size={14} aria-hidden="true" /> Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 20 }}>
                <ArrowLeft size={13} aria-hidden="true" /> Retour
              </Link>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Mot de passe oublié</h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>

            <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label htmlFor="forgot-email" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  name="email"
                  required
                  placeholder="toi@email.com"
                  autoComplete="email"
                  style={{
                    width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)",
                    borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "var(--text)",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {state?.error && (
                <p role="alert" style={{ fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(239,68,68,0.2)" }}>
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
                {pending ? "Envoi..." : "Envoyer le lien"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
