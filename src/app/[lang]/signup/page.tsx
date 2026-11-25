import type { Metadata } from "next";
import Link from "next/link";
import { signUp, signInWithGoogle } from "@/lib/actions/auth";
import { AuthFormWorkie } from "@/components/AuthFormWorkie";
import { Logo } from "@/components/Logo";
import { tServeur } from "@/i18n/page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await tServeur();
  return { title: t("auth.creerCompte"), description: t("auth.metaInscription"), robots: { index: false, follow: false } };
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: brut } = await searchParams;
  const next = brut && /^\/(?![/\\])/.test(brut) ? brut : "/explore";
  const t = await tServeur();
  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <Logo taille={40} />
      </Link>

      <div className="auth-card" style={{ width: "100%", maxWidth: 400, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{t("auth.creerCompte")}</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
          {t("auth.dejaCompte")}{" "}
          <Link href={next !== "/explore" ? `/login?next=${encodeURIComponent(next)}` : "/login"} style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>{t("auth.seConnecter")}</Link>
        </p>

        <AuthFormWorkie mode="signup" action={signUp} googleAction={signInWithGoogle} next={next} />
      </div>
    </main>
  );
}
