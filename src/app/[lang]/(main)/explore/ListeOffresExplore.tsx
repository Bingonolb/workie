"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { OffreAffichee } from "@/lib/offresTypes";
import { CarteOffre, StylesCartesOffre } from "@/components/offres/CarteOffre";

/**
 * La vue « Offres » d'Explorer : la recherche, la liste filtrée, et le
 * chargement par pages. Les cartes elles-mêmes sont dans CarteOffre.
 */

type Filtres = { sector: string; canton: string; langue: string; contrat: string };

type Compris = { equivalences: { mot: string; corrige?: string; traduit: boolean }[]; compris: string[] } | null;

export function ListeOffresExplore({ filtres, q, onQ }: { filtres: Filtres; q: string; onQ: (q: string) => void }) {
  // Ce qui est tapé s'affiche aussitôt ; la recherche part après une courte
  // pause dans la frappe, pas à chaque lettre.
  const [saisie, setSaisie] = useState(q);
  useEffect(() => {
    if (saisie === q) return;
    const t = setTimeout(() => onQ(saisie), 350);
    return () => clearTimeout(t);
  }, [saisie, q, onQ]);
  const [compris, setCompris] = useState<Compris>(null);
  const [offres, setOffres] = useState<OffreAffichee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [etat, setEtat] = useState<"chargement" | "pret" | "plus" | "erreur">("chargement");
  const demande = useRef(0);
  const cle = `${filtres.sector}|${filtres.canton}|${filtres.langue}|${filtres.contrat}|${q.trim()}`;

  const charger = async (n: number, ajout: boolean) => {
    const numero = ++demande.current;
    setEtat(ajout ? "plus" : "chargement");
    const p = new URLSearchParams();
    if (filtres.sector) p.set("sector", filtres.sector);
    if (filtres.canton) p.set("canton", filtres.canton);
    if (filtres.langue) p.set("langue", filtres.langue);
    if (filtres.contrat) p.set("contrat", filtres.contrat);
    if (q.trim()) p.set("q", q.trim());
    if (n) p.set("page", String(n));
    try {
      const r = await fetch(`/api/offres?${p}`);
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json() as { offres: OffreAffichee[]; total: number; recherche: Compris };
      // Seule la dernière demande décide de l'affichage.
      if (numero !== demande.current) return;
      setCompris(d.recherche ?? null);
      setOffres(prec => ajout ? [...prec, ...d.offres.filter(o => !prec.some(x => x.id === o.id))] : d.offres);
      setTotal(d.total);
      setPage(n);
      setEtat("pret");
    } catch {
      if (numero === demande.current) setEtat("erreur");
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { void charger(0, false); }, [cle]);

  const styles = <style>{`
        .recherche-offres { margin: 0 0 16px; }
        .recherche-offres-champ { display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 8px 0 16px; border-radius: 14px; background: var(--surface); border: 1px solid var(--border2); color: var(--text-muted); transition: border-color .15s, box-shadow .15s; }
        .recherche-offres-champ:focus-within { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 18%, transparent); }
        .recherche-offres-champ input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: var(--text); font: inherit; font-size: 16px; }
        .recherche-offres-champ input::-webkit-search-cancel-button { display: none; }
        /* La règle globale des champs (bordure et halo violets au focus) dessinait
           un second cadre à l'intérieur de la boîte : c'est la boîte qui s'allume. */
        /* Sélecteur volontairement plus précis que la règle globale
           « input:not(…):not(…):not(…):focus » : à !important égal, c'est la
           plus précise qui gagne, et la globale gardait son halo de 3 px. */
        .recherche-offres .recherche-offres-champ input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
        .recherche-offres .recherche-offres-champ input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):focus,
        .recherche-offres .recherche-offres-champ input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):focus-visible {
          border: 0 !important; box-shadow: none !important; outline: none !important; padding: 0; border-radius: 0; -webkit-appearance: none; appearance: none;
          /* En mode sombre, le navigateur peignait son propre fond de champ :
             un second rectangle, plus clair, dans la boîte. */
          background: transparent !important; background-color: transparent !important; }
        .recherche-offres-champ input:-webkit-autofill { -webkit-box-shadow: 0 0 0 40px var(--surface) inset !important; -webkit-text-fill-color: var(--text); }
        .recherche-offres-champ button { flex: none; width: 40px; height: 40px; border-radius: 10px; border: 0; background: var(--surface2); color: var(--text-muted); display: grid; place-items: center; cursor: pointer; }
        .recherche-offres-compris { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin: 10px 2px 0; font-size: 13.5px; color: var(--text-muted); line-height: 1.45; }
      `}</style>;

  // Le champ de recherche, présent dans tous les états (même sans résultat :
  // c'est là qu'on corrige sa recherche).
  const champ = (
    <div className="recherche-offres">
      <div className="recherche-offres-champ">
        <Search size={18} aria-hidden="true" />
        <input
          type="text"
          inputMode="search"
          value={saisie}
          onChange={e => setSaisie(e.target.value)}
          placeholder="Rechercher un poste"
          aria-label="Rechercher une offre : métier, taux, langue ou contrat"
          enterKeyHint="search"
          autoComplete="off"
        />
        {saisie && (
          <button type="button" onClick={() => { setSaisie(""); onQ(""); }} aria-label="Effacer la recherche">
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      {/* Ce que la recherche a compris : la personne voit que « vendeur »
          cherche aussi « Verkauf » et « Sales », et que « 80% » filtre le taux. */}
      {compris && (compris.compris.length > 0 || compris.equivalences.length > 0) && (
        <p className="recherche-offres-compris">
          {compris.compris.map(c => <span key={c} className="carte-offre-pastille">{c}</span>)}
          {compris.equivalences.map(e => (
            <span key={e.mot}>
              {e.corrige ? <>« {e.mot} » compris comme « {e.corrige} »{e.traduit ? ", " : ""}</> : null}
              {e.traduit ? <>{e.corrige ? "cherché" : `« ${e.mot} » cherché`} aussi en allemand, anglais et italien</> : null}
            </span>
          ))}
        </p>
      )}
    </div>
  );

  if (etat === "erreur" && offres.length === 0) {
    return (
      <>{styles}<StylesCartesOffre />{champ}
      <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
        <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Les offres n&apos;ont pas pu être chargées.</p>
        <button type="button" className="btn btn-clair" onClick={() => void charger(0, false)}>Réessayer</button>
      </div>
      </>
    );
  }

  if (etat === "pret" && offres.length === 0) {
    return (
      <>{styles}<StylesCartesOffre />{champ}
      <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{q.trim() ? `Aucune offre pour « ${q.trim()} »` : "Aucune offre pour ces filtres"}</p>
        <p style={{ fontSize: 14 }}>{q.trim() ? "Essayez un autre mot, ou retirez le taux ou la langue." : "Essayez d'élargir le canton ou la langue."}</p>
      </div>
      </>
    );
  }

  return (
    <>
      {styles}
      <StylesCartesOffre />
      {champ}

      <p aria-live="polite" style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 14px" }}>
        {etat === "chargement" && offres.length === 0 ? "Chargement des offres…" : <><strong style={{ color: "var(--text)" }}>{total.toLocaleString("fr-CH")}</strong> offres</>}
      </p>

      <div className="offres-grille" style={{ opacity: etat === "chargement" && offres.length > 0 ? 0.5 : 1, transition: "opacity .15s" }}>
        {etat === "chargement" && offres.length === 0
          ? Array.from({ length: 6 }, (_, i) => <div key={i} className="carte-offre img-placeholder" style={{ height: 250 }} aria-hidden="true" />)
          : offres.map(o => <CarteOffre key={o.id} o={o} />)}
      </div>

      {offres.length > 0 && offres.length < total && (
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 14 }}>
            <strong style={{ color: "var(--text)" }}>{offres.length.toLocaleString("fr-CH")}</strong> sur <strong style={{ color: "var(--text)" }}>{total.toLocaleString("fr-CH")}</strong> offres
          </p>
          <button type="button" className="btn btn-clair" disabled={etat === "plus"} onClick={() => void charger(page + 1, true)}>
            {etat === "plus" ? "Chargement…" : `Voir ${Math.min(24, total - offres.length)} offres de plus`}
          </button>
        </div>
      )}
    </>
  );
}
