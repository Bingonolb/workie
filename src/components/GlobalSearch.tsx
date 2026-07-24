"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";

type Suggestion = { id: string; name: string; city: string; sector: string };

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount immediately (synchronous — no visible blank frame)
  useLayoutEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    // iOS-safe scroll lock: freeze body in place
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
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

  const go = (id: string) => { onClose(); router.push(`/company/${id}`); };

  if (!mounted) return null;

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10100,
        background: "var(--bg)",
        display: "flex", flexDirection: "column",
        animation: "searchSlideIn 0.18s cubic-bezier(0.32,0.72,0,1) both",
        touchAction: "none",
      }}
    >
      <style>{`
        @keyframes searchSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .search-result-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          text-decoration: none;
          transition: background 0.1s;
        }
        .search-result-row:hover, .search-result-row:focus-visible {
          background: var(--surface2);
        }
        .search-result-row:active { background: var(--surface3); }
      `}</style>

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderBottom: "1px solid var(--border)",
        flexShrink: 0, background: "var(--bg)",
      }}>
        <button
          onClick={onClose}
          aria-label="Fermer la recherche"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: "var(--text)", flexShrink: 0 }}
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>

        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && suggestions[0]) go(suggestions[0].id);
              if (e.key === "Escape") onClose();
            }}
            placeholder="Rechercher une entreprise…"
            autoComplete="off"
            spellCheck={false}
            style={{
              width: "100%", height: 44, borderRadius: 12,
              background: "var(--surface2)", border: "1px solid var(--border2)",
              padding: "0 38px 0 40px", fontSize: 16, color: "var(--text)",
              outline: "none", boxSizing: "border-box",
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setSuggestions([]); inputRef.current?.focus(); }}
              aria-label="Effacer"
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "none", touchAction: "pan-y" }}>
        {loading && query && (
          <div style={{ padding: "20px", fontSize: 13, color: "var(--text-muted)" }}>Recherche…</div>
        )}

        {!loading && query && suggestions.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Aucun résultat</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Aucune entreprise pour « {query} »</p>
          </div>
        )}

        {suggestions.map(s => (
          <Link key={s.id} href={`/company/${s.id}`} onClick={onClose} className="search-result-row">
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg, #8b5cf6, #f97316)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 900, color: "#fff",
            }}>
              {s.name[0]}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.city} · {s.sector}</p>
            </div>
            <Search size={14} color="var(--text-muted)" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.4 }} />
          </Link>
        ))}

        {!query && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Search size={22} color="var(--text-muted)" aria-hidden="true" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Trouver une entreprise</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>Tape un nom, une ville ou un secteur</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
