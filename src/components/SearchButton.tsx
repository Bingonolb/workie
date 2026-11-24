"use client";

import { useT } from "@/i18n/FournisseurLangue";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, TrendingUp } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";

const EVENEMENT = "workie:recherche";

/** Ouvre la recherche depuis n'importe quel menu (barre du haut ou du bas). */
export function ouvrirRecherche() {
  window.dispatchEvent(new Event(EVENEMENT));
}

/** Un seul panneau de recherche pour toute la page, ouvert par événement. */
export function RechercheHote() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const ouvrir = () => setOpen(true);
    window.addEventListener(EVENEMENT, ouvrir);
    return () => window.removeEventListener(EVENEMENT, ouvrir);
  }, []);
  return open ? <GlobalSearch onClose={() => setOpen(false)} /> : null;
}

const CARRE: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 40, height: 40, borderRadius: 10,
  border: "1px solid var(--border2)",
  color: "var(--text)", cursor: "pointer",
};

/** Accès au classement, en haut à droite. */
export function ClassementBouton() {
  const t = useT();
  const actif = usePathname().startsWith("/ranking");
  return (
    <Link href="/ranking" aria-label={t("menu.classement")} title={t("menu.classement")}
      aria-current={actif ? "page" : undefined}
      style={{ ...CARRE, background: actif ? "var(--surface3, var(--surface2))" : "var(--surface2)", textDecoration: "none" }}>
      <TrendingUp size={20} strokeWidth={actif ? 2.5 : 2} aria-hidden="true" />
    </Link>
  );
}

export function SearchButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={t("menu.rechercher")} title={t("menu.rechercher")}
        style={{ ...CARRE, background: "var(--surface2)" }}>
        <Search size={20} aria-hidden="true" />
      </button>
      {open && <GlobalSearch onClose={() => setOpen(false)} />}
    </>
  );
}
