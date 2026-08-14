"use client";

import { useTransition, useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { adminUpdateCompany, adminDeleteCompany } from "@/lib/actions/admin";
import { EMPLOYEE_RANGES } from "@/lib/types";
import type { Company } from "@/lib/types";
import { Trash2, ImageIcon } from "lucide-react";

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
  borderRadius: 10, padding: "10px 14px", fontSize: 16, color: "var(--text)",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "var(--text-muted)", marginBottom: 5, letterSpacing: "0.05em", textTransform: "uppercase",
};

/** Convention pour une enseigne présente dans toute la Suisse. */
export const VILLE_MULTI_SITES = "Multi-sites";
export const CANTON_MULTI_SITES = "CH";

export function AdminCompanyForm({ company, sectors }: { company: Company; sectors: string[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrlValue, setCoverUrlValue] = useState(company.cover_url ?? "");
  const [tags, setTags] = useState<string[]>(company.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  // Multi-sites : une enseigne présente dans toute la Suisse n'a pas de ville
  // ni de canton propres. La convention est celle de LANDI, la première fiche
  // traitée ainsi, et elle est écrite ici une fois pour toutes plutôt que
  // ressaisie à la main : « Multi-site » ou « multisites » deviendraient des
  // valeurs distinctes de « Multi-sites », et rien ne les rejoindrait plus au
  // moment de filtrer ou de compter.
  const [ville, setVille] = useState(company.city);
  const [canton, setCanton] = useState(company.canton ?? "");
  // Mémorise la localisation réelle pour la rendre si la case est décochée.
  const [avantMultiSites, setAvantMultiSites] = useState<{ ville: string; canton: string } | null>(null);
  const multiSites = ville === VILLE_MULTI_SITES && canton === CANTON_MULTI_SITES;

  const basculerMultiSites = (coche: boolean) => {
    if (coche) {
      setAvantMultiSites({ ville, canton });
      setVille(VILLE_MULTI_SITES);
      setCanton(CANTON_MULTI_SITES);
    } else {
      setVille(avantMultiSites?.ville ?? "");
      setCanton(avantMultiSites?.canton ?? "");
    }
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef<string | null>(null);
  const [infoImage, setInfoImage] = useState<string | null>(null);

  const addTag = useCallback((raw: string) => {
    const t = raw.trim().replace(/^#+/, "").slice(0, 40);
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  }, [tags]);

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    return () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); };
  }, []);

  const revokeBlobPreview = () => {
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInfoImage("Optimisation…");

    // La requête ne peut pas dépasser 8 Mo. Une photo d'appareil les dépasse
    // souvent, et l'envoi échouait alors sans message exploitable — d'où
    // l'impression que « ça bugue » sur une image sur deux. On réduit ici.
    const { preparerImage, formaterPoids } = await import("@/lib/preparerImage");
    const r = await preparerImage(file);

    if (r.reduite && fileRef.current) {
      const dt = new DataTransfer();
      dt.items.add(r.fichier);
      fileRef.current.files = dt.files;
      setInfoImage(`Optimisée : ${formaterPoids(r.avant)} → ${formaterPoids(r.apres)}`);
    } else {
      setInfoImage(`${formaterPoids(r.apres)} · prête`);
    }

    revokeBlobPreview();
    const url = URL.createObjectURL(r.fichier);
    blobRef.current = url;
    setCoverPreview(url);
  };

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

  const displayCover = coverPreview ?? (coverUrlValue || null);

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Row 1 */}
      <div className="admin-grille-2">
        <div>
          <label style={lbl}>Nom</label>
          <input name="name" defaultValue={company.name} required style={inp} />
        </div>
        <div>
          <label style={lbl}>Secteur</label>
          <select name="sector" defaultValue={company.sector} style={{ ...inp, cursor: "pointer" }}>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2 */}
      <div className="admin-grille-3">
        <div>
          <label style={lbl}>Sous-secteur</label>
          <input name="subsector" defaultValue={company.subsector ?? ""} style={inp} />
        </div>
        <div>
          <label style={lbl}>Ville</label>
          {/* readOnly et non disabled : un champ désactivé n'est pas envoyé
              avec le formulaire, et la ville est obligatoire. */}
          <input
            name="city"
            value={ville}
            onChange={e => setVille(e.target.value)}
            readOnly={multiSites}
            required
            style={{ ...inp, ...(multiSites ? { opacity: 0.65, cursor: "not-allowed" } : null) }}
          />
        </div>
        <div>
          <label style={lbl}>Canton</label>
          <input
            name="canton"
            value={canton}
            onChange={e => setCanton(e.target.value)}
            readOnly={multiSites}
            style={{ ...inp, ...(multiSites ? { opacity: 0.65, cursor: "not-allowed" } : null) }}
          />
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 9, marginTop: -6, fontSize: 13, color: "var(--text-muted)", cursor: "pointer", width: "fit-content" }}>
        <input
          type="checkbox"
          checked={multiSites}
          onChange={e => basculerMultiSites(e.target.checked)}
          style={{ width: 16, height: 16, cursor: "pointer" }}
        />
        Présente dans toute la Suisse
        <span style={{ color: "var(--text-sub)" }}>
          (inscrit « {VILLE_MULTI_SITES} » et « {CANTON_MULTI_SITES} », comme LANDI)
        </span>
      </label>

      {/* Row 3 */}
      <div className="admin-grille-2">
        <div>
          <label style={lbl}>Taille</label>
          {/* Option vide en tête : une taille non renseignée doit rester
              non renseignée tant qu'elle n'est pas vérifiée. */}
          <select name="employee_range" defaultValue={company.employee_range ?? ""} style={{ ...inp, cursor: "pointer" }}>
            <option value="">Non renseignée</option>
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
            onChange={e => { setCoverUrlValue(e.target.value); revokeBlobPreview(); setCoverPreview(null); }}
            placeholder="https://images.unsplash.com/..."
            style={inp}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {infoImage ?? "ou uploader un fichier : n'importe quelle taille, réduite automatiquement à 2560 px"}
            </span>
            <label style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8, cursor: "pointer",
              background: "var(--surface2)", border: "1px solid var(--border)",
              fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
            }}>
              <ImageIcon size={13} aria-hidden="true" /> Choisir une image
              <input ref={fileRef} name="cover_file" type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </label>
            {(coverPreview || coverUrlValue) && (
              <button type="button" onClick={() => { revokeBlobPreview(); setCoverPreview(null); setCoverUrlValue(""); if (fileRef.current) fileRef.current.value = ""; }} style={{
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
                  Aperçu, non enregistré
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayCover} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, border: `2px solid ${coverPreview ? "#8b5cf6" : "var(--border)"}` }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
        </div>
      </div>

      {/* Autres URLs */}
      <div className="admin-grille-2">
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
          <label style={lbl}>Tags</label>
          <input type="hidden" name="tags" value={tags.join(", ")} />
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "8px 10px", minHeight: 44, boxSizing: "border-box",
          }}>
            {tags.map(t => (
              <span key={t} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, color: "#8b5cf6",
              }}>
                #{t}
                <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))} style={{
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  color: "#8b5cf6", fontSize: 13, lineHeight: 1, display: "flex",
                }}>×</button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKey}
              onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
              placeholder={tags.length === 0 ? "Ajouter un tag…" : ""}
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, color: "var(--text)", flex: 1, minWidth: 80 }}
            />
          </div>
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
            <Trash2 size={15} aria-hidden="true" /> Supprimer
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
