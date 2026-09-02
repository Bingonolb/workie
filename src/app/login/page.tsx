import type { Metadata } from "next";
import Link from "next/link";
import { signIn, signInWithGoogle } from "@/lib/actions/auth";
import { AuthFormWorkie } from "@/components/AuthFormWorkie";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Connexion · Workie",
  description: "Connectez-vous à Workie pour accéder aux avis d'employés, salaires réels et offres d'emploi des entreprises suisses.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams;
  const next = rawNext && /^\/(?![/\\])/.test(rawNext) ? rawNext : "/explore";
  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <Logo taille={40} />
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
