export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Explorer les entreprises suisses · Workie",
  description: "Découvre les avis anonymes et salaires des entreprises en Suisse. Tech, Pharma, Finance, Conseil et plus.",
};
import { CompanyCard } from "@/components/CompanyCard";
import { getCompanies, getAllCompaniesForSwipe } from "@/lib/actions/companies";
import { getUserFavoriteIds } from "@/lib/actions/favorites";
import { getUserFlameIds } from "@/lib/actions/scores";
import { getUser } from "@/lib/supabase/server";
import { ExploreFilters } from "./ExploreFilters";
import { SwipeView } from "./SwipeView";
import { Pagination } from "./Pagination";
import type { Company } from "@/lib/types";

const SECTORS = [
  "Tech", "Finance", "Assurances", "Pharma", "Santé",
  "Conseil", "Industrie", "Automobile", "Horlogerie",
  "Commerce", "Alimentation", "Agriculture",
  "Éducation & Recherche", "Sports & Fashion", "Transport", "Énergie",
];
const CANTONS = [
  { code: "ZH", name: "Zürich" },
  { code: "BE", name: "Bern" },
  { code: "LU", name: "Lucerne" },
  { code: "UR", name: "Uri" },
  { code: "SZ", name: "Schwyz" },
  { code: "OW", name: "Obwald" },
  { code: "NW", name: "Nidwald" },
  { code: "GL", name: "Glaris" },
  { code: "ZG", name: "Zug" },
  { code: "FR", name: "Fribourg" },
  { code: "SO", name: "Soleure" },
  { code: "BS", name: "Bâle-Ville" },
  { code: "BL", name: "Bâle-Camp." },
  { code: "SH", name: "Schaffhouse" },
  { code: "AR", name: "Appenzell A.Rh." },
  { code: "AI", name: "Appenzell I.Rh." },
  { code: "SG", name: "St-Gallen" },
  { code: "GR", name: "Grisons" },
  { code: "AG", name: "Argovie" },
  { code: "TG", name: "Thurgovie" },
  { code: "TI", name: "Tessin" },
  { code: "VD", name: "Vaud" },
  { code: "VS", name: "Valais" },
  { code: "NE", name: "Neuchâtel" },
  { code: "GE", name: "Genève" },
  { code: "JU", name: "Jura" },
];

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; canton?: string; q?: string; view?: string; page?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const isSwipe = params.view === "swipe";
  const filters = { sector: params.sector, canton: params.canton, search: params.q, sort: params.sort };

  const [user, favIds, flameIds, isAdmin] = await Promise.all([
    getUser(),
    getUserFavoriteIds(),
    getUserFlameIds(),
    (await import("@/lib/supabase/server")).getIsAdmin(),
  ]);


  // Guests are locked to page 1 — enforced server-side, not just in UI
  const page = user ? Math.max(1, parseInt(params.page ?? "1") || 1) : 1;

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
              Chargement au fil des swipes
            </p>
          </div>
          <Suspense fallback={null}><ExploreFilters sectors={SECTORS} cantons={CANTONS} current={params}  /></Suspense>
          <SwipeView
            key={`${params.sector ?? ""}-${params.canton ?? ""}-${params.q ?? ""}`}
            companies={companies as Company[]}
            initialFavIds={favIds}
            initialFlameIds={flameIds}
            isLoggedIn={!!user}
            isAdmin={isAdmin}
            filters={filters}
          />
        </main>
      </div>
    );
  }

  const result = await getCompanies({ ...filters, page, sort: params.sort });
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

        <ExploreFilters sectors={SECTORS} cantons={CANTONS} current={params}  />

        {!user && total > companies.length && (
          <div style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(249,115,22,0.06))",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: 16, padding: "16px 20px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <p style={{ fontSize: 14, color: "var(--text-muted)", flex: 1 }}>
              <strong style={{ color: "var(--text)" }}>{total - companies.length} entreprises supplémentaires</strong> disponibles.{" "}
              <a href="/signup" style={{ color: "#8b5cf6", fontWeight: 700, textDecoration: "none" }}>Créer un compte gratuit</a> pour tout voir.
            </p>
          </div>
        )}

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
            {pageCount > 1 && !!user && (
              <Pagination page={page} pageCount={pageCount} total={total} params={params} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
