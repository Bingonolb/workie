"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "var(--text)",
  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--text-muted)", marginBottom: 6, letterSpacing: "0.02em",
};

export function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateProfile(formData);
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={lbl}>Nom complet</label>
          <input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Alex Martin" style={inp}
            onFocus={e => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={e => (e.target.style.borderColor = "var(--border2)")}
          />
        </div>
        <div>
          <label style={lbl}>Ville</label>
          <input name="city" defaultValue={profile?.city ?? ""} placeholder="Zurich" style={inp}
            onFocus={e => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={e => (e.target.style.borderColor = "var(--border2)")}
          />
        </div>
        <div>
          <label style={lbl}>Pays</label>
          <input name="country" defaultValue={profile?.country ?? ""} placeholder="Suisse" style={inp}
            onFocus={e => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={e => (e.target.style.borderColor = "var(--border2)")}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={lbl}>Bio</label>
          <textarea name="bio" rows={3} defaultValue={profile?.bio ?? ""} placeholder="Ex-Google, maintenant indie hacker à Lausanne..." style={{ ...inp, resize: "none" }}
            onFocus={e => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={e => (e.target.style.borderColor = "var(--border2)")}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={lbl}>Photo de profil</label>
          <input name="avatar" type="file" accept="image/*" style={{ ...inp, padding: "9px 14px", color: "var(--text-muted)", cursor: "pointer" }} />
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid var(--border)" }}>
        Email : <span style={{ color: "var(--text-sub)" }}>{email}</span>
      </div>

      {success && (
        <div style={{ padding: "12px 16px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#10b981", textAlign: "center" }}>
          ✓ Profil mis à jour !
        </div>
      )}

      <button type="submit" disabled={pending} style={{
        background: pending ? "var(--surface3)" : "linear-gradient(135deg, #8b5cf6, #f97316)",
        color: "#fff", fontWeight: 700, fontSize: 14, border: "none",
        borderRadius: 10, padding: "13px 0", cursor: pending ? "not-allowed" : "pointer",
        transition: "opacity 0.2s", opacity: pending ? 0.7 : 1,
      }}>
        {pending ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
