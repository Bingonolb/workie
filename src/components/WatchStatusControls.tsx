"use client";

import { useTransition } from "react";
import { updateWatchStatus, deleteWatch } from "@/lib/actions/watches";
import type { WatchStatus } from "@/lib/types";

export function WatchStatusControls({
  watchId,
  status,
}: {
  watchId: string;
  status: WatchStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex gap-2 text-xs">
      {status !== "paused" && status !== "swapped" && (
        <button
          disabled={isPending}
          onClick={() => startTransition(() => { void updateWatchStatus(watchId, "paused"); })}
          className="rounded-full border border-neutral-300 px-3 py-1.5 font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Mettre en pause
        </button>
      )}
      {status === "paused" && (
        <button
          disabled={isPending}
          onClick={() => startTransition(() => { void updateWatchStatus(watchId, "available"); })}
          className="rounded-full border border-neutral-300 px-3 py-1.5 font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Réactiver
        </button>
      )}
      <button
        disabled={isPending}
        onClick={() => {
          if (confirm("Supprimer cette montre ?")) {
            startTransition(() => { void deleteWatch(watchId); });
          }
        }}
        className="rounded-full border border-red-200 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50"
      >
        Supprimer
      </button>
    </div>
  );
}
