"use client";

import { useTransition } from "react";
import { quitterVueEntreprise } from "@/lib/actions/espaceEntreprise";

export function BandeauVueAdmin({ nom, retour }: { nom: string; retour: string }) {
  const [enCours, demarrer] = useTransition();
  return (
    <div role="status" style={{
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18,
      padding: "10px 14px", borderRadius: 12, fontSize: 13.5,
      background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", color: "var(--text)",
    }}>
      <strong>Vue admin</strong>
      <span style={{ color: "var(--text-muted)" }}>Vous voyez l&apos;espace de {nom} comme l&apos;entreprise. Vos modifications sont réelles et journalisées.</span>
      <button type="button" className="btn btn-clair btn-sm" style={{ marginLeft: "auto" }} disabled={enCours}
        onClick={() => demarrer(async () => { await quitterVueEntreprise(); window.location.assign(retour); })}>
        Quitter la vue admin
      </button>
    </div>
  );
}
