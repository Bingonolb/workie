import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { ProfileForm } from "@/components/ProfileForm";
import { getUserReviews } from "@/lib/actions/reviews";
import { getFavorites } from "@/lib/actions/favorites";
import { Star, MapPin, Flame, Calendar, Building2, MessageSquare } from "lucide-react";
import type { Profile } from "@/lib/types";

const EMPLOYMENT_LABELS: Record<string, string> = {
  cdi: "CDI", cdd: "CDD", stage: "Stage", alternance: "Alternance", freelance: "Freelance",
};

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

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "36px 32px 80px" }}>

        {/* Header card */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, overflow: "hidden", marginBottom: 24 }}>
          {/* Gradient banner */}
          <div style={{ height: 100, background: "linear-gradient(135deg, #8b5cf6 0%, #f97316 100%)", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 40px)" }} />
          </div>

          <div style={{ padding: "0 28px 28px" }}>
            {/* Avatar */}
            <div style={{ marginTop: -40, marginBottom: 16, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div style={{ position: "relative" }}>
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" style={{ width: 80, height: 80, borderRadius: 18, objectFit: "cover", border: "3px solid var(--surface)", display: "block" }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: 18, background: "linear-gradient(135deg, #8b5cf6, #f97316)", border: "3px solid var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: "#fff" }}>{initial}</span>
                  </div>
                )}
              </div>

              {/* Stats pills */}
              <div style={{ display: "flex", gap: 10, paddingBottom: 4 }}>
                <StatPill icon={<MessageSquare size={13} />} value={reviews.length} label="avis" color="#8b5cf6" />
                <StatPill icon={<Flame size={13} />} value={favorites.length} label="sauvegardés" color="#f97316" />
              </div>
            </div>

            {/* Name + meta */}
            <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
              {profile?.full_name || profile?.username || "Workie User"}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>{user.email}</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {(profile?.city || profile?.country) && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
                  <MapPin size={13} /> {[profile?.city, profile?.country].filter(Boolean).join(", ")}
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
                <Calendar size={13} /> Membre depuis {memberSince}
              </span>
            </div>
            {profile?.bio && (
              <p style={{ fontSize: 14, color: "var(--text-sub)", lineHeight: 1.6, marginTop: 12, maxWidth: 600 }}>{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
          {/* Left — reviews */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                Mes avis ({reviews.length})
              </h2>
              {reviews.length > 0 && (
                <Link href="/explore" style={{ fontSize: 13, color: "#8b5cf6", textDecoration: "none", fontWeight: 600 }}>
                  Explorer +
                </Link>
              )}
            </div>

            {reviews.length === 0 ? (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "48px 24px", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <MessageSquare size={22} color="#8b5cf6" />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Pas encore d&apos;avis</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Partage ton expérience pour aider la communauté.</p>
                <Link href="/explore" style={{ display: "inline-block", padding: "10px 24px", borderRadius: 50, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 13 }}>
                  Trouver une entreprise
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reviews.map(r => (
                  <Link key={r.id} href={`/company/${r.company_id}`} style={{ textDecoration: "none" }}>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px", transition: "border-color 0.2s, transform 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.4)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <Building2 size={14} color="#8b5cf6" />
                            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{r.company_name}</span>
                          </div>
                          <div style={{ display: "flex", gap: 2 }}>
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} size={13} fill={n <= Math.round(r.rating_overall) ? "#f59e0b" : "transparent"} color={n <= Math.round(r.rating_overall) ? "#f59e0b" : "#3a3a4a"} strokeWidth={1.5} />
                            ))}
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginLeft: 4 }}>{Number(r.rating_overall).toFixed(1)}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {r.job_title && <p style={{ fontSize: 12, color: "var(--text-sub)", fontWeight: 600 }}>{r.job_title}</p>}
                          {r.employment_type && <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{EMPLOYMENT_LABELS[r.employment_type] ?? r.employment_type}</p>}
                          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            {new Date(r.created_at).toLocaleDateString("fr-CH", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      {r.title && <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{r.title}</p>}
                      <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {r.content}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right — edit form */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "24px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>Modifier mon profil</h3>
              <ProfileForm profile={profile} email={user.email ?? ""} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatPill({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 50, background: `${color}15`, border: `1px solid ${color}30` }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}
