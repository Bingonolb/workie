"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useTransition, useState } from "react";

export function ExploreFilters({
  sectors,
  cities,
  current,
}: {
  sectors: string[];
  cities: string[];
  current: { sector?: string; city?: string; q?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(current.q ?? "");

  const push = (key: string, value: string | undefined) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  const clearAll = () => {
    setSearch("");
    startTransition(() => router.push(pathname));
  };

  const hasFilters = current.sector || current.city || current.q;

  return (
    <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Search bar */}
      <div style={{ position: "relative", maxWidth: 480 }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") push("q", search || undefined); }}
          placeholder="Rechercher une entreprise..."
          style={{
            width: "100%", background: "var(--surface)", border: "1px solid var(--border2)",
            borderRadius: 12, padding: "12px 14px 12px 42px", fontSize: 14, color: "var(--text)",
            outline: "none", boxSizing: "border-box",
          }}
        />
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
    </div>
  );
}
