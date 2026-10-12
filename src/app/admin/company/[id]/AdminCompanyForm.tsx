"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { adminUpdateCompany, adminDeleteCompany } from "@/lib/actions/admin";
import type { Company } from "@/lib/types";
import { Trash2, AlertTriangle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { ChampsEntreprise } from "../ChampsEntreprise";

/**
 * Modifier une fiche entreprise.
 *
 * Les champs viennent de `ChampsEntreprise`, partagé avec la création : les
 * deux écrans tenaient chacun leur liste et elles avaient divergé. Ce fichier
 * ne garde que ce qui distingue une modification d'une création, à savoir la
 * suppression.
 */
export function AdminCompanyForm({ company, sectors, precedente, suivante }: {
  company: Company;
  sectors: string[];
  /** Les fiches voisines dans l'ordre alphabetique, pour enchainer sans repasser par le panel. */
  precedente: { id: string; name: string } | null;
  suivante: { id: string; name: string } | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [infoImage, setInfoImage] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  /*
   * Passer a la fiche voisine enregistre d'abord.
   *
   * Reprendre un millier de fiches veut dire enchainer : corriger, passer,
   * corriger. Partir sans enregistrer perdrait le travail en silence, une
   * fois sur dix, et on ne s'en apercoit que des semaines plus tard. Si
   * l'enregistrement echoue, on reste sur place avec l'erreur : c'est le seul
   * moment ou l'on peut encore la corriger.
   */
  const aller = (cible: { id: string } | null) => {
    if (!cible || pending) return;
    const formulaire = formRef.current;
    if (!formulaire) return;
    setError(null);
    const formData = new FormData(formulaire);
    startTransition(async () => {
      const res = await adminUpdateCompany(company.id, formData);
      if (res.error) { setError(res.error); return; }
      if (res.avertissement) { setInfoImage(res.avertissement); return; }
      window.location.href = `/admin/company/${cible.id}`;
    });
  };

  // Les fleches du clavier avec Alt : les mains restent sur le clavier, et
  // Alt evite de voler les fleches aux champs de saisie.
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); aller(precedente); }
      if (e.key === "ArrowRight") { e.preventDefault(); aller(suivante); }
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  });

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
    <form ref={formRef} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Les voisines, en haut et en bas : en haut on les voit en arrivant,
          en bas on les a sous la main apres avoir rempli le formulaire. */}
      <BarreVoisines precedente={precedente} suivante={suivante} aller={aller} pending={pending} />

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

      <BarreVoisines precedente={precedente} suivante={suivante} aller={aller} pending={pending} />
    </form>
  );
}

/** Deux boutons, « Enregistrer et precedente » et « Enregistrer et suivante ». */
function BarreVoisines({ precedente, suivante, aller, pending }: {
  precedente: { id: string; name: string } | null;
  suivante: { id: string; name: string } | null;
  aller: (cible: { id: string } | null) => void;
  pending: boolean;
}) {
  const style = (actif: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 7, minWidth: 0,
    padding: "9px 14px", borderRadius: 10,
    border: "1px solid var(--border2)", background: "var(--surface2)",
    color: actif ? "var(--text)" : "var(--text-muted)",
    fontSize: 13, fontWeight: 600,
    cursor: actif && !pending ? "pointer" : "not-allowed",
    opacity: actif && !pending ? 1 : 0.5,
  });
  const nom: React.CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <button type="button" onClick={() => aller(precedente)} disabled={!precedente || pending} style={style(Boolean(precedente))} title="Enregistre puis ouvre la fiche précédente (Alt + flèche gauche)">
        <ChevronLeft size={16} aria-hidden="true" />
        <span style={nom}>{precedente ? precedente.name : "Début de la liste"}</span>
      </button>
      <button type="button" onClick={() => aller(suivante)} disabled={!suivante || pending} style={style(Boolean(suivante))} title="Enregistre puis ouvre la fiche suivante (Alt + flèche droite)">
        <span style={nom}>{suivante ? suivante.name : "Fin de la liste"}</span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
