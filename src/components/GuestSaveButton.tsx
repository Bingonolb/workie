"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { GuestModal } from "@/components/GuestModal";

export function GuestSaveButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 20px", borderRadius: 12,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
          backdropFilter: "blur(8px)", minHeight: 44,
        }}
      >
        <Flame size={16} fill="none" /> Sauvegarder
      </button>
      {open && <GuestModal reviewCount={0} open />}
    </>
  );
}
