"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";

export function SearchButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Rechercher"
        title="Rechercher"
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
