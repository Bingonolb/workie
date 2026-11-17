"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";

const ONGLETS = [
  { href: "/espace-entreprise", label: "Tableau de bord" },
  { href: "/espace-entreprise/fiche", label: "Ma fiche" },
  { href: "/espace-entreprise/offres", label: "Offres d'emploi" },
  { href: "/espace-entreprise/abonnement", label: "Abonnement" },
  // Les campagnes vivent dans la régie existante, rattachée au même compte.
  { href: "/profile/ads", label: "Publicités" },
];

export function OngletsEspace({ slug }: { slug: string }) {
  const chemin = usePathname();
  return (
    <nav aria-label="Espace entreprise" style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
      {ONGLETS.map(o => {
        const actif = chemin === o.href;
        return (
          <Link key={o.href} href={o.href} aria-current={actif ? "page" : undefined} style={{
            padding: "10px 14px", fontSize: 14, fontWeight: actif ? 700 : 500, whiteSpace: "nowrap",
            color: actif ? "var(--text)" : "var(--text-muted)", textDecoration: "none",
            borderBottom: `2px solid ${actif ? "var(--text)" : "transparent"}`, marginBottom: -1,
          }}>{o.label}</Link>
        );
      })}
      <Link href={`/entreprise/${slug}`} target="_blank" style={{
        marginLeft: "auto", padding: "10px 4px", fontSize: 13, color: "var(--text-muted)", textDecoration: "none",
        display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
      }}>
        Voir la fiche publique <ExternalLink size={13} aria-hidden="true" />
      </Link>
    </nav>
  );
}
