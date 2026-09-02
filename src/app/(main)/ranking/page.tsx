export const revalidate = 60;

import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { getCachedTopCompanies, getCachedReviewCount } from "@/lib/actions/scores";
import { RankingTable } from "./RankingList";
import type { Company } from "@/lib/types";

export const metadata: Metadata = {
  title: "Classement des entreprises suisses · Workie",
  description: "Le vrai classement des entreprises en Suisse, calculé sur les avis anonymes, les salaires et les votes de la communauté Workie.",
  alternates: { canonical: "https://www.workie.ch/ranking" },
  openGraph: {
    title: "Classement des meilleurs employeurs suisses · Workie",
    description: "200 entreprises classées par note, salaire et votes anonymes d'employés.",
    url: "https://www.workie.ch/ranking",
    siteName: "Workie",
    type: "website",
    locale: "fr_CH",
    images: [{ url: "https://www.workie.ch/api/og?title=Classement+des+employeurs+suisses+%C2%B7+Workie&sub=200+entreprises+class%C3%A9es+par+la+communaut%C3%A9", width: 1200, height: 630, alt: "Classement des employeurs suisses · Workie" }],
  },
  twitter: { card: "summary_large_image", title: "Classement des employeurs suisses · Workie", images: ["https://www.workie.ch/api/og?title=Classement+des+employeurs+suisses+%C2%B7+Workie&sub=200+entreprises+class%C3%A9es+par+la+communaut%C3%A9"] },
};

export default async function RankingPage() {
  const [companies, reviewCount] = await Promise.all([
    getCachedTopCompanies(200).catch(() => [] as Company[]),
    getCachedReviewCount().catch(() => 0),
  ]);
  const typedCompanies = companies as Company[];

  const withRating = typedCompanies.filter(c => Number(c.avg_rating) > 0);
  const avgRating = withRating.length
    ? withRating.reduce((s, c) => s + Number(c.avg_rating), 0) / withRating.length
    : 0;
  const totalReviews = reviewCount;

  const rankingJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Classement des meilleurs employeurs suisses",
    "description": "Top 200 entreprises suisses classées par avis anonymes, notes et votes d'employés sur Workie.",
    "url": "https://www.workie.ch/ranking",
    "numberOfItems": typedCompanies.length,
    "itemListElement": typedCompanies.slice(0, 10).map((c, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": c.name,
      "url": `https://www.workie.ch/company/${c.id}`,
      ...(Number(c.avg_rating) > 0 ? { "description": `Note : ${Number(c.avg_rating).toFixed(1)}/5 · ${c.city}, ${c.canton}` } : {}),
    })),
  };

  return (
    <div className="page-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(rankingJsonLd).replace(/<\/script>/gi, "<\\/script>") }} />
      <main className="page-main-md">

        {/* Table */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
          {/* Le titre et son sous-titre sont rendus par la table.
              Ils annoncaient « Top 200 » et « Trie par score communautaire »
              depuis le serveur, donc immuables : des qu'un filtre reduisait la
              liste a vingt-quatre lignes, la page continuait d'annoncer deux
              cents. Le sous-titre suit maintenant ce qui est reellement
              affiche. */}

          {companies.length === 0 ? (
            <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Pas encore de données</p>
              <p style={{ fontSize: 13 }}>Explorez les entreprises et déposez un avis pour alimenter le classement.</p>
            </div>
          ) : (
            <RankingTable companies={typedCompanies} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
