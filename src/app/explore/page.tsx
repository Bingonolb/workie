import { Navbar } from "@/components/Navbar";
import { CompanyCard } from "@/components/CompanyCard";
import { getCompanies } from "@/lib/actions/companies";
import { getUserFavoriteIds } from "@/lib/actions/favorites";
import { getUser } from "@/lib/supabase/server";
import { ExploreFilters } from "./ExploreFilters";
import type { Company } from "@/lib/types";

const SECTORS = ["Tech", "Pharma", "Finance", "Conseil", "Sports & Fashion", "Horlogerie", "Alimentation", "Industrie", "Éducation & Recherche"];
const CITIES = ["Zurich", "Lausanne", "Basel", "Genève", "Bern", "Vevey", "Biel/Bienne"];

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; city?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [user, companies, favIds] = await Promise.all([
    getUser(),
    getCompanies({ sector: params.sector, city: params.city, search: params.q }),
    getUserFavoriteIds(),
  ]);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 32px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Explorer les entreprises
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
            {companies.length} entreprise{companies.length > 1 ? "s" : ""} · Avis 100% authentiques
          </p>
        </div>

        {/* Filters */}
        <ExploreFilters sectors={SECTORS} cities={CITIES} current={params} />

        {/* Grid */}
        {companies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Aucune entreprise trouvée</p>
            <p style={{ fontSize: 14 }}>Essaie d&apos;autres filtres.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {(companies as Company[]).map(c => (
              <CompanyCard
                key={c.id}
                company={c}
                isFav={favIds.includes(c.id)}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
