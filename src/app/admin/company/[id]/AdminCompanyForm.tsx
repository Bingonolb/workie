"use client";

import { useTransition, useState } from "react";
import { adminUpdateCompany, adminDeleteCompany } from "@/lib/actions/admin";
import type { Company } from "@/lib/types";
import { Trash2, AlertTriangle, Check } from "lucide-react";
import { ChampsEntreprise } from "../ChampsEntreprise";

/**
 * Modifier une fiche entreprise.
 *
 * Les champs viennent de `ChampsEntreprise`, partagé avec la création : les
 * deux écrans tenaient chacun leur liste et elles avaient divergé. Ce fichier
 * ne garde que ce qui distingue une modification d'une création, à savoir la
 * suppression.
 */
export function AdminCompanyForm({ company, sectors }: { company: Company; sectors: string[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [infoImage, setInfoImage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await adminUpdateCompany(company.id, formData);
      if (res.error) { setError(res.error); return; }
      // Le texte a été enregistré même si l'image a échoué : on reste sur la
      // page pour le dire, plutôt que de partir en laissant croire que tout
      // s'est bien passé.
      if (res.avertissement) { setInfoImage(res.avertissement); setError(null); return; }
      window.location.href = "/admin";
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await adminDeleteCompany(company.id);
      if (res.error) { setError(res.error); return; }
      // Hard navigation — évite la tentative de rerender sur une entité supprimée
      window.location.href = "/admin";
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ChampsEntreprise company={company} sectors={sectors} infoImage={infoImage} setInfoImage={setInfoImage} />

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: 13, color: "#ef4444", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={14} strokeWidth={2.2} aria-hidden="true" style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
        <button type="submit" disabled={pending} style={{
          flex: 1, padding: "13px 0", borderRadius: 10, border: "none", cursor: pending ? "not-allowed" : "pointer",
          background: "var(--brand)",
          color: "#fff", fontWeight: 700, fontSize: 14, opacity: pending ? 0.7 : 1,
        }}>
          {pending ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>

        {!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)} style={{
            padding: "13px 16px", borderRadius: 10,
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.08)", color: "#ef4444",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            fontWeight: 600, fontSize: 13,
          }}>
            <Trash2 size={15} aria-hidden="true" /> Supprimer
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button type="button" onClick={handleDelete} disabled={pending} style={{
              padding: "10px 16px", borderRadius: 10, border: "none",
              background: "#ef4444", color: "#fff", cursor: "pointer",
              fontWeight: 700, fontSize: 13, whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Check size={14} strokeWidth={2.6} aria-hidden="true" />
              {pending ? "Suppression…" : "Confirmer la suppression"}
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} style={{
              padding: "6px", background: "none", border: "none",
              color: "var(--text-muted)", cursor: "pointer", fontSize: 12,
            }}>
              Annuler
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
