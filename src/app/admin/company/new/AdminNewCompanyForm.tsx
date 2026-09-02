"use client";

import { useTransition, useState, useCallback, KeyboardEvent } from "react";
import { adminAddCompany } from "@/lib/actions/admin";
import { EMPLOYEE_RANGES } from "@/lib/types";

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
  borderRadius: 10, padding: "10px 14px", fontSize: 16, color: "var(--text)",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "var(--text-muted)", marginBottom: 5, letterSpacing: "0.05em", textTransform: "uppercase",
};

export function AdminNewCompanyForm({ sectors }: { sectors: string[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await adminAddCompany(formData);
      if (res.error) { setError(res.error); return; }
      window.location.href = "/admin";
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <div className="admin-grille-2">
        <div>
          <label style={lbl}>Nom *</label>
          <input name="name" required style={inp} />
        </div>
        <div>
          <label style={lbl}>Secteur</label>
          <select name="sector" defaultValue={sectors[0]} style={{ ...inp, cursor: "pointer" }}>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="admin-grille-3">
        <div>
          <label style={lbl}>Sous-secteur</label>
          <input name="subsector" style={inp} />
        </div>
        <div>
          <label style={lbl}>Ville *</label>
          <input name="city" required style={inp} />
        </div>
        <div>
          <label style={lbl}>Canton</label>
          <input name="canton" style={inp} />
        </div>
      </div>

      <div className="admin-grille-2">
        <div>
          <label style={lbl}>Taille</label>
          {/* Vide par défaut : ne rien affirmer tant que la taille n'est pas connue. */}
          <select name="employee_range" defaultValue="" style={{ ...inp, cursor: "pointer" }}>
            <option value="">Non renseignée</option>
            {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Salaire moyen (CHF/an)</label>
          <input name="avg_salary_chf" type="number" placeholder="95000" style={inp} />
        </div>
      </div>

      <div>
        <label style={lbl}>Description</label>
        <textarea name="description" rows={3} style={{ ...inp, resize: "vertical" }} />
      </div>

      <div className="admin-grille-2">
        <div>
          <label style={lbl}>Logo URL</label>
          <input name="logo_url" placeholder="https://..." style={inp} />
        </div>
        <div>
          <label style={lbl}>Image de couverture URL</label>
          <input name="cover_url" placeholder="https://..." style={inp} />
        </div>
        <div>
          <label style={lbl}>Site web</label>
          <input name="website_url" placeholder="https://..." style={inp} />
        </div>
        <div>
          <label style={lbl}>LinkedIn</label>
          <input name="linkedin_url" placeholder="https://linkedin.com/company/..." style={inp} />
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

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: 13, color: "#ef4444" }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
        <button type="submit" disabled={pending} style={{
          flex: 1, padding: "13px 0", borderRadius: 10, border: "none", cursor: pending ? "not-allowed" : "pointer",
          background: "var(--brand)",
          color: "#fff", fontWeight: 700, fontSize: 14, opacity: pending ? 0.7 : 1,
        }}>
          {pending ? "Création..." : "Créer l'entreprise"}
        </button>
      </div>
    </form>
  );
}
