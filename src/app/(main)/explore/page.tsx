export const revalidate = 60; // ISR: Vercel CDN caches for 60s, auth/ads/filters are client-side

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Explorer les entreprises suisses · Workie",
  description: "Découvre les avis anonymes et salaires des entreprises en Suisse. Tech, Pharma, Finance, Conseil et plus.",
  alternates: { canonical: "https://www.workie.ch/explore" },
  openGraph: {
    title: "Explorer les entreprises suisses · Workie",
    description: "1700+ entreprises suisses — avis anonymes, salaires réels, classement communautaire.",
    url: "https://www.workie.ch/explore",
    siteName: "Workie",
    type: "website",
    locale: "fr_CH",
    images: [{ url: "https://www.workie.ch/og-default.png", width: 1200, height: 630, alt: "Explorer les entreprises suisses · Workie" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explorer les entreprises suisses · Workie",
    images: ["https://www.workie.ch/og-default.png"],
  },
};
import { fetchGridPage } from "@/lib/actions/companies";
import { largeurCouverture } from "@/lib/coverUrl";
import { ExploreClient } from "./ExploreClient";
import type { Company } from "@/lib/types";

export default async function ExplorePage() {
  // No searchParams — ISR requires no dynamic input.
  // Filters are applied client-side via ExploreClient → fetchGridPage (cached).
  const { companies: initialCompanies, total: initialTotal } = await fetchGridPage({}, 0)
    .catch(() => ({ companies: [] as Company[], total: 0 }));

  // JSON-LD for Google indexing of top companies
  const BASE_URL = "https://www.workie.ch";
  const topForJsonLd = initialCompanies
    .filter(c => Number(c.review_count) > 0)
    .slice(0, 30);
  const exploreJsonLd = topForJsonLd.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Meilleures entreprises suisses",
    "url": `${BASE_URL}/explore`,
    "numberOfItems": topForJsonLd.length,
    "itemListElement": topForJsonLd.map((c, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `${BASE_URL}/company/${c.id}`,
      "name": c.name,
    })),
  } : null;

  return (
    <div className="page-root">
      {exploreJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(exploreJsonLd).replace(/<\/script>/gi, "<\\/script>") }} />
      )}
      {/* Le navigateur commence à télécharger les premières bannières dès la
          lecture du HTML, sans attendre le chargement ni l'exécution du
          JavaScript. C'est ce qui fait qu'elles sont déjà là au premier rendu
          plutôt que d'apparaître ensuite. */}
      {initialCompanies.slice(0, 8).map(c => c.cover_url && (
        <link
          key={c.id}
          rel="preload"
          as="image"
          href={largeurCouverture(c.cover_url, 640)}
          imageSrcSet={`${largeurCouverture(c.cover_url, 480)} 480w, ${largeurCouverture(c.cover_url, 640)} 640w, ${largeurCouverture(c.cover_url, 940)} 940w`}
          imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          fetchPriority="high"
        />
      ))}
      <main className="page-main">
        <ExploreClient
          initialCompanies={initialCompanies}
          initialTotal={initialTotal}
          favIds={[]}
          flameIds={[]}
          swipeAds={[]}
          isLoggedIn={false}
          isGuest={true}
          isAdmin={false}
          penaltyCredits={0}
          penaltySuccess={false}
          initialView="grid"
          squareAds={[]}
        />
      </main>
    </div>
  );
}
