import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Mail } from "lucide-react";
import { RenvoyerCourriel } from "./RenvoyerCourriel";
import { meta } from "@/i18n/meta";
import { tServeur } from "@/i18n/page";
import { riche } from "@/i18n/riche";

export const generateMetadata = () => meta({ titre: "mdp.confirmerTitre", indexer: false });

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const t = await tServeur();
  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <Logo taille={40} />
      </Link>

      <div style={{ width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px", textAlign: "center" }}>
        <Mail size={40} color="var(--brand)" strokeWidth={1.6} aria-hidden="true" style={{ marginBottom: 20 }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>
          {t("mdp.verifiez")}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 28 }}>
          {t("mdp.envoyeA")}{" "}
          <ConfirmEmail searchParams={searchParams} />
          {". "}
          {t("mdp.cliquez")}
        </p>

        <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 28, textAlign: "left" }}>
          <strong style={{ color: "var(--text)" }}>{t("mdp.pasRecu")}</strong><br />
          {riche(t("mdp.indesirables"), { em: c => <em>{c}</em> })}
        </div>

        <Renvoyer searchParams={searchParams} />


        <Link href="/login" style={{ fontSize: 13, color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
          {t("mdp.dejaCompte")}
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

async function Renvoyer({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const params = await searchParams;
  if (!params.email) return null;
  return <RenvoyerCourriel email={params.email} />;
}
