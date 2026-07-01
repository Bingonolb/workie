"use client";

import { Info, MapPin, BadgeCheck, FileCheck, Package, Expand } from "lucide-react";
import { useState } from "react";
import type { Watch } from "@/lib/types";
import { CONDITION_LABELS } from "@/lib/types";
import { PhotoLightbox } from "@/components/PhotoLightbox";

export function WatchCard({ watch }: { watch: Watch }) {
  const [showInfo, setShowInfo] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const photos = watch.photos ?? [];
  const photo = photos[photoIndex];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-neutral-900 shadow-2xl">
      {photo ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(true);
          }}
          className="absolute inset-0 h-full w-full cursor-zoom-in"
          aria-label="Agrandir la photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={`${watch.brand} ${watch.model}`}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </button>
      ) : (
        <div className="flex h-full items-center justify-center bg-neutral-800 text-neutral-500">
          Pas de photo
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {photos.length > 1 && (
        <div className="absolute left-0 right-0 top-3 flex gap-1.5 px-4">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setPhotoIndex(i);
              }}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i === photoIndex ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      )}

      {photos.length > 1 && (
        <span className="absolute right-4 top-7 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[11px] text-white backdrop-blur">
          <Expand size={10} /> {photoIndex + 1}/{photos.length}
        </span>
      )}

      <button
        onClick={() => setShowInfo((s) => !s)}
        className="absolute bottom-24 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
      >
        <Info size={18} />
      </button>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-6 text-white">
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
          <p className="pointer-events-auto mt-3 rounded-xl bg-black/40 p-3 text-sm text-white/90">
            {watch.description}
          </p>
        )}
      </div>

      {lightboxOpen && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          index={photoIndex}
          alt={`${watch.brand} ${watch.model}`}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setPhotoIndex}
        />
      )}
    </div>
  );
}
