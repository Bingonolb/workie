"use client";

import { useState, useMemo, useCallback } from "react";
import { CompanyCard } from "@/components/CompanyCard";
import { ExploreFilters } from "./ExploreFilters";
import { AdSquareCard } from "@/components/AdSquareCard";
import type { Company } from "@/lib/types";
import type { AdCampaign } from "@/lib/actions/ads";

const PAGE_SIZE = 12;

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
];

function sortCompanies(companies: Company[], sort: string): Company[] {
  if (sort === "recent") return companies; // already sorted by server
  const copy = [...companies];
  if (sort === "score") {
    copy.sort((a, b) => {
      const d = Number(b.score) - Number(a.score); if (d !== 0) return d;
      const d2 = Number(b.avg_rating) - Number(a.avg_rating); if (d2 !== 0) return d2;
      return a.name.localeCompare(b.name);
    });
  } else if (sort === "rating") {
    copy.sort((a, b) => {
      const d = Number(b.avg_rating) - Number(a.avg_rating); if (d !== 0) return d;
      const d2 = Number(b.review_count) - Number(a.review_count); if (d2 !== 0) return d2;
      return a.name.localeCompare(b.name);
    });
  } else if (sort === "reviews") {
    copy.sort((a, b) => {
      const d = Number(b.review_count) - Number(a.review_count); if (d !== 0) return d;
      const d2 = Number(b.avg_rating) - Number(a.avg_rating); if (d2 !== 0) return d2;
      return a.name.localeCompare(b.name);
    });
  } else if (sort === "name") {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  return copy;
}

export function ExploreClient({
  allCompanies,
  favIds: initialFavIds,
  isLoggedIn,
  isBusiness,
  isGuest,
  initialSector,
  initialCanton,
  initialSort,
  initialSearch,
  squareAds,
}: {
  allCompanies: Company[];
  favIds: string[];
  isLoggedIn: boolean;
  isBusiness: boolean;
  isGuest: boolean;
  initialSector?: string;
  initialCanton?: string;
  initialSort?: string;
  initialSearch?: string;
  squareAds: AdCampaign[];
}) {
  const [sector, setSector] = useState(initialSector ?? "");
  const [canton, setCanton] = useState(initialCanton ?? "");
  const [sort, setSort] = useState(initialSort ?? "recent");
  const [search, setSearch] = useState(initialSearch ?? "");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = allCompanies;
    if (sector) result = result.filter(c => c.sector === sector);
    if (canton) result = result.filter(c => c.canton === canton);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    }
    return sortCompanies(result, sort);
  }, [allCompanies, sector, canton, search, sort]);

  const total = filtered.length;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const adsForGrid = page === 1 && paginated.length >= 4 ? squareAds : [];

  const handleFilter = useCallback((key: string, value: string | undefined) => {
    setPage(1);
    if (key === "sector") setSector(value ?? "");
    else if (key === "canton") setCanton(value ?? "");
    else if (key === "sort") setSort(value ?? "recent");
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const handleClear = useCallback(() => {
    setSector("");
    setCanton("");
    setSort("recent");
    setSearch("");
    setPage(1);
  }, []);

  const current = { sector: sector || undefined, canton: canton || undefined, q: search || undefined, sort: sort !== "recent" ? sort : undefined, view: "grid" as const };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          Explorer les entreprises
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
          <span style={{ color: "var(--text)", fontWeight: 700 }}>{total}</span> entreprises · avis 100% authentiques
        </p>
      </div>

      <ExploreFilters
        sectors={SECTORS}
        cantons={CANTONS}
        current={current}
        onFilter={handleFilter}
        onSearch={handleSearch}
        onClear={handleClear}
      />

      {isGuest && total > 0 && allCompanies.length <= 50 && (
        <div style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(249,115,22,0.06))",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: 16, padding: "16px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <p style={{ fontSize: 14, color: "var(--text-muted)", flex: 1 }}>
            <strong style={{ color: "var(--text)" }}>1700+ entreprises disponibles.</strong>{" "}
            <a href="/signup" style={{ color: "#8b5cf6", fontWeight: 700, textDecoration: "none" }}>Créer un compte gratuit</a> pour tout voir.
          </p>
        </div>
      )}

      {paginated.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Aucune entreprise trouvée</p>
          <p style={{ fontSize: 14 }}>Essaie d&apos;autres filtres.</p>
        </div>
      ) : (
        <>
          <div className="explore-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {(() => {
              const AD_SLOTS = [3, 9];
              const items: React.ReactNode[] = [];
              let adCursor = 0;
              paginated.forEach((c, i) => {
                if (adCursor < adsForGrid.length && AD_SLOTS[adCursor] === i) {
                  const ad = adsForGrid[adCursor++];
                  items.push(<AdSquareCard key={`ad-${ad.id}`} ad={ad} />);
                }
                items.push(<CompanyCard key={c.id} company={c} isFav={initialFavIds.includes(c.id)} isLoggedIn={isLoggedIn} isBusiness={isBusiness} />);
              });
              return items;
            })()}
          </div>

          {pageCount > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 32, flexWrap: "wrap" }}>
              {page > 1 && (
                <button onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid var(--border2)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  ← Précédent
                </button>
              )}
              {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    style={{ padding: "8px 14px", borderRadius: 10, border: page === p ? "1.5px solid #8b5cf6" : "1px solid var(--border2)", background: page === p ? "rgba(139,92,246,0.12)" : "var(--surface)", color: page === p ? "#8b5cf6" : "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: page === p ? 700 : 400 }}>
                    {p}
                  </button>
                );
              })}
              {page < pageCount && (
                <button onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid var(--border2)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Suivant →
                </button>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
