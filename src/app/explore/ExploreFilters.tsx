"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, LayoutGrid, Layers, ArrowUpDown, ChevronDown, MapPin } from "lucide-react";
import { useTransition, useState, useEffect, useRef } from "react";
import { SECTOR_COLORS } from "@/lib/types";

export function ExploreFilters({
  sectors,
  cantons,
  current,
  allNames = [],
}: {
  sectors: string[];
  cantons: { code: string; name: string }[];
  current: { sector?: string; canton?: string; q?: string; view?: string; sort?: string };
  allNames?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    current.q ? current.q.split(",").map(s => s.trim()).filter(Boolean) : []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCantonPanel, setShowCantonPanel] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cantonRef = useRef<HTMLDivElement>(null);
  const view = current.view ?? "grid";
  const sort = current.sort ?? "score";
  const activeCanton = cantons.find(c => c.code === current.canton);
  const hasFilters = current.sector || current.canton || tags.length > 0;

  const suggestions = input.length >= 1
    ? allNames.filter(n => n.toLowerCase().includes(input.toLowerCase()) && !tags.includes(n)).slice(0, 7)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (cantonRef.current && !cantonRef.current.contains(e.target as Node)) setShowCantonPanel(false);
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

  const pushQ = (newTags: string[]) => {
    const p = new URLSearchParams(searchParams.toString());
    if (newTags.length > 0) p.set("q", newTags.join(",")); else p.delete("q");
    p.delete("page");
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  const addTag = (name: string) => {
    const next = [...tags, name];
    setTags(next); setInput(""); setShowSuggestions(false); pushQ(next);
  };

  const removeTag = (name: string) => {
    const next = tags.filter(t => t !== name);
    setTags(next); pushQ(next);
  };

  const clearAll = () => {
    setTags([]); setInput(""); setShowCantonPanel(false);
    startTransition(() => router.push(pathname));
  };

  const pill = (active: boolean, color: string, onClick: () => void, children: React.ReactNode) => (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 13px", borderRadius: 50, fontSize: 12, fontWeight: 600,
      flexShrink: 0, whiteSpace: "nowrap", cursor: "pointer",
      border: active ? `1.5px solid ${color}` : "1px solid var(--border2)",
      background: active ? `color-mix(in srgb, ${color} 15%, transparent)` : "var(--surface)",
      color: active ? color : "var(--text-muted)",
      transition: "all 0.12s",
    }}>{children}</button>
  );

  return (
    <div style={{ marginBottom: 20, opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s" }}>
      <style>{`
        .filter-scroll { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; align-items: center; }
        .filter-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Row 1 : search + view toggle ── */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>

        {/* Search */}
        <div ref={wrapperRef} style={{ position: "relative", flex: 1 }}>
          <div
            onClick={() => (wrapperRef.current?.querySelector("input") as HTMLInputElement)?.focus()}
            style={{
              display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5,
              background: "var(--surface)", border: "1px solid var(--border2)",
              borderRadius: showSuggestions && suggestions.length > 0 ? "12px 12px 0 0" : 12,
              padding: "0 12px 0 38px", minHeight: 42, cursor: "text", position: "relative",
            }}
          >
            <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            {tags.map(tag => (
              <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.4)", borderRadius: 20, padding: "2px 9px", fontSize: 12, fontWeight: 600, color: "#a78bfa" }}>
                {tag}
                <button onMouseDown={e => { e.preventDefault(); removeTag(tag); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#a78bfa", padding: 0, display: "flex" }}>
                  <X size={11} />
                </button>
              </span>
            ))}
            <input
              value={input}
              onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
              onKeyDown={e => {
                if (e.key === "Escape") setShowSuggestions(false);
                if (e.key === "Backspace" && input === "" && tags.length > 0) removeTag(tags[tags.length - 1]);
                if (e.key === "Enter" && input.trim()) {
                  const match = allNames.find(n => n.toLowerCase() === input.toLowerCase());
                  if (match) addTag(match);
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={tags.length === 0 ? "Rechercher une entreprise..." : "Ajouter..."}
              style={{ flex: 1, minWidth: 80, background: "transparent", border: "none", fontSize: 14, color: "var(--text)", outline: "none", padding: "11px 0" }}
            />
            {(input || tags.length > 0) && (
              <button onMouseDown={e => { e.preventDefault(); setInput(""); setTags([]); pushQ([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}>
                <X size={15} />
              </button>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border2)", borderTop: "none", borderRadius: "0 0 12px 12px", zIndex: 50, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
              {suggestions.map((name, i) => (
                <button key={name} onMouseDown={() => addTag(name)} style={{ width: "100%", textAlign: "left", padding: "10px 14px 10px 38px", background: "transparent", border: "none", color: "var(--text)", fontSize: 13, cursor: "pointer", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle — icon only, saves space */}
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

        {/* Reset */}
        {hasFilters && (
          <button onClick={clearAll} title="Réinitialiser les filtres" style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer", flexShrink: 0 }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Row 2 : sectors (scroll) + canton (fixed right) + sort (grid only) ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, minWidth: 0 }}>
        {/* Sectors — scrollable, fades out on right */}
        <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden" }}>
          <div className="filter-scroll" style={{ paddingRight: 8 }}>
            {sectors.map(s => {
              const color = SECTOR_COLORS[s] ?? "#8b5cf6";
              const active = current.sector === s;
              return pill(active, color, () => push("sector", active ? undefined : s), s);
            })}
            {/* Sort pills — inline with sectors, grid only */}
            {view !== "swipe" && (
              <>
                <span style={{ width: 1, height: 20, background: "var(--border2)", flexShrink: 0, margin: "0 4px" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}><ArrowUpDown size={11} /></span>
                {([
                  { v: "score", label: "Score" },
                  { v: "rating", label: "Note" },
                  { v: "reviews", label: "Avis" },
                  { v: "name", label: "A→Z" },
                ] as const).map(({ v, label }) =>
                  pill(sort === v, "#8b5cf6", () => push("sort", v === "score" ? undefined : v), label)
                )}
              </>
            )}
          </div>
          {/* Fade edge */}
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 32, background: "linear-gradient(to right, transparent, var(--bg))", pointerEvents: "none" }} />
        </div>

        {/* Canton — fixed right, never scrolls away */}
        <div ref={cantonRef} style={{ position: "relative", flexShrink: 0, marginLeft: 6 }}>
          <button onClick={() => setShowCantonPanel(v => !v)} style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 13px",
            borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            border: activeCanton ? "1.5px solid #f97316" : "1px solid var(--border2)",
            background: activeCanton ? "rgba(249,115,22,0.15)" : "var(--surface)",
            color: activeCanton ? "#f97316" : "var(--text-muted)",
            transition: "all 0.12s",
          }}>
            <MapPin size={12} />
            {activeCanton ? activeCanton.name : "Canton"}
            <ChevronDown size={12} style={{ transform: showCantonPanel ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {showCantonPanel && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "var(--surface)", border: "1px solid var(--border2)",
              borderRadius: 16, padding: 12, zIndex: 60,
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4,
              width: 260,
            }}>
              {cantons.map(c => {
                const active = current.canton === c.code;
                return (
                  <button key={c.code}
                    onClick={() => { push("canton", active ? undefined : c.code); setShowCantonPanel(false); }}
                    style={{
                      padding: "6px 4px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                      border: active ? "1.5px solid #f97316" : "1px solid var(--border)",
                      background: active ? "rgba(249,115,22,0.15)" : "transparent",
                      color: active ? "#f97316" : "var(--text-muted)",
                      cursor: "pointer", textAlign: "center", lineHeight: 1.3, transition: "all 0.1s",
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface2)"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <div style={{ fontSize: 9, opacity: 0.5 }}>{c.code}</div>
                    <div>{c.name}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
