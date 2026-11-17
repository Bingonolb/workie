"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, ArrowRight } from "lucide-react";

/**
 * Arrivée depuis « Trouvez votre entreprise » (?gerer=1) : la personne voit
 * d'abord la fiche, et ce bandeau lui demande si c'est bien la sienne avant
 * de lancer la demande. Lu côté navigateur : la fiche reste une page en cache,
 * identique pour tous.
 */
export function BandeauRevendication({ slug, dejaGeree }: { slug: string; dejaGeree: boolean }) {
  const params = useSearchParams();
  if (params.get("gerer") !== "1") return null;
  return (
    <div role="region" aria-label="Gérer cette fiche" style={{
      maxWidth: 1100, margin: "16px auto 0", padding: "0 16px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 16,
        padding: "14px 18px", boxShadow: "0 10px 30px rgba(0,0,0,0.07)",
      }}>
        <Building2 size={22} color="var(--brand)" aria-hidden="true" style={{ flexShrink: 0 }} />
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          {dejaGeree ? (
            <>
              <p style={{ fontWeight: 750, fontSize: 15 }}>Cette fiche est déjà gérée par l&apos;entreprise.</p>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Pour obtenir un accès, adressez-vous à la personne qui la gère, ou écrivez à contact@workie.ch.</p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 750, fontSize: 15 }}>C&apos;est bien votre entreprise ?</p>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Vérifiez la fiche ci-dessous. Si c&apos;est la bonne, faites la demande pour la gérer.</p>
            </>
          )}
        </div>
        {!dejaGeree && (
          <Link href={`/revendiquer/${slug}`} className="btn btn-marque">
            Oui, gérer cette fiche <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
