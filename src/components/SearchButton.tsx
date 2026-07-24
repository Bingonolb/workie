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
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Rechercher"
        title="Rechercher (⌘K)"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 40, height: 40, borderRadius: 10,
          background: "var(--surface2)", border: "1px solid var(--border2)",
          color: "var(--text)", cursor: "pointer",
        }}
      >
        <Search size={20} aria-hidden="true" />
      </button>
      {open && <GlobalSearch onClose={() => setOpen(false)} />}
    </>
  );
}
