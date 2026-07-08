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
  const [tags, setTags] = useState<string[]>(current.q ? current.q.split(",").map(s => s.trim()).filter(Boolean) : []);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCantonPanel, setShowCantonPanel] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cantonRef = useRef<HTMLDivElement>(null);
  const view = current.view ?? "grid";
  const sort = current.sort ?? "score";

  const suggestions = input.length >= 1
    ? allNames.filter(n => n.toLowerCase().includes(input.toLowerCase()) && !tags.includes(n)).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (cantonRef.current && !cantonRef.current.contains(e.target as Node)) setShowCantonPanel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pushQ = (newTags: string[]) => {
    const p = new URLSearchParams(searchParams.toString());
    if (newTags.length > 0) p.set("q", newTags.join(","));
    else p.delete("q");
    p.delete("page");
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  const addTag = (name: string) => {
    const newTags = [...tags, name];
    setTags(newTags);
    setInput("");
    setShowSuggestions(false);
    pushQ(newTags);
  };

  const removeTag = (name: string) => {
    const newTags = tags.filter(t => t !== name);
    setTags(newTags);
    pushQ(newTags);
  };

  const push = (key: string, value: string | undefined) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  const clearAll = () => {
    setTags([]);
    setInput("");
    setShowCantonPanel(false);
    startTransition(() => router.push(pathname));
  };

  const hasFilters = current.sector || current.canton || tags.length > 0;
  const activeCanton = cantons.find(c => c.code === current.canton);

  return (
    <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 10, opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s" }}>

      {/* Row 1: search + view toggle */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div ref={wrapperRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5,
            background: "var(--surface)", border: "1px solid var(--border2)",
            borderRadius: showSuggestions && suggestions.length > 0 ? "12px 12px 0 0" : 12,
            padding: "8px 12px 8px 38px", minHeight: 44, cursor: "text", position: "relative",
          }} onClick={() => (wrapperRef.current?.querySelector("input") as HTMLInputElement)?.focus()}>
            <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            {tags.map(tag => (
              <span key={tag} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.4)",
                borderRadius: 20, padding: "2px 9px", fontSize: 12, fontWeight: 600, color: "#a78bfa",
              }}>
                {tag}
                <button onMouseDown={e => { e.preventDefault(); removeTag(tag); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#a78bfa", padding: 0, display: "flex", alignItems: "center" }}>
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
              style={{ flex: 1, minWidth: 100, background: "transparent", border: "none", fontSize: 14, color: "var(--text)", outline: "none", padding: "1px 0" }}
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0,
              background: "var(--surface)", border: "1px solid var(--border2)",
              borderTop: "none", borderRadius: "0 0 12px 12px",
              zIndex: 50, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}>
              {suggestions.map((name, i) => (
                <button key={name} onMouseDown={() => addTag(name)} style={{
                  width: "100%", textAlign: "left", padding: "9px 14px 9px 38px",
                  background: "transparent", border: "none", color: "var(--text)",
                  fontSize: 13, cursor: "pointer",
                  borderTop: i > 0 ? "1px solid var(--border)" : "none",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Search size={12} style={{ color: "var(--text-muted)", position: "absolute", marginLeft: -24, marginTop: 1 }} />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, padding: 4, gap: 4, flexShrink: 0 }}>
          {([
            { v: "grid", icon: <LayoutGrid size={15} />, label: "Grille" },
            { v: "swipe", icon: <Layers size={15} />, label: "Swipe" },
          ] as const).map(({ v, icon, label }) => (
            <button key={v} onClick={() => push("view", v === "grid" ? undefined : v)} title={label}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px", borderRadius: 9, border: "none",
                background: view === v ? "linear-gradient(135deg, #8b5cf6, #f97316)" : "transparent",
                color: view === v ? "#fff" : "var(--text-muted)",
                cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
              }}>
              {icon}
              <span style={{ display: "none" }} className="sm-show">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: sector scroll + canton button */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* Sectors — horizontal scroll, no wrap */}
        <div style={{ flex: 1, minWidth: 0, overflowX: "auto", display: "flex", gap: 6, paddingBottom: 2, scrollbarWidth: "none" }}>
          <style>{`.sector-scroll::-webkit-scrollbar { display: none; }`}</style>
          <div className="sector-scroll" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {sectors.map(s => {
              const color = SECTOR_COLORS[s] ?? "#8b5cf6";
              const active = current.sector === s;
              return (
                <button key={s} onClick={() => push("sector", active ? undefined : s)}
                  style={{
                    padding: "5px 13px", borderRadius: 50, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                    border: active ? `1.5px solid ${color}` : "1px solid var(--border2)",
                    background: active ? `${color}22` : "var(--surface)",
                    color: active ? color : "var(--text-muted)",
                    cursor: "pointer", transition: "all 0.12s", flexShrink: 0,
                  }}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Canton button → dropdown panel */}
        <div ref={cantonRef} style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={() => setShowCantonPanel(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "5px 13px",
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
              borderRadius: 16, padding: 14, zIndex: 60,
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5,
              width: 280,
            }}>
              {cantons.map(c => {
                const active = current.canton === c.code;
                return (
                  <button key={c.code} onClick={() => { push("canton", active ? undefined : c.code); setShowCantonPanel(false); }}
                    style={{
                      padding: "6px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                      border: active ? "1.5px solid #f97316" : "1px solid var(--border)",
                      background: active ? "rgba(249,115,22,0.15)" : "transparent",
                      color: active ? "#f97316" : "var(--text-muted)",
                      cursor: "pointer", textAlign: "center", transition: "all 0.1s",
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface2)"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <div style={{ fontSize: 9, opacity: 0.6, lineHeight: 1 }}>{c.code}</div>
                    <div style={{ lineHeight: 1.3 }}>{c.name}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reset */}
        {hasFilters && (
          <button onClick={clearAll} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
            borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
            border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444",
          }}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Sort row — grid only */}
      {view !== "swipe" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0 }}>
            <ArrowUpDown size={11} /> Trier
          </span>
          {([
            { v: "score", label: "Score" },
            { v: "rating", label: "Note" },
            { v: "reviews", label: "Avis" },
            { v: "name", label: "A→Z" },
          ] as const).map(({ v, label }) => (
            <button key={v} onClick={() => push("sort", v === "score" ? undefined : v)}
              style={{
                padding: "5px 13px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                border: sort === v ? "1.5px solid #8b5cf6" : "1px solid var(--border2)",
                background: sort === v ? "rgba(139,92,246,0.15)" : "var(--surface)",
                color: sort === v ? "#8b5cf6" : "var(--text-muted)",
                transition: "all 0.12s",
              }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
