"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, LayoutGrid, Layers, ArrowUpDown } from "lucide-react";
import { useTransition, useState, useEffect, useRef } from "react";

export function ExploreFilters({
  sectors,
  cities,
  current,
  allNames = [],
}: {
  sectors: string[];
  cities: string[];
  current: { sector?: string; city?: string; q?: string; view?: string; sort?: string };
  allNames?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const [tags, setTags] = useState<string[]>(current.q ? current.q.split(",").map(s => s.trim()).filter(Boolean) : []);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const view = current.view ?? "grid";
  const sort = current.sort ?? "score";

  const suggestions = input.length >= 1
    ? allNames.filter(n =>
        n.toLowerCase().includes(input.toLowerCase()) && !tags.includes(n)
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
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
    startTransition(() => router.push(pathname));
  };

  const hasFilters = current.sector || current.city || tags.length > 0;

  return (
    <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 16, opacity: isPending ? 0.7 : 1, transition: "opacity 0.2s" }}>
      {/* Top row: search + view toggle */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div ref={wrapperRef} style={{ position: "relative", flex: 1, maxWidth: 480 }}>
          {/* Input with tags inside */}
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6,
            background: "var(--surface)", border: "1px solid var(--border2)",
            borderRadius: showSuggestions && suggestions.length > 0 ? "12px 12px 0 0" : 12,
            padding: "8px 12px 8px 42px", minHeight: 46, cursor: "text",
            position: "relative",
          }}
            onClick={() => (wrapperRef.current?.querySelector("input") as HTMLInputElement)?.focus()}
          >
            <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />

            {/* Tags */}
            {tags.map(tag => (
              <span key={tag} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.4)",
                borderRadius: 20, padding: "3px 10px 3px 10px",
                fontSize: 13, fontWeight: 600, color: "#a78bfa",
              }}>
                {tag}
                <button
                  onMouseDown={e => { e.preventDefault(); removeTag(tag); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#a78bfa", padding: 0, display: "flex", alignItems: "center",
                    opacity: 0.7,
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            {/* Input */}
            <input
              value={input}
              onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
              onKeyDown={e => {
                if (e.key === "Escape") setShowSuggestions(false);
                if (e.key === "Backspace" && input === "" && tags.length > 0) {
                  removeTag(tags[tags.length - 1]);
                }
                if (e.key === "Enter" && input.trim()) {
                  const match = allNames.find(n => n.toLowerCase() === input.toLowerCase());
                  if (match) addTag(match);
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={tags.length === 0 ? "Rechercher une entreprise..." : "Ajouter..."}
              style={{
                flex: 1, minWidth: 120, background: "transparent", border: "none",
                fontSize: 14, color: "var(--text)", outline: "none", padding: "2px 0",
              }}
            />
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0,
              background: "var(--surface)", border: "1px solid var(--border2)",
              borderTop: "none", borderRadius: "0 0 12px 12px",
              zIndex: 50, overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}>
              {suggestions.map((name, i) => (
                <button
                  key={name}
                  onMouseDown={() => addTag(name)}
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 16px 10px 42px",
                    background: "transparent", border: "none", color: "var(--text)",
                    fontSize: 14, cursor: "pointer",
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Search size={13} style={{ color: "var(--text-muted)", flexShrink: 0, marginLeft: -26 }} />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, padding: 4, gap: 4, flexShrink: 0 }}>
          {([
            { v: "grid", icon: <LayoutGrid size={16} />, label: "Grille" },
            { v: "swipe", icon: <Layers size={16} />, label: "Swipe" },
          ] as const).map(({ v, icon, label }) => (
            <button
              key={v}
              onClick={() => push("view", v === "grid" ? undefined : v)}
              title={label}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 9, border: "none",
                background: view === v ? "linear-gradient(135deg, #8b5cf6, #f97316)" : "transparent",
                color: view === v ? "#fff" : "var(--text-muted)",
                cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginRight: 4 }}>Secteur :</span>
        {sectors.map(s => (
          <button key={s} onClick={() => push("sector", current.sector === s ? undefined : s)}
            style={{
              padding: "6px 14px", borderRadius: 50, fontSize: 12, fontWeight: 600,
              border: current.sector === s ? "1px solid #8b5cf6" : "1px solid var(--border2)",
              background: current.sector === s ? "rgba(139,92,246,0.15)" : "var(--surface)",
              color: current.sector === s ? "#8b5cf6" : "var(--text-muted)",
              cursor: "pointer",
            }}>
            {s}
          </button>
        ))}

        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginLeft: 8, marginRight: 4 }}>Ville :</span>
        {cities.map(c => (
          <button key={c} onClick={() => push("city", current.city === c ? undefined : c)}
            style={{
              padding: "6px 14px", borderRadius: 50, fontSize: 12, fontWeight: 600,
              border: current.city === c ? "1px solid #f97316" : "1px solid var(--border2)",
              background: current.city === c ? "rgba(249,115,22,0.15)" : "var(--surface)",
              color: current.city === c ? "#f97316" : "var(--text-muted)",
              cursor: "pointer",
            }}>
            {c}
          </button>
        ))}

        {hasFilters && (
          <button onClick={clearAll} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
            borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444",
          }}>
            <X size={12} /> Réinitialiser
          </button>
        )}
      </div>

      {/* Sort row — only in grid view */}
      {view !== "swipe" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>
            <ArrowUpDown size={13} /> Trier par :
          </span>
          {([
            { v: "score", label: "Score" },
            { v: "rating", label: "Note" },
            { v: "reviews", label: "Avis" },
            { v: "name", label: "Nom A→Z" },
          ] as const).map(({ v, label }) => (
            <button key={v} onClick={() => push("sort", v === "score" ? undefined : v)}
              style={{
                padding: "5px 12px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: sort === v ? "1px solid #8b5cf6" : "1px solid var(--border2)",
                background: sort === v ? "rgba(139,92,246,0.15)" : "var(--surface)",
                color: sort === v ? "#8b5cf6" : "var(--text-muted)",
              }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
