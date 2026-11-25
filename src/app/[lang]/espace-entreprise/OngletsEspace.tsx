"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { useT } from "@/i18n/FournisseurLangue";

const ONGLETS = [
  { href: "/espace-entreprise", label: "espace.ongletBord" },
  { href: "/espace-entreprise/fiche", label: "espace.ongletFiche" },
  { href: "/espace-entreprise/offres", label: "espace.ongletOffres" },
  { href: "/espace-entreprise/abonnement", label: "espace.ongletAbo" },
  // Les campagnes vivent dans la régie existante, rattachée au même compte.
  { href: "/profile/ads", label: "espace.ongletPub" },
] as const;

export function OngletsEspace({ slug }: { slug: string }) {
  const chemin = usePathname();
  const t = useT();
  return (
    <nav aria-label={t("espace.titre")} style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
      {ONGLETS.map(o => {
        const actif = chemin === o.href;
        return (
          <Link key={o.href} href={o.href} aria-current={actif ? "page" : undefined} style={{
            padding: "10px 14px", fontSize: 14, fontWeight: actif ? 700 : 500, whiteSpace: "nowrap",
            color: actif ? "var(--text)" : "var(--text-muted)", textDecoration: "none",
            borderBottom: `2px solid ${actif ? "var(--text)" : "transparent"}`, marginBottom: -1,
          }}>{t(o.label)}</Link>
        );
      })}
      <Link href={`/entreprise/${slug}`} target="_blank" style={{
        marginLeft: "auto", padding: "10px 4px", fontSize: 13, color: "var(--text-muted)", textDecoration: "none",
        display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
      }}>
        {t("espace.voirFiche")} <ExternalLink size={13} aria-hidden="true" />
      </Link>
    </nav>
  );
}
