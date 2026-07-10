"use client";

import { useActionState } from "react";

type ActionResult = { error?: string } | undefined;

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "12px 14px", fontSize: 16, color: "var(--text)",
  outline: "none", boxSizing: "border-box",
};

export function AuthFormWorkie({
  mode,
  action,
  googleAction,
  next = "/explore",
}: {
  mode: "login" | "signup";
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  googleAction: (formData: FormData) => Promise<void>;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div>
      {/* Google button */}
      <form action={googleAction}>
        <input type="hidden" name="next" value={next} />
        <button type="submit" style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, padding: "12px 16px",
          fontWeight: 600, fontSize: 14, color: "#111", cursor: "pointer", marginBottom: 20,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.05l3.02-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
          </svg>
          Continuer avec Google
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border2)" }} />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>ou</span>
        <div style={{ flex: 1, height: 1, background: "var(--border2)" }} />
      </div>

      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input type="hidden" name="next" value={next} />
        {mode === "signup" && (
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Pseudo</label>
            <input name="username" required placeholder="alex_workie" style={inp} />
          </div>
        )}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Email</label>
          <input type="email" name="email" required placeholder="toi@email.com" style={inp} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Mot de passe</label>
          <input type="password" name="password" required minLength={6} placeholder="••••••••" style={inp} />
        </div>

        {state?.error && (
          <p style={{ fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(239,68,68,0.2)" }}>
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} style={{
          width: "100%", background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          color: "#fff", fontWeight: 700, fontSize: 15, border: "none",
          borderRadius: 10, padding: "13px 0", cursor: "pointer", opacity: pending ? 0.6 : 1,
          marginTop: 4,
        }}>
          {pending ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}
