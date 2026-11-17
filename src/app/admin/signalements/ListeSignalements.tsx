"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateReportStatus, type Report } from "@/lib/actions/reports";

const TYPES: Record<string, string> = { company: "Fiche", ad_campaign: "Publicité", review: "Avis", profile: "Profil" };
const STATUTS: Record<string, { libelle: string; couleur: string }> = {
  pending: { libelle: "À traiter", couleur: "#f59e0b" },
  reviewed: { libelle: "Traité", couleur: "#10b981" },
  dismissed: { libelle: "Ignoré", couleur: "#6b7280" },
  content_deleted: { libelle: "Contenu retiré", couleur: "#ef4444" },
};

export function ListeSignalements({ signalements }: { signalements: Report[] }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const decider = (id: string, statut: "reviewed" | "dismissed") => {
    setErreur(null);
    demarrer(async () => {
      const r = await updateReportStatus(id, statut);
      if (r.error) setErreur(r.error); else router.refresh();
    });
  };

  if (signalements.length === 0) return <p style={{ color: "var(--text-muted)" }}>Aucun signalement pour l&apos;instant.</p>;
  const tries = [...signalements].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {erreur && <p role="alert" style={{ color: "#ef4444", fontSize: 13.5 }}>{erreur}</p>}
      {tries.map(s => {
        const st = STATUTS[s.status] ?? { libelle: s.status, couleur: "#6b7280" };
        return (
          <div key={s.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <p style={{ fontWeight: 800, fontSize: 15 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginRight: 8 }}>{TYPES[s.target_type] ?? s.target_type}</span>
                {s.target_url ? <Link href={s.target_url} target="_blank" style={{ color: "var(--text)" }}>{s.target_label ?? "Sans titre"}</Link> : (s.target_label ?? "Sans titre")}
              </p>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, color: st.couleur, background: `${st.couleur}1f` }}>{st.libelle}</span>
            </div>
            <p style={{ fontSize: 14 }}><strong>{s.category}</strong>{s.explanation ? ` : ${s.explanation}` : ""}</p>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              Par {s.reporter_name ?? "compte supprimé"}{s.reporter_email ? ` (${s.reporter_email})` : ""} · {new Date(s.created_at).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich" })}
            </p>
            {s.status === "pending" && (
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-fantome" disabled={enCours} onClick={() => decider(s.id, "dismissed")}>Ignorer</button>
                <button type="button" className="btn btn-encre" disabled={enCours} onClick={() => decider(s.id, "reviewed")}>Marquer comme traité</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
