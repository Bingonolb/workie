"use client";

import { useT, useLangue } from "@/i18n/FournisseurLangue";

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
const PAR_TRANCHE = 60;

const sansAccents = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * `jobs` : les premières offres, envoyées avec la page. `total` : le nombre
 * réel. Au-delà de SEUIL, le panneau charge toutes les offres à son ouverture
 * (Coop en a près de deux mille : les mettre dans la page l'alourdissait d'un
 * mégaoctet pour chaque visiteur).
 */
export function ListeOffres({ jobs, total, companyName, companyId }: { jobs: Offre[]; total: number; companyName: string; companyId: string }) {
  const t = useT();
  const [ouvert, setOuvert] = useState(false);

  if (total <= SEUIL) {
    return <>{jobs.map(job => <JobOfferCard key={job.id} job={job} companyName={companyName} companyId={companyId} />)}</>;
  }
  return (
    <>
      <div className="jo-liste">
        {jobs.slice(0, APERCU).map(job => <JobOfferCard key={job.id} ligne job={job} companyName={companyName} companyId={companyId} />)}
      </div>
      <button type="button" className="btn btn-encre" onClick={() => setOuvert(true)} style={{ width: "100%", justifyContent: "center", minHeight: 46 }}>
        {t("fiche.voirOffres", { n: total })}
      </button>
      {ouvert && <PanneauOffres apercu={jobs} total={total} companyName={companyName} companyId={companyId} fermer={() => setOuvert(false)} />}
      <style>{STYLES}</style>
    </>
  );
}

// Offres déjà chargées, par entreprise : rouvrir le panneau ne refait pas la requête.
const memoire = new Map<string, Offre[]>();

function PanneauOffres({ apercu, total, companyName, companyId, fermer }: { apercu: Offre[]; total: number; companyName: string; companyId: string; fermer: () => void }) {
  const t = useT();
  const [recherche, setRecherche] = useState("");
  const [ville, setVille] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Offre[]>(() => memoire.get(companyId) ?? apercu);
  const [etat, setEtat] = useState<"charge" | "pret" | "erreur">(() => memoire.has(companyId) ? "pret" : "charge");
  useVerrouDefilement(true);

  useEffect(() => {
    if (memoire.has(companyId)) return;
    let annule = false;
    fetch(`/api/company/${companyId}/offres`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(({ offres }: { offres: (Offre & { created_at: string | null })[] }) => {
        if (annule) return;
        const liste = offres.map(o => ({ ...o, created_at: o.created_at ?? "" }));
        memoire.set(companyId, liste);
        setJobs(liste);
        setEtat("pret");
      })
      .catch(() => { if (!annule) setEtat("erreur"); });
    return () => { annule = true; };
  }, [companyId]);

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

  // Affichage progressif : 60 lignes, puis 60 de plus à l'approche du bas.
  // Deux mille lignes d'un coup ralentissaient le téléphone.
  const [montrees, setMontrees] = useState(PAR_TRANCHE);
  const [repere, setRepere] = useState<HTMLDivElement | null>(null);
  // Nouvelle recherche ou nouvelle ville : on repart du haut de la liste.
  const cle = `${recherche}|${ville}`;
  const [cleVue, setCleVue] = useState(cle);
  if (cle !== cleVue) { setCleVue(cle); setMontrees(PAR_TRANCHE); }
  useEffect(() => {
    if (!repere) return;
    const obs = new IntersectionObserver(e => { if (e[0].isIntersecting) setMontrees(n => n + PAR_TRANCHE); }, { rootMargin: "600px" });
    obs.observe(repere);
    return () => obs.disconnect();
  }, [repere]);

  return createPortal(
    <div className="jo-panneau-fond" onClick={e => { if (e.target === e.currentTarget) fermer(); }}>
      <div className="jo-panneau" role="dialog" aria-modal="true" aria-label={t("fiche.offresChez", { nom: companyName })}>
        <header className="jo-panneau-tete">
          <div>
            <p className="jo-panneau-sur">{companyName}</p>
            <h2 className="jo-panneau-titre">{t("fiche.nbOffres", { n: total })}</h2>
          </div>
          <button type="button" className="jo-fermer" onClick={fermer} aria-label={t("fiche.fermer")}><X size={18} aria-hidden="true" /></button>
        </header>

        <label className="jo-recherche">
          <Search size={17} aria-hidden="true" />
          <input
            type="search" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder={t("fiche.rechercherParmi", { n: total })} aria-label={t("fiche.rechercherOffre")}
          />
        </label>

        {villes.length > 1 && (
          <div className="jo-villes" role="group" aria-label={t("fiche.filtrerVille")}>
            <button type="button" aria-pressed={!ville} className={!ville ? "actif" : ""} onClick={() => setVille(null)}>{t("fiche.toutes")}</button>
            {villes.map(v => (
              <button key={v} type="button" aria-pressed={ville === v} className={ville === v ? "actif" : ""} onClick={() => setVille(ville === v ? null : v)}>{v}</button>
            ))}
          </div>
        )}

        <div className="jo-panneau-liste" aria-busy={etat === "charge"}>
          {etat === "charge" && <p className="jo-etat">{t("fiche.chargementOffres", { n: total })}</p>}
          {etat === "erreur" && <p className="jo-etat">{t("fiche.erreurOffres")}</p>}
          {visibles.length ? (
            <div className="jo-liste">
              {visibles.slice(0, montrees).map(job => <JobOfferCard key={job.id} ligne job={job} companyName={companyName} companyId={companyId} />)}
              {montrees < visibles.length && <div ref={setRepere} style={{ height: 1 }} aria-hidden="true" />}
            </div>
          ) : etat !== "charge" && (
            <p className="jo-vide">{t("fiche.aucuneOffre")}</p>
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
  .jo-etat { font-size: 13.5px; color: var(--text-muted); padding: 12px 0 4px; margin: 0; }
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
