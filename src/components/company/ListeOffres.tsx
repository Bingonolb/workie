"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { JobOfferCard } from "@/components/JobOfferCard";
import { useVerrouDefilement } from "@/lib/useVerrouDefilement";

type Offre = Parameters<typeof JobOfferCard>[0]["job"];

// Jusqu'à SEUIL offres : les cartes, comme avant. Au-delà (Rolex en a plus de
// deux cents), une liste compacte des premières, et toutes les autres dans un
// panneau avec recherche et filtre par ville, comme sur les sites d'emploi.
const SEUIL = 6;
const APERCU = 4;

const sansAccents = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function ListeOffres({ jobs, companyName, companyId }: { jobs: Offre[]; companyName: string; companyId: string }) {
  const [ouvert, setOuvert] = useState(false);

  if (jobs.length <= SEUIL) {
    return <>{jobs.map(job => <JobOfferCard key={job.id} job={job} companyName={companyName} companyId={companyId} />)}</>;
  }
  return (
    <>
      <div className="jo-liste">
        {jobs.slice(0, APERCU).map(job => <JobOfferCard key={job.id} ligne job={job} companyName={companyName} companyId={companyId} />)}
      </div>
      <button type="button" className="btn btn-encre" onClick={() => setOuvert(true)} style={{ width: "100%", justifyContent: "center", minHeight: 46 }}>
        Voir les {jobs.length} offres
      </button>
      {ouvert && <PanneauOffres jobs={jobs} companyName={companyName} companyId={companyId} fermer={() => setOuvert(false)} />}
      <style>{STYLES}</style>
    </>
  );
}

function PanneauOffres({ jobs, companyName, companyId, fermer }: { jobs: Offre[]; companyName: string; companyId: string; fermer: () => void }) {
  const [recherche, setRecherche] = useState("");
  const [ville, setVille] = useState<string | null>(null);
  useVerrouDefilement(true);

  useEffect(() => {
    // Échap ferme le panneau, sauf si une offre est ouverte par-dessus (elle se ferme d'abord).
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector(".job-modal")) fermer(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fermer]);

  // Les villes les plus représentées, pour filtrer d'un geste.
  const villes = useMemo(() => {
    const n = new Map<string, number>();
    for (const j of jobs) if (j.location) n.set(j.location, (n.get(j.location) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([v]) => v);
  }, [jobs]);

  const visibles = useMemo(() => {
    const q = sansAccents(recherche.trim());
    return jobs.filter(j =>
      (!ville || j.location === ville) &&
      (!q || sansAccents(`${j.title} ${j.location ?? ""} ${j.contract_type ?? ""}`).includes(q)));
  }, [jobs, recherche, ville]);

  return createPortal(
    <div className="jo-panneau-fond" onClick={e => { if (e.target === e.currentTarget) fermer(); }}>
      <div className="jo-panneau" role="dialog" aria-modal="true" aria-label={`Offres d'emploi chez ${companyName}`}>
        <header className="jo-panneau-tete">
          <div>
            <p className="jo-panneau-sur">{companyName}</p>
            <h2 className="jo-panneau-titre">{jobs.length} offres d&apos;emploi</h2>
          </div>
          <button type="button" className="jo-fermer" onClick={fermer} aria-label="Fermer"><X size={18} aria-hidden="true" /></button>
        </header>

        <label className="jo-recherche">
          <Search size={17} aria-hidden="true" />
          <input
            type="search" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder={`Rechercher parmi ${jobs.length} offres`} aria-label="Rechercher une offre"
          />
        </label>

        {villes.length > 1 && (
          <div className="jo-villes" role="group" aria-label="Filtrer par ville">
            <button type="button" aria-pressed={!ville} className={!ville ? "actif" : ""} onClick={() => setVille(null)}>Toutes</button>
            {villes.map(v => (
              <button key={v} type="button" aria-pressed={ville === v} className={ville === v ? "actif" : ""} onClick={() => setVille(ville === v ? null : v)}>{v}</button>
            ))}
          </div>
        )}

        <div className="jo-panneau-liste">
          {visibles.length ? (
            <div className="jo-liste">
              {visibles.map(job => <JobOfferCard key={job.id} ligne job={job} companyName={companyName} companyId={companyId} />)}
            </div>
          ) : (
            <p className="jo-vide">Aucune offre ne correspond. Essayez un autre mot ou une autre ville.</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

const STYLES = `
  .jo-liste { display: flex; flex-direction: column; margin-bottom: 14px; }
  .jo-ligne {
    display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
    background: none; border: none; border-bottom: 1px solid var(--border); padding: 13px 2px;
    cursor: pointer; color: var(--text); font-family: inherit;
  }
  .jo-liste > .jo-ligne:last-child { border-bottom: none; }
  .jo-ligne:hover .jo-ligne-titre { color: var(--brand); }
  .jo-ligne:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; border-radius: 6px; }
  .jo-ligne-texte { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .jo-ligne-titre { font-size: 14px; font-weight: 650; line-height: 1.35; transition: color .15s; }
  .jo-ligne-meta { font-size: 12.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .jo-ligne-fleche { color: var(--text-muted); flex-shrink: 0; }

  .jo-panneau-fond {
    position: fixed; inset: 0; z-index: 10150; background: rgba(0,0,0,.55);
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 24px;
    animation: joFondu .18s ease;
  }
  .jo-panneau {
    background: var(--surface); border: 1px solid var(--border2); border-radius: 20px;
    width: 100%; max-width: 620px; height: min(780px, 88vh);
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 24px 80px rgba(0,0,0,.45);
  }
  .jo-panneau-tete { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 22px 24px 14px; }
  .jo-panneau-sur { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted); margin: 0 0 4px; }
  .jo-panneau-titre { font-size: 22px; font-weight: 850; letter-spacing: -.02em; margin: 0; color: var(--text); }
  .jo-fermer {
    width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    background: var(--surface2); border: 1px solid var(--border2); color: var(--text-muted); cursor: pointer;
  }
  .jo-recherche {
    display: flex; align-items: center; gap: 10px; margin: 0 24px 12px; padding: 0 14px; height: 46px;
    background: var(--surface2); border: 1px solid var(--border2); border-radius: 12px; color: var(--text-muted);
  }
  .jo-recherche:focus-within { border-color: var(--brand); }
  .jo-recherche input { flex: 1; min-width: 0; border: none; outline: none; background: none; color: var(--text); font-size: 15px; font-family: inherit; }
  .jo-villes { display: flex; gap: 8px; overflow-x: auto; padding: 0 24px 12px; scrollbar-width: none; }
  .jo-villes::-webkit-scrollbar { display: none; }
  .jo-villes button {
    flex-shrink: 0; height: 34px; padding: 0 14px; border-radius: 999px; font-size: 13px; font-weight: 600; font-family: inherit;
    background: var(--surface2); border: 1px solid var(--border2); color: var(--text); cursor: pointer; white-space: nowrap;
  }
  .jo-villes button.actif { background: var(--encre); border-color: var(--encre); color: var(--encre-texte); }
  .jo-panneau-liste { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 0 24px 24px; border-top: 1px solid var(--border); }
  .jo-panneau-liste .jo-liste { margin-bottom: 0; }
  .jo-vide { font-size: 15px; color: var(--text-muted); text-align: center; padding: 48px 12px; margin: 0; }
  @keyframes joFondu { from { opacity: 0 } to { opacity: 1 } }

  @media (max-width: 640px) {
    .jo-ligne-titre { font-size: 15.5px; }
    .jo-ligne-meta { font-size: 13px; }
    .jo-panneau-fond { padding: 0; align-items: stretch; }
    .jo-panneau { max-width: none; height: 100%; height: 100dvh; border-radius: 0; border: none; padding-top: env(safe-area-inset-top); }
    .jo-panneau-tete { padding: 18px 20px 12px; }
    .jo-recherche { margin: 0 20px 12px; }
    .jo-recherche input { font-size: 16px; }
    .jo-villes { padding: 0 20px 12px; }
    .jo-panneau-liste { padding: 0 20px calc(24px + env(safe-area-inset-bottom)); }
    .jo-fermer { width: 44px; height: 44px; }
  }
`;
