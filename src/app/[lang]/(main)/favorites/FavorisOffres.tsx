"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import type { OffreAffichee } from "@/lib/offresTypes";
import { obtenir, CLE_OFFRES_ENREGISTREES } from "@/lib/cacheSession";
import { idsOffresAppareil, useOffresEnregistrees } from "@/lib/offresEnregistrees";
import { CarteOffre, StylesCartesOffre } from "@/components/offres/CarteOffre";
import { langueDocument } from "@/i18n/langueDocument";
import { useT } from "@/i18n/FournisseurLangue";
import { riche } from "@/i18n/riche";
const GRAS = { b: (c: React.ReactNode) => <strong style={{ color: "var(--text)" }}>{c}</strong> };

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
/** Carte d'attente, à la forme d'une vraie carte : en-tête entreprise, puis le poste. */
function CarteAttente() {
  const barre = (l: string, h = 12) => <div style={{ height: h, width: l, borderRadius: 4, background: "var(--surface3)" }} />;
  return (
    <div className="carte-offre" aria-hidden="true">
      <div className="carte-offre-tete" style={{ padding: "16px 18px 14px", gap: 12 }}>
        <div className="img-placeholder" style={{ width: 44, height: 44, borderRadius: 12, flex: "none" }} />
        <div style={{ flex: 1, display: "grid", gap: 7 }}>{barre("45%")}{barre("30%", 10)}</div>
      </div>
      <div style={{ padding: "16px 18px 18px", display: "grid", gap: 10 }}>{barre("80%", 16)}{barre("95%")}{barre("60%")}</div>
    </div>
  );
}

export function FavorisOffres() {
  const { pret, connecte, ids } = useOffresEnregistrees();
  const t = useT();
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
          return fetch(`/api/offres/par-ids?ids=${ids.join(",")}&site=${langueDocument()}`).then(r => (r.ok ? r.json() : null)).then(d => d?.offres ?? null);
        })();
    charger
      .then(liste => { if (annule) return; if (liste) setOffres(liste); else setEchec(true); })
      .catch(() => { if (!annule) setEchec(true); });
    return () => { annule = true; };
  }, [pret, connecte]);

  if (echec) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "48px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{t("favoris.erreurOffres")}</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>{t("favoris.erreurOffresAide")}</p>
        <button type="button" className="btn btn-encre" onClick={() => window.location.reload()}>{t("favoris.reessayer")}</button>
      </div>
    );
  }

  // Pendant le chargement : autant de cartes d'attente que d'offres gardées
  // (le nombre est connu avant leur contenu), et aucune s'il n'y en a pas.
  // Quatre cartes grises fixes annonçaient quatre offres à qui n'en avait qu'une.
  if (offres === null && !(pret && ids.size === 0)) {
    if (!pret) return null;
    return (
      <><StylesCartesOffre />
      <div className="offres-grille" aria-busy="true">
        {Array.from({ length: Math.min(ids.size, 6) }, (_, i) => <CarteAttente key={i} />)}
      </div></>
    );
  }

  // La liste suit les signets en direct : en retirer un retire la carte.
  const liste = (offres ?? []).filter(o => ids.has(o.id));

  const bandeauVisiteur = !connecte && (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 18px", marginBottom: 22 }}>
      <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 560 }}>
        {riche(t("favoris.appareilOffres"), GRAS)}
      </p>
      <Link href={`/signup?next=${encodeURIComponent("/favorites?vue=offres")}`} className="btn btn-encre btn-sm">{t("favoris.creerCompte")}</Link>
    </div>
  );

  if (liste.length === 0) {
    return (
      <>{bandeauVisiteur}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "64px 32px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "var(--text)" }}>
          <Bookmark size={28} aria-hidden="true" />
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{t("favoris.aucuneOffre")}</p>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>{t("favoris.aucuneOffreAide")}</p>
        <Link href="/explore?vue=offres" className="btn btn-encre">{t("favoris.explorerOffres")}</Link>
      </div>
      </>
    );
  }

  return (
    <>
      <StylesCartesOffre />
      {bandeauVisiteur}
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
        {t("favoris.nbOffres", { n: liste.length })}
      </p>
      <div className="offres-grille">
        {liste.map(o => <CarteOffre key={o.id} o={o} />)}
      </div>
    </>
  );
}
