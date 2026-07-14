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
import { AdSquareCard } from "@/components/AdSquareCard";
import { getActiveAds } from "@/lib/actions/ads";
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
  const raw = await searchParams;
  // Sanitize all URL params
  const VALID_SORTS = ["recent", "score", "rating", "reviews", "name"] as const;
  const VALID_VIEWS = ["grid", "swipe"] as const;
  const params = {
    sector: raw.sector && SECTORS.includes(raw.sector) ? raw.sector : undefined,
    canton: raw.canton && CANTONS.some(c => c.code === raw.canton) ? raw.canton : undefined,
    q: raw.q ? raw.q.slice(0, 100).trim() || undefined : undefined,
    view: raw.view && (VALID_VIEWS as readonly string[]).includes(raw.view) ? raw.view : undefined,
    page: raw.page,
    sort: raw.sort && (VALID_SORTS as readonly string[]).includes(raw.sort) ? raw.sort : undefined,
  };
  const isSwipe = params.view === "swipe";
  const filters = { sector: params.sector, canton: params.canton, search: params.q, sort: params.sort };

  // Compute page before the Promise.all so we skip the squareAds fetch on page 2+
  // (guests are always page 1, so provisionalPage is reliable for the ad-fetch decision)
  const provisionalPage = Math.max(1, parseInt(raw.page ?? "1") || 1);

  const [user, favIds, flameIds, isAdmin, bizCompanyId, squareAds, swipeAds] = await Promise.all([
    getUser().catch(() => null),
    getUserFavoriteIds().catch(() => [] as string[]),
    getUserFlameIds().catch(() => [] as string[]),
    import("@/lib/supabase/server").then(m => m.getIsAdmin()).catch(() => false),
    import("@/lib/supabase/server").then(m => m.getBusinessCompanyId()).catch(() => null),
    // Bug 2 fix: skip DB fetch entirely on page 2+ — don't fetch then discard
    !isSwipe && provisionalPage === 1
      ? getActiveAds({ format: "square", canton: params.canton, sector: params.sector }).catch(() => [])
      : Promise.resolve([]),
    isSwipe
      ? getActiveAds({ format: "swipe", canton: params.canton, sector: params.sector }).catch(() => [])
      : Promise.resolve([]),
  ]);
  const isBusiness = !!bizCompanyId;

  // Fetch penalty pass status for logged-in non-business users
  let hasPenaltyPass = false;
  if (user && !isBusiness && !isAdmin) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_penalty_pass")
      .eq("id", user.id)
      .maybeSingle();
    hasPenaltyPass = profile?.has_penalty_pass ?? false;
  }

  // Guests are locked to page 1 — enforced server-side, not just in UI
  const page = user ? Math.max(1, parseInt(params.page ?? "1") || 1) : 1;


  if (isSwipe) {
    const companies = await getAllCompaniesForSwipe(filters);
    return (
      <div className="page-root">
        <Navbar />
        <main style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px 100px" }}>
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
            isBusiness={isBusiness}
            hasPenaltyPass={hasPenaltyPass}
            filters={filters}
            swipeAds={swipeAds}
          />
        </main>
      </div>
    );
  }

  const result = await getCompanies({ ...filters, page, sort: params.sort });
  const { companies, total, pageCount } = result;
  // Bugs 2+3 fix: ads only on page 1 (no fetch wasted on page 2+, done above),
  // and only when ≥4 results so slot at index 3 is always reachable
  const adsForGrid = page === 1 && companies.length >= 4 ? squareAds : [];

  return (
    <div className="page-root">
      <Navbar />
      <main className="page-main">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Explorer les entreprises
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--text)", fontWeight: 700 }}>{total}</span> entreprises · avis 100% authentiques
          </p>
        </div>

        <ExploreFilters sectors={SECTORS} cantons={CANTONS} current={params}  />

        {!user && companies.length > 0 && total > companies.length && (
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
              {(() => {
                // Inject ads after positions 3 and 9 (0-indexed) — never at position 0
                const AD_SLOTS = [3, 9];
                const items: React.ReactNode[] = [];
                let adCursor = 0;
                (companies as Company[]).forEach((c, i) => {
                  if (adCursor < adsForGrid.length && AD_SLOTS[adCursor] === i) {
                    const ad = adsForGrid[adCursor++];
                    items.push(<AdSquareCard key={`ad-${ad.id}`} ad={ad} />);
                  }
                  items.push(<CompanyCard key={c.id} company={c} isFav={favIds.includes(c.id)} isLoggedIn={!!user} isBusiness={isBusiness} />);
                });
                return items;
              })()}
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
