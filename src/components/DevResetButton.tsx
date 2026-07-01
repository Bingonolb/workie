"use client";

import { useTransition } from "react";
import { resetAllSwipes } from "@/lib/actions/swipes";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

export function DevResetButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      onClick={() => startTransition(async () => { await resetAllSwipes(); router.refresh(); })}
      disabled={pending}
      title="Reset tous les swipes (mode test)"
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 50,
        display: "flex", alignItems: "center", gap: 6,
        background: "#fff", border: "1px solid #e8e8e8",
        borderRadius: 50, padding: "8px 14px",
        fontSize: 11, fontWeight: 600, color: "#888",
        cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        opacity: pending ? 0.6 : 1,
      }}
    >
      <RotateCcw size={11} />
      {pending ? "Reset…" : "Reset swipes"}
    </button>
  );
}
