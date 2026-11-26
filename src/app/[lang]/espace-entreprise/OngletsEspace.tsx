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
    <nav aria-label={t("espace.titre")} className="espace-onglets" style={{ display: "flex", gap: 2, padding: "0 18px", overflowX: "auto", scrollbarWidth: "none" }}>
      {ONGLETS.map(o => {
        const actif = chemin === o.href;
        return (
          <Link key={o.href} href={o.href} aria-current={actif ? "page" : undefined} style={{
            display: "inline-flex", alignItems: "center", minHeight: 50, padding: "0 14px", fontSize: 14, fontWeight: actif ? 700 : 550, whiteSpace: "nowrap",
            color: actif ? "var(--text)" : "var(--text-muted)", textDecoration: "none",
            boxShadow: actif ? "inset 0 -2px 0 var(--brand)" : "none",
          }}>{t(o.label)}</Link>
        );
      })}
      <Link href={`/entreprise/${slug}`} target="_blank" style={{
        marginLeft: "auto", minHeight: 50, padding: "0 4px 0 14px", fontSize: 13, color: "var(--text-muted)", textDecoration: "none",
        display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
      }}>
        {t("espace.voirFiche")} <ExternalLink size={13} aria-hidden="true" />
      </Link>
    </nav>
  );
}
