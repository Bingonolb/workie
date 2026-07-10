"use client";

import { useTransition, useState, useRef } from "react";
import { adminUpdateCompany, adminDeleteCompany } from "@/lib/actions/admin";
import { SECTOR_COLORS, EMPLOYEE_RANGES } from "@/lib/types";
import type { Company } from "@/lib/types";
import { Trash2, ImageIcon } from "lucide-react";

const SECTORS = Object.keys(SECTOR_COLORS);

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
  borderRadius: 10, padding: "10px 14px", fontSize: 16, color: "var(--text)",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "var(--text-muted)", marginBottom: 5, letterSpacing: "0.05em", textTransform: "uppercase",
};

export function AdminCompanyForm({ company }: { company: Company }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrlValue, setCoverUrlValue] = useState(company.cover_url ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await adminUpdateCompany(company.id, formData);
      if (res.error) { setError(res.error); return; }
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

  const displayCover = coverPreview ?? (coverUrlValue || null);

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={lbl}>Nom</label>
          <input name="name" defaultValue={company.name} required style={inp} />
        </div>
        <div>
          <label style={lbl}>Secteur</label>
          <select name="sector" defaultValue={company.sector} style={{ ...inp, cursor: "pointer" }}>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div>
          <label style={lbl}>Sous-secteur</label>
          <input name="subsector" defaultValue={company.subsector ?? ""} style={inp} />
        </div>
        <div>
          <label style={lbl}>Ville</label>
          <input name="city" defaultValue={company.city} required style={inp} />
        </div>
        <div>
          <label style={lbl}>Canton</label>
          <input name="canton" defaultValue={company.canton ?? ""} style={inp} />
        </div>
      </div>

      {/* Row 3 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={lbl}>Taille</label>
          <select name="employee_range" defaultValue={company.employee_range} style={{ ...inp, cursor: "pointer" }}>
            {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Salaire moyen (CHF/an)</label>
          <input name="avg_salary_chf" type="number" defaultValue={company.avg_salary_chf ?? ""} placeholder="95000" style={inp} />
        </div>
      </div>

      {/* Description */}
      <div>
        <label style={lbl}>Description</label>
        <textarea name="description" rows={3} defaultValue={company.description ?? ""} style={{ ...inp, resize: "vertical" }} />
      </div>

      {/* Cover — URL + upload fichier */}
      <div>
        <label style={lbl}>Image de couverture</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            name="cover_url"
            value={coverUrlValue}
            onChange={e => { setCoverUrlValue(e.target.value); setCoverPreview(null); }}
            placeholder="https://images.unsplash.com/..."
            style={inp}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>ou uploader un fichier :</span>
            <label style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8, cursor: "pointer",
              background: "var(--surface2)", border: "1px solid var(--border)",
              fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
            }}>
              <ImageIcon size={13} /> Choisir une image
              <input ref={fileRef} name="cover_file" type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </label>
            {(coverPreview || coverUrlValue) && (
              <button type="button" onClick={() => { setCoverPreview(null); setCoverUrlValue(""); if (fileRef.current) fileRef.current.value = ""; }} style={{
                fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600,
              }}>
                ✕ Supprimer la bannière
              </button>
            )}
          </div>

          {/* Preview */}
          {displayCover && (
            <div style={{ position: "relative" }}>
              {coverPreview && (
                <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(139,92,246,0.9)", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                  Aperçu — non enregistré
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayCover} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, border: `2px solid ${coverPreview ? "#8b5cf6" : "var(--border)"}` }} />
            </div>
          )}
        </div>
      </div>

      {/* Autres URLs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={lbl}>Logo URL</label>
          <input name="logo_url" defaultValue={company.logo_url ?? ""} placeholder="https://..." style={inp} />
        </div>
        <div>
          <label style={lbl}>Site web</label>
          <input name="website_url" defaultValue={company.website_url ?? ""} placeholder="https://..." style={inp} />
        </div>
        <div>
          <label style={lbl}>LinkedIn</label>
          <input name="linkedin_url" defaultValue={company.linkedin_url ?? ""} placeholder="https://linkedin.com/company/..." style={inp} />
        </div>
        <div>
          <label style={lbl}>Tags (virgule)</label>
          <input name="tags" defaultValue={company.tags?.join(", ") ?? ""} placeholder="tech, innovation" style={inp} />
        </div>
      </div>

      {/* Verified */}
      <div>
        <label style={lbl}>Statut</label>
        <select name="is_verified" defaultValue={company.is_verified ? "true" : "false"} style={{ ...inp, width: "auto", cursor: "pointer" }}>
          <option value="true">✓ Entreprise vérifiée</option>
          <option value="false">Non vérifiée</option>
        </select>
      </div>

      {/* Feedback */}
      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: 13, color: "#ef4444" }}>
          ⚠ {error}
        </div>
      )}


      {/* Actions */}
      <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
        <button type="submit" disabled={pending} style={{
          flex: 1, padding: "13px 0", borderRadius: 10, border: "none", cursor: pending ? "not-allowed" : "pointer",
          background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          color: "#fff", fontWeight: 700, fontSize: 14, opacity: pending ? 0.7 : 1,
        }}>
          {pending ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>

        {!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)} style={{
            padding: "13px 16px", borderRadius: 10,
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.08)", color: "#ef4444",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            fontWeight: 600, fontSize: 13,
          }}>
            <Trash2 size={15} /> Supprimer
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button type="button" onClick={handleDelete} disabled={pending} style={{
              padding: "10px 16px", borderRadius: 10, border: "none",
              background: "#ef4444", color: "#fff", cursor: "pointer",
              fontWeight: 700, fontSize: 13, whiteSpace: "nowrap",
            }}>
              {pending ? "Suppression..." : "✓ Confirmer la suppression"}
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
