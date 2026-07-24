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
          width: 36, height: 36, borderRadius: 8,
          background: "none", border: "none",
          color: "var(--text-muted)", cursor: "pointer",
        }}
      >
        <Search size={18} aria-hidden="true" />
      </button>
      {open && <GlobalSearch onClose={() => setOpen(false)} />}
    </>
  );
}
