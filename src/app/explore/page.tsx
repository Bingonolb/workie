export const dynamic = "force-dynamic";

import { Navbar } from "@/components/Navbar";
import { CompanyCard } from "@/components/CompanyCard";
import { getCompanies, getAllCompaniesForSwipe } from "@/lib/actions/companies";
import { getUserFavoriteIds } from "@/lib/actions/favorites";
import { getUserFlameIds } from "@/lib/actions/scores";
import { getUser } from "@/lib/supabase/server";
import { ExploreFilters } from "./ExploreFilters";
import { SwipeView } from "./SwipeView";
import { Pagination } from "./Pagination";
import type { Company } from "@/lib/types";

const SECTORS = ["Tech", "Pharma", "Finance", "Conseil", "Sports & Fashion", "Horlogerie", "Alimentation", "Industrie", "Éducation & Recherche"];
const CITIES = ["Zurich", "Lausanne", "Basel", "Genève", "Bern", "Vevey", "Biel/Bienne", "Zürich"];

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; city?: string; q?: string; view?: string; page?: string }>;
}) {
  const params = await searchParams;
  const isSwipe = params.view === "swipe";
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);

  const filters = { sector: params.sector, city: params.city, search: params.q };

  const [user, favIds, flameIds] = await Promise.all([
    getUser(),
    getUserFavoriteIds(),
    getUserFlameIds(),
  ]);

  if (isSwipe) {
    const companies = await getAllCompaniesForSwipe(filters);
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
        <Navbar />
        <main style={{ maxWidth: 600, margin: "0 auto", padding: "36px 32px 80px" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>
              Explorer
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              <span style={{ color: "var(--text)", fontWeight: 700 }}>{companies.length}</span> entreprises à découvrir
            </p>
          </div>
          <ExploreFilters sectors={SECTORS} cities={CITIES} current={params} />
          <SwipeView
            companies={companies as Company[]}
            initialFavIds={favIds}
            initialFlameIds={flameIds}
            isLoggedIn={!!user}
          />
        </main>
      </div>
    );
  }

  const result = await getCompanies({ ...filters, page });
  const { companies, total, pageCount } = result;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 32px 80px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Explorer les entreprises
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--text)", fontWeight: 700 }}>{total}</span> entreprises · avis 100% authentiques
          </p>
        </div>

        <ExploreFilters sectors={SECTORS} cities={CITIES} current={params} />

        {companies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Aucune entreprise trouvée</p>
            <p style={{ fontSize: 14 }}>Essaie d&apos;autres filtres.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {(companies as Company[]).map(c => (
                <CompanyCard key={c.id} company={c} isFav={favIds.includes(c.id)} isLoggedIn={!!user} />
              ))}
            </div>
            {pageCount > 1 && (
              <Pagination page={page} pageCount={pageCount} total={total} params={params} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
