"use client";

import { Globe } from "lucide-react";

/**
 * Le lien vers les offres d'emploi. Au clic, un signal part en arrière-plan
 * (keepalive) pour le classement ; le lien s'ouvre immédiatement, sans
 * attendre. Une fois par onglet et par entreprise suffit : le serveur ne
 * compte de toute façon qu'un clic par compte.
 */
export function LienOffres({ href, companyId }: { href: string; companyId: string }) {
  const signaler = () => {
    try {
      const cle = "offres:" + companyId;
      if (sessionStorage.getItem(cle)) return;
      sessionStorage.setItem(cle, "1");
    } catch { /* stockage indisponible : on envoie quand même */ }
    try {
      fetch(`/api/company/${companyId}/offres`, { method: "POST", keepalive: true }).catch(() => {});
    } catch { /* jamais bloquant */ }
  };

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="lien-site" onClick={signaler} onAuxClick={signaler}>
      <Globe size={14} aria-hidden="true" />
      Site internet
      <span aria-hidden="true" className="lien-site-fleche">↗</span>
    </a>
  );
}
