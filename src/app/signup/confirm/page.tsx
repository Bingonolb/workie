import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Confirmez votre adresse · Workie",
};

export default function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <Logo taille={40} />
      </Link>

      <div style={{ width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>📬</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>
          Vérifiez votre boîte mail
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 28 }}>
          On a envoyé un lien de confirmation à{" "}
          <ConfirmEmail searchParams={searchParams} />
          {". "}
          Cliquez dessus pour activer votre compte.
        </p>

        <div style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.18)", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 28, textAlign: "left" }}>
          <strong style={{ color: "var(--text)" }}>Tu ne vois pas l&apos;email ?</strong><br />
          Vérifiez votre dossier de courriers indésirables. L&apos;email vient de <em>noreply@workie.ch</em>.
        </div>

        <Link href="/login" style={{ fontSize: 13, color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>
          Déjà un compte ? Se connecter →
        </Link>
      </div>
    </main>
  );
}

async function ConfirmEmail({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const params = await searchParams;
  if (!params.email) return null;
  return <strong style={{ color: "var(--text)" }}>{params.email}</strong>;
}
