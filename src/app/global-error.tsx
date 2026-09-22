"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * La page qu'on voit quand plus rien ne répond, hors ligne comprise.
 *
 * Elle remplace le gabarit racine tout entier : ni la feuille de style du
 * site, ni ses jetons de couleur, ni son composant de logotype ne sont
 * disponibles ici. Tout est donc écrit sur place, et le logotype est l'image
 * du site plutôt que le composant.
 *
 * Elle portait encore l'ancienne identité : un emoji d'alerte, un bouton en
 * dégradé violet vers orange, et une police système. C'est pourtant la page
 * qu'on voit dans le métro, sans réseau, au pire moment.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // Sans réseau, le message doit le dire. « Une erreur inattendue » laissait
  // croire que le site était cassé, alors que c'est la connexion.
  const horsLigne = typeof navigator !== "undefined" && navigator.onLine === false;

  return (
    <html lang="fr">
      <body style={{
        margin: 0, minHeight: "100dvh", background: "#0c0d12", color: "#eceef4",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}>
        <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: 380 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/workie-logo.svg" alt="Workie" style={{ height: 30, width: "auto", marginBottom: 36 }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
            {horsLigne ? "Vous êtes hors ligne" : "Un instant"}
          </h1>
          <p style={{ fontSize: 14.5, color: "#8b90a3", lineHeight: 1.6, margin: "0 0 28px" }}>
            {horsLigne
              ? "Workie reviendra dès que la connexion sera rétablie."
              : "Quelque chose n'a pas répondu. Réessayez dans un moment."}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0 26px", minHeight: 46, borderRadius: 11, border: "none", cursor: "pointer",
              background: "#eceef4", color: "#0c0d12", fontWeight: 700, fontSize: 14.5, fontFamily: "inherit",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
