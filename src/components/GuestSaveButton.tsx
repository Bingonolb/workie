"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { GuestModal } from "@/components/GuestModal";

export function GuestSaveButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-photo"
      >
        <Flame size={16} fill="none" aria-hidden="true" /> Sauvegarder
      </button>
      {open && <GuestModal open />}
    </>
  );
}
