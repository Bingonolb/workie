"use client";

import { useState, useTransition } from "react";
import { Flame } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";

export function SaveButton({ companyId, initialFav }: { companyId: string; initialFav: boolean }) {
  const [fav, setFav] = useState(initialFav);
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    const prev = fav;
    setFav(f => !f);
    startTransition(async () => {
      try { await toggleFavorite(companyId); }
      catch { setFav(prev); }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 20px", borderRadius: 12,
        background: fav ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.1)",
        border: fav ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.15)",
        color: fav ? "#f97316" : "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", minHeight: 44,
        transition: "all 0.18s",
      }}
    >
      <Flame size={16} fill={fav ? "#f97316" : "none"} /> {fav ? "Sauvegardé" : "Sauvegarder"}
    </button>
  );
}
