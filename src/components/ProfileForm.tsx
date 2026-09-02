"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border2, var(--border))",
  borderRadius: 10, padding: "11px 14px", fontSize: 16, color: "var(--text)",
  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--text-muted)", marginBottom: 6, letterSpacing: "0.02em",
};

export function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      setSaveError(null);
      try {
        const res = await updateProfile(formData);
        if (res?.error) { setSaveError(res.error); return; }
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setSaveError((err as Error).message ?? "Une erreur est survenue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <div className="profile-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="full_name" style={lbl}>Nom complet</label>
          <input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Alex Martin" style={inp}
            onFocus={e => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="city" style={lbl}>Canton</label>
          <select id="city" name="city" defaultValue={profile?.city ?? ""} style={{ ...inp, appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: 36 }}>
            <option value="">Choisir un canton</option>
            {[
              ["ZH","Zürich"],["BE","Bern"],["LU","Lucerne"],["UR","Uri"],["SZ","Schwyz"],
              ["OW","Obwalden"],["NW","Nidwalden"],["GL","Glaris"],["ZG","Zoug"],
              ["FR","Fribourg"],["SO","Soleure"],["BS","Bâle-Ville"],["BL","Bâle-Campagne"],
              ["SH","Schaffhouse"],["AR","Appenzell Rh.-Ext."],["AI","Appenzell Rh.-Int."],
              ["SG","Saint-Gall"],["GR","Grisons"],["AG","Argovie"],["TG","Thurgovie"],
              ["TI","Tessin"],["VD","Vaud"],["VS","Valais"],["NE","Neuchâtel"],
              ["GE","Genève"],["JU","Jura"],
            ].map(([code, name]) => <option key={code} value={name}>{name} ({code})</option>)}
          </select>
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid var(--border)" }}>
        Email : <span style={{ color: "var(--text)" }}>{email}</span>
      </div>

      {saveError && (
        <div role="alert" style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#ef4444" }}>
          ⚠ {saveError}
        </div>
      )}
      {success && (
        <div role="status" style={{ padding: "12px 16px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#10b981", textAlign: "center" }}>
          ✓ Profil mis à jour !
        </div>
      )}

      <button type="submit" disabled={pending} style={{
        background: pending ? "var(--surface3)" : "var(--brand)",
        color: "#fff", fontWeight: 700, fontSize: 14, border: "none",
        borderRadius: 10, padding: "13px 0", cursor: pending ? "not-allowed" : "pointer",
        transition: "opacity 0.2s", opacity: pending ? 0.7 : 1,
      }}>
        {pending ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
