"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/** Compte sans entreprise active, ou paiement tout juste reçu (webhook en route). */
export function SansEntreprise() {
  const bienvenue = useSearchParams().get("bienvenue");
  return (
    <div style={{ maxWidth: 560, margin: "40px auto 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 26, display: "grid", gap: 14 }}>
      {bienvenue ? (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Paiement reçu</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Nous activons votre abonnement, cela prend quelques secondes.
          </p>
          <button type="button" className="btn btn-encre" onClick={() => window.location.reload()}>Actualiser</button>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Aucune entreprise liée à ce compte</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Pour gérer une fiche, ouvrez-la sur Workie et choisissez « Gérer cette fiche ».
          </p>
          <Link href="/explore" className="btn btn-clair">Explorer les entreprises</Link>
        </>
      )}
    </div>
  );
}
