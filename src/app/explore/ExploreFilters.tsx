"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal } from "lucide-react";
import { useTransition, useState, useEffect, useRef } from "react";
import { SECTOR_COLORS } from "@/lib/types";

export function ExploreFilters({
  sectors,
  cantons,
  current,
  onFilter,
  onClear,
}: {
  sectors: string[];
  cantons: { code: string; name: string }[];
  current: { sector?: string; canton?: string; view?: string; sort?: string };
  onFilter?: (key: string, value: string | undefined) => void;
  onClear?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const view = current.view ?? "grid";
  const sort = current.sort ?? "recent";
  const activeCanton = cantons.find(c => c.code === current.canton);
  const activeCount = (current.sector ? 1 : 0) + (current.canton ? 1 : 0) + (sort !== "recent" && view !== "swipe" ? 1 : 0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const btn = document.getElementById("filter-btn");
        if (!btn?.contains(e.target as Node)) setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const push = (key: string, value: string | undefined) => {
    if (onFilter) { onFilter(key, value); return; }
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  const clearAll = () => {
    setShowPanel(false);
    if (onClear) { onClear(); return; }
    const p = new URLSearchParams();
    if (view !== "grid") p.set("view", view);
    startTransition(() => router.push(`${pathname}${p.toString() ? `?${p}` : ""}`));
  };

  return (
    <div style={{ marginBottom: 20, opacity: isPending ? 0.65 : 1, transition: "opacity 0.15s" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>

        {/* Filtres button */}
        <div style={{ position: "relative" }}>
          <button
            id="filter-btn"
            aria-expanded={showPanel}
            aria-controls="filter-panel"
            onClick={() => setShowPanel(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              height: 42, padding: "0 16px", borderRadius: 12,
              border: showPanel || activeCount > 0 ? "1.5px solid #8b5cf6" : "1px solid var(--border2)",
              background: showPanel || activeCount > 0 ? "rgba(139,92,246,0.12)" : "var(--surface)",
              color: activeCount > 0 ? "#8b5cf6" : "var(--text-muted)",
              cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
            }}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span>Filtres</span>
            {activeCount > 0 && (
              <span style={{ background: "#8b5cf6", color: "#fff", borderRadius: 50, fontSize: 10, fontWeight: 800, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                {activeCount}
              </span>
            )}
          </button>

          {showPanel && (
            <>
              <div className="filter-panel-overlay" onClick={() => setShowPanel(false)} />
              <div ref={panelRef} id="filter-panel" className="filter-panel">
                {/* Sectors */}
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Secteur</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
                  {sectors.map(s => {
                    const color = SECTOR_COLORS[s] ?? "#8b5cf6";
                    const active = current.sector === s;
                    return (
                      <button key={s} onClick={() => push("sector", active ? undefined : s)}
                        style={{
                          padding: "5px 13px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          border: active ? `1.5px solid ${color}` : "1px solid var(--border2)",
                          background: active ? `color-mix(in srgb, ${color} 15%, transparent)` : "transparent",
                          color: active ? color : "var(--text-muted)", transition: "all 0.1s",
                        }}>
                        {s}
                      </button>
                    );
                  })}
                </div>

                {/* Cantons */}
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Canton</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 5, marginBottom: view !== "swipe" ? 18 : 0 }}>
                  {cantons.map(c => {
                    const active = current.canton === c.code;
                    return (
                      <button key={c.code} onClick={() => push("canton", active ? undefined : c.code)}
                        style={{
                          padding: "6px 4px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                          border: active ? "1.5px solid #f97316" : "1px solid var(--border)",
                          background: active ? "rgba(249,115,22,0.15)" : "transparent",
                          color: active ? "#f97316" : "var(--text-muted)",
                          textAlign: "center", lineHeight: 1.4, transition: "all 0.1s",
                        }}>
                        <div style={{ fontSize: 9, opacity: 0.5 }}>{c.code}</div>
                        {c.name}
                      </button>
                    );
                  })}
                </div>

                {/* Sort — grid only */}
                {view !== "swipe" && (
                  <>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Trier par</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {([
                        { v: "recent", label: "Récentes" },
                        { v: "score", label: "Score" },
                        { v: "rating", label: "Meilleure note" },
                        { v: "reviews", label: "Plus d'avis" },
                        { v: "name", label: "A → Z" },
                      ] as const).map(({ v, label }) => (
                        <button key={v} onClick={() => push("sort", v === "recent" ? undefined : v)}
                          style={{
                            padding: "5px 13px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            border: sort === v ? "1.5px solid #8b5cf6" : "1px solid var(--border2)",
                            background: sort === v ? "rgba(139,92,246,0.15)" : "transparent",
                            color: sort === v ? "#8b5cf6" : "var(--text-muted)", transition: "all 0.1s",
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {activeCount > 0 && (
                  <div style={{ borderTop: "1px solid var(--border)", marginTop: 18, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button type="button" onClick={clearAll} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      Tout réinitialiser
                    </button>
                    <button type="button" onClick={() => setShowPanel(false)} style={{ padding: "7px 18px", borderRadius: 9, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                      Voir les résultats
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Active filter chips — separate row below the button */}
      {(current.sector || activeCanton || (sort !== "recent" && view !== "swipe")) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {current.sector && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: `${SECTOR_COLORS[current.sector] ?? "#8b5cf6"}18`, border: `1px solid ${SECTOR_COLORS[current.sector] ?? "#8b5cf6"}44`, color: SECTOR_COLORS[current.sector] ?? "#8b5cf6" }}>
              {current.sector}
              <button type="button" aria-label="Retirer le secteur" onClick={() => push("sector", undefined)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, display: "flex", opacity: 0.7 }}><X size={11} aria-hidden="true" /></button>
            </span>
          )}
          {activeCanton && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316" }}>
              📍 {activeCanton.name}
              <button type="button" aria-label="Retirer le canton" onClick={() => push("canton", undefined)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, display: "flex", opacity: 0.7 }}><X size={11} aria-hidden="true" /></button>
            </span>
          )}
          {sort !== "recent" && view !== "swipe" && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#8b5cf6" }}>
              ↑ {sort === "score" ? "Score" : sort === "rating" ? "Meilleure note" : sort === "reviews" ? "Plus d'avis" : "A→Z"}
              <button type="button" aria-label="Retirer le tri" onClick={() => push("sort", undefined)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, display: "flex", opacity: 0.7 }}><X size={11} aria-hidden="true" /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
