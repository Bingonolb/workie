"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";

type Suggestion = { id: string; name: string; city: string; sector: string; logo_url?: string | null };

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    // Simple scroll lock — no body position manipulation (causes iOS jump)
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSuggestions(data.companies ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 150);
  }, []);

  useEffect(() => { search(query); }, [query, search]);

  if (!mounted) return null;

  return createPortal(
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 10100,
        background: "var(--bg)",
        display: "flex", flexDirection: "column",
        animation: "gsIn 0.15s ease both",
        overscrollBehavior: "none",
      }}
    >
      <style>{`
        @keyframes gsIn { from { opacity: 0; } to { opacity: 1; } }
        .gs-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          text-decoration: none;
          cursor: pointer;
          transition: background 0.1s;
        }
        .gs-row:active { background: var(--surface2); }
        @media (hover: hover) { .gs-row:hover { background: var(--surface2); } }
        .gs-scroll { overflow-y: auto; flex: 1; overscroll-behavior: contain; }
        .gs-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Top bar — fixed height, never moves */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        background: "var(--bg)",
      }}>
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: "var(--text)", flexShrink: 0 }}
        >
          <ArrowLeft size={21} aria-hidden="true" />
        </button>

        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && suggestions[0]) { onClose(); router.push(`/company/${suggestions[0].id}`); }
              if (e.key === "Escape") onClose();
            }}
            placeholder="Rechercher une entreprise…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="search"
            style={{
              width: "100%", height: 42, borderRadius: 10,
              background: "var(--surface2)", border: "1px solid var(--border2)",
              padding: "0 36px 0 38px", fontSize: 16, color: "var(--text)",
              outline: "none", boxSizing: "border-box",
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setSuggestions([]); inputRef.current?.focus(); }}
              aria-label="Effacer"
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="gs-scroll">
        {loading && (
          <div style={{ padding: "16px 20px", fontSize: 13, color: "var(--text-muted)" }}>Recherche…</div>
        )}

        {!loading && query && suggestions.length === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Aucun résultat</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Aucune entreprise pour « {query} »</p>
          </div>
        )}

        {suggestions.map(s => (
          <Link
            key={s.id}
            href={`/company/${s.id}`}
            prefetch={false}
            onClick={onClose}
            className="gs-row"
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.name}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.city} · {s.sector}</p>
            </div>
            <Search size={13} color="var(--text-muted)" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.35 }} />
          </Link>
        ))}

        {!query && (
          <div style={{ padding: "52px 20px", textAlign: "center" }}>
            <Search size={28} color="var(--text-muted)" aria-hidden="true" style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Trouver une entreprise</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Tape un nom, une ville ou un secteur</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
