"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { getBusinessCompany, updateBusinessProfile } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Upload, LogOut } from "lucide-react";
import { EMPLOYEE_RANGES } from "@/lib/types";

const CANTONS = [
  { code: "ZH", name: "Zürich" }, { code: "BE", name: "Bern" }, { code: "LU", name: "Lucerne" },
  { code: "UR", name: "Uri" }, { code: "SZ", name: "Schwyz" }, { code: "OW", name: "Obwald" },
  { code: "NW", name: "Nidwald" }, { code: "GL", name: "Glaris" }, { code: "ZG", name: "Zug" },
  { code: "FR", name: "Fribourg" }, { code: "SO", name: "Soleure" }, { code: "BS", name: "Bâle-Ville" },
  { code: "BL", name: "Bâle-Campagne" }, { code: "SH", name: "Schaffhouse" }, { code: "AR", name: "Appenzell A.-Rh." },
  { code: "AI", name: "Appenzell I.-Rh." }, { code: "SG", name: "St-Gallen" }, { code: "GR", name: "Grisons" },
  { code: "AG", name: "Argovie" }, { code: "TG", name: "Thurgovie" }, { code: "TI", name: "Tessin" },
  { code: "VD", name: "Vaud" }, { code: "VS", name: "Valais" }, { code: "NE", name: "Neuchâtel" },
  { code: "GE", name: "Genève" }, { code: "JU", name: "Jura" },
];

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "11px 14px", fontSize: 16, color: "var(--text)",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6,
};

type Company = Record<string, string | number | boolean | null | undefined>;

export function ProfileClient({ initialCompany }: { initialCompany: Company }) {
  const router = useRouter();
  const [company, setCompany] = useState<Company>(initialCompany);
  const [state, action, pending] = useActionState(updateBusinessProfile, undefined);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const logoBlobRef = useRef<string | null>(null);
  const coverBlobRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (logoBlobRef.current) URL.revokeObjectURL(logoBlobRef.current);
      if (coverBlobRef.current) URL.revokeObjectURL(coverBlobRef.current);
    };
  }, []);

  // Refresh company after successful save so hidden logo_url stays current
  useEffect(() => {
    if (state?.success) {
      getBusinessCompany().then(r => { if (r.company) setCompany(r.company as Company); });
    }
  }, [state?.success]);

  return (
    <div className="biz-page" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 6 }}>Ma fiche entreprise</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Ces informations sont visibles publiquement sur votre fiche Workie.</p>
      </div>

      {state?.success && (
        <div role="status" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle size={18} color="#10b981" aria-hidden="true" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>Fiche mise à jour avec succès</span>
        </div>
      )}
      {state?.error && (
        <div role="alert" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 24 }}>
          <span style={{ fontSize: 14, color: "#ef4444" }}>{state.error}</span>
        </div>
      )}

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 24 }} encType="multipart/form-data">

        {/* Logo */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Identité visuelle</p>

          <div className="biz-form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <label style={lbl}>Logo</label>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                {(logoPreview ?? company.logo_url) ? (
                  <img src={logoPreview ?? String(company.logo_url)} alt="logo" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1px solid var(--border)" }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff" }}>
                    {String(company.name ?? "?")[0]}
                  </div>
                )}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border2)", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", cursor: "pointer" }}>
                    <Upload size={14} aria-hidden="true" /> Choisir
                    <input type="file" name="logo_file" accept="image/*" style={{ display: "none" }} onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { if (logoBlobRef.current) URL.revokeObjectURL(logoBlobRef.current); const u = URL.createObjectURL(f); logoBlobRef.current = u; setLogoPreview(u); }
                    }} />
                  </label>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>PNG, JPG · max 10MB</p>
                </div>
              </div>
              <input type="hidden" name="logo_url" value={String(company.logo_url ?? "")} />
            </div>

            <div>
              <label style={lbl}>Photo de couverture</label>
              {(coverPreview ?? company.cover_url) && (
                <img src={coverPreview ?? String(company.cover_url)} alt="cover" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 8 }} />
              )}
              <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border2)", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", cursor: "pointer", width: "fit-content" }}>
                <Upload size={14} aria-hidden="true" /> Changer la photo
                <input type="file" name="cover_file" accept="image/*" style={{ display: "none" }} onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { if (coverBlobRef.current) URL.revokeObjectURL(coverBlobRef.current); const u = URL.createObjectURL(f); coverBlobRef.current = u; setCoverPreview(u); }
                }} />
              </label>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>PNG, JPG · max 10MB · recommandé 1920×1080</p>
            </div>
          </div>
        </div>

        {/* Localisation & infos — obligatoire */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Localisation & infos</p>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "2px 7px" }}>Obligatoire</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="biz-form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label htmlFor="biz-city" style={lbl}>Ville *</label>
                <input id="biz-city" name="city" type="text" required
                  defaultValue={String(company.city ?? "")}
                  placeholder="Genève, Zurich, Lausanne..."
                  style={inp} />
              </div>
              <div>
                <label htmlFor="biz-canton" style={lbl}>Canton</label>
                <select id="biz-canton" name="canton" defaultValue={String(company.canton ?? "")} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">— Sélectionner —</option>
                  {CANTONS.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="biz-employee-range" style={lbl}>Taille de l&apos;entreprise</label>
              <select id="biz-employee-range" name="employee_range" defaultValue={String(company.employee_range ?? "")} style={{ ...inp, cursor: "pointer" }}>
                <option value="">— Sélectionner —</option>
                {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r} employés</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Tags — obligatoire */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Mots-clés</p>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "2px 7px" }}>Obligatoire</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.6 }}>
            Séparés par des virgules · ex: <em>startup, innovation, tech, durabilité</em>
          </p>
          <input id="biz-tags" name="tags" type="text"
            defaultValue={Array.isArray(company.tags) ? (company.tags as string[]).join(", ") : String(company.tags ?? "")}
            placeholder="startup, innovation, tech, durabilité..."
            style={inp} />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Minimum 1 mot-clé · max 10 · apparaissent comme #hashtags sur votre fiche</p>
        </div>

        {/* Description */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
          <label htmlFor="biz-description" style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 20 }}>Description</label>
          <textarea id="biz-description" name="description" rows={5} defaultValue={String(company.description ?? "")}
            placeholder="Décrivez votre entreprise, votre culture, vos valeurs..."
            style={{ ...inp, resize: "vertical" }} />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Cette description apparaît en haut de votre fiche publique.</p>
        </div>

        {/* Liens */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Liens & réseaux sociaux</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { name: "website_url", label: "🌐 Site web", placeholder: "https://www.entreprise.ch" },
              { name: "linkedin_url", label: "💼 LinkedIn", placeholder: "https://linkedin.com/company/..." },
              { name: "twitter_url", label: "𝕏 Twitter / X", placeholder: "https://x.com/..." },
              { name: "instagram_url", label: "📸 Instagram", placeholder: "https://instagram.com/..." },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label htmlFor={`biz-${name}`} style={lbl}>{label}</label>
                <input id={`biz-${name}`} name={name} type="url" defaultValue={String((company as Record<string, unknown>)[name] ?? "")} placeholder={placeholder} style={inp} />
              </div>
            ))}
          </div>
        </div>

        <div className="biz-submit-row" style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={pending} style={{ padding: "13px 32px", borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
            {pending ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>

      {/* Se déconnecter — visible surtout sur mobile (sidebar masquée) */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", color: "#ef4444", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
        >
          <LogOut size={16} aria-hidden="true" /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
