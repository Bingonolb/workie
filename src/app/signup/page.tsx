import type { Metadata } from "next";
import Link from "next/link";
import { signUp, signInWithGoogle } from "@/lib/actions/auth";
import { AuthFormWorkie } from "@/components/AuthFormWorkie";

export const metadata: Metadata = {
  title: "Créer un compte · Workie",
  description: "Rejoins Workie gratuitement. Accède aux avis anonymes d'employés, aux salaires réels et donne ton avis sur ton employeur.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <span style={{
          fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          workie
        </span>
      </Link>

      <div className="auth-card" style={{ width: "100%", maxWidth: 400, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Créer un compte</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
          Déjà un compte ?{" "}
          <Link href="/login" style={{ color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>Se connecter</Link>
        </p>

        <AuthFormWorkie mode="signup" action={signUp} googleAction={signInWithGoogle} />
      </div>
    </main>
  );
}
