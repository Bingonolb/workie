"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";

export function PhotoLightbox({
  photos,
  index,
  alt,
  onClose,
  onIndexChange,
}: {
  photos: string[];
  index: number;
  alt: string;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onClose, onIndexChange]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <X size={22} />
        </button>

        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((index - 1 + photos.length) % photos.length);
              }}
              className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((index + 1) % photos.length);
              }}
              className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative h-[80vh] w-[92vw] max-w-2xl"
        >
          <Image src={photos[index]} alt={alt} fill className="rounded-2xl object-contain" />
        </motion.div>

        {photos.length > 1 && (
          <div className="absolute bottom-6 flex gap-2">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onIndexChange(i);
                }}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-gold" : "w-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
