"use client";

import { useState } from "react";
import { JobOfferCard } from "@/components/JobOfferCard";

type Offre = Parameters<typeof JobOfferCard>[0]["job"];

// Certaines entreprises ont plus de deux cents offres (Rolex, PostFinance…).
// Les montrer toutes d'un coup faisait une fiche sans fin : on en montre
// quelques-unes, puis on en ajoute à la demande.
const D_ABORD = 6;
const PAR_AJOUT = 20;

export function ListeOffres({ jobs, companyName, companyId }: { jobs: Offre[]; companyName: string; companyId: string }) {
  const [visibles, setVisibles] = useState(D_ABORD);
  const reste = jobs.length - visibles;
  return (
    <>
      {jobs.slice(0, visibles).map(job => <JobOfferCard key={job.id} job={job} companyName={companyName} companyId={companyId} />)}
      {reste > 0 && (
        <button
          type="button"
          className="btn btn-clair"
          onClick={() => setVisibles(v => v + PAR_AJOUT)}
          style={{ width: "100%", justifyContent: "center", minHeight: 44 }}
        >
          Afficher {Math.min(reste, PAR_AJOUT)} offres de plus{reste > PAR_AJOUT ? ` (sur ${reste})` : ""}
        </button>
      )}
    </>
  );
}
