"use client";

import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { BoutonSignet } from "@/components/offres/BoutonSignet";
import { JobOfferCard } from "@/components/JobOfferCard";
import type { OffreAffichee } from "@/lib/offresTypes";
import { urlFiche } from "@/lib/urlFiche";
import { largeurCouverture } from "@/lib/coverUrl";
import { libelleTaux } from "@/lib/offres";
import { lieuAffiche } from "@/lib/types";

/**
 * La carte d'une offre d'emploi, partout où des offres se listent (Explorer,
 * favoris).
 *
 * Le parti pris : on choisit un employeur autant qu'un poste. L'entreprise en
 * tête (sa photo, son secteur), le poste ensuite, puis les faits qui décident
 * si l'on postule : lieu, contrat, taux, langue de l'annonce. Toucher le poste
 * ouvre l'aperçu de l'offre (« En savoir plus » y mène chez l'employeur) ;
 * toucher l'entreprise ouvre sa fiche.
 *
 * Le signet garde l'offre dans les favoris. Il est privé et ne compte dans
 * aucun classement : la flamme reste réservée aux entreprises.
 */

const CODE_LANGUE: Record<string, string> = { fr: "FR", de: "DE", en: "EN", it: "IT" };

function initiales(nom: string) {
  const mots = nom.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/);
  return ((mots[0]?.[0] ?? "") + (mots[1]?.[0] ?? mots[0]?.[1] ?? "")).toUpperCase();
}

export function CarteOffre({ o }: { o: OffreAffichee }) {
  const e = o.entreprise;
  const taux = libelleTaux(o.taux_min, o.taux_max);
  const lieu = o.location || (e.city ? lieuAffiche(e.city, e.canton) : null);
  const faits = [o.contract_type, taux, o.langue ? CODE_LANGUE[o.langue] : null].filter(Boolean) as string[];

  const contenu = (
    <>
      {o.cloturee && <span className="carte-offre-cloturee">Offre clôturée</span>}
      <h3 className="carte-offre-titre">{o.title}</h3>
      {o.apercu && <p className="carte-offre-apercu">{o.apercu}</p>}
      <span className="carte-offre-faits">
        {lieu && <span className="carte-offre-lieu"><MapPin size={14} strokeWidth={2} aria-hidden="true" />{lieu}</span>}
        {faits.map(f => <span key={f} className="carte-offre-pastille">{f}</span>)}
      </span>
      {!o.cloturee && <span className="carte-offre-voir">Voir l&apos;offre <ChevronRight size={16} aria-hidden="true" /></span>}
    </>
  );

  return (
    <article className={`carte-offre${o.cloturee ? " carte-offre--cloturee" : ""}`}>
      <div className="carte-offre-tete">
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
        <BoutonSignet offreId={o.id} titre={o.title} />
      </div>

      {/* Une offre clôturée ne s'ouvre plus : son lien ne mènerait nulle part.
          Elle reste visible pour qu'on sache ce qu'elle est devenue. */}
      {o.cloturee ? (
        <div className="carte-offre-corps">{contenu}</div>
      ) : (
        <JobOfferCard
          job={{ ...o, created_at: o.created_at ?? "" }}
          companyName={e.name}
          companyId={e.id}
          declencheur={ouvrir => (
            <button type="button" onClick={ouvrir} className="carte-offre-corps" aria-label={`Voir l'offre : ${o.title}`}>
              {contenu}
            </button>
          )}
        />
      )}
    </article>
  );
}

/** La grille et les cartes, à poser une fois par page qui liste des offres. */
export function StylesCartesOffre() {
  return <style>{`
    .offres-grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .carte-offre { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; transition: border-color .15s, box-shadow .15s; }
    .carte-offre:hover { border-color: var(--border2); box-shadow: 0 10px 30px -18px rgba(16,19,25,.35); }
    .carte-offre-tete { display: flex; align-items: center; gap: 8px; padding-right: 10px; border-bottom: 1px solid var(--border); }
    .carte-offre-ent { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; padding: 16px 0 14px 18px; text-decoration: none; color: inherit; }
    .carte-offre-vignette { flex: none; width: 44px; height: 44px; border-radius: 12px; overflow: hidden; display: grid; place-items: center; }
    .carte-offre-vignette img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .carte-offre-vignette span { font-size: 15px; font-weight: 800; color: #fff; }
    .carte-offre-nom { display: block; font-size: 15px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .carte-offre-sect { display: block; font-size: 13px; color: var(--text-muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .carte-offre-ent:hover .carte-offre-nom { text-decoration: underline; text-underline-offset: 3px; }
    .carte-offre-signet { flex: none; width: 44px; height: 44px; border-radius: 12px; border: 0; background: transparent; color: var(--text-muted); display: grid; place-items: center; cursor: pointer; transition: background .15s, color .15s; }
    .carte-offre-signet:hover { background: var(--surface2); color: var(--text); }
    .carte-offre-signet[aria-pressed="true"] { color: var(--brand); }
    .carte-offre-signet:disabled { opacity: .4; cursor: default; }
    .carte-offre-signet:focus-visible { outline: 2px solid var(--brand); outline-offset: -2px; }
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
    .carte-offre--cloturee .carte-offre-corps { cursor: default; }
    .carte-offre--cloturee .carte-offre-corps > :not(.carte-offre-cloturee), .carte-offre--cloturee .carte-offre-ent { opacity: .55; }
    .carte-offre--cloturee .carte-offre-corps:hover .carte-offre-titre { text-decoration: none; }
    .carte-offre-cloturee { align-self: flex-start; font-size: 12.5px; font-weight: 700; padding: 5px 9px; border-radius: 7px; background: var(--surface2); color: var(--text-muted); }
    @media (max-width: 640px) {
      .offres-grille { grid-template-columns: 1fr; gap: 14px; }
      .carte-offre-ent { padding: 14px 0 12px 16px; }
      .carte-offre-corps { padding: 14px 16px 16px; }
    }
  `}</style>;
}
