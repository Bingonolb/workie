"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deciderRevendication, type DemandeAdmin } from "@/lib/actions/revendicationsAdmin";

const STATUTS: Record<string, { libelle: string; couleur: string }> = {
  en_attente: { libelle: "À valider", couleur: "#f59e0b" },
  code_envoye: { libelle: "Code envoyé", couleur: "#6b7280" },
  verifiee: { libelle: "Vérifiée, paiement en attente", couleur: "#3b82f6" },
  active: { libelle: "Abonnée", couleur: "#10b981" },
  refusee: { libelle: "Refusée", couleur: "#ef4444" },
};

export function ListeRevendications({ demandes }: { demandes: DemandeAdmin[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const decider = (id: string, accepter: boolean) => {
    setErreur(null);
    demarrer(async () => {
      const r = await deciderRevendication(id, accepter, notes[id] ?? "");
      if (r.error) setErreur(r.error); else router.refresh();
    });
  };

  if (demandes.length === 0) return <p style={{ color: "var(--text-muted)" }}>Aucune demande pour l&apos;instant.</p>;

  const triees = [...demandes].sort((a, b) => Number(b.statut === "en_attente") - Number(a.statut === "en_attente"));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {erreur && <p role="alert" style={{ color: "#ef4444", fontSize: 13.5 }}>{erreur}</p>}
      {triees.map(d => {
        const s = STATUTS[d.statut] ?? { libelle: d.statut, couleur: "#6b7280" };
        return (
          <div key={d.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: 15 }}>
                  {d.fiche && !d.entreprise && <span style={{ fontSize: 11, fontWeight: 800, color: "#7c5cff", background: "rgba(124,92,255,0.12)", padding: "2px 8px", borderRadius: 999, marginRight: 8 }}>Nouvelle entreprise</span>}
                  {d.entreprise?.name ?? d.fiche?.name ?? "Fiche supprimée"}
                </p>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  Site : {(d.entreprise?.website_url ?? d.fiche?.website_url) || "non renseigné"}
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, color: s.couleur, background: `${s.couleur}1f` }}>{s.libelle}</span>
            </div>
            <p style={{ fontSize: 13.5 }}>
              <strong>{d.prenom} {d.nom}</strong>, {d.fonction} · {d.email_pro}
              <span style={{ color: "var(--text-muted)" }}> · {new Date(d.cree_le).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich" })}</span>
            </p>
            {d.fiche && !d.entreprise && (
              <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, display: "grid", gap: 6 }}>
                <p><strong>{d.fiche.sector}</strong> · {d.fiche.city} ({d.fiche.canton}){d.fiche.employee_range ? ` · ${d.fiche.employee_range} employés` : ""}{d.fiche.langues?.length ? ` · ${d.fiche.langues.join(", ")}` : ""}</p>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.55, whiteSpace: "pre-line" }}>{d.fiche.description}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Acceptée, la fiche sera créée et publiée dès le paiement de l&apos;abonnement.</p>
              </div>
            )}
            {d.statut === "en_attente" && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input value={notes[d.id] ?? ""} onChange={e => setNotes(n => ({ ...n, [d.id]: e.target.value }))}
                  placeholder="Note interne (facultative)" aria-label="Note interne" maxLength={300}
                  style={{ flex: "1 1 220px", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)" }} />
                <button type="button" className="btn btn-fantome" disabled={enCours} onClick={() => decider(d.id, false)}>Refuser</button>
                <button type="button" className="btn btn-encre" disabled={enCours} onClick={() => decider(d.id, true)}>Accepter</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
