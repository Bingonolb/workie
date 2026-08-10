"use client";

import { useState, useMemo, useCallback, useRef, useTransition, useEffect, useLayoutEffect } from "react";
import { CompanyCard } from "@/components/CompanyCard";
import { prechargerCouvertures } from "@/components/CoverImage";
import { ExploreFilters } from "./ExploreFilters";
import { AdSquareCard } from "@/components/AdSquareCard";
import { SwipeView } from "./SwipeView";
import { fetchGridPage, fetchSwipePage } from "@/lib/actions/companies";
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
  isLoggedIn: initialIsLoggedIn,
  isGuest: initialIsGuest,
  isAdmin: initialIsAdmin,
  penaltyCredits: initialPenaltyCredits,
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

  // null = auth not yet resolved (loading). Avoids flash of cadenas for logged-in users.
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [isGuest, setIsGuest] = useState(false); // optimistic false until auth resolves
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [penaltyCredits, setPenaltyCredits] = useState(initialPenaltyCredits);
  const [favIds, setFavIds] = useState<string[]>(initialFavIds);
  const [flameIds, setFlameIds] = useState<string[]>(initialFlameIds);
  // Boost et pénalité repartaient de zéro à chaque chargement : le bouton
  // s'affichait éteint alors que le geste était enregistré, et un second clic
  // l'annulait sans que l'utilisateur l'ait voulu.
  const [boostIds, setBoostIds] = useState<string[]>([]);
  const [penaltyIds, setPenaltyIds] = useState<string[]>([]);
  const [squareAdsState, setSquareAdsState] = useState<PublicAdCampaign[]>(squareAds);
  const [swipeAdsState, setSwipeAdsState] = useState<PublicAdCampaign[]>(swipeAds);

  // Server-driven company list + total count
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Préchargement des bannières encore hors écran du lot courant.
  //
  // La version précédente tirait l'URL stockée telle quelle, soit 1600 px de
  // large, pour chaque entreprise de la liste. Ces téléchargements entraient en
  // concurrence avec les images réellement visibles et retardaient l'affichage
  // au lieu de l'accélérer. On demande désormais la largeur d'une carte, et on
  // laisse passer le premier rendu avant de commencer.
  useEffect(() => {
    const t = setTimeout(() => {
      prechargerCouvertures(companies.slice(6).map(c => c.cover_url), 640);
    }, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lecture des paramètres d'URL au montage.
  //
  // useLayoutEffect et non useEffect : la page étant servie depuis le cache, le
  // serveur rend toujours la grille, et c'est le client qui bascule sur le
  // swipe quand l'URL le demande. Avec useEffect, la bascule survient après le
  // premier affichage — on voit donc la grille apparaître puis céder la place
  // aux cartes. Ici elle a lieu avant que le navigateur peigne, sans à-coup.
  useLayoutEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const urlSector = sp.get("sector") ?? "";
    const urlCanton = sp.get("canton") ?? "";
    const urlSort   = sp.get("sort")   ?? "recent";
    const urlView   = sp.get("view");
    const urlPenalty = sp.get("penalty_success") === "1";

    if (urlView === "swipe") setView("swipe");
    if (urlPenalty) {
      // Penalty success — user will see updated credits after /api/user/context loads
    }
    if (urlSector || urlCanton || urlSort !== "recent") {
      setSector(urlSector);
      setCanton(urlCanton);
      setSort(urlSort);
      startTransition(async () => {
        const result = await fetchGridPage(
          { sector: urlSector || undefined, canton: urlCanton || undefined, sort: urlSort },
          0,
        );
        setCompanies(result.companies);
        setTotal(result.total);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate auth state + ads client-side (page is ISR/CDN-cached, no cookies in SSR)
  useEffect(() => {
    const sectorParam = sector ? `&sector=${encodeURIComponent(sector)}` : "";
    Promise.all([
      fetch("/api/user/context").then(r => r.json()),
      fetch(`/api/ads/active?${sectorParam}`).then(r => r.json()),
    ]).then(([ctx, ads]) => {
      setIsLoggedIn(ctx.isLoggedIn);
      setIsGuest(!ctx.isLoggedIn);  // only lock after we know for sure
      setAuthReady(true);
      setIsAdmin(ctx.isAdmin);
      setFavIds(ctx.favIds);
      setFlameIds(ctx.flameIds);
      setBoostIds(ctx.boostIds ?? []);
      setPenaltyIds(ctx.penaltyIds ?? []);
      setPenaltyCredits(ctx.penaltyCredits);
      if (ads.squareAds) setSquareAdsState(ads.squareAds);
      if (ads.swipeAds) setSwipeAdsState(ads.swipeAds);
    }).catch(() => { setAuthReady(true); /* leave defaults */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for instant view switch from BottomNav/NavLinks (no server round-trip)
  useEffect(() => {
    const handler = (e: Event) => setView((e as CustomEvent<"grid" | "swipe">).detail);
    window.addEventListener("workie:view", handler);
    return () => window.removeEventListener("workie:view", handler);
  }, []);

  // L'URL doit refléter l'état complet (filtres + vue), pas seulement la vue.
  // L'ancienne version réécrivait « /explore » ou « /explore?view=swipe » en
  // dur, ce qui effaçait sector/canton/sort : un lien filtré n'était pas
  // partageable et un rechargement perdait les filtres.
  const syncUrl = useCallback((s: string, c: string, so: string, v: string) => {
    const p = new URLSearchParams();
    if (s) p.set("sector", s);
    if (c) p.set("canton", c);
    if (so && so !== "recent") p.set("sort", so);
    if (v === "swipe") p.set("view", "swipe");
    const qs = p.toString();
    const target = `/explore${qs ? `?${qs}` : ""}`;
    if (window.location.pathname + window.location.search !== target) {
      window.history.replaceState({}, "", target);
    }
  }, []);

  // Au montage, l'URL fait déjà foi — on ne la réécrit qu'après un changement,
  // sinon on écraserait les paramètres d'arrivée avant leur lecture.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    syncUrl(sector, canton, sort, view);
  }, [sector, canton, sort, view, syncUrl]);

  // La vue swipe occupe exactement l'écran et ne défile pas.
  //
  // Elle défilait de 56 px auparavant — la hauteur de la barre de navigation,
  // que .page-root ne déduisait pas de son 100dvh. Ce débattement minuscule
  // suffisait à gâcher le geste : le verrou de direction du glissement rendait
  // la main au navigateur dès qu'un mouvement partait vers le bas, et une fois
  // en butée il n'y avait plus rien à faire défiler. Le geste était mort pour
  // toute sa durée et la carte semblait figée.
  //
  // Le verrou posé sur le corps du document plutôt que sur un conteneur : la
  // barre du bas est en position fixe et la barre du haut collante, aucune des
  // deux ne se laisse contenir proprement par un parent en hauteur figée.
  useEffect(() => {
    if (view !== "swipe") return;
    document.body.classList.add("mode-swipe");
    return () => document.body.classList.remove("mode-swipe");
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

  /**
   * Photos du lot suivant, téléchargées et décodées à l'avance.
   *
   * On précharge les images, pas les données : la requête de données prend
   * quelques dizaines de millisecondes, alors que 24 photos représentent
   * l'essentiel de l'attente. Au clic, le rendu est immédiat parce que les
   * images sont déjà dans le cache du navigateur.
   *
   * Une version antérieure réutilisait aussi la promesse de données ; elle
   * renvoyait un lot vide au moment du clic et la liste ne grandissait plus.
   * Le gain ne valait pas le risque : la récupération des données reste dans
   * loadMore, là où elle a toujours fonctionné.
   */
  useEffect(() => {
    if ((page + 1) * GRID_PAGE_SIZE >= total) return;

    // requestIdleCallback : on ne dispute pas la bande passante aux images
    // encore en cours de chargement dans le lot visible.
    const lancer = () => {
      fetchGridPage(
        { sector: sector || undefined, canton: canton || undefined, sort },
        page + 1,
      )
        .then(r => prechargerCouvertures(r.companies.map(c => c.cover_url), 640))
        .catch(() => { /* le clic refera la requête */ });
    };

    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const surIdle = typeof w.requestIdleCallback === "function";
    const id = surIdle
      ? w.requestIdleCallback!(lancer, { timeout: 2500 })
      : window.setTimeout(lancer, 1500);
    return () => {
      if (surIdle) (window as unknown as { cancelIdleCallback: (i: number) => void }).cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [page, sector, canton, sort, total]);

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

  // Swipe uses its own fetched pool (random offset) — pass empty so SwipeView fetches immediately
  const swipeCompanies: Company[] = [];

  const hasMore = (page + 1) * GRID_PAGE_SIZE < total;

  // Ad slot map: one ad every 7 companies starting at adOffset
  const AD_INTERVAL = 7;
  const adsForGrid = (authReady && isGuest) ? [] : squareAdsState;
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
          initialFavIds={favIds}
          initialFlameIds={flameIds}
          initialBoostIds={boostIds}
          initialPenaltyIds={penaltyIds}
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          penaltyCredits={penaltyCredits}
          penaltySuccess={penaltySuccess}
          filters={{ sector: sector || undefined, canton: canton || undefined }}
          swipeAds={swipeAdsState}
        />
      </>
    );
  }

  // Guest: show first GUEST_VISIBLE, blur GUEST_BLUR, hide the rest
  // Only apply guest restrictions after auth is confirmed (avoids flash of cadenas for logged-in users)
  const guestActive = authReady && isGuest;
  const visibleCompanies = guestActive ? companies.slice(0, GUEST_VISIBLE) : companies;
  const blurCompanies    = guestActive ? companies.slice(GUEST_VISIBLE, GUEST_VISIBLE + GUEST_BLUR) : [];

  return (
    <>
      <ExploreFilters
        sectors={SECTORS}
        cantons={CANTONS}
        current={current}
        onFilter={handleFilter}
        onClear={handleClear}
      />

      {guestActive && total > 0 && (
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
                        isFav={favIds.includes(c.id)}
                        isLoggedIn={isLoggedIn}
                        priority={i < 8}
                      />
                    </div>
                  );
                });
                return items;
              })()}
            </div>

            {/* Blurred preview + CTA for guests */}
            {guestActive && blurCompanies.length > 0 && (
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
            {!guestActive && hasMore && (
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
