import Link from "next/link";
import { signIn, signInWithGoogle } from "@/lib/actions/auth";
import { AuthFormWorkie } from "@/components/AuthFormWorkie";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams;
  const next = rawNext && /^\/(?![/\\])/.test(rawNext) ? rawNext : "/explore";
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
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Connexion</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
          Pas encore de compte ?{" "}
          <Link href="/signup" style={{ color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>S&apos;inscrire</Link>
          {" · "}
          <Link href="/forgot-password" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Mot de passe oublié ?</Link>
        </p>

        <AuthFormWorkie mode="login" action={signIn} googleAction={signInWithGoogle} next={next} />
      </div>
    </main>
  );
}
