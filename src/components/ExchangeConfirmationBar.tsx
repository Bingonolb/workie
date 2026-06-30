"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import { startIdentityVerification } from "@/lib/actions/identity";
import { confirmExchange } from "@/lib/actions/matches";

export function ExchangeConfirmationBar({
  matchId,
  status,
  myConfirmed,
  otherConfirmed,
  identityVerified,
}: {
  matchId: string;
  status: "active" | "completed" | "cancelled";
  myConfirmed: boolean;
  otherConfirmed: boolean;
  identityVerified: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === "completed") {
    return (
      <div className="flex items-center justify-center gap-2 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 size={16} /> Échange finalisé des deux côtés. Félicitations !
      </div>
    );
  }

  const handleVerify = () => {
    setError(null);
    startTransition(async () => {
      const res = await startIdentityVerification();
      if (res.error) setError(res.error);
      else if (res.url) window.location.href = res.url;
    });
  };

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await confirmExchange(matchId);
      if (res.error) setError(res.error);
    });
  };

  return (
    <div className="border-b border-neutral-200 bg-white px-4 py-2.5">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          {myConfirmed ? (
            <>
              <Clock size={16} className="text-amber-500" />
              En attente de la confirmation de l&apos;autre personne
            </>
          ) : otherConfirmed ? (
            <>
              <Clock size={16} className="text-amber-500" />
              L&apos;autre personne a confirmé, à toi de jouer
            </>
          ) : (
            "Quand vous êtes prêts tous les deux, confirmez l'échange"
          )}
        </div>

        {!myConfirmed && (
          identityVerified ? (
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              Confirmer l&apos;échange
            </button>
          ) : (
            <button
              onClick={handleVerify}
              disabled={isPending}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
            >
              <ShieldCheck size={14} /> Vérifier mon identité
            </button>
          )
        )}
      </div>
      {error && <p className="mx-auto mt-2 max-w-2xl text-xs text-brand-dark">{error}</p>}
    </div>
  );
}
