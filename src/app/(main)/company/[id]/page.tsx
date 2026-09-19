import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getCachedCompany, getCachedJobOffers, getCachedSuggestions } from "@/lib/actions/companies";
import { MapPin, Users, Globe, ArrowLeft, TrendingUp, CheckCircle, ChevronRight, Languages } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { JobOfferCard } from "@/components/JobOfferCard";
import { ViewTracker } from "@/components/ViewTracker";
import { FournisseurEtatFiche } from "@/components/company/EtatFiche";
import { ActionsFiche, VotesFiche, PorteInvite } from "@/components/company/Interactions";
import { BoutonRetour } from "@/components/company/BoutonRetour";

import { SECTOR_COLORS } from "@/lib/types";
import { languesDeTravail } from "@/lib/langues";
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
    : `${company.name}, ${company.sector} à ${company.city}. Offres d'emploi, langues de travail et entreprises voisines.`;
  const url = `${BASE_URL}/company/${id}`;
  // Sans photo de couverture, l'aperçu est dessiné à la demande, avec le nom
  // de l'entreprise, sa ville et son secteur.
  const apercuDessine = `${BASE_URL}/api/og?title=${encodeURIComponent(company.name)}`
    + `&sub=${encodeURIComponent([company.city, company.sector].filter(Boolean).join(" · "))}`;
  const ogImage = company.cover_url
    ? [{ url: company.cover_url, width: 1200, height: 630, alt: company.name }]
    : [{ url: apercuDessine, width: 1200, height: 630, alt: company.name }];
  return {
    title: `${company.name} · Emploi et entreprise · Workie`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: `${company.name} sur Workie`,
      description: desc,
      url,
      siteName: "Workie",
      type: "website",
      locale: "fr_CH",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: `${company.name} sur Workie`,
      description: desc,
      images: ogImage.map(i => i.url),
    },
  };
}

/**
 * Le site de l'entreprise, sous le titre qui dit ce qu'on va y chercher.
 *
 * Rendu à deux endroits, jamais deux fois à la fois : dans la colonne de
 * gauche sous « À propos » sur téléphone, dans la colonne de droite en
 * bureau. Un seul composant pour les deux, sinon les deux versions finissent
 * par diverger.
 *
 * Réduit au site officiel. Le bloc s'appelait « Réseaux » et listait aussi
 * LinkedIn, Twitter et Instagram : sur les 1032 entreprises, 25 ont un
 * LinkedIn et aucune n'a de Twitter ni d'Instagram, et surtout un réseau
 * social n'est pas une offre d'emploi. C'est le site officiel qu'on ouvre
 * pour postuler.
 */
function BlocOffresEmploi({ url, className, style }: { url: string; className?: string; style?: React.CSSProperties }) {
  const href = /^https?:\/\//.test(url) ? url : `https://${url}`;
  return (
    <div className={className} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", ...style }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Offres d&apos;emploi</h3>
      {/* Pastille d'accent plutôt que pavé gris : c'est le vocabulaire déjà
          employé pour le compteur d'offres et le badge de secteur. Le gris
          plein pesait autant qu'une carte pour un simple lien. */}
      <a href={href} target="_blank" rel="noopener noreferrer" className="lien-site">
        <Globe size={14} aria-hidden="true" />
        Site internet
        <span aria-hidden="true" className="lien-site-fleche">↗</span>
      </a>
    </div>
  );
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Aucune lecture de cookie ni de searchParams ici : c'est ce qui permet à
  // Next de rendre la fiche une fois pour tout le monde et de la servir depuis
  // le cache. Ce qui dépend du visiteur est chargé par FournisseurEtatFiche.
  // Les avis ne sont plus lus : ils ne sont ni affichés ni résumés, et une
  // donnée qu'on ne montre pas ne doit pas être envoyée avec la page.
  const company = await getCachedCompany(id).catch(() => null);

  if (!company) notFound();


  // Tous les avis sont affichés, notes uniquement. Les anciens avis rédigés
  // étaient auparavant masqués alors qu'ils comptaient dans la moyenne — leur
  // texte n'est simplement plus rendu (voir SectionAvis). Le tri est appliqué
  // côté client, pour qu'il ne coûte plus une navigation.
  const [jobs, groupesSuggestions] = await Promise.all([
    getCachedJobOffers(id).catch(() => [] as never[]),
    getCachedSuggestions(company.id, company.sector, company.subsector ?? null, company.canton ?? null).catch(() => []),
  ]);

  const langues = languesDeTravail(company.canton ?? null, company.website_url ?? null, company.employee_range ?? null);

  const sectorColor = SECTOR_COLORS[company.sector] ?? "#8b5cf6";

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
      // Pas d'aggregateRating : plus aucune note n'est affichée sur la page,
      // et Google refuse une donnée structurée qui ne correspond à rien de
      // visible.
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

        {/* Retour, en haut du hero et aligné sur le bord gauche du logo.
            Il vivait dans la colonne de texte, à côté du logo : il héritait
            donc de son décalage et commençait à la largeur du logo plus la
            gouttière. Le sortir et lui donner le conteneur du bas, mêmes
            marges comprises, aligne les deux bords gauches par construction
            plutôt que par une valeur recopiée. */}
        <div className="company-hero-retour">
          <div>
            <BoutonRetour style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14.5, fontWeight: 600, color: "#fff", textDecoration: "none", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.18)" }} />
          </div>
        </div>

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
                <span style={{ padding: "3px 10px", borderRadius: 50, fontSize: 13.5, fontWeight: 600, color: sectorColor, background: `${sectorColor}22`, border: `1px solid ${sectorColor}44` }}>
                  {company.sector}
                </span>
                {company.subsector && <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.5)" }}>{company.subsector}</span>}
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
        .suggestion-ligne { transition: background 0.15s; }
        .suggestion-ligne:hover { background: var(--surface2); }
        @media (max-width: 700px) {
          .company-grid { grid-template-columns: 1fr !important; }
          .company-sidebar { position: static !important; }
          .company-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .about-desktop { display: none !important; }
          .about-mobile { display: block !important; }
          .liens-desktop { display: none !important; }
          .liens-mobile { display: block !important; }
        }
        @media (min-width: 701px) {
          .about-mobile { display: none !important; }
          .liens-mobile { display: none !important; }
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
                <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.7 }}>{company.description}</p>
              </div>
            )}

            {/* Sur téléphone les colonnes s'empilent, et ce bloc, qui vit dans
                la colonne de droite, se retrouvait tout en bas de la page,
                après les avis. Or c'est ce qu'on vient y chercher : il remonte
                donc ici, et la version de droite est masquée à cette taille. */}
            {company.website_url && (
              <BlocOffresEmploi url={company.website_url} className="liens-mobile" style={{ marginBottom: 32, display: "none" }} />
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
                // Les langues remplacent la note : on ne postule pas dans une
                // langue qu'on ne parle pas, et c'est la première chose qu'un
                // candidat romand veut savoir d'une entreprise alémanique.
                langues.length > 0
                  ? { icon: <Languages size={18} color="#06b6d4" aria-hidden="true" />, value: langues.join(" · "), label: "Langues de travail" }
                  : null,
              ].filter(Boolean) as { icon: React.ReactNode; value: string; label: string }[]).map(({ icon, value, label }) => (
                <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ marginBottom: 8 }}>{icon}</div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>{value}</p>
                  <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Vote buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
              <VotesFiche companyId={company.id} initialScore={Number(company.score ?? 0)} />
            </div>

            {/* Les entreprises voisines, en liste et par groupes.
                En grille, quatre vignettes se regardent en même temps et
                aucune ne se lit. En liste, on descend, un nom après l'autre.
                Et les groupes vont du plus proche au plus large, pour qu'une
                fiche isolée dans son secteur ne soit jamais un cul-de-sac. */}
            {groupesSuggestions.map(groupe => (
              <div key={groupe.titre} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ padding: "22px 24px 16px" }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
                    {groupe.titre}
                  </h2>
                </div>
                {groupe.entreprises.map(c => (
                  <Link
                    key={c.id}
                    href={`/company/${c.id}`}
                    className="suggestion-ligne"
                    style={{
                      display: "grid", gridTemplateColumns: "56px 1fr 16px", gap: 14, alignItems: "center",
                      padding: "14px 24px", borderTop: "1px solid var(--border)", textDecoration: "none",
                    }}
                  >
                    <div style={{
                      width: 56, height: 56, borderRadius: 13, overflow: "hidden", position: "relative",
                      background: c.cover_color ?? "var(--surface3)", flexShrink: 0,
                    }}>
                      <CoverImage src={c.cover_url} color={c.cover_color} sizes="56px" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: 15.5, fontWeight: 700, color: "var(--text)", marginBottom: 2,
                        display: "flex", alignItems: "center", gap: 5,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {c.name}
                        {c.is_verified && (
                          <svg viewBox="0 0 22 22" style={{ width: 13, height: 13, flexShrink: 0 }} aria-label="Entreprise vérifiée">
                            <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
                            <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
                          </svg>
                        )}
                      </p>
                      <p style={{ fontSize: 13.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.subsector ? `${c.subsector} · ` : ""}{c.city}
                      </p>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Right sidebar */}
          <div className="company-sidebar" style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 16 }}>
            {company.description && (
              <div className="about-desktop" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>À propos</h3>
                <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.7 }}>{company.description}</p>
              </div>
            )}

            {company.website_url && (
              <BlocOffresEmploi url={company.website_url} className="liens-desktop" />
            )}

            {/* Le bloc « Tags » a été retiré.

                Il redisait le secteur en minuscules : « Alimentation »
                devenait « #food #nutrition #agroalimentaire ». Ces mots
                n'aidaient à choisir en rien, et le secteur figure déjà en
                pastille en haut de la fiche. */}

            {company.founded_year && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14.5, color: "var(--text-muted)" }}>Fondée en</span>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>{company.founded_year}</span>
              </div>
            )}

            {/* Job offers */}
            {jobs.length > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  Offres d&apos;emploi
                  <span style={{ fontSize: 12.5, fontWeight: 700, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", borderRadius: 50, padding: "2px 8px" }}>{jobs.length}</span>
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

      </PorteInvite>
      </main>
    </div>
    </FournisseurEtatFiche>
  );
}

