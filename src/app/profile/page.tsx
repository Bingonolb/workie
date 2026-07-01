import Link from "next/link";
import { Shield, Plus, Settings, Camera } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProfileForm } from "@/components/ProfileForm";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Profile, Watch as WatchType } from "@/lib/types";

export default async function ProfilePage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);

  const [{ data: profile }, { data: watches }, { count: matchesCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
    supabase.from("watches").select("id,brand,model,photos,status").eq("owner_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("matches").select("id", { count: "exact", head: true }).or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`),
  ]);

  const p = profile as Profile | null;
  const watchList = (watches ?? []) as unknown as (WatchType & { photos: string[] })[];
  const memberYear = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();
  const initial = (p?.username?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();

  return (
    <div style={{ minHeight: "100dvh", background: "#f4f4f4" }}>
      <Navbar />
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "36px 32px 60px", display: "grid", gridTemplateColumns: "280px 1fr", gap: 28, alignItems: "start" }}>

        {/* Left — identity card */}
        <div>
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e8e8e8", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            {/* Hero */}
            <div style={{ height: 100, background: "linear-gradient(135deg, #e8445a 0%, #ff7a8a 100%)", position: "relative" }} />
            {/* Avatar */}
            <div style={{ padding: "0 20px", marginTop: -44, marginBottom: 16 }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                {p?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt="avatar" style={{ width: 80, height: 80, borderRadius: 16, objectFit: "cover", border: "3px solid #fff", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", display: "block" }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: 16, background: "linear-gradient(135deg, #e8445a, #ff7a8a)", border: "3px solid #fff", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{initial}</span>
                  </div>
                )}
                <div style={{ position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: "50%", background: "#e8445a", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Camera size={11} color="#fff" />
                </div>
              </div>

              <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111", marginTop: 12, marginBottom: 2 }}>
                {p?.full_name || p?.username || "Mon profil"}
              </h1>
              {p?.username && <p style={{ fontSize: 13, color: "#e8445a", fontWeight: 600, marginBottom: 4 }}>@{p.username}</p>}
              {(p?.city || p?.country) && (
                <p style={{ fontSize: 12, color: "#888" }}>📍 {[p.city, p.country].filter(Boolean).join(", ")}</p>
              )}
              {p?.bio && <p style={{ fontSize: 13, color: "#555", marginTop: 8, lineHeight: 1.6 }}>{p.bio}</p>}
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid #f0f0f0" }}>
              {[
                { value: watchList.length, label: "Montres" },
                { value: matchesCount ?? 0, label: "Échanges" },
                { value: memberYear, label: "Depuis" },
              ].map(({ value, label }, i) => (
                <div key={label} style={{ padding: "14px 0", textAlign: "center", borderRight: i < 2 ? "1px solid #f0f0f0" : "none" }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#e8445a" }}>{value}</p>
                  <p style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Verification */}
            {!p?.identity_verified ? (
              <div style={{ margin: "12px 16px 16px", padding: "12px 14px", background: "#fff8f8", border: "1px solid #ffd0d0", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <Shield size={18} color="#e8445a" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>Vérifiez votre identité</p>
                  <p style={{ fontSize: 11, color: "#888" }}>Échangez 3× plus facilement.</p>
                </div>
              </div>
            ) : (
              <div style={{ margin: "12px 16px 16px", padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <Shield size={18} color="#22c55e" fill="#22c55e" />
                <p style={{ fontSize: 12, fontWeight: 600, color: "#166534" }}>Identité vérifiée</p>
              </div>
            )}
          </div>

          {/* Collection */}
          {watchList.length > 0 && (
            <div style={{ marginTop: 20, background: "#fff", borderRadius: 20, border: "1px solid #e8e8e8", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Ma collection</p>
                <Link href="/watches/mine" style={{ fontSize: 12, color: "#e8445a", textDecoration: "none", fontWeight: 600 }}>Tout voir</Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {watchList.slice(0, 6).map(w => (
                  <div key={w.id} style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: "#f4f4f4", position: "relative" }}>
                    {w.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.photos[0]} alt={w.brand} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#aaa" }}>{w.brand}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {watchList.length === 0 && (
            <Link href="/watches/new" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 20, borderRadius: 16, border: "1.5px dashed #ddd", padding: "24px 16px", textDecoration: "none", textAlign: "center", background: "#fff" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff0f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={20} color="#e8445a" />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Ajouter votre première montre</p>
            </Link>
          )}
        </div>

        {/* Right — edit form */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e8e8e8", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <Settings size={16} color="#aaa" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Modifier mon profil</h2>
          </div>
          <ProfileForm profile={p} email={user!.email ?? ""} />
        </div>
      </main>
    </div>
  );
}
