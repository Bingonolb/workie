"use client";

import { useT } from "@/i18n/FournisseurLangue";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * Erreur dans une page, le reste du site tenant encore.
 *
 * Mêmes règles que partout : le logotype, une action principale à l'encre,
 * une seconde qui se propose sans insister. L'emoji d'alerte et le violet en
 * dur sont partis avec l'ancienne identité.
 */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const horsLigne = typeof navigator !== "undefined" && navigator.onLine === false;

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "24px", textAlign: "center",
    }}>
      <div style={{ marginBottom: 36 }}><Logo taille={28} /></div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>
        {horsLigne ? t("erreur.horsLigne") : t("erreur.unInstant")}
      </h1>
      <p style={{ fontSize: 14.5, color: "var(--text-muted)", marginBottom: 28, maxWidth: 360, lineHeight: 1.6 }}>
        {horsLigne
          ? t("erreur.horsLigneAide")
          : t("erreur.pasRepondu")}
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button type="button" onClick={reset} className="btn btn-encre">{t("erreur.reessayer")}</button>
        <Link href="/explore" className="btn btn-clair">{t("erreur.explorer")}</Link>
      </div>
    </div>
  );
}
