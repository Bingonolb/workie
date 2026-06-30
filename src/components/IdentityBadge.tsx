"use client";

import { useTransition } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { startIdentityVerification } from "@/lib/actions/identity";

export function IdentityBadge({ verified }: { verified: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (verified) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
        <ShieldCheck size={18} /> Identité vérifiée
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
      <span className="flex items-center gap-2">
        <ShieldAlert size={18} /> Identité non vérifiée
      </span>
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await startIdentityVerification();
            if (res.url) window.location.href = res.url;
          })
        }
        className="rounded-full bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        Vérifier maintenant
      </button>
    </div>
  );
}
