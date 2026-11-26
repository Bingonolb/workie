"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { revendicationOuverte } from "@/lib/ouverture";
import { confirmerPaiement } from "@/lib/actions/revendication";
import { useT } from "@/i18n/FournisseurLangue";

/**
 * Compte sans entreprise active.
 *
 * Juste après le paiement (?bienvenue=1), Stripe prévient le site quelques
 * secondes plus tard : la page se recharge seule jusqu'à l'activation, au lieu
 * de demander à la personne de cliquer « Actualiser » sans savoir quand.
 */
export function SansEntreprise() {
  const bienvenue = useSearchParams().get("bienvenue");
  const tr = useT();
  const session = useSearchParams().get("session");
  const [abandon, setAbandon] = useState(false);

  // Retour de Stripe : on demande à Workie de vérifier le paiement auprès de
  // Stripe, jusqu'à dix fois à trois secondes d'intervalle. Dès que c'est bon,
  // l'espace s'ouvre. Pas de rechargement de page : la vérification en cours
  // n'est jamais coupée.
  useEffect(() => {
    if (!bienvenue) return;
    let fini = false;
    (async () => {
      for (let essai = 0; essai < 10 && !fini; essai++) {
        const r = await confirmerPaiement(session ?? "").catch(() => ({ ok: false }));
        if (r.ok) { window.location.replace("/espace-entreprise"); return; }
        await new Promise(ok => setTimeout(ok, 3000));
      }
      if (!fini) setAbandon(true);
    })();
    return () => { fini = true; };
  }, [bienvenue, session]);

  return (
    <div style={{ maxWidth: 560, margin: "40px auto 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 26, display: "grid", gap: 14 }}>
      {bienvenue ? (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{tr("espace.payeTitre")}</h1>
          {!abandon && (
            <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span aria-hidden="true" className="chargement-rond" />
              <span style={{ fontSize: 14.5, fontWeight: 600 }}>{tr("espace.payeOuverture")}</span>
            </div>
          )}
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {abandon
              ? tr("espace.payeLent")
              : tr("espace.payeAttente")}
          </p>
          <style>{`
            .chargement-rond { width: 22px; height: 22px; border-radius: 50%; border: 3px solid var(--border2); border-top-color: var(--brand); animation: tourner .8s linear infinite; flex-shrink: 0; }
            @keyframes tourner { to { transform: rotate(360deg); } }
            @media (prefers-reduced-motion: reduce) { .chargement-rond { animation-duration: 2.4s; } }
          `}</style>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{tr("espace.sansTitre")}</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {tr("espace.sansTexte")}
          </p>
          <Link href={revendicationOuverte ? "/pour-les-entreprises" : "/explore"} className="btn btn-encre">{tr("espace.trouverFiche")}</Link>
        </>
      )}
    </div>
  );
}
