"use client";

import { useActionState, useState } from "react";
import { submitReview } from "@/lib/actions/reviews";

function StarPicker({ name, label }: { name: string; label: string }) {
  const [val, setVal] = useState(0);
  const [hover, setHover] = useState(0);
  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>{label}</p>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setVal(n)}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 2,
              fontSize: 22, filter: n <= (hover || val) ? "none" : "grayscale(1) opacity(0.3)",
            }}>
            ⭐
          </button>
        ))}
        <input type="hidden" name={name} value={val} />
      </div>
    </div>
  );
}

export function ReviewForm({ companyId, onSuccess }: { companyId: string; onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(submitReview, undefined);

  if (state?.success) {
    return (
      <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 14, padding: "20px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#10b981", marginBottom: 6 }}>Avis publié ! Merci 🙏</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Ton avis aide la communauté à faire les bons choix.</p>
      </div>
    );
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <input type="hidden" name="company_id" value={companyId} />

      {/* Overall rating — required */}
      <StarPicker name="rating_overall" label="Note globale *" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StarPicker name="rating_culture" label="Ambiance / Culture" />
        <StarPicker name="rating_management" label="Management" />
        <StarPicker name="rating_worklife" label="Équilibre vie pro/perso" />
        <StarPicker name="rating_career" label="Évolution de carrière" />
      </div>

      <div>
        <label style={lbl}>Titre de ton avis</label>
        <input name="title" placeholder="Super boîte mais attention au rythme..." style={inp} />
      </div>

      <div>
        <label style={lbl}>Ton avis * (anonyme par défaut)</label>
        <textarea name="content" required rows={4} placeholder="Décris ton expérience honnêtement..." style={{ ...inp, resize: "vertical" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lbl}>Points positifs</label>
          <textarea name="pros" rows={2} placeholder="Ce que j'ai apprécié..." style={{ ...inp, resize: "none" }} />
        </div>
        <div>
          <label style={lbl}>Points négatifs</label>
          <textarea name="cons" rows={2} placeholder="Ce qui m'a déçu..." style={{ ...inp, resize: "none" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lbl}>Ton poste (optionnel)</label>
          <input name="job_title" placeholder="Software Engineer" style={inp} />
        </div>
        <div>
          <label style={lbl}>Salaire annuel CHF (optionnel)</label>
          <input name="salary_chf" type="number" placeholder="95000" style={inp} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}>
          <input type="checkbox" name="is_current" value="true" defaultChecked style={{ accentColor: "#8b5cf6" }} />
          Employé actuel
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}>
          <input type="checkbox" name="is_anonymous" value="false" style={{ accentColor: "#8b5cf6" }} />
          Afficher mon pseudo
        </label>
      </div>

      {state?.error && (
        <p style={{ fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(239,68,68,0.2)" }}>
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} style={{
        background: "linear-gradient(135deg, #8b5cf6, #f97316)",
        color: "#fff", fontWeight: 700, fontSize: 15, border: "none",
        borderRadius: 12, padding: "14px 0", cursor: "pointer", opacity: pending ? 0.6 : 1,
      }}>
        {pending ? "Publication..." : "Publier mon avis"}
      </button>
    </form>
  );
}

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "var(--text)",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6,
};
