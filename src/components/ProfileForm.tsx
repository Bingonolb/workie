"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";

const input: React.CSSProperties = {
  width: "100%", borderRadius: 10, border: "1px solid #e8e8e8",
  background: "#fafafa", color: "#111", padding: "11px 14px",
  fontSize: 14, outline: "none", boxSizing: "border-box",
};
const label: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#555",
  marginBottom: 6,
};

export function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={label}>Nom complet</label>
          <input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Alexandre Martin" style={input} />
        </div>
        <div>
          <label style={label}>Ville</label>
          <input name="city" defaultValue={profile?.city ?? ""} placeholder="Paris" style={input} />
        </div>
        <div>
          <label style={label}>Pays</label>
          <input name="country" defaultValue={profile?.country ?? ""} placeholder="France" style={input} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={label}>Bio</label>
          <textarea name="bio" rows={3} defaultValue={profile?.bio ?? ""} placeholder="Collectionneur depuis 10 ans..." style={{ ...input, resize: "none" }} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={label}>Photo de profil</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", background: "#f4f4f4", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 16, fontWeight: 700, color: "#e8445a" }}>{profile?.username?.[0]?.toUpperCase() ?? "?"}</span>
              )}
            </div>
            <input name="avatar" type="file" accept="image/*" style={{ flex: 1, fontSize: 13, color: "#888" }} />
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: "#aaa", padding: "10px 14px", background: "#fafafa", borderRadius: 10, border: "1px solid #f0f0f0" }}>
        Email : <span style={{ color: "#333", fontWeight: 500 }}>{email}</span>
      </div>

      {state?.error && (
        <p style={{ fontSize: 13, color: "#e8445a", background: "#fff0f2", borderRadius: 10, padding: "10px 14px", border: "1px solid #ffd0d0" }}>{state.error}</p>
      )}
      {state?.success && (
        <p style={{ fontSize: 13, color: "#16a34a", background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", border: "1px solid #bbf7d0" }}>Profil mis à jour ✓</p>
      )}

      <button type="submit" disabled={pending} style={{ width: "100%", borderRadius: 10, background: "#e8445a", color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px", border: "none", cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
        {pending ? "Enregistrement…" : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
