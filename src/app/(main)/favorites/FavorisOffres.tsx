"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import type { OffreAffichee } from "@/lib/offresTypes";
import { obtenir, CLE_OFFRES_ENREGISTREES } from "@/lib/cacheSession";
import { idsOffresAppareil, useOffresEnregistrees } from "@/lib/offresEnregistrees";
import { CarteOffre, StylesCartesOffre } from "@/components/offres/CarteOffre";

/**
 * Les offres enregistrées (signet), onglet « Offres » des favoris.
 *
 * Compte : la liste vient de la route privée, mémorisée par compte
 * (cacheSession). Visiteur : ses identifiants sont dans son navigateur, les
 * offres viennent de la route publique. Dans les deux cas, retirer un signet
 * retire la carte aussitôt : la liste affichée suit l'état des signets.
 *
 * Une offre fermée depuis par l'employeur reste, grisée (« Offre clôturée »),
 * plutôt que de disparaître sans explication.
 */
export function FavorisOffres() {
  const { pret, connecte, ids } = useOffresEnregistrees();
  const [offres, setOffres] = useState<OffreAffichee[] | null>(null);
  const [echec, setEchec] = useState(false);

  useEffect(() => {
    if (!pret) return;
    let annule = false;
    const charger = connecte
      ? obtenir<{ offres?: OffreAffichee[] }>(CLE_OFFRES_ENREGISTREES, "/api/user/offres-enregistrees").then(r => r.donnees?.offres ?? null)
      : (() => {
          const ids = idsOffresAppareil();
          if (!ids.length) return Promise.resolve([] as OffreAffichee[]);
          return fetch(`/api/offres/par-ids?ids=${ids.join(",")}`).then(r => (r.ok ? r.json() : null)).then(d => d?.offres ?? null);
        })();
    charger
      .then(liste => { if (annule) return; if (liste) setOffres(liste); else setEchec(true); })
      .catch(() => { if (!annule) setEchec(true); });
    return () => { annule = true; };
  }, [pret, connecte]);

  if (echec) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "48px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Impossible de charger vos offres enregistrées</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Elles sont toujours là, c&apos;est l&apos;affichage qui a échoué.</p>
        <button type="button" className="btn btn-encre" onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  if (offres === null) {
    return (
      <><StylesCartesOffre />
      <div className="offres-grille">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="carte-offre img-placeholder" style={{ height: 250 }} aria-hidden="true" />)}
      </div></>
    );
  }

  // La liste suit les signets en direct : en retirer un retire la carte.
  const liste = offres.filter(o => ids.has(o.id));

  const bandeauVisiteur = !connecte && (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 18px", marginBottom: 22 }}>
      <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 560 }}>
        <strong style={{ color: "var(--text)" }}>Vos offres sont gardées sur cet appareil.</strong> Créez un compte gratuit pour les retrouver partout.
      </p>
      <Link href={`/signup?next=${encodeURIComponent("/favorites?vue=offres")}`} className="btn btn-encre btn-sm">Créer un compte</Link>
    </div>
  );

  if (liste.length === 0) {
    return (
      <>{bandeauVisiteur}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "64px 32px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "var(--text)" }}>
          <Bookmark size={28} aria-hidden="true" />
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Aucune offre enregistrée</p>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>Touchez le signet d&apos;une offre pour la garder ici.</p>
        <Link href="/explore?vue=offres" className="btn btn-encre">Explorer les offres</Link>
      </div>
      </>
    );
  }

  return (
    <>
      <StylesCartesOffre />
      {bandeauVisiteur}
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
        {liste.length} offre{liste.length > 1 ? "s" : ""}
      </p>
      <div className="offres-grille">
        {liste.map(o => <CarteOffre key={o.id} o={o} />)}
      </div>
    </>
  );
}
