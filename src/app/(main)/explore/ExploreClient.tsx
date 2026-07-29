"use client";

import { useState, useMemo, useCallback, useRef, useTransition, useEffect } from "react";
import { CompanyCard } from "@/components/CompanyCard";
import { ExploreFilters } from "./ExploreFilters";
import { AdSquareCard } from "@/components/AdSquareCard";
import { SwipeView } from "./SwipeView";
import { fetchGridPage } from "@/lib/actions/companies";
import { GRID_PAGE_SIZE } from "@/lib/actions/columns";
import type { Company } from "@/lib/types";
import type { PublicAdCampaign } from "@/lib/actions/ads";

// Guests see the first 12 companies + 6 blurred
const GUEST_VISIBLE = 12;
const GUEST_BLUR = 6;

const CANTONS = [
  { code: "ZH", name: "Zürich" }, { code: "BE", name: "Bern" }, { code: "LU", name: "Lucerne" },
  { code: "UR", name: "Uri" }, { code: "SZ", name: "Schwyz" }, { code: "OW", name: "Obwald" },
  { code: "NW", name: "Nidwald" }, { code: "GL", name: "Glaris" }, { code: "ZG", name: "Zug" },
  { code: "FR", name: "Fribourg" }, { code: "SO", name: "Soleure" }, { code: "BS", name: "Bâle-Ville" },
  { code: "BL", name: "Bâle-Camp." }, { code: "SH", name: "Schaffhouse" }, { code: "AR", name: "Appenzell A.Rh." },
  { code: "AI", name: "Appenzell I.Rh." }, { code: "SG", name: "St-Gallen" }, { code: "GR", name: "Grisons" },
  { code: "AG", name: "Argovie" }, { code: "TG", name: "Thurgovie" }, { code: "TI", name: "Tessin" },
  { code: "VD", name: "Vaud" }, { code: "VS", name: "Valais" }, { code: "NE", name: "Neuchâtel" },
  { code: "GE", name: "Genève" }, { code: "JU", name: "Jura" },
];
const SECTORS = [
  "Tech", "Finance", "Assurances", "Pharma", "Santé", "Conseil", "Industrie",
  "Automobile", "Horlogerie", "Commerce", "Alimentation", "Agriculture",
  "Éducation & Recherche", "Sports & Fashion", "Transport", "Énergie",
  "Droit", "Bâtiment", "Beauté", "Administration publique",
];

export function ExploreClient({
  initialCompanies,
  initialTotal,
  favIds: initialFavIds,
  flameIds: initialFlameIds,
  swipeAds,
  isLoggedIn,
  isGuest,
  isAdmin,
  penaltyCredits,
  penaltySuccess,
  initialView,
  initialSector,
  initialCanton,
  initialSort,
  squareAds,
}: {
  initialCompanies: Company[];
  initialTotal: number;
  favIds: string[];
  flameIds: string[];
  swipeAds: PublicAdCampaign[];
  isLoggedIn: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  penaltyCredits: number;
  penaltySuccess: boolean;
  initialView: "grid" | "swipe";
  initialSector?: string;
  initialCanton?: string;
  initialSort?: string;
  squareAds: PublicAdCampaign[];
}) {
  const [view, setView] = useState<"grid" | "swipe">(initialView);
  const [sector, setSector] = useState(initialSector ?? "");
  const [canton, setCanton] = useState(initialCanton ?? "");
  const [sort, setSort] = useState(initialSort ?? "recent");

  // Server-driven company list + total count
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Preload ALL company covers into browser cache as soon as the list is known.
  // This ensures Swipe/Ranking/Favoris show cached images with no reload.
  useEffect(() => {
    companies.forEach(c => {
      const url = c.cover_url || `/api/og?title=${encodeURIComponent(c.name)}&sub=${encodeURIComponent(c.sector ?? "")}`;
      const img = new window.Image();
      img.src = url;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for instant view switch from BottomNav/NavLinks (no server round-trip)
  useEffect(() => {
    const handler = (e: Event) => setView((e as CustomEvent<"grid" | "swipe">).detail);
    window.addEventListener("workie:view", handler);
    return () => window.removeEventListener("workie:view", handler);
  }, []);

  // Keep URL in sync with view state
  useEffect(() => {
    const target = view === "swipe" ? "/explore?view=swipe" : "/explore";
    if (window.location.pathname + window.location.search !== target) {
      window.history.replaceState({}, "", target);
    }
    if (view === "swipe") window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);

  // Re-fetch from page 0 whenever filters/sort change
  const applyFilters = useCallback((
    newSector: string,
    newCanton: string,
    newSort: string,
  ) => {
    setSector(newSector);
    setCanton(newCanton);
    setSort(newSort);
    setPage(0);
    startTransition(async () => {
      const result = await fetchGridPage(
        { sector: newSector || undefined, canton: newCanton || undefined, sort: newSort },
        0,
      );
      setCompanies(result.companies);
      setTotal(result.total);
    });
  }, []);

  const handleFilter = useCallback((key: string, value: string | undefined) => {
    const newSector = key === "sector" ? (value ?? "") : sector;
    const newCanton = key === "canton" ? (value ?? "") : canton;
    const newSort   = key === "sort"   ? (value ?? "recent") : sort;
    applyFilters(newSector, newCanton, newSort);
  }, [sector, canton, sort, applyFilters]);

  const handleClear = useCallback(() => {
    applyFilters("", "", "recent");
  }, [applyFilters]);

  const [newFrom, setNewFrom] = useState<number>(-1);

  const loadMore = async () => {
    if (loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const result = await fetchGridPage(
        { sector: sector || undefined, canton: canton || undefined, sort },
        nextPage,
      );
      setCompanies(prev => {
        setNewFrom(prev.length);
        return [...prev, ...result.companies];
      });
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  // Session-stable ad offset
  const adOffset = useRef<number>(-1);
  if (adOffset.current === -1) {
    try {
      const stored = sessionStorage.getItem("w_ad_off");
      if (stored !== null) {
        adOffset.current = parseInt(stored, 10);
      } else {
        const v = 3 + Math.floor(Math.random() * 3);
        sessionStorage.setItem("w_ad_off", String(v));
        adOffset.current = v;
      }
    } catch {
      adOffset.current = 4;
    }
  }

  // Swipe companies: same list filtered for city + tags (SwipeView loads more itself)
  const swipeCompanies = useMemo(
    () => companies.filter(c => c.city?.trim()),
    [companies],
  );

  const hasMore = (page + 1) * GRID_PAGE_SIZE < total;

  // Ad slot map: one ad every 7 companies starting at adOffset
  const AD_INTERVAL = 7;
  const adsForGrid = isGuest ? [] : squareAds;
  const adSlotMap = useMemo((): Map<number, number> => {
    if (adsForGrid.length === 0 || companies.length < adOffset.current + 1) return new Map();
    const map = new Map<number, number>();
    let slotNum = 0;
    for (let idx = adOffset.current; idx < companies.length; idx += AD_INTERVAL) {
      map.set(idx, slotNum++);
    }
    return map;
  }, [adsForGrid.length, companies.length, adOffset]);

  const current = {
    sector: sector || undefined,
    canton: canton || undefined,
    sort: sort !== "recent" ? sort : undefined,
    view: view as "grid" | "swipe",
  };

  if (view === "swipe") {
    return (
      <>
        <ExploreFilters
          sectors={SECTORS}
          cantons={CANTONS}
          current={current}
          onFilter={(key, value) => {
            if (key === "sector") applyFilters(value ?? "", canton, sort);
            else if (key === "canton") applyFilters(sector, value ?? "", sort);
          }}
          onClear={() => applyFilters("", "", sort)}
        />
        <SwipeView
          key={`${sector}-${canton}`}
          companies={swipeCompanies}
          initialFavIds={initialFavIds}
          initialFlameIds={initialFlameIds}
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          penaltyCredits={penaltyCredits}
          penaltySuccess={penaltySuccess}
          filters={{ sector: sector || undefined, canton: canton || undefined }}
          swipeAds={swipeAds}
        />
      </>
    );
  }

  // Guest: show first GUEST_VISIBLE, blur GUEST_BLUR, hide the rest
  const visibleCompanies = isGuest ? companies.slice(0, GUEST_VISIBLE) : companies;
  const blurCompanies    = isGuest ? companies.slice(GUEST_VISIBLE, GUEST_VISIBLE + GUEST_BLUR) : [];

  return (
    <>
      <ExploreFilters
        sectors={SECTORS}
        cantons={CANTONS}
        current={current}
        onFilter={handleFilter}
        onClear={handleClear}
      />

      {isGuest && total > 0 && (
        <div style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(249,115,22,0.06))",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: 16, padding: "16px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          <p style={{ fontSize: 14, color: "var(--text-muted)", flex: 1 }}>
            <strong style={{ color: "var(--text)" }}>{total} entreprises disponibles.</strong>{" "}
            <a href="/signup" style={{ color: "#8b5cf6", fontWeight: 700, textDecoration: "none" }}>Créer un compte gratuit</a> pour tout voir.
          </p>
        </div>
      )}

      {/* Pending overlay — fades the grid while new results load */}
      <div style={{ opacity: isPending ? 0.5 : 1, transition: "opacity 0.15s" }}>
        {visibleCompanies.length === 0 && !isPending ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Aucune entreprise trouvée</p>
            <p style={{ fontSize: 14 }}>Essaie d&apos;autres filtres.</p>
          </div>
        ) : (
          <>
            <div className="explore-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 28 }}>
              {(() => {
                const items: React.ReactNode[] = [];
                visibleCompanies.forEach((c, i) => {
                  const slotNum = adSlotMap.get(i);
                  if (slotNum !== undefined) {
                    const ad = adsForGrid[slotNum % adsForGrid.length];
                    items.push(<AdSquareCard key={`ad-slot-${slotNum}`} ad={ad} />);
                  }
                  const isNew = newFrom >= 0 && i >= newFrom;
                  const delay = isNew ? Math.min((i - newFrom) * 40, 400) : 0;
                  items.push(
                    <div
                      key={c.id}
                      style={isNew ? {
                        animation: `cardIn 0.35s ease-out both`,
                        animationDelay: `${delay}ms`,
                      } : undefined}
                    >
                      <CompanyCard
                        company={c}
                        isFav={initialFavIds.includes(c.id)}
                        isLoggedIn={isLoggedIn}
                        priority={i < 8}
                        loading="eager"
                      />
                    </div>
                  );
                });
                return items;
              })()}
            </div>

            {/* Blurred preview + CTA for guests */}
            {isGuest && blurCompanies.length > 0 && (
              <>
                <div style={{ position: "relative", marginTop: 20, overflow: "hidden" }}>
                  <div aria-hidden="true" className="guest-blur-preview">
                    {blurCompanies.map(c => (
                      <CompanyCard key={c.id} company={c} isFav={false} isLoggedIn={false} priority={false} />
                    ))}
                  </div>
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to bottom, transparent 38%, var(--bg) 88%)",
                    pointerEvents: "none",
                  }} />
                </div>

                <div className="guest-gate-cta">
                  <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.025em" }}>
                    {total - GUEST_VISIBLE} entreprises de plus
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 22, maxWidth: 300, lineHeight: 1.6 }}>
                    Avis complets, salaires réels, classements — gratuit et 100% anonyme.
                  </p>
                  <a href="/signup" style={{
                    display: "inline-block", padding: "13px 28px", borderRadius: 12,
                    background: "linear-gradient(135deg, #8b5cf6, #f97316)",
                    color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
                  }}>
                    Créer un compte — gratuit
                  </a>
                  <a href="/login" style={{
                    marginTop: 12, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontWeight: 500,
                  }}>
                    Déjà un compte ? <span style={{ color: "#8b5cf6", fontWeight: 600 }}>Se connecter</span>
                  </a>
                </div>
              </>
            )}

            {/* Load more for logged-in users */}
            {!isGuest && hasMore && (
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                  <span style={{ color: "var(--text)", fontWeight: 700 }}>{companies.length}</span> sur <span style={{ fontWeight: 700 }}>{total}</span> entreprises
                </p>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    padding: "12px 32px", borderRadius: 50, border: "1.5px solid rgba(139,92,246,0.4)",
                    background: "rgba(139,92,246,0.08)", color: "#8b5cf6", cursor: loadingMore ? "not-allowed" : "pointer",
                    fontSize: 14, fontWeight: 700, opacity: loadingMore ? 0.6 : 1, transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!loadingMore) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.16)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#8b5cf6"; }}}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.08)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.4)"; }}
                >
                  {loadingMore ? "Chargement…" : `Voir ${Math.min(GRID_PAGE_SIZE, total - companies.length)} de plus`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
