"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { useFicheProche } from "@/lib/useFicheProche";

/**
 * Une entreprise suggérée, en ligne.
 *
 * Composant client, et pas par confort : il porte `useFicheProche`, qui
 * précharge la fiche dès que la ligne approche de l'écran. La page qui
 * l'entoure reste un composant serveur, rendu une fois pour tout le monde.
 */
export function LigneSuggestion({ c }: { c: { id: string; name: string; city: string; cover_url: string | null; cover_color: string | null; is_verified: boolean | null; subsector: string | null } }) {
  const ref = useFicheProche(`/company/${c.id}`);
  return (
    <Link
      ref={ref}
      href={`/company/${c.id}`}
      className="suggestion-ligne"
      style={{
        display: "grid", gridTemplateColumns: "56px 1fr 16px", gap: 14, alignItems: "center",
        padding: "14px 24px", borderTop: "1px solid var(--border)", textDecoration: "none",
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 13, overflow: "hidden", position: "relative",
        background: c.cover_color ?? "var(--surface3)", flexShrink: 0,
      }}>
        <CoverImage src={c.cover_url} color={c.cover_color} sizes="56px" vignette />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: 15.5, fontWeight: 700, color: "var(--text)", marginBottom: 2,
          display: "flex", alignItems: "center", gap: 5,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {c.name}
          {c.is_verified && (
            <svg viewBox="0 0 22 22" style={{ width: 13, height: 13, flexShrink: 0 }} aria-label="Entreprise vérifiée">
              <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
              <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
            </svg>
          )}
        </p>
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {c.subsector ? `${c.subsector} · ` : ""}{c.city}
        </p>
      </div>
      <ChevronRight size={16} color="var(--text-muted)" aria-hidden="true" />
    </Link>
  );
}
