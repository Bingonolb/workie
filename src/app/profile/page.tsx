import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { ProfileForm } from "@/components/ProfileForm";
import { ProfileReviews } from "./ProfileReviews";
import { getUserReviews } from "@/lib/actions/reviews";
import { getFavorites } from "@/lib/actions/favorites";
import { MapPin, Calendar, Flame, Star, TrendingUp } from "lucide-react";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) redirect("/login");

  const [profileData, reviews, favorites] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getUserReviews(),
    getFavorites(),
  ]);

  const profile = profileData.data as Profile | null;
  const initial = (profile?.full_name?.[0] ?? profile?.username?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
  const memberSince = new Date(user.created_at ?? Date.now()).toLocaleDateString("fr-CH", { month: "long", year: "numeric" });

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating_overall, 0) / reviews.length
    : null;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 32px 80px" }}>

        {/* Identity header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 16, background: "linear-gradient(135deg, #8b5cf6, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{initial}</span>
              </div>
            )}
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>
                {profile?.full_name || profile?.username || "Workie User"}
              </h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{user.email}</span>
                {(profile?.city || profile?.country) && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
                    <MapPin size={12} /> {[profile?.city, profile?.country].filter(Boolean).join(", ")}
                  </span>
                )}
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
                  <Calendar size={12} /> Depuis {memberSince}
                </span>
              </div>
              {profile?.bio && (
                <p style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.6, marginTop: 6, maxWidth: 560 }}>{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* KPI strip — même style que ranking */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { icon: <Star size={16} color="#f59e0b" />, value: avgRating ? Number(avgRating).toFixed(2) : "—", label: "Note moyenne donnée", color: "#f59e0b" },
            { icon: <Flame size={16} color="#f97316" />, value: favorites.length, label: "Entreprises sauvegardées", color: "#f97316" },
            { icon: <TrendingUp size={16} color="#10b981" />, value: reviews.length, label: "Avis publiés", color: "#10b981" },
          ].map(({ icon, value, label, color }) => (
            <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{value}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

          {/* Reviews table */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                Mes avis · {reviews.length} publié{reviews.length > 1 ? "s" : ""}
              </p>
              {reviews.length > 0 && (
                <Link href="/explore" style={{ fontSize: 12, color: "#8b5cf6", textDecoration: "none", fontWeight: 600 }}>
                  + Nouvel avis
                </Link>
              )}
            </div>
            <ProfileReviews reviews={reviews} />
          </div>

          {/* Edit form */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
              <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Modifier le profil</p>
              </div>
              <div style={{ padding: "20px" }}>
                <ProfileForm profile={profile} email={user.email ?? ""} />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
