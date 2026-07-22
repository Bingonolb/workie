export const dynamic = "force-dynamic"; // needed for auth/cookies

import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Explorer les entreprises suisses · Workie",
  description: "Découvre les avis anonymes et salaires des entreprises en Suisse. Tech, Pharma, Finance, Conseil et plus.",
  openGraph: {
    title: "Explorer les entreprises suisses · Workie",
    description: "1700+ entreprises suisses — avis anonymes, salaires réels, classement communautaire.",
    url: "https://www.workie.ch/explore",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Explorer les entreprises suisses · Workie" },
};
import { getAllCompaniesForGrid, getAllCompaniesForSwipe } from "@/lib/actions/companies";
import { getUserFavoriteIds } from "@/lib/actions/favorites";
import { getUserFlameIds } from "@/lib/actions/scores";
import { getUser } from "@/lib/supabase/server";
import { ExploreFilters } from "./ExploreFilters";
import { ExploreClient } from "./ExploreClient";
import { SwipeView } from "./SwipeView";
import { getActiveAds, getViewerCanton } from "@/lib/actions/ads";
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
  searchParams: Promise<{ sector?: string; canton?: string; q?: string; view?: string; page?: string; sort?: string; penalty_success?: string }>;
}) {
  const raw = await searchParams;
  const penaltySuccess = raw.penalty_success === "1";
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

  // Resolve viewer canton FIRST (profile → IP fallback) for ad targeting
  const viewerCanton = await getViewerCanton().catch(() => null);

  const [user, favIds, flameIds, isAdmin, bizCompanyId, squareAds, swipeAds, allCompaniesForGrid] = await Promise.all([
    getUser().catch(() => null),
    getUserFavoriteIds().catch(() => [] as string[]),
    isSwipe ? getUserFlameIds().catch(() => [] as string[]) : Promise.resolve([] as string[]),
    import("@/lib/supabase/server").then(m => m.getIsAdmin()).catch(() => false),
    import("@/lib/supabase/server").then(m => m.getBusinessCompanyId()).catch(() => null),
    !isSwipe ? getActiveAds({ format: "square", canton: viewerCanton ?? undefined }).catch(() => []) : Promise.resolve([]),
    isSwipe
      ? getActiveAds({ format: "swipe", canton: viewerCanton ?? undefined, sector: params.sector }).catch(() => [])
      : Promise.resolve([]),
    !isSwipe ? getAllCompaniesForGrid().catch(() => [] as Company[]) : Promise.resolve([] as Company[]),
  ]);
  const isBusiness = !!bizCompanyId;

  // Helper: resolve penalty credits (with optional Stripe verification on redirect)
  const resolvePenaltyCredits = async (): Promise<number> => {
    if (!user || isBusiness || isAdmin) return 0;
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (penaltySuccess && process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const sessions = await stripe.checkout.sessions.list({
          limit: 100,
          status: "complete",
        });
        const paid = sessions.data.find(
          s => s.mode === "payment" &&
               s.metadata?.type === "penalty_pass" &&
               (s.metadata?.user_id === user.id || s.client_reference_id === user.id)
        );
        if (paid) {
          // Idempotency: mark this session as credited in the profile to avoid double-add
          // with the webhook. Use upsert on a dedicated column; if already set, skip.
          const { data: prof } = await supabase
            .from("profiles")
            .select("penalty_credits, stripe_verification_session_id")
            .eq("id", user.id)
            .maybeSingle();
          // stripe_verification_session_id reused as last_penalty_session_id
          if (prof?.stripe_verification_session_id === paid.id) {
            // Already credited (webhook or previous page load)
            return Number(prof.penalty_credits ?? 0);
          }
          // Atomic claim: only one concurrent request will match IS NULL and win
          const { data: claimed } = await supabase
            .from("profiles")
            .update({ stripe_verification_session_id: paid.id })
            .eq("id", user.id)
            .is("stripe_verification_session_id", null)
            .select("id");
          if (!claimed || claimed.length === 0) {
            // Another request already claimed this session — skip crediting
            const { data: fresh } = await supabase.from("profiles").select("penalty_credits").eq("id", user.id).maybeSingle();
            return Number(fresh?.penalty_credits ?? 0);
          }
          await supabase.rpc("increment_penalty_credits", { uid: user.id, amount: 10 });
          const { data: updated } = await supabase.from("profiles").select("penalty_credits").eq("id", user.id).maybeSingle();
          return Number(updated?.penalty_credits ?? 10);
        }
      } catch { /* fall through to DB check */ }
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("penalty_credits")
      .eq("id", user.id)
      .maybeSingle();
    return Number(profile?.penalty_credits ?? 0);
  };

  if (isSwipe) {
    const [companies, penaltyCredits] = await Promise.all([
      getAllCompaniesForSwipe(filters),
      resolvePenaltyCredits(),
    ]);
    return (
      <div className="page-root">
        <Navbar />
        <main style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 100px" }}>
          <Suspense fallback={null}><ExploreFilters sectors={SECTORS} cantons={CANTONS} current={params}  /></Suspense>
          <SwipeView
            key={`${params.sector ?? ""}-${params.canton ?? ""}-${params.q ?? ""}`}
            companies={companies as Company[]}
            initialFavIds={favIds}
            initialFlameIds={flameIds}
            isLoggedIn={!!user}
            isAdmin={isAdmin}
            isBusiness={isBusiness}
            penaltyCredits={penaltyCredits}
            penaltySuccess={penaltySuccess}
            filters={filters}
            swipeAds={swipeAds}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="page-root">
      <Navbar />
      <main className="page-main">
        <ExploreClient
          allCompanies={allCompaniesForGrid}
          favIds={favIds}
          isLoggedIn={!!user}
          isBusiness={isBusiness}
          isGuest={!user}
          initialSector={params.sector}
          initialCanton={params.canton}
          initialSort={params.sort}
          initialSearch={params.q}
          squareAds={squareAds}
        />
      </main>
    </div>
  );
}
