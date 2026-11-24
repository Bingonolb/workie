"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, MapPin, Search, X } from "lucide-react";
import { JobOfferCard } from "@/components/JobOfferCard";
import type { OffreExplorer } from "@/app/api/offres/route";
import { urlFiche } from "@/lib/urlFiche";
import { largeurCouverture } from "@/lib/coverUrl";
import { libelleTaux } from "@/lib/offres";
import { lieuAffiche } from "@/lib/types";

/**
 * La vue « Offres » d'Explorer.
 *
 * Le parti pris : on choisit un employeur autant qu'un poste. Chaque carte
 * porte donc l'entreprise en tête (sa photo, son secteur, sa ville), le poste
 * ensuite, puis les quatre faits qui décident si l'on postule : lieu,
 * contrat, taux, langue de l'annonce. Le titre et « Voir l'offre » mènent à
 * l'offre officielle, sur le site de l'employeur ; l'en-tête mène à la fiche.
 */

type Filtres = { sector: string; canton: string; langue: string; contrat: string };
const CODE_LANGUE: Record<string, string> = { fr: "FR", de: "DE", en: "EN", it: "IT" };

function initiales(nom: string) {
  const mots = nom.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/);
  return ((mots[0]?.[0] ?? "") + (mots[1]?.[0] ?? mots[0]?.[1] ?? "")).toUpperCase();
}

function CarteOffre({ o }: { o: OffreExplorer }) {
  const e = o.entreprise;
  const taux = libelleTaux(o.taux_min, o.taux_max);
  const lieu = o.location || (e.city ? lieuAffiche(e.city, e.canton) : null);
  const faits = [o.contract_type, taux, o.langue ? CODE_LANGUE[o.langue] : null].filter(Boolean) as string[];
  return (
    <article className="carte-offre">
      <Link href={urlFiche(e)} className="carte-offre-ent" aria-label={`Voir la fiche de ${e.name}`}>
        <span className="carte-offre-vignette" style={{ background: e.cover_color ?? "var(--surface2)" }}>
          {e.cover_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={largeurCouverture(e.cover_url, 160)} alt="" loading="lazy" decoding="async" />
            : <span>{initiales(e.name)}</span>}
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="carte-offre-nom">{e.name}</span>
          <span className="carte-offre-sect">{e.subsector || e.sector}</span>
        </span>
      </Link>

      {/* Le clic ouvre l'aperçu de l'offre, le même que sur la fiche
          entreprise ; « En savoir plus » y mène ensuite au site de
          l'employeur. Arriver directement chez l'employeur était trop brusque. */}
      <JobOfferCard
        job={{ ...o, created_at: o.created_at ?? "" }}
        companyName={e.name}
        companyId={e.id}
        declencheur={ouvrir => (
          <button type="button" onClick={ouvrir} className="carte-offre-corps" aria-label={`Voir l'offre : ${o.title}`}>
            <h3 className="carte-offre-titre">{o.title}</h3>
            {o.apercu && <p className="carte-offre-apercu">{o.apercu}</p>}
            <span className="carte-offre-faits">
              {lieu && <span className="carte-offre-lieu"><MapPin size={14} strokeWidth={2} aria-hidden="true" />{lieu}</span>}
              {faits.map(f => <span key={f} className="carte-offre-pastille">{f}</span>)}
            </span>
            <span className="carte-offre-voir">Voir l&apos;offre <ChevronRight size={16} aria-hidden="true" /></span>
          </button>
        )}
      />
    </article>
  );
}

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
  const [offres, setOffres] = useState<OffreExplorer[]>([]);
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
      const d = await r.json() as { offres: OffreExplorer[]; total: number; recherche: Compris };
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
        .offres-grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .carte-offre { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; transition: border-color .15s, box-shadow .15s; }
        .carte-offre:hover { border-color: var(--border2); box-shadow: 0 10px 30px -18px rgba(16,19,25,.35); }
        .carte-offre-ent { display: flex; align-items: center; gap: 12px; padding: 16px 18px 14px; text-decoration: none; color: inherit; border-bottom: 1px solid var(--border); }
        .carte-offre-vignette { flex: none; width: 44px; height: 44px; border-radius: 12px; overflow: hidden; display: grid; place-items: center; }
        .carte-offre-vignette img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .carte-offre-vignette span { font-size: 15px; font-weight: 800; color: #fff; }
        .carte-offre-nom { display: block; font-size: 15px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .carte-offre-sect { display: block; font-size: 13px; color: var(--text-muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .carte-offre-ent:hover .carte-offre-nom { text-decoration: underline; text-underline-offset: 3px; }
        .carte-offre-corps { flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 16px 18px 18px; text-decoration: none; color: inherit;
          width: 100%; text-align: left; background: none; border: 0; font: inherit; cursor: pointer; }
        .carte-offre-corps:focus-visible { outline: 2px solid var(--brand); outline-offset: -2px; }
        .carte-offre-titre { font-size: 17.5px; font-weight: 750; letter-spacing: -0.015em; line-height: 1.3; color: var(--text); margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .carte-offre-apercu { font-size: 14.5px; line-height: 1.55; color: var(--text-muted); margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .carte-offre-faits { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 2px; }
        .carte-offre-lieu { display: inline-flex; align-items: center; gap: 4px; font-size: 13.5px; font-weight: 600; color: var(--text); margin-right: 4px; }
        .carte-offre-pastille { font-size: 13px; font-weight: 700; line-height: 1; padding: 6px 8px; border-radius: 7px; background: var(--surface2); color: var(--text); }
        .carte-offre-voir { margin-top: auto; padding-top: 6px; display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 700; color: var(--brand); }
        .carte-offre-corps:hover .carte-offre-titre { text-decoration: underline; text-underline-offset: 3px; }
        @media (max-width: 640px) {
          .offres-grille { grid-template-columns: 1fr; gap: 14px; }
          .carte-offre-ent { padding: 14px 16px 12px; }
          .carte-offre-corps { padding: 14px 16px 16px; }
        }
        .recherche-offres { margin: 0 0 16px; }
        .recherche-offres-champ { display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 8px 0 16px; border-radius: 14px; background: var(--surface); border: 1px solid var(--border2); color: var(--text-muted); transition: border-color .15s, box-shadow .15s; }
        .recherche-offres-champ:focus-within { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 18%, transparent); }
        .recherche-offres-champ input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: var(--text); font: inherit; font-size: 16px; }
        .recherche-offres-champ input::-webkit-search-cancel-button { display: none; }
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
          type="search"
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
      <>{styles}{champ}
      <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
        <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Les offres n&apos;ont pas pu être chargées.</p>
        <button type="button" className="btn btn-clair" onClick={() => void charger(0, false)}>Réessayer</button>
      </div>
      </>
    );
  }

  if (etat === "pret" && offres.length === 0) {
    return (
      <>{styles}{champ}
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
          <button type="button" className="btn btn-clair" disabled={etat === "plus"} onClick={() => void charger(page + 1, true)}>
            {etat === "plus" ? "Chargement…" : "Voir plus d'offres"}
          </button>
        </div>
      )}
    </>
  );
}
