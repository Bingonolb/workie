"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";
import { ImageIcon } from "lucide-react";

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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    return () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      setSaveError(null);
      try {
        const res = await updateProfile(formData);
        if (res?.error) { setSaveError(res.error); return; }
        setSuccess(true);
        setAvatarPreview(null);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setSaveError((err as Error).message ?? "Une erreur est survenue.");
      }
    });
  };

  const currentAvatar = profile?.avatar_url ?? null;
  const displayAvatar = avatarPreview ?? currentAvatar;
  const initial = (profile?.full_name?.[0] ?? profile?.username?.[0] ?? email[0] ?? "?").toUpperCase();

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Avatar preview + upload */}
      <div>
        <label style={lbl}>Photo de profil</label>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Current / preview avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: 14, flexShrink: 0, overflow: "hidden",
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: avatarPreview ? "2px solid #8b5cf6" : "2px solid var(--border)",
            position: "relative",
          }}>
            {displayAvatar
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={displayAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{initial}</span>
            }
          </div>

          <div style={{ flex: 1 }}>
            {avatarPreview && (
              <p style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6", marginBottom: 6 }}>
                Aperçu — cliquez sur Enregistrer pour confirmer
              </p>
            )}
            <label style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8, cursor: "pointer",
              background: "var(--surface2)", border: "1px solid var(--border)",
              fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
            }}>
              <ImageIcon size={13} /> Choisir une photo
              <input
                ref={fileRef}
                name="avatar"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
            {avatarPreview && (
              <button type="button" onClick={() => { setAvatarPreview(null); if (fileRef.current) fileRef.current.value = ""; }} style={{
                marginLeft: 8, fontSize: 12, color: "#ef4444",
                background: "none", border: "none", cursor: "pointer", fontWeight: 600,
              }}>
                Annuler
              </button>
            )}
          </div>
        </div>
      </div>

<div className="profile-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={lbl}>Nom complet</label>
          <input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Alex Martin" style={inp}
            onFocus={e => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        <div>
          <label style={lbl}>Ville</label>
          <input name="city" defaultValue={profile?.city ?? ""} placeholder="Zurich" style={inp}
            onFocus={e => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        <div>
          <label style={lbl}>Pays</label>
          <input name="country" defaultValue={profile?.country ?? ""} placeholder="Suisse" style={inp}
            onFocus={e => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={lbl}>Bio</label>
          <textarea name="bio" rows={3} defaultValue={profile?.bio ?? ""} placeholder="Ex-Google, maintenant indie hacker à Lausanne..." style={{ ...inp, resize: "none" }}
            onFocus={e => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid var(--border)" }}>
        Email : <span style={{ color: "var(--text)" }}>{email}</span>
      </div>

      {saveError && (
        <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#ef4444" }}>
          ⚠ {saveError}
        </div>
      )}
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
