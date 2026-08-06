import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getCachedCompany, getCachedJobOffers, getCachedSimilarCompanies } from "@/lib/actions/companies";
import { getCachedReviews } from "@/lib/actions/reviews";
import { Star, MapPin, Users, Globe, ArrowLeft, TrendingUp, CheckCircle } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { JobOfferCard } from "@/components/JobOfferCard";
import { ViewTracker } from "@/components/ViewTracker";
import { Stars, RatingRow, StatPill, ratingColor } from "@/components/company/notation";
import { FournisseurEtatFiche } from "@/components/company/EtatFiche";
import { ActionsFiche, VotesFiche, PorteInvite, FormulaireAvis } from "@/components/company/Interactions";
import { SectionAvis } from "@/components/company/SectionAvis";

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
import { CompanyHeroLogo } from "@/components/LogoImg";
import { logoAffichable } from "@/lib/logo";
import { CoverImage } from "@/components/CoverImage";
import { largeurCouverture } from "@/lib/coverUrl";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";

// La fiche ne lit plus ni cookie ni searchParams : Next peut la rendre une fois
// et la servir depuis le cache, et surtout la précharger au survol d'un lien —
// ce qu'une route dynamique interdit.
export const revalidate = 300;

/**
 * Pré-génère les fiches les plus consultées.
 *
 * Un segment dynamique reste rendu à la demande tant qu'aucun paramètre n'est
 * connu à la compilation — même sans lecture de cookie. Or c'est précisément ce
 * statut qui empêche Next de précharger la page au survol d'un lien : le clic
 * attend alors un aller-retour serveur complet.
 *
 * On se limite aux 300 mieux classées plutôt qu'aux 1033 : elles couvrent
 * l'essentiel de la navigation depuis /explore et le classement, et le reste
 * est rendu au premier accès puis mis en cache pour 5 minutes.
 */
export async function generateStaticParams() {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { data } = await createAdminClient()
      .from("companies").select("id").order("score", { ascending: false }).limit(300);
    return (data ?? []).map(c => ({ id: c.id }));
  } catch {
    // Base injoignable à la compilation : on laisse tout se rendre à la demande
    // plutôt que de faire échouer le build.
    return [];
  }
}

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

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Aucune lecture de cookie ni de searchParams ici : c'est ce qui permet à
  // Next de rendre la fiche une fois pour tout le monde et de la servir depuis
  // le cache. Ce qui dépend du visiteur est chargé par FournisseurEtatFiche.
  const [company, reviews] = await Promise.all([
    getCachedCompany(id).catch(() => null),
    getCachedReviews(id).catch(() => [] as Review[]),
  ]);

  if (!company) notFound();

  // Tous les avis sont affichés, notes uniquement. Les anciens avis rédigés
  // étaient auparavant masqués alors qu'ils comptaient dans la moyenne — leur
  // texte n'est simplement plus rendu (voir SectionAvis). Le tri est appliqué
  // côté client, pour qu'il ne coûte plus une navigation.
  const [jobs, similarCompaniesData] = await Promise.all([
    getCachedJobOffers(id).catch(() => [] as never[]),
    getCachedSimilarCompanies(company.sector, id).catch(() => []),
  ]);

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
    <FournisseurEtatFiche companyId={company.id}>
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
              <ActionsFiche companyId={company.id} companyName={company.name} />
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
      <PorteInvite>
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
              <VotesFiche companyId={company.id} initialScore={Number(company.score ?? 0)} />
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
                <SectionAvis reviews={reviews} companyName={company.name} />
              </div>
            )}

            {/* Post review */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "28px" }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Partage ton expérience</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Ton avis est anonyme par défaut. Aide la communauté à faire les bons choix.</p>
              <FormulaireAvis companyId={company.id} />
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
              {similarCompaniesData.map((c: { id: string; name: string; city: string; avg_rating: number | string | null; review_count: number | string | null; cover_url: string | null; cover_color: string | null; is_verified: boolean | null; sector: string; subsector: string | null }) => (
                <Link key={c.id} href={`/company/${c.id}`} style={{ textDecoration: "none" }}>
                  <div className="company-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ height: 130, background: c.cover_color ?? "linear-gradient(135deg, #8b5cf6, #3b82f6)", position: "relative" }}>
                      {/* Servi en direct par le CDN : ces 4 vignettes passaient
                          par l'optimiseur, soit 4 transformations d'image
                          déclenchées à chaque affichage de fiche. */}
                      <CoverImage src={c.cover_url} color={c.cover_color} sizes="250px" />
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
                      {c.subsector && (
                        <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.subsector}
                        </p>
                      )}
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
      </PorteInvite>
      </main>
    </div>
    </FournisseurEtatFiche>
  );
}

