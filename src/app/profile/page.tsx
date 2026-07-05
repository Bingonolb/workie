export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { ProfileForm } from "@/components/ProfileForm";
import { ProfileReviews } from "./ProfileReviews";
import { getUserReviews } from "@/lib/actions/reviews";
import { getUserFavoriteIds } from "@/lib/actions/favorites";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) redirect("/login");

  const [{ data: profileRaw }, reviews, favIds] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getUserReviews(),
    getUserFavoriteIds(),
  ]);

  const profile = profileRaw as Profile | null;
  const displayName = profile?.full_name || profile?.username || "Workie User";
  const initial = displayName[0].toUpperCase();
  const memberSince = new Date(user.created_at ?? Date.now()).toLocaleDateString("fr-CH", {
    month: "long",
    year: "numeric",
  });
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating_overall, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px 100px" }}>

        {/* ── Header ── */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "28px 32px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: 20, flexShrink: 0,
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> // eslint-disable-line @next/next/no-img-element
              : <span style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>{initial}</span>
            }
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>
              {displayName}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 20px" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{user.email}</span>
              {(profile?.city || profile?.country) && (
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  📍 {[profile.city, profile.country].filter(Boolean).join(", ")}
                </span>
              )}
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>🗓 Membre depuis {memberSince}</span>
            </div>
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          {([
            { emoji: "⭐", value: avgRating ?? "—", label: "Note moyenne donnée", color: "#f59e0b" },
            { emoji: "🔥", value: String(favIds.length), label: "Entreprises sauvegardées", color: "#f97316" },
            { emoji: "📊", value: String(reviews.length), label: "Avis publiés", color: "#10b981" },
          ] as const).map(({ emoji, value, label, color }) => (
            <div key={label} style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
              padding: "18px 22px", display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                {emoji}
              </div>
              <div>
                <p style={{
                  fontSize: 24, fontWeight: 900, color: "var(--text)",
                  fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", lineHeight: 1,
                }}>{value}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

          {/* Reviews table */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 18, overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 22px", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                Mes avis · <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{reviews.length} publié{reviews.length !== 1 ? "s" : ""}</span>
              </p>
            </div>
            <ProfileReviews reviews={reviews} />
          </div>

          {/* Edit form */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 18, overflow: "hidden",
            }}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Modifier le profil</p>
              </div>
              <div style={{ padding: 22 }}>
                <ProfileForm profile={profile} email={user.email ?? ""} />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
