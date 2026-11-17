"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { revendicationOuverte } from "@/lib/ouverture";

/**
 * Compte sans entreprise active.
 *
 * Juste après le paiement (?bienvenue=1), Stripe prévient le site quelques
 * secondes plus tard : la page se recharge seule jusqu'à l'activation, au lieu
 * de demander à la personne de cliquer « Actualiser » sans savoir quand.
 */
export function SansEntreprise() {
  const bienvenue = useSearchParams().get("bienvenue");
  const lireEssais = () => { try { return Number(sessionStorage.getItem("workie_attente_abo") ?? 0); } catch { return 0; } };
  const [abandon] = useState(() => typeof window !== "undefined" && lireEssais() >= 10);

  // Compteur gardé dans l'onglet : un rechargement remet l'état React à zéro,
  // et sans lui la page se rechargerait sans fin si l'activation échouait.
  useEffect(() => {
    if (!bienvenue) return;
    const n = lireEssais();
    if (n >= 10) return;
    const t = window.setTimeout(() => {
      try { sessionStorage.setItem("workie_attente_abo", String(n + 1)); } catch { /* sans conséquence */ }
      window.location.reload();
    }, 3000);
    return () => window.clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bienvenue]);

  return (
    <div style={{ maxWidth: 560, margin: "40px auto 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 26, display: "grid", gap: 14 }}>
      {bienvenue ? (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Paiement reçu, merci.</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {abandon
              ? "L'activation prend plus de temps que prévu. Votre paiement est bien reçu : écrivez-nous à contact@workie.ch et nous ouvrons votre espace aussitôt."
              : "Nous ouvrons votre espace, cela prend quelques secondes. La page se met à jour toute seule."}
          </p>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vous ne gérez pas encore d&apos;entreprise</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Trouvez la fiche de votre entreprise sur Workie, puis faites la demande pour la gérer.
          </p>
          <Link href={revendicationOuverte ? "/pour-les-entreprises" : "/explore"} className="btn btn-encre">Trouver ma fiche</Link>
        </>
      )}
    </div>
  );
}
