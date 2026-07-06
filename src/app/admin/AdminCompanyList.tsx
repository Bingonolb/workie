"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Pencil, ExternalLink } from "lucide-react";
import type { Company } from "@/lib/types";

export function AdminCompanyList({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const q = input.trim().toLowerCase();

  const filtered = q
    ? companies.filter(c => c.name.toLowerCase().includes(q))
    : companies;

  const suggestions = q
    ? companies
        .filter(c => c.name.toLowerCase().includes(q))
        .slice(0, 6)
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

  const bySector = filtered.reduce<Record<string, Company[]>>((acc, c) => {
    (acc[c.sector] ??= []).push(c);
    return acc;
  }, {});

  return (
    <>
      {/* Search bar */}
      <div ref={wrapperRef} style={{ position: "relative", maxWidth: 480, marginBottom: 28 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--surface)", border: "1px solid var(--border2)",
          borderRadius: showSuggestions && suggestions.length > 0 ? "12px 12px 0 0" : 12,
          padding: "10px 14px 10px 42px", position: "relative",
        }}
          onClick={() => (wrapperRef.current?.querySelector("input") as HTMLInputElement)?.focus()}
        >
          <Search size={16} style={{ position: "absolute", left: 14, color: "var(--text-muted)" }} />
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={e => {
              if (e.key === "Escape") { setShowSuggestions(false); }
              if (e.key === "Enter" && suggestions.length > 0) {
                setInput(suggestions[0].name);
                setShowSuggestions(false);
              }
            }}
            placeholder="Rechercher une entreprise…"
            style={{
              flex: 1, background: "transparent", border: "none",
              fontSize: 14, color: "var(--text)", outline: "none",
            }}
          />
          {input && (
            <button
              onMouseDown={e => { e.preventDefault(); setInput(""); setShowSuggestions(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}
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
            zIndex: 50, overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}>
            {suggestions.map((c, i) => (
              <button
                key={c.id}
                onMouseDown={() => { setInput(c.name); setShowSuggestions(false); }}
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
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.sector}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result count when filtering */}
      {q && (
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} pour &ldquo;{input}&rdquo;
        </p>
      )}

      {/* Companies by sector */}
      {Object.entries(bySector).sort(([a], [b]) => a.localeCompare(b)).map(([sector, sectorCompanies]) => (
        <div key={sector} style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            {sector} · {sectorCompanies.length}
          </p>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            {sectorCompanies.map((c, i) => (
              <div key={c.id} onClick={() => router.push(`/admin/company/${c.id}`)} style={{
                display: "grid", gridTemplateColumns: "48px 1fr auto auto auto",
                alignItems: "center", gap: 16, padding: "12px 20px",
                borderBottom: i < sectorCompanies.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "pointer", transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {/* Cover thumbnail */}
                <div style={{
                  width: 48, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                  background: "var(--surface2)",
                }}>
                  {c.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>

                {/* Name + city */}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.city}{c.canton ? `, ${c.canton}` : ""} · {c.employee_range} emp.</p>
                </div>

                {/* Rating */}
                <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  ★ {Number(c.avg_rating).toFixed(1)}
                </span>

                {/* Verified badge */}
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                  background: c.is_verified ? "rgba(16,185,129,0.12)" : "var(--surface2)",
                  color: c.is_verified ? "#10b981" : "var(--text-muted)",
                  border: c.is_verified ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--border)",
                  whiteSpace: "nowrap",
                }}>
                  {c.is_verified ? "✓ Vérifié" : "Non vérifié"}
                </span>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
                  <Link href={`/admin/company/${c.id}`} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)",
                    color: "#8b5cf6", textDecoration: "none",
                  }}>
                    <Pencil size={12} /> Modifier
                  </Link>
                  <Link href={`/company/${c.id}`} target="_blank" style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, borderRadius: 8,
                    background: "var(--surface2)", border: "1px solid var(--border)",
                    color: "var(--text-muted)", textDecoration: "none",
                  }}>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: 14 }}>
          Aucune entreprise ne correspond à &ldquo;{input}&rdquo;
        </div>
      )}
    </>
  );
}
