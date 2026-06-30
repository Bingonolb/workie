"use client";

import Image from "next/image";
import { Info, MapPin, BadgeCheck, FileCheck, Package } from "lucide-react";
import { useState } from "react";
import type { Watch } from "@/lib/types";
import { CONDITION_LABELS } from "@/lib/types";

export function WatchCard({ watch }: { watch: Watch }) {
  const [showInfo, setShowInfo] = useState(false);
  const photo = watch.photos?.[0];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-neutral-900 shadow-2xl">
      {photo ? (
        <Image
          src={photo}
          alt={`${watch.brand} ${watch.model}`}
          fill
          draggable={false}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 420px"
          priority
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-neutral-800 text-neutral-500">
          Pas de photo
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      <button
        onClick={() => setShowInfo((s) => !s)}
        className="absolute bottom-24 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
      >
        <Info size={18} />
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h2 className="text-2xl font-bold">
          {watch.brand} {watch.model}
        </h2>
        <p className="mt-1 text-sm text-white/90">
          {watch.year ? `${watch.year} · ` : ""}
          {CONDITION_LABELS[watch.condition]}
        </p>
        {(watch.city || watch.country) && (
          <p className="mt-1 flex items-center gap-1 text-xs text-white/70">
            <MapPin size={12} />
            {[watch.city, watch.country].filter(Boolean).join(", ")}
          </p>
        )}
        {watch.purchase_price && (
          <p className="mt-2 text-lg font-bold">
            {new Intl.NumberFormat("fr-FR").format(watch.purchase_price)} {watch.currency}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          {watch.has_proof_of_purchase && (
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] backdrop-blur">
              <FileCheck size={11} /> Preuve d&apos;achat
            </span>
          )}
          {watch.has_certificate_authenticity && (
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] backdrop-blur">
              <BadgeCheck size={11} /> Certificat d&apos;authenticité
            </span>
          )}
          {(watch.has_box || watch.has_papers) && (
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] backdrop-blur">
              <Package size={11} />
              {watch.has_box && watch.has_papers ? "Full set" : watch.has_box ? "Boîte" : "Papiers"}
            </span>
          )}
        </div>

        {showInfo && watch.description && (
          <p className="mt-3 rounded-xl bg-black/40 p-3 text-sm text-white/90">
            {watch.description}
          </p>
        )}
      </div>
    </div>
  );
}
