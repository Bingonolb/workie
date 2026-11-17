import type { Metadata } from "next";
import Link from "next/link";
import { signIn, signInWithGoogle } from "@/lib/actions/auth";
import { AuthFormWorkie } from "@/components/AuthFormWorkie";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous pour retrouver les employeurs suisses que vous avez gardés et vos recherches récentes.",
  robots: { index: false, follow: false },
};

/** Ce qui ramène ici après un lien d'e-mail ou une connexion Google ratés. */
const ERREURS: Record<string, string> = {
  oauth: "Ce lien n'est plus valide : il a expiré ou a déjà servi. Connectez-vous, ou demandez un nouveau lien.",
  invite: "Ce lien n'est plus valide : il a expiré ou a déjà servi. Connectez-vous, ou demandez un nouveau lien.",
  google: "La connexion avec Google n'a pas abouti. Réessayez, ou connectez-vous avec votre e-mail.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await searchParams;
  // Sans destination demandée, signIn choisit : espace entreprise ou Explorer.
  const demande = rawNext && /^\/(?![/\\])/.test(rawNext) && !rawNext.toLowerCase().includes("javascript:") ? rawNext : "";
  const next = demande || "/explore";
  const message = error ? ERREURS[error] : undefined;
  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <Logo taille={40} />
      </Link>

      <div className="auth-card" style={{ width: "100%", maxWidth: 400, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Connexion</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
          Pas encore de compte ?{" "}
          <Link href={next !== "/explore" ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>S&apos;inscrire</Link>
          {" · "}
          <Link href="/forgot-password" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Mot de passe oublié ?</Link>
        </p>

        {message && (
          <p role="alert" style={{ fontSize: 13.5, lineHeight: 1.5, color: "#b45309", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "10px 12px", marginBottom: 18 }}>
            {message}
          </p>
        )}
        <AuthFormWorkie mode="login" action={signIn} googleAction={signInWithGoogle} next={demande} />
      </div>
    </main>
  );
}
