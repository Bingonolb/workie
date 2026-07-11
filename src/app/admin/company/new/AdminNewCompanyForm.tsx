"use client";

import { useTransition, useState } from "react";
import { adminAddCompany } from "@/lib/actions/admin";
import { SECTOR_COLORS, EMPLOYEE_RANGES } from "@/lib/types";

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

export function AdminNewCompanyForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={lbl}>Nom *</label>
          <input name="name" required style={inp} />
        </div>
        <div>
          <label style={lbl}>Secteur</label>
          <select name="sector" defaultValue={SECTORS[0]} style={{ ...inp, cursor: "pointer" }}>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={lbl}>Taille</label>
          <select name="employee_range" defaultValue={EMPLOYEE_RANGES[0]} style={{ ...inp, cursor: "pointer" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
          <label style={lbl}>Tags (virgule)</label>
          <input name="tags" placeholder="tech, innovation" style={inp} />
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
          background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          color: "#fff", fontWeight: 700, fontSize: 14, opacity: pending ? 0.7 : 1,
        }}>
          {pending ? "Création..." : "Créer l'entreprise"}
        </button>
      </div>
    </form>
  );
}
