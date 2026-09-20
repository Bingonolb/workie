"use client";

import { useEffect, useRef } from "react";
import { trackCompanyView } from "@/lib/actions/analytics";
import { oublier, CLE_PROFIL } from "@/lib/cacheSession";

export function ViewTracker({ companyId }: { companyId: string }) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackCompanyView(companyId);
    // « Reprendre où vous en étiez » vient de changer : la fiche qu'on ouvre
    // est desormais la plus recente. Sans cet oubli, le profil servait sa
    // liste memorisee et l'entreprise qu'on venait de lire n'y figurait pas.
    oublier(CLE_PROFIL);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
