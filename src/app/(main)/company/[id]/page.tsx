import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ReviewForm } from "@/components/ReviewForm";
import { getCachedCompany, getCachedJobOffers, getCachedSimilarCompanies } from "@/lib/actions/companies";
import { getCachedReviews } from "@/lib/actions/reviews";
import { createClient } from "@/lib/supabase/server";
import { getUserFavoriteIds } from "@/lib/actions/favorites";
import { getUser } from "@/lib/supabase/server";
import { Star, MapPin, Users, Globe, ArrowLeft, TrendingUp, CheckCircle } from "lucide-react";
import { HelpfulButton } from "@/components/HelpfulButton";
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
// Les 8 catégories notées vivent dans un module partagé : la synthèse, la carte
// d'avis et les tests de colonnes s'appuient sur la même liste.
import { RATING_CATEGORIES } from "@/lib/reviewCategories";
import { GuestContentGate } from "@/components/GuestContentGate";
import { GuestSaveButton } from "@/components/GuestSaveButton";
import { SaveButton } from "@/components/SaveButton";
import { CompanyHeroLogo } from "@/components/LogoImg";
import { logoAffichable } from "@/lib/logo";
import { CoverImage } from "@/components/CoverImage";
import { largeurCouverture } from "@/lib/coverUrl";
import { CompanyVoteButtons } from "@/components/CompanyVoteButtons";
import { ReportButton } from "@/components/ReportButton";

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span aria-hidden="true" style={{ display: "inline-flex", gap: 2 }}>
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

function RatingRow({ label, value }: { label: string; value: number | null }) {
  const color = value !== null ? ratingColor(value) : "var(--text-muted)";
  const pct = value !== null ? (value / 5) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ flex: "1 1 0", minWidth: 0, fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </span>
      {/* Barre volontairement étroite : dans une carte d'avis en 2 colonnes,
          chaque colonne fait ~215px et les libellés longs (« Diversité &
          inclusion ») étaient tronqués au-delà de 56px de barre. */}
      <div style={{ flex: "0 0 56px", height: 6, background: "var(--surface3)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ flex: "0 0 26px", textAlign: "right", fontSize: 12, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>
        {value !== null ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

// Indicateur oui/non agrégé (recommandation, retour). Toujours rendu, avec un
// état explicite quand personne n'a encore répondu.
function StatPill({ label, pct }: { label: string; pct: number | null }) {
  const color = pct === null ? "var(--text-muted)" : pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 7, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "8px 13px" }}>
      <span style={{ fontSize: 16, fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {pct === null ? "—" : `${pct}%`}
      </span>
      <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const company = await getCachedCompany(id);
  if (!company) return { title: "Entreprise introuvable · Workie" };
  const desc = company.description
    ? company.description.slice(0, 155) + (company.description.length > 155 ? "…" : "")
    : `Avis anonymes sur ${company.name} — salaires, culture, management. La vérité que Glassdoor ne te dit pas.`;
  const url = `${BASE_URL}/company/${id}`;
  const ogApiUrl = `${BASE_URL}/api/og?title=${encodeURIComponent(company.name)}&sub=${encodeURIComponent(`${company.city} · ${company.sector}`)}${Number(company.avg_rating) > 0 ? `&rating=${Number(company.avg_rating).toFixed(1)}&reviews=${company.review_count}` : ""}`;
  const ogImage = company.cover_url
    ? [{ url: company.cover_url, width: 1200, height: 630, alt: company.name }]
    : [{ url: ogApiUrl, width: 1200, height: 630, alt: company.name }];
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

// ── Review relevance scoring ──────────────────────────────────────────────────
// Weighted combination of recency, helpful votes, completeness, and verified author.
// All factors normalized to [0, 1]. Weights sum to 1.0.

function reviewRelevanceScore(review: Review): number {
  const ageMs = Date.now() - new Date(review.created_at ?? 0).getTime();
  const ageDays = ageMs / 86400000;
  // Exponential decay, half-life ~18 months — recent reviews stay on top
  // but a 3-year-old review with 20 votes can still beat a 1-month-old with 0
  const recencyScore = Math.exp(-ageDays / 540);

  // Log scale: 10 votes ≈ 0.7, 20 votes ≈ 1.0, beyond that capped
  const helpfulScore = Math.min(Math.log1p(Number(review.helpful_count ?? 0)) / Math.log1p(20), 1);

  // Optional fields in the new format (ratings-only)
  const optionalFields = [
    review.salary_chf,
    review.rating_culture, review.rating_management, review.rating_worklife, review.rating_career,
    review.work_mode, review.employment_type, review.duration_range,
  ];
  const completeness = optionalFields.filter(v => v !== null && v !== undefined && v !== 0 && v !== "").length / optionalFields.length;

  // Small bonus for Stripe-verified authors
  const verifiedBonus = review.is_verified_author ? 0.08 : 0;

  return helpfulScore * 0.35 + recencyScore * 0.42 + completeness * 0.15 + verifiedBonus;
}

type SortMode = "relevance" | "recent" | "helpful";

export default async function CompanyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sort?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const sortMode: SortMode = (["relevance", "recent", "helpful"].includes(sp.sort ?? "")) ? sp.sort as SortMode : "relevance";
  // createClient runs in parallel with the other fetches — not sequential
  const [company, reviews, user, favIds, supabase] = await Promise.all([
    getCachedCompany(id).catch(() => null),
    getCachedReviews(id).catch(() => [] as Review[]),
    getUser().catch(() => null),
    getUserFavoriteIds().catch(() => [] as string[]),
    createClient(),
  ]);

  // Guard early — no need to run 5 more queries for a non-existent company
  if (!company) notFound();

  // Tous les avis sont affichés, notes uniquement. Les anciens avis rédigés
  // étaient auparavant masqués alors qu'ils comptaient dans la moyenne — leur
  // texte n'est simplement plus rendu (voir ReviewCard).
  // Sort reviews server-side so the initial render matches the user's intent
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortMode === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortMode === "helpful") return Number(b.helpful_count ?? 0) - Number(a.helpful_count ?? 0);
    return reviewRelevanceScore(b) - reviewRelevanceScore(a);
  });

  // Les deux données publiques passent par le cache partagé ; seules celles qui
  // dépendent du visiteur touchent encore la base à chaque affichage.
  const [jobs, voteData, profileData, similarCompaniesData, helpfulVotesResult] = await Promise.all([
    getCachedJobOffers(id).catch(() => [] as never[]),
    user ? Promise.resolve(supabase.from("score_events").select("event_type").eq("company_id", id).eq("user_id", user.id).in("event_type", ["boost", "penalty"])).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
    user ? Promise.resolve(supabase.from("profiles").select("role, penalty_credits").eq("id", user.id).maybeSingle()).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
    getCachedSimilarCompanies(company.sector, id).catch(() => []),
    user && reviews.length > 0 ? Promise.resolve(supabase.from("review_votes").select("review_id").eq("user_id", user.id).in("review_id", reviews.map(r => r.id))).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
  ]);

  const votedReviewIds = new Set<string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((helpfulVotesResult as any)?.data ?? []).map((v: { review_id: string }) => v.review_id)
  );
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
  const subAvg = (field: "rating_culture" | "rating_management" | "rating_worklife" | "rating_career" | "rating_flexibility" | "rating_recognition" | "rating_workload" | "rating_diversity") => {
    const subset = reviews.filter(r => r[field]);
    return subset.length ? subset.reduce((s, r) => s + Number(r[field]), 0) / subset.length : null;
  };
  const avgCulture = subAvg("rating_culture");
  const avgMgmt = subAvg("rating_management");
  const avgWl = subAvg("rating_worklife");
  const avgCareer = subAvg("rating_career");
  const avgFlexibility = subAvg("rating_flexibility");
  const avgRecognition = subAvg("rating_recognition");
  const avgWorkload = subAvg("rating_workload");
  const avgDiversity = subAvg("rating_diversity");
  const avgByCategory: Record<string, number | null> = {
    rating_management:  avgMgmt,
    rating_worklife:    avgWl,
    rating_culture:     avgCulture,
    rating_career:      avgCareer,
    rating_flexibility: avgFlexibility,
    rating_recognition: avgRecognition,
    rating_workload:    avgWorkload,
    rating_diversity:   avgDiversity,
  };

  // Would recommend stats
  const withRecommend = reviews.filter(r => r.would_recommend);
  const recOui = withRecommend.filter(r => r.would_recommend === "oui").length;
  const recPct = withRecommend.length ? Math.round((recOui / withRecommend.length) * 100) : null;

  // Would return stats — « peut-être » ne compte pas comme un oui
  const withReturn = reviews.filter(r => r.would_return);
  const retOui = withReturn.filter(r => r.would_return === "oui").length;
  const retPct = withReturn.length ? Math.round((retOui / withReturn.length) * 100) : null;

  // Work mode breakdown — single-pass reduce
  const modeCounts = reviews.reduce((acc: Record<string, number>, r) => {
    if (r.work_mode) acc[r.work_mode] = (acc[r.work_mode] ?? 0) + 1;
    return acc;
  }, {});
  const dominantMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;


  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": company.name,
      "url": company.website_url ?? undefined,
      // Même règle que l'affichage : on ne déclare pas à Google un logo de
      // marque qu'on n'a pas le droit de diffuser.
      "logo": logoAffichable(company.logo_url) ?? undefined,
      "description": company.description ?? undefined,
      "address": { "@type": "PostalAddress", "addressLocality": company.city, "addressCountry": "CH" },
      ...(Number(company.avg_rating) > 0 && Number(company.review_count) > 0 ? {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": Number(company.avg_rating).toFixed(1),
          "bestRating": "5",
          "worstRating": "1",
          "ratingCount": Number(company.review_count),
        }
      } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Workie", "item": BASE_URL },
        { "@type": "ListItem", "position": 2, "name": "Explorer", "item": `${BASE_URL}/explore` },
        { "@type": "ListItem", "position": 3, "name": company.sector, "item": `${BASE_URL}/explore?sector=${encodeURIComponent(company.sector)}` },
        { "@type": "ListItem", "position": 4, "name": company.name, "item": `${BASE_URL}/company/${company.id}` },
      ],
    },
    // Pas d'objets Review individuels : le format 100% notes n'a pas de corps
    // de texte, et c'est aggregateRating (émis plus haut) qui porte les étoiles
    // dans les résultats de recherche.
  ];

  return (
    <div className="page-root">
      <ViewTracker companyId={company.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\/script>/gi, "<\\/script>") }} />

      {/* Preload hero cover — browser fetches directly from CDN before paint */}
      {/* On préannonce la largeur réellement affichée. L'URL stockée fait
          1600 px : la précharger telle quelle faisait télécharger 198 Ko là où
          la même photo en pèse 81 à la taille du hero. */}
      {company.cover_url && (
        <link rel="preload" as="image" href={largeurCouverture(company.cover_url, 1280)} fetchPriority="high" />
      )}

      {/* Hero cover */}
      <div className="hero-cover">
        {/* CSS background = direct CDN, no Vercel proxy hop */}
        <div style={{
          position: "absolute", inset: 0,
          // La couleur dominante de la photo est peinte sous l'image : le hero
          // est coloré dès le premier rendu au lieu d'afficher un vide.
          backgroundColor: company.cover_color ?? sectorColor,
          background: company.cover_url
            ? `url(${largeurCouverture(company.cover_url, 1280)}) center / cover no-repeat, ${company.cover_color ?? sectorColor}`
            : `linear-gradient(135deg, ${sectorColor}, #f97316)`,
        }} />
        {/* Top gradient — darkens so navbar stays readable */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,13,19,0.65) 0%, rgba(13,13,19,0.0) 40%, rgba(13,13,19,0.0) 50%, rgba(13,13,19,0.92) 100%)" }} />

        <div className="company-hero-bottom" style={{ position: "absolute", bottom: 24, left: 0, right: 0 }}>
          <div className="company-hero-inner" style={{ maxWidth: 900, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              {/* Bloc identité — initiales par défaut, logo seulement s'il est
                  hébergé chez nous (voir logoAffichable). Toujours monté :
                  le retirer décale le titre et la ligne d'infos. */}
              <CompanyHeroLogo
                src={logoAffichable(company.logo_url)}
                alt={`${company.name} logo`}
                className="company-hero-logo"
                name={company.name}
              />
              <div>
              <Link href="/explore" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none", marginBottom: 10, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.18)" }}>
                <ArrowLeft size={14} aria-hidden="true" /> Retour
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
            <div className="company-hero-actions" style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              <ShareButton name={company.name} url={`${BASE_URL}/company/${company.id}`} />
              {user ? (
                <SaveButton companyId={company.id} initialFav={isFav} />
              ) : (
                <GuestSaveButton />
              )}
              <ReportButton
                targetType="company"
                targetId={company.id}
                targetLabel={company.name}
                isLoggedIn={!!user}
                variant="icon"
              />
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
      <GuestContentGate isGuest={!user}>
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

            {/* Key stats — seules les données réellement disponibles sont
                affichées. Le salaire moyen ne provient que des avis publiés ;
                tant que personne n'en a déclaré, la tuile n'apparaît pas
                (mieux vaut rien qu'un « N/A » qui laisse croire à une donnée
                manquante alors qu'aucune n'a jamais existé). */}
            {/* auto-fit : le nombre de tuiles varie selon les données réellement
                disponibles (1 à 4), la grille s'ajuste au lieu d'être figée à 3. */}
            <div className="company-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 32 }}>
              {([
                { icon: <MapPin size={18} color="#8b5cf6" aria-hidden="true" />, value: `${company.city}${company.canton ? `, ${company.canton}` : ""}`, label: "Localisation" },
                company.employee_range
                  ? { icon: <Users size={18} color="#f97316" aria-hidden="true" />, value: company.employee_range, label: "Employés" }
                  : null,
                Number(company.avg_salary_chf) > 0
                  ? { icon: <TrendingUp size={18} color="#10b981" aria-hidden="true" />, value: `CHF ${Math.round(Number(company.avg_salary_chf) / 1000)}k`, label: "Salaire moyen déclaré" }
                  : null,
                { icon: <Star size={18} color="#f59e0b" aria-hidden="true" />, value: Number(company.review_count) > 0 ? `${Number(company.avg_rating).toFixed(1)} / 5` : "Aucun avis", label: `${company.review_count} avis` },
              ].filter(Boolean) as { icon: React.ReactNode; value: string; label: string }[]).map(({ icon, value, label }) => (
                <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ marginBottom: 8 }}>{icon}</div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>{value}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Vote buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
              <CompanyVoteButtons
                companyId={company.id}
                isLoggedIn={!!user}
                isAdmin={isAdmin}
                penaltyCredits={penaltyCredits}
                initialBoosted={initialBoosted}
                initialPenalized={initialPenalized}
                initialScore={Number(company.score ?? 0)}
                variant="card"
              />
            </div>

            {/* Ratings breakdown */}
            {Number(company.review_count) > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "24px", marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
                  <p style={{ fontSize: 52, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{Number(company.avg_rating).toFixed(1)}</p>
                  <div>
                    <Stars rating={Number(company.avg_rating)} size={18} />
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{company.review_count} avis</p>
                  </div>
                </div>

                {/* Les huit catégories sont toujours listées, y compris celles
                    sans donnée, pour que l'étendue du questionnaire soit
                    visible quelle que soit l'ancienneté des avis. */}
                <div className="review-subratings">
                  {RATING_CATEGORIES.map(({ key, label }) => (
                    <RatingRow key={key} label={label} value={avgByCategory[key]} />
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 16, marginTop: 16, borderTop: "1px solid var(--border)" }}>
                  <StatPill label="recommandent" pct={recPct} />
                  <StatPill label="reviendraient" pct={retPct} />
                  {dominantMode && (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 7, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "8px 13px" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", textTransform: "capitalize" }}>{dominantMode}</span>
                      <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>mode dominant</span>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Reviews header + sort tabs */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>
                Avis des employés ({company.review_count})
              </h2>
              {sortedReviews.length > 1 && (
                <div style={{ display: "flex", gap: 6 }}>
                  {([
                    { v: "relevance", l: "Pertinence" },
                    { v: "recent",    l: "Récents" },
                    { v: "helpful",   l: "Utiles" },
                  ] as const).map(({ v, l }) => (
                    <Link
                      key={v}
                      href={`/company/${id}${v === "relevance" ? "" : `?sort=${v}`}`}
                      style={{
                        fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8,
                        textDecoration: "none",
                        background: sortMode === v ? "rgba(139,92,246,0.12)" : "var(--surface2)",
                        color: sortMode === v ? "#8b5cf6" : "var(--text-muted)",
                        border: `1px solid ${sortMode === v ? "rgba(139,92,246,0.35)" : "var(--border2)"}`,
                      }}
                    >
                      {l}
                    </Link>
                  ))}
                </div>
              )}
            </div>

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
              <div style={{ marginBottom: 32, display: "flex", flexDirection: "column", gap: 16 }}>
                {sortedReviews.map(r => <ReviewCard key={r.id} review={r} isLoggedIn={!!user} companyName={company.name} initialVoted={votedReviewIds.has(r.id)} />)}
              </div>
            )}

            {/* Post review */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "28px" }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Partage ton expérience</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Ton avis est anonyme par défaut. Aide la communauté à faire les bons choix.</p>
              {user ? (
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
                      <Globe size={14} aria-hidden="true" /> Site internet
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

          </div>
        </div>

        {/* Similar companies */}
        {similarCompaniesData.length > 0 && (
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>
              Autres entreprises · {company.sector}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {similarCompaniesData.map((c: { id: string; name: string; city: string; avg_rating: number | string | null; review_count: number | string | null; cover_url: string | null; cover_color: string | null; is_verified: boolean | null; sector: string }) => (
                <Link key={c.id} href={`/company/${c.id}`} style={{ textDecoration: "none" }}>
                  <div className="company-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ height: 80, background: c.cover_color ?? "linear-gradient(135deg, #8b5cf6, #3b82f6)", position: "relative" }}>
                      {/* Servi en direct par le CDN : ces 4 vignettes passaient
                          par l'optimiseur, soit 4 transformations d'image
                          déclenchées à chaque affichage de fiche. */}
                      <CoverImage src={c.cover_url} color={c.cover_color} sizes="200px" />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6))" }} />
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        {c.name}
                        {c.is_verified && (
                          <svg viewBox="0 0 22 22" style={{ width: 13, height: 13, flexShrink: 0 }} aria-label="Entreprise vérifiée">
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
      </GuestContentGate>
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
  oui:       { label: "Recommande",          color: "#10b981" },
  non:       { label: "Ne recommande pas",   color: "#ef4444" },
  ca_depend: { label: "Recommande : mitigé", color: "#f59e0b" },
};

const RETURN_LABELS: Record<string, { label: string; color: string }> = {
  oui:       { label: "Reviendrait",           color: "#10b981" },
  peut_etre: { label: "Reviendrait : peut-être", color: "#f59e0b" },
  non:       { label: "Ne reviendrait pas",    color: "#ef4444" },
};

// Score-driven colour so a weak rating reads as weak at a glance — a flat
// gradient made 1/5 and 5/5 look identical.
function ratingColor(value: number): string {
  if (value >= 4) return "#10b981";   // solide
  if (value >= 3) return "#f59e0b";   // moyen
  if (value >= 2) return "#f97316";   // faible
  return "#ef4444";                   // critique
}

function ReviewCard({ review, isLoggedIn = false, companyName = "", initialVoted = false }: { review: Review; isLoggedIn?: boolean; companyName?: string; initialVoted?: boolean }) {
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
  const ret = review.would_return ? RETURN_LABELS[review.would_return] : null;
  const hasSubRatings = review.rating_culture || review.rating_management || review.rating_worklife || review.rating_career
    || review.rating_flexibility || review.rating_recognition || review.rating_workload || review.rating_diversity;

  const chips: { label: string; color?: string; bg?: string; bold?: boolean }[] = [];
  if (review.job_title) chips.push({ label: review.job_title, bold: true });
  if (review.employment_type) chips.push({ label: EMPLOYMENT_LABELS[review.employment_type] ?? review.employment_type });
  if (review.duration_range) chips.push({ label: DURATION_LABELS[review.duration_range] ?? review.duration_range });
  if (review.work_mode) chips.push({ label: WORK_MODE_LABELS[review.work_mode] ?? review.work_mode });
  if (Number(review.salary_chf) > 0) chips.push({ label: `CHF ${Math.round(Number(review.salary_chf) / 1000)}k / an`, color: "#10b981", bg: "rgba(16,185,129,0.08)", bold: true });
  if (review.is_current) chips.push({ label: "Employé actuel", color: "#10b981", bg: "rgba(16,185,129,0.08)", bold: true });

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "20px 22px" }}>
      {/* Top row: rating + recommend + date */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Big rating circle */}
          <div style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(249,115,22,0.08))",
            border: "2px solid rgba(139,92,246,0.2)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{Number(review.rating_overall).toFixed(1)}</span>
            <span style={{ fontSize: 8, color: "var(--text-muted)", fontWeight: 600 }}>/ 5</span>
          </div>
          <div>
            <Stars rating={Number(review.rating_overall)} size={14} />
            <div style={{ marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: rec ? rec.color : "var(--text-muted)" }}>
                {rec ? rec.label : "Recommande : —"}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: ret ? ret.color : "var(--text-muted)" }}>
                {ret ? ret.label : "Reviendrait : —"}
              </span>
            </div>
          </div>
          {review.is_verified_author && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 50,
              background: "rgba(16,185,129,0.1)", color: "#10b981",
              border: "1px solid rgba(16,185,129,0.25)",
            }}>
              <CheckCircle size={10} aria-hidden="true" /> Vérifié
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{age}</span>
      </div>

      {/* Metadata chips */}
      {chips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {chips.map((c, i) => (
            <span key={i} style={{
              fontSize: 11, fontWeight: c.bold ? 600 : 400,
              padding: "3px 10px", borderRadius: 50,
              background: c.bg ?? "var(--surface2)",
              color: c.color ?? "var(--text-muted)",
              border: "1px solid var(--border2)",
            }}>
              {c.label}
            </span>
          ))}
        </div>
      )}

      {/* Sub-ratings */}
      {hasSubRatings && (
        <div className="review-subratings" style={{ paddingTop: 14, borderTop: "1px solid var(--border)", marginBottom: 14 }}>
          {RATING_CATEGORIES.map(({ key, label }) => {
            const raw = review[key];
            return <RatingRow key={key} label={label} value={raw ? Number(raw) : null} />;
          })}
        </div>
      )}

      {/* Aucun texte n'est rendu : la plateforme est passée au format 100% notes.
          Les anciens avis conservent leur texte en base mais seules leurs notes
          sont affichées. */}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: hasSubRatings || chips.length > 0 ? 0 : 4 }}>
        <HelpfulButton reviewId={review.id} initialCount={review.helpful_count} initialVoted={initialVoted} />
        <ReportButton
          targetType="review"
          targetId={review.id}
          targetLabel={`[${companyName}] Avis — ${review.job_title ?? "employé"}`}
          isLoggedIn={isLoggedIn}
          variant="link"
        />
      </div>
    </div>
  );
}
