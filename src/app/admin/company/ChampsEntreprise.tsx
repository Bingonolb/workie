"use client";

import { useState, useRef, useEffect } from "react";
import { EMPLOYEE_RANGES } from "@/lib/types";
import type { Company } from "@/lib/types";
import { ImageIcon } from "lucide-react";

/**
 * Les champs d'une fiche entreprise, écrits une seule fois.
 *
 * Ils vivaient en double, dans le formulaire de création et dans celui de
 * modification, et les deux listes avaient divergé : la création n'offrait ni
 * le statut, ni l'envoi d'une image, ni la case « présente dans toute la
 * Suisse ». Une fiche créée devait donc être rouverte en modification pour
 * être complétée, et rien ne signalait ce qui manquait.
 *
 * Une seule liste et les deux écrans ne peuvent plus se contredire. Le
 * formulaire qui l'entoure ne garde que ce qui lui est propre : le bouton
 * d'envoi, et la suppression pour la fiche qui existe déjà.
 */

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

export function ChampsEntreprise({
  company,
  sectors,
  infoImage,
  setInfoImage,
}: {
  /** Absent à la création. */
  company?: Company;
  sectors: string[];
  infoImage: string | null;
  setInfoImage: (v: string | null) => void;
}) {
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrlValue, setCoverUrlValue] = useState(company?.cover_url ?? "");

  // Multi-sites : une enseigne présente dans toute la Suisse n'a pas de ville
  // ni de canton propres. La convention est celle de LANDI, la première fiche
  // traitée ainsi, et elle est écrite ici une fois pour toutes plutôt que
  // ressaisie à la main : « Multi-site » ou « multisites » deviendraient des
  // valeurs distinctes de « Multi-sites », et rien ne les rejoindrait plus au
  // moment de filtrer ou de compter.
  const [ville, setVille] = useState(company?.city ?? "");
  const [canton, setCanton] = useState(company?.canton ?? "");
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

  const displayCover = coverPreview ?? (coverUrlValue || null);

  return (
    <>
      <div className="admin-grille-2">
        <div>
          <label style={lbl}>Nom</label>
          <input name="name" defaultValue={company?.name ?? ""} required style={inp} />
        </div>
        <div>
          <label style={lbl}>Secteur</label>
          <select name="sector" defaultValue={company?.sector ?? sectors[0]} style={{ ...inp, cursor: "pointer" }}>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="admin-grille-3">
        <div>
          <label style={lbl}>Sous-secteur</label>
          <input name="subsector" defaultValue={company?.subsector ?? ""} style={inp} />
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

      <div className="admin-grille-2">
        <div>
          <label style={lbl}>Taille</label>
          {/* Option vide en tête : une taille non renseignée doit rester
              non renseignée tant qu'elle n'est pas vérifiée. */}
          <select name="employee_range" defaultValue={company?.employee_range ?? ""} style={{ ...inp, cursor: "pointer" }}>
            <option value="">Non renseignée</option>
            {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Salaire moyen (CHF/an)</label>
          <input name="avg_salary_chf" type="number" defaultValue={company?.avg_salary_chf ?? ""} placeholder="95000" style={inp} />
        </div>
      </div>

      <div>
        <label style={lbl}>Description</label>
        <textarea name="description" rows={3} defaultValue={company?.description ?? ""} style={{ ...inp, resize: "vertical" }} />
      </div>

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

      <div className="admin-grille-2">
        <div>
          <label style={lbl}>Logo URL</label>
          <input name="logo_url" defaultValue={company?.logo_url ?? ""} placeholder="https://..." style={inp} />
        </div>
        <div>
          <label style={lbl}>Site web</label>
          <input name="website_url" defaultValue={company?.website_url ?? ""} placeholder="https://..." style={inp} />
        </div>
        <div>
          <label style={lbl}>LinkedIn</label>
          <input name="linkedin_url" defaultValue={company?.linkedin_url ?? ""} placeholder="https://linkedin.com/company/..." style={inp} />
        </div>
      </div>

      <div>
        <label style={lbl}>Statut</label>
        <select name="is_verified" defaultValue={company?.is_verified ? "true" : "false"} style={{ ...inp, width: "auto", cursor: "pointer" }}>
          <option value="true">Entreprise vérifiée</option>
          <option value="false">Non vérifiée</option>
        </select>
      </div>
    </>
  );
}

export const styleChampAdmin = inp;
export const styleLibelleAdmin = lbl;
