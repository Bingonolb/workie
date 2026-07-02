import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";

const inp: React.CSSProperties = {
  width: "100%", background: "#1e1e2a", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#f0f0f8",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "rgba(240,240,248,0.45)", marginBottom: 6,
};

export default async function ProfilePage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const p = profile as Profile | null;
  const initial = (p?.username?.[0] ?? user.email?.[0] ?? "?").toUpperCase();

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 520, margin: "0 auto", padding: "40px 32px 80px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", marginBottom: 32, letterSpacing: "-0.03em" }}>Mon profil</h1>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
            {p?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 16, background: "linear-gradient(135deg, #8b5cf6, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>{initial}</span>
              </div>
            )}
            <div>
              <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{p?.full_name || p?.username || "Mon profil"}</p>
              <p style={{ fontSize: 13, color: "rgba(240,240,248,0.4)" }}>{user.email}</p>
            </div>
          </div>

          <form action={updateProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Nom complet</label>
                <input name="full_name" defaultValue={p?.full_name ?? ""} placeholder="Alex Martin" style={inp} />
              </div>
              <div>
                <label style={lbl}>Ville</label>
                <input name="city" defaultValue={p?.city ?? ""} placeholder="Zurich" style={inp} />
              </div>
              <div>
                <label style={lbl}>Pays</label>
                <input name="country" defaultValue={p?.country ?? ""} placeholder="Suisse" style={inp} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Bio</label>
                <textarea name="bio" rows={3} defaultValue={p?.bio ?? ""} placeholder="Développeur chez..." style={{ ...inp, resize: "none" }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Photo de profil</label>
                <input name="avatar" type="file" accept="image/*" style={{ ...inp, padding: "9px 14px" }} />
              </div>
            </div>

            <div style={{ fontSize: 13, color: "rgba(240,240,248,0.2)", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
              Email : <span style={{ color: "rgba(240,240,248,0.4)" }}>{user.email}</span>
            </div>

            <button type="submit" style={{
              background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff",
              fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "13px 0", cursor: "pointer",
            }}>
              Enregistrer les modifications
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
