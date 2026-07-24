"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";

export function SearchButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Mobile: icon button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Rechercher"
        className="nav-search-icon"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 40, height: 40, borderRadius: 10,
          background: "var(--surface2)", border: "1px solid var(--border2)",
          color: "var(--text)", cursor: "pointer",
        }}
      >
        <Search size={20} aria-hidden="true" />
      </button>

      {/* Desktop: wide search bar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Rechercher"
        className="nav-search-bar"
        style={{
          display: "none",
          alignItems: "center", gap: 8,
          height: 38, padding: "0 14px",
          borderRadius: 10,
          background: "var(--surface2)", border: "1px solid var(--border2)",
          color: "var(--text-muted)", cursor: "pointer",
          width: 220, textAlign: "left",
          fontSize: 13, fontWeight: 500,
        }}
      >
        <Search size={15} style={{ flexShrink: 0, color: "var(--text-muted)" }} aria-hidden="true" />
        <span>Rechercher…</span>
        <kbd style={{
          marginLeft: "auto", fontSize: 10, fontWeight: 700,
          color: "var(--text-muted)", background: "var(--surface3, var(--border))",
          border: "1px solid var(--border2)", borderRadius: 5,
          padding: "2px 5px", letterSpacing: "0.02em",
        }}>⌘K</kbd>
      </button>

      {open && <GlobalSearch onClose={() => setOpen(false)} />}
    </>
  );
}
