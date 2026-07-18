import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ReviewForm } from "@/components/ReviewForm";
import { getCompany } from "@/lib/actions/companies";
import { getReviews } from "@/lib/actions/reviews";
import { createClient } from "@/lib/supabase/server";
import { getUserFavoriteIds, toggleFavorite } from "@/lib/actions/favorites";
import { getUser, getBusinessCompanyId } from "@/lib/supabase/server";
import { Star, MapPin, Users, Globe, ArrowLeft, TrendingUp, Flame, CheckCircle } from "lucide-react";
import { HelpfulButton } from "@/components/HelpfulButton";
import { ParallaxCover } from "@/components/ParallaxCover";
import { ShareButton } from "@/components/ShareButton";
import { JobOfferCard } from "@/components/JobOfferCard";
import { ViewTracker } from "@/components/ViewTracker";

const LinkedinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
);
const TwitterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
);
import { SECTOR_COLORS } from "@/lib/types";
import type { Review } from "@/lib/types";
import { GuestModal } from "@/components/GuestModal";
import { GuestSaveButton } from "@/components/GuestSaveButton";
import { LogoImg } from "@/components/LogoImg";
import { CompanyVoteButtons } from "@/components/CompanyVoteButtons";

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size}
          fill={n <= Math.round(rating) ? "#f59e0b" : "transparent"}
          color={n <= Math.round(rating) ? "#f59e0b" : "var(--border2)"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function RatingBar({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span className="rating-bar-label" style={{ fontSize: 12, color: "var(--text-muted)", width: 120, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: "var(--surface3)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${(value / 5) * 100}%`, height: "100%", background: "linear-gradient(90deg, #8b5cf6, #f97316)", borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", width: 30 }}>{Number(value).toFixed(1)}</span>
    </div>
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) return { title: "Entreprise introuvable · Workie" };
  const desc = company.description
    ? company.description.slice(0, 155) + (company.description.length > 155 ? "…" : "")
    : `Avis anonymes sur ${company.name} — salaires, culture, management. La vérité que Glassdoor ne te dit pas.`;
  const url = `${BASE_URL}/company/${id}`;
  const ogImage = company.cover_url
    ? [{ url: company.cover_url, width: 1200, height: 630, alt: company.name }]
    : [{ url: `${BASE_URL}/og-default.png`, width: 1200, height: 630, alt: "Workie" }];
  return {
    title: `${company.name} · Avis & Salaires · Workie`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: `${company.name} — Avis & Salaires sur Workie`,
      description: desc,
      url,
      siteName: "Workie",
      type: "website",
      locale: "fr_CH",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: `${company.name} — Avis & Salaires sur Workie`,
      description: desc,
      images: ogImage.map(i => i.url),
    },
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // createClient runs in parallel with the other fetches — not sequential
  const [company, reviews, user, favIds, supabase, bizCompanyId] = await Promise.all([
    getCompany(id).catch(() => null),
    getReviews(id).catch(() => [] as Review[]),
    getUser().catch(() => null),
    getUserFavoriteIds().catch(() => [] as string[]),
    createClient(),
    getBusinessCompanyId().catch(() => null),
  ]);

  // Similar companies — fetched after company resolves (needs sector)
  const similarCompaniesData = company ? await (async () => {
    const sb = await createClient();
    const { data } = await sb
      .from("companies")
      .select("id, name, city, avg_rating, review_count, cover_url, is_verified, sector")
      .eq("sector", company.sector)
      .neq("id", id)
      .order("score", { ascending: false })
      .limit(4);
    return data ?? [];
  })().catch(() => []) : [];
  const [repliesResult, jobsResult, voteData, profileData] = await Promise.all([
    Promise.resolve(supabase.from("company_replies").select("review_id, content, created_at").eq("company_id", id)).catch(() => ({ data: null })),
    Promise.resolve(supabase.from("job_offers").select("id, title, location, contract_type, work_mode, experience_level, salary_range, apply_url, description, created_at").eq("company_id", id).eq("is_active", true).order("created_at", { ascending: false })).catch(() => ({ data: null })),
    user ? Promise.resolve(supabase.from("score_events").select("event_type").eq("company_id", id).eq("user_id", user.id).in("event_type", ["boost", "penalty"])).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
    user ? Promise.resolve(supabase.from("profiles").select("role, penalty_credits").eq("id", user.id).maybeSingle()).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
  ]);
  const repliesMap = Object.fromEntries(
    (repliesResult.data ?? []).map((r: { review_id: string; content: string; created_at: string | null }) => [r.review_id, { ...r, created_at: r.created_at ?? "" }])
  );
  const jobs: { id: string; title: string; location: string | null; contract_type: string | null; work_mode: string | null; experience_level: string | null; salary_range: string | null; apply_url: string | null; description: string | null; created_at: string | null }[] = jobsResult.data ?? [];

  if (!company) notFound();

  const isBusiness = !!bizCompanyId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileRow = (profileData as any)?.data;
  const isAdmin = profileRow?.role === "admin";
  const penaltyCredits = Number(profileRow?.penalty_credits ?? 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const voteEvents: { event_type: string }[] = (voteData as any)?.data ?? [];
  const initialBoosted = voteEvents.some(e => e.event_type === "boost");
  const initialPenalized = voteEvents.some(e => e.event_type === "penalty");

  const isFav = favIds.includes(company.id);
  const sectorColor = SECTOR_COLORS[company.sector] ?? "#8b5cf6";

  // Sub-ratings averages — each computed independently to avoid null-as-zero bias
  const subAvg = (field: "rating_culture" | "rating_management" | "rating_worklife" | "rating_career") => {
    const subset = reviews.filter(r => r[field]);
    return subset.length ? subset.reduce((s, r) => s + Number(r[field]), 0) / subset.length : null;
  };
  const avgCulture = subAvg("rating_culture");
  const avgMgmt = subAvg("rating_management");
  const avgWl = subAvg("rating_worklife");
  const avgCareer = subAvg("rating_career");

  // Would recommend stats
  const withRecommend = reviews.filter(r => r.would_recommend);
  const recOui = withRecommend.filter(r => r.would_recommend === "oui").length;
  const recPct = withRecommend.length ? Math.round((recOui / withRecommend.length) * 100) : null;

  // Work mode breakdown — single-pass reduce
  const modeCounts = reviews.reduce((acc: Record<string, number>, r) => {
    if (r.work_mode) acc[r.work_mode] = (acc[r.work_mode] ?? 0) + 1;
    return acc;
  }, {});
  const dominantMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": company.name,
    "url": company.website_url ?? undefined,
    "description": company.description ?? undefined,
    "address": { "@type": "PostalAddress", "addressLocality": company.city, "addressCountry": "CH" },
    ...(Number(company.avg_rating) > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": Number(company.avg_rating).toFixed(1),
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": Number(company.review_count),
      }
    } : {}),
  };

  return (
    <div className="page-root">
      <ViewTracker companyId={company.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {/* Hero cover */}
      <div className="hero-cover">
        {/* Image or gradient bg */}
        {company.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.cover_url}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${sectorColor}, #f97316)` }} />
        )}
        {/* Top gradient — darkens so navbar stays readable */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,13,19,0.65) 0%, rgba(13,13,19,0.0) 40%, rgba(13,13,19,0.0) 50%, rgba(13,13,19,0.92) 100%)" }} />

        <div className="company-hero-bottom" style={{ position: "absolute", bottom: 24, left: 0, right: 0 }}>
          <div className="company-hero-inner" style={{ maxWidth: 900, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              {/* Logo overlay — wrapper porte le fond blanc, img fade-in après load */}
              {company.logo_url && (
                <div className="company-hero-logo" style={{ width: 76, height: 76, borderRadius: 14, background: "#fff", border: "3px solid rgba(255,255,255,0.15)", flexShrink: 0, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden" }}>
                  <LogoImg
                    src={company.logo_url}
                    alt={`${company.name} logo`}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
              )}
              <div>
              <Link href="/explore" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none", marginBottom: 10, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.18)" }}>
                <ArrowLeft size={14} /> Retour
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <h1 className="company-hero-title" style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>{company.name}</h1>
                {company.is_verified && (
                  <svg viewBox="0 0 22 22" style={{ width: 22, height: 22, flexShrink: 0 }} aria-label="Entreprise vérifiée">
                    <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
                    <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
                  </svg>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 10px", borderRadius: 50, fontSize: 12, fontWeight: 600, color: sectorColor, background: `${sectorColor}22`, border: `1px solid ${sectorColor}44` }}>
                  {company.sector}
                </span>
                {company.subsector && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{company.subsector}</span>}
              </div>
            </div>
            </div>

            {/* Actions */}
            <div className="company-hero-actions" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <ShareButton name={company.name} url={`${BASE_URL}/company/${company.id}`} />
              {user && !isBusiness ? (
                <form action={toggleFavorite.bind(null, company.id)}>
                  <button type="submit" style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 20px", borderRadius: 12,
                    background: isFav ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.1)",
                    border: isFav ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.15)",
                    color: isFav ? "#f97316" : "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", minHeight: 44,
                  }}>
                    <Flame size={16} fill={isFav ? "#f97316" : "none"} /> {isFav ? "Sauvegardé" : "Sauvegarder"}
                  </button>
                </form>
              ) : (!isBusiness && <GuestSaveButton />)}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .company-grid { grid-template-columns: 1fr !important; }
          .company-sidebar { position: static !important; }
          .company-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .about-desktop { display: none !important; }
          .about-mobile { display: block !important; }
        }
        @media (min-width: 701px) {
          .about-mobile { display: none !important; }
        }
      `}</style>
      <main className="page-main-sm">
        <div className="company-grid two-col" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32, alignItems: "start" }}>
          {/* Left column */}
          <div>
            {/* À propos — mobile only (before stats) */}
            {company.description && (
              <div className="about-mobile" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 32, display: "none" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>À propos</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>{company.description}</p>
              </div>
            )}

            {/* Key stats */}
            <div className="company-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              {[
                { icon: <MapPin size={18} color="#8b5cf6" />, value: `${company.city}${company.canton ? `, ${company.canton}` : ""}`, label: "Localisation" },
                { icon: <Users size={18} color="#f97316" />, value: company.employee_range, label: "Employés" },
                { icon: <TrendingUp size={18} color="#10b981" />, value: Number(company.avg_salary_chf) > 0 ? `CHF ${Math.round(Number(company.avg_salary_chf) / 1000)}k` : "N/A", label: "Salaire moyen" },
              ].map(({ icon, value, label }) => (
                <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ marginBottom: 8 }}>{icon}</div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>{value}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Community score — toujours visible */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 18px", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>Score communautaire</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>La communauté évalue cette entreprise</p>
              </div>
              <CompanyVoteButtons
                companyId={company.id}
                isLoggedIn={!!user}
                isAdmin={isAdmin}
                isBusiness={isBusiness}
                penaltyCredits={penaltyCredits}
                initialBoosted={initialBoosted}
                initialPenalized={initialPenalized}
              />
            </div>

            {/* Ratings breakdown */}
            {Number(company.review_count) > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "24px", marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 52, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{Number(company.avg_rating).toFixed(1)}</p>
                    <Stars rating={Number(company.avg_rating)} size={18} />
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{company.review_count} avis</p>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    <RatingBar label="👔 Management" value={avgMgmt} />
                    <RatingBar label="⚖️ Vie pro/perso" value={avgWl} />
                    <RatingBar label="🌍 Culture" value={avgCulture} />
                    <RatingBar label="🚀 Évolution" value={avgCareer} />
                  </div>
                </div>

                {/* Recommend + work mode badges */}
                {(recPct !== null || dominantMode) && (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    {recPct !== null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: recPct >= 70 ? "rgba(16,185,129,0.1)" : recPct >= 40 ? "rgba(249,115,22,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${recPct >= 70 ? "rgba(16,185,129,0.25)" : recPct >= 40 ? "rgba(249,115,22,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: 10, padding: "8px 14px" }}>
                        <span style={{ fontSize: 18 }}>{recPct >= 70 ? "👍" : recPct >= 40 ? "🤔" : "👎"}</span>
                        <div>
                          <p style={{ fontSize: 18, fontWeight: 900, color: recPct >= 70 ? "#10b981" : recPct >= 40 ? "#f97316" : "#ef4444", lineHeight: 1 }}>{recPct}%</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>recommandent</p>
                        </div>
                      </div>
                    )}
                    {dominantMode && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "8px 14px" }}>
                        <span style={{ fontSize: 18 }}>{dominantMode === "remote" ? "🏠" : dominantMode === "hybride" ? "🔀" : "🏢"}</span>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", lineHeight: 1.2, textTransform: "capitalize" }}>{dominantMode}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>mode dominant</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* Reviews */}
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>
              Avis des employés ({company.review_count})
            </h2>

            {reviews.length === 0 ? (
              <div style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(249,115,22,0.04))",
                border: "1px solid rgba(139,92,246,0.15)",
                borderRadius: 18, padding: "40px 32px", textAlign: "center", marginBottom: 32,
              }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>🌟</p>
                <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Aucun avis pour l&apos;instant</p>
                <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 340, margin: "0 auto 20px" }}>
                  Tu as travaillé ici ? Ton avis anonyme aide des centaines de candidats à faire le bon choix.
                </p>
                <span style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #8b5cf6, #f97316)",
                  color: "#fff", fontWeight: 700, borderRadius: 12,
                  padding: "10px 24px", fontSize: 14,
                }}>
                  Laisser le premier avis ↓
                </span>
              </div>
            ) : (
              <div style={{ position: "relative", marginBottom: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(user ? reviews : reviews.slice(0, 1)).map(r => <ReviewCard key={r.id} review={r} reply={repliesMap[r.id]} />)}
                </div>
                {!user && reviews.length > 1 && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: 160,
                    background: "linear-gradient(to bottom, transparent, var(--bg) 90%)",
                    pointerEvents: "none",
                  }} />
                )}
              </div>
            )}

            {/* Guest modal — only when there are more reviews to unlock */}
            {!user && reviews.length > 1 && (
              <GuestModal reviewCount={reviews.length} />
            )}

            {/* Post review */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "28px" }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Partage ton expérience</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Ton avis est anonyme par défaut. Aide la communauté à faire les bons choix.</p>
              {isBusiness ? (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: 14 }}>
                  Les comptes business ne peuvent pas publier d&apos;avis.
                </div>
              ) : user ? (
                <ReviewForm companyId={company.id} />
              ) : (
                <div style={{ textAlign: "center", padding: "24px" }}>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>Connecte-toi pour partager un avis anonyme.</p>
                  <Link href="/login" style={{
                    display: "inline-block", background: "linear-gradient(135deg, #8b5cf6, #f97316)",
                    color: "#fff", fontWeight: 700, borderRadius: 10, padding: "12px 28px", textDecoration: "none", fontSize: 14,
                  }}>
                    Se connecter
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="company-sidebar" style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 16 }}>
            {company.description && (
              <div className="about-desktop" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>À propos</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>{company.description}</p>
              </div>
            )}

            {/* Links */}
            {(company.website_url || company.linkedin_url || company.twitter_url || company.instagram_url) && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Réseaux</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {company.website_url && (
                    <a href={/^https?:\/\//.test(company.website_url) ? company.website_url : `https://${company.website_url}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                      <Globe size={14} /> Site internet
                    </a>
                  )}
                  {company.linkedin_url && (
                    <a href={/^https?:\/\//.test(company.linkedin_url) ? company.linkedin_url : `https://${company.linkedin_url}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#0077b5", textDecoration: "none" }}>
                      <LinkedinIcon /> LinkedIn
                    </a>
                  )}
                  {company.twitter_url && (
                    <a href={/^https?:\/\//.test(company.twitter_url) ? company.twitter_url : `https://${company.twitter_url}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1da1f2", textDecoration: "none" }}>
                      <TwitterIcon /> Twitter / X
                    </a>
                  )}
                  {company.instagram_url && (
                    <a href={/^https?:\/\//.test(company.instagram_url) ? company.instagram_url : `https://${company.instagram_url}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ec4899", textDecoration: "none" }}>
                      <InstagramIcon /> Instagram
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {company.tags?.length > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Tags</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {company.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 50, background: "var(--surface3)", color: "var(--text-muted)" }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {company.founded_year && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Fondée en</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{company.founded_year}</span>
              </div>
            )}

            {/* Job offers */}
            {jobs.length > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  💼 Offres d'emploi
                  <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", borderRadius: 50, padding: "2px 8px" }}>{jobs.length}</span>
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {jobs.map((job) => (
                    <JobOfferCard key={job.id} job={{ ...job, created_at: job.created_at ?? "" }} companyName={company.name} />
                  ))}
                </div>
              </div>
            )}

            {/* Business CTA — only for non-subscribed companies and non-business users */}
            {!company.is_subscribed && !isBusiness && (
              <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(249,115,22,0.04))", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: "-0.02em" }}>
                    <span style={{ background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>workie</span>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.04em", color: "#8b5cf6", marginLeft: 4, textTransform: "uppercase" as const }}>Business</span>
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 14 }}>
                  Vous représentez <strong style={{ color: "var(--text)" }}>{company.name}</strong> ? Revendiquez cette fiche pour répondre aux avis et accéder aux analytics.
                </p>
                <Link href="/business/claim" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 9, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                  Revendiquer ma fiche
                </Link>
                <Link href="/business/login" style={{ display: "block", textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 8, textDecoration: "none" }}>
                  Déjà un compte ? Se connecter →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Similar companies */}
        {similarCompaniesData.length > 0 && (
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>
              Autres entreprises · {company.sector}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {similarCompaniesData.map((c: { id: string; name: string; city: string; avg_rating: number | string | null; review_count: number | string | null; cover_url: string | null; is_verified: boolean | null; sector: string }) => (
                <Link key={c.id} href={`/company/${c.id}`} style={{ textDecoration: "none" }}>
                  <div className="company-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ height: 80, background: c.cover_url ? "none" : "linear-gradient(135deg, #8b5cf6, #3b82f6)", position: "relative" }}>
                      {c.cover_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6))" }} />
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        {c.name}
                        {c.is_verified && (
                          <svg viewBox="0 0 22 22" style={{ width: 13, height: 13, flexShrink: 0 }}>
                            <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
                            <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
                          </svg>
                        )}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                        {Number(c.avg_rating) > 0 && (
                          <span style={{ color: "#f59e0b", fontWeight: 700 }}>★ {Number(c.avg_rating).toFixed(1)}</span>
                        )}
                        <span>{c.city}</span>
                        {Number(c.review_count) > 0 && <span>· {c.review_count} avis</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  cdi: "CDI", cdd: "CDD", stage: "Stage", alternance: "Alternance", freelance: "Freelance",
};
const DURATION_LABELS: Record<string, string> = {
  moins_6mois: "< 6 mois", "6mois_2ans": "6 mois – 2 ans", plus_2ans: "+ 2 ans",
};
const WORK_MODE_LABELS: Record<string, string> = {
  "présentiel": "🏢 Présentiel", hybride: "🔀 Hybride", remote: "🏠 Remote",
};
const RECOMMEND_LABELS: Record<string, { label: string; color: string }> = {
  oui: { label: "👍 Recommandé", color: "#10b981" },
  non: { label: "👎 Ne recommande pas", color: "#ef4444" },
  ca_depend: { label: "🤔 Ça dépend", color: "#f59e0b" },
};

function ReviewCard({ review, reply }: { review: Review; reply?: { content: string; created_at: string } }) {
  const age = (() => {
    const d = new Date(review.created_at);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days < 7) return `Il y a ${days}j`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
    return `Il y a ${Math.floor(days / 30)} mois`;
  })();

  const rec = review.would_recommend ? RECOMMEND_LABELS[review.would_recommend] : null;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 22px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Stars rating={Number(review.rating_overall)} size={13} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{Number(review.rating_overall).toFixed(1)}</span>
            {rec && (
              <span style={{ fontSize: 11, fontWeight: 700, color: rec.color, marginLeft: 4 }}>{rec.label}</span>
            )}
          </div>
          {review.title && <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{review.title}</p>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{age}</p>
          {review.job_title && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-sub)", background: "var(--surface2)", borderRadius: 6, padding: "2px 8px" }}>
              {review.job_title}
            </span>
          )}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {review.employment_type && (
              <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--surface3)", borderRadius: 6, padding: "2px 8px" }}>
                {EMPLOYMENT_LABELS[review.employment_type] ?? review.employment_type}
              </span>
            )}
            {review.duration_range && (
              <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--surface3)", borderRadius: 6, padding: "2px 8px" }}>
                {DURATION_LABELS[review.duration_range] ?? review.duration_range}
              </span>
            )}
            {review.work_mode && (
              <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--surface3)", borderRadius: 6, padding: "2px 8px" }}>
                {WORK_MODE_LABELS[review.work_mode] ?? review.work_mode}
              </span>
            )}
          </div>
          {review.is_current && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>● Employé actuel</span>
          )}
          {Number(review.salary_chf) > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>CHF {Math.round(Number(review.salary_chf) / 1000)}k / an</span>
          )}
        </div>
      </div>

      {/* Content */}
      <p style={{ fontSize: 14, color: "var(--text-sub)", lineHeight: 1.7, marginBottom: 12 }}>
        {review.content}
      </p>

      {/* Pros / Cons */}
      {(review.pros || review.cons) && (
        <div className="review-pros-cons" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {review.pros && (
            <div style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10, padding: "10px 12px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>👍 Points positifs</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: "10px 12px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>👎 Points négatifs</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{review.cons}</p>
            </div>
          )}
        </div>
      )}

      {/* Knew before */}
      {review.knew_before && (
        <div style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6", marginBottom: 4 }}>💡 Ce que j'aurais voulu savoir avant</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{review.knew_before}</p>
        </div>
      )}

      {/* Employer reply */}
      {reply && (
        <div style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "14px 16px", marginTop: 4, marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
            <svg viewBox="0 0 22 22" style={{ width: 13, height: 13 }}><circle cx="11" cy="11" r="11" fill="#1D9BF0" /><path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" /></svg>
            Réponse officielle de l'employeur
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>{reply.content}</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, opacity: 0.6 }}>
            {new Date(reply.created_at).toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      )}

      {/* Helpful */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
        <HelpfulButton reviewId={review.id} initialCount={review.helpful_count} />
      </div>
    </div>
  );
}
