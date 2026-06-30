"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import type { MatchResult } from "@/lib/actions/swipes";

export function MatchModal({
  match,
  onClose,
}: {
  match: MatchResult | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {match && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="w-full max-w-sm rounded-3xl bg-neutral-950 p-8 text-center text-white"
          >
            <h2 className="font-serif text-3xl italic">It&apos;s a Match!</h2>
            <p className="mt-2 text-sm text-white/70">
              Vous aimez tous les deux ces montres.
            </p>

            <div className="mt-8 flex items-center justify-center">
              <div className="h-28 w-28 -mr-4 overflow-hidden rounded-full border-4 border-neutral-950 bg-neutral-800">
                {match.watch_a.photos?.[0] && (
                  <Image
                    src={match.watch_a.photos[0]}
                    alt="watch a"
                    width={112}
                    height={112}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-brand">
                <Heart size={18} fill="white" className="text-white" />
              </div>
              <div className="h-28 w-28 -ml-4 overflow-hidden rounded-full border-4 border-neutral-950 bg-neutral-800">
                {match.watch_b.photos?.[0] && (
                  <Image
                    src={match.watch_b.photos[0]}
                    alt="watch b"
                    width={112}
                    height={112}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>

            <Link
              href={`/messages/${match.id}`}
              className="mt-8 block rounded-full bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark"
            >
              Envoyer un message
            </Link>
            <button
              onClick={onClose}
              className="mt-3 w-full rounded-full border border-white/20 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Continuer à swiper
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
