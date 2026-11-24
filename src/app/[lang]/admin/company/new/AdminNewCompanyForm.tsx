"use client";

import { useTransition, useState } from "react";
import { adminAddCompany } from "@/lib/actions/admin";
import { ChampsEntreprise } from "../ChampsEntreprise";
import { AlertTriangle } from "lucide-react";

/**
 * Créer une fiche entreprise.
 *
 * Les champs viennent de `ChampsEntreprise`, partagé avec la modification :
 * les deux écrans tenaient chacun leur liste et elles avaient divergé. Ce
 * fichier ne garde que ce qui distingue une création d'une modification, à
 * savoir le bouton et l'absence de suppression.
 */
export function AdminNewCompanyForm({ sectors }: { sectors: string[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [infoImage, setInfoImage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await adminAddCompany(formData);
      if (res.error) { setError(res.error); return; }
      // La fiche est créée même si l'image a échoué : on reste sur place pour
      // le dire, plutôt que de partir en laissant croire que tout a réussi.
      if (res.avertissement) { setInfoImage(res.avertissement); return; }
      window.location.href = "/admin";
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ChampsEntreprise sectors={sectors} infoImage={infoImage} setInfoImage={setInfoImage} />

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
          {pending ? "Création…" : "Créer l'entreprise"}
        </button>
      </div>
    </form>
  );
}
