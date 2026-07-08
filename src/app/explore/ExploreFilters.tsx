"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, LayoutGrid, Layers, SlidersHorizontal } from "lucide-react";
import { useTransition, useState, useEffect, useRef } from "react";
import { SECTOR_COLORS } from "@/lib/types";

type Suggestion = { id: string; name: string; city: string; sector: string };

export function ExploreFilters({
  sectors,
  cantons,
  current,
}: {
  sectors: string[];
  cantons: { code: string; name: string }[];
  current: { sector?: string; canton?: string; q?: string; view?: string; sort?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Search state
  const [input, setInput] = useState(current.q ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter panel state
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const view = current.view ?? "grid";
  const sort = current.sort ?? "score";
  const activeCanton = cantons.find(c => c.code === current.canton);
  const activeCount = (current.sector ? 1 : 0) + (current.canton ? 1 : 0) + (sort !== "score" ? 1 : 0);

  // Fetch suggestions from API with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (input.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(input.trim())}`);
        const data = await res.json();
        setSuggestions(data.companies ?? []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 220);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const btn = document.getElementById("filter-btn");
        if (!btn?.contains(e.target as Node)) setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const push = (key: string, value: string | undefined) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  const submitSearch = (q: string) => {
    setShowSuggestions(false);
    const p = new URLSearchParams(searchParams.toString());
    if (q.trim()) p.set("q", q.trim()); else p.delete("q");
    p.delete("page");
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  const clearSearch = () => {
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    const p = new URLSearchParams(searchParams.toString());
    p.delete("q");
    p.delete("page");
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  const clearAll = () => {
    setInput("");
    setSuggestions([]);
    setShowPanel(false);
    startTransition(() => router.push(pathname + (view !== "grid" ? `?view=${view}` : "")));
  };

  return (
    <div style={{ marginBottom: 20, opacity: isPending ? 0.65 : 1, transition: "opacity 0.15s" }}>

      {/* ── Row 1: search + filter button + view toggle ── */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>

        {/* Search */}
        <div ref={searchRef} style={{ position: "relative", flex: 1 }}>
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 1 }} />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") submitSearch(input);
                if (e.key === "Escape") { setShowSuggestions(false); }
              }}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="Rechercher une entreprise..."
              style={{
                width: "100%", background: "var(--surface)", border: "1px solid var(--border2)",
                borderRadius: showSuggestions && suggestions.length > 0 ? "12px 12px 0 0" : 12,
                padding: "0 36px 0 38px", height: 42, fontSize: 14, color: "var(--text)",
                outline: "none", boxSizing: "border-box",
              }}
            />
            {input && (
              <button
                onMouseDown={e => { e.preventDefault(); clearSearch(); }}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0,
              background: "var(--surface)", border: "1px solid var(--border2)",
              borderTop: "none", borderRadius: "0 0 12px 12px",
              zIndex: 600, overflow: "hidden",
              boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            }}>
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  onMouseDown={() => { setInput(s.name); submitSearch(s.name); }}
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 14px 10px 38px",
                    background: "transparent", border: "none", color: "var(--text)",
                    fontSize: 13, cursor: "pointer",
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span>{s.name}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{s.city}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filtres button */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            id="filter-btn"
            onClick={() => setShowPanel(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              height: 42, padding: "0 14px", borderRadius: 12,
              border: showPanel || activeCount > 0 ? "1.5px solid #8b5cf6" : "1px solid var(--border2)",
              background: showPanel || activeCount > 0 ? "rgba(139,92,246,0.12)" : "var(--surface)",
              color: activeCount > 0 ? "#8b5cf6" : "var(--text-muted)",
              cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
            }}
          >
            <SlidersHorizontal size={15} />
            <span>Filtres</span>
            {activeCount > 0 && (
              <span style={{ background: "#8b5cf6", color: "#fff", borderRadius: 50, fontSize: 10, fontWeight: 800, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                {activeCount}
              </span>
            )}
          </button>

          {/* Filter panel */}
          {showPanel && (
            <>
              <div className="filter-panel-overlay" onClick={() => setShowPanel(false)} />
              <div ref={panelRef} className="filter-panel">
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
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface2)"; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
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
                      { v: "score", label: "Score" },
                      { v: "rating", label: "Meilleure note" },
                      { v: "reviews", label: "Plus d'avis" },
                      { v: "name", label: "A → Z" },
                    ] as const).map(({ v, label }) => (
                      <button key={v} onClick={() => push("sort", v === "score" ? undefined : v)}
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

              {/* Footer */}
              {(activeCount > 0) && (
                <div style={{ borderTop: "1px solid var(--border)", marginTop: 18, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button onClick={clearAll} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    Tout réinitialiser
                  </button>
                  <button onClick={() => setShowPanel(false)} style={{ padding: "7px 18px", borderRadius: 9, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    Voir les résultats
                  </button>
                </div>
              )}
            </div>
            </>
          )}
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, padding: 3, gap: 3, flexShrink: 0 }}>
          {([
            { v: "grid", icon: <LayoutGrid size={16} />, label: "Grille" },
            { v: "swipe", icon: <Layers size={16} />, label: "Swipe" },
          ] as const).map(({ v, icon, label }) => (
            <button key={v} onClick={() => push("view", v === "grid" ? undefined : v)} title={label}
              style={{
                width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 9, border: "none",
                background: view === v ? "linear-gradient(135deg, #8b5cf6, #f97316)" : "transparent",
                color: view === v ? "#fff" : "var(--text-muted)",
                cursor: "pointer", transition: "all 0.15s",
              }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter chips */}
      {(current.q || current.sector || activeCanton || (sort !== "score" && view !== "swipe")) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {current.q && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#8b5cf6" }}>
              🔍 {current.q}
              <button onClick={clearSearch} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, display: "flex", opacity: 0.7 }}><X size={11} /></button>
            </span>
          )}
          {current.sector && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: `${SECTOR_COLORS[current.sector] ?? "#8b5cf6"}18`, border: `1px solid ${SECTOR_COLORS[current.sector] ?? "#8b5cf6"}44`, color: SECTOR_COLORS[current.sector] ?? "#8b5cf6" }}>
              {current.sector}
              <button onClick={() => push("sector", undefined)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, display: "flex", opacity: 0.7 }}><X size={11} /></button>
            </span>
          )}
          {activeCanton && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316" }}>
              📍 {activeCanton.name}
              <button onClick={() => push("canton", undefined)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, display: "flex", opacity: 0.7 }}><X size={11} /></button>
            </span>
          )}
          {sort !== "score" && view !== "swipe" && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#8b5cf6" }}>
              ↑ {sort === "rating" ? "Meilleure note" : sort === "reviews" ? "Plus d'avis" : "A→Z"}
              <button onClick={() => push("sort", undefined)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, display: "flex", opacity: 0.7 }}><X size={11} /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
