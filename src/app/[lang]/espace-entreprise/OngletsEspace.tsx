"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { useT } from "@/i18n/FournisseurLangue";

const ONGLETS = [
  { href: "/espace-entreprise", label: "espace.ongletBord" },
  { href: "/espace-entreprise/fiche", label: "espace.ongletFiche" },
  { href: "/espace-entreprise/offres", label: "espace.ongletOffres" },
  { href: "/espace-entreprise/abonnement", label: "espace.ongletAbo" },
  { href: "/espace-entreprise/publicites", label: "espace.ongletPub" },
] as const;

export function OngletsEspace({ slug }: { slug: string }) {
  const chemin = usePathname();
  const t = useT();
  const barre = useRef<HTMLElement>(null);
  // Sur téléphone, l'onglet ouvert peut être hors de l'écran : la barre
  // glisse jusqu'à lui, sans faire défiler la page.
  useEffect(() => {
    const nav = barre.current;
    const actif = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && actif) nav.scrollLeft = actif.offsetLeft - (nav.clientWidth - actif.offsetWidth) / 2;
  }, [chemin]);
  return (
    <nav ref={barre} aria-label={t("espace.titre")} className="espace-onglets" style={{ display: "flex", gap: 2, padding: "0 18px", overflowX: "auto", scrollbarWidth: "none" }}>
      {ONGLETS.map(o => {
        const actif = chemin === o.href || (o.href === "/espace-entreprise/publicites" && (chemin ?? "").startsWith(o.href + "/"));
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
