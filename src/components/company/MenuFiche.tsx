"use client";

import { useT, useLangue } from "@/i18n/FournisseurLangue";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoreHorizontal, Flag, Building2 } from "lucide-react";
import { ReportButton } from "@/components/ReportButton";

/**
 * Le menu « ⋯ » d'une fiche : ce qui est rare se range ici plutôt que de
 * s'afficher en permanence.
 *   - Signaler la fiche ;
 *   - « C'est votre entreprise ? » : mène directement au formulaire Workie
 *     Business de cette fiche. Discret : un candidat ne le voit qu'en ouvrant
 *     le menu, et rien n'y suggère qu'on pourrait prendre la main sur une
 *     fiche sans vérification.
 */
export function MenuFiche({ companyId, companyName, slug, gerable, isLoggedIn }: {
  companyId: string; companyName: string; slug: string | null; gerable: boolean; isLoggedIn: boolean;
}) {
  const t = useT();
  const [ouvert, setOuvert] = useState(false);
  // Le menu est posé sur la page entière : le bandeau photo de la fiche coupe
  // tout ce qui en dépasse. Sa position suit le bouton.
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const boutonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const basculer = () => {
    const r = boutonRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    setOuvert(o => !o);
  };
  const [signaler, setSignaler] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => {
      const n = e.target as Node;
      if (!ref.current?.contains(n) && !menuRef.current?.contains(n)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(false); };
    const fermer = () => setOuvert(false);
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", echap);
    window.addEventListener("scroll", fermer, { passive: true });
    window.addEventListener("resize", fermer);
    return () => {
      document.removeEventListener("mousedown", dehors); document.removeEventListener("keydown", echap);
      window.removeEventListener("scroll", fermer); window.removeEventListener("resize", fermer);
    };
  }, [ouvert]);

  const ligne: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px",
    background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text)",
    textDecoration: "none", textAlign: "left", fontFamily: "inherit",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button ref={boutonRef} type="button" className="btn btn-photo" aria-label={t("fiche.plusOptions")} aria-haspopup="menu" aria-expanded={ouvert}
        onClick={basculer} style={{ padding: "8px 10px" }}>
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>
      {ouvert && pos && createPortal(
        <div ref={menuRef} role="menu" style={{
          position: "fixed", right: pos.right, top: pos.top, zIndex: 10050, minWidth: 250,
          background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 14,
          boxShadow: "0 16px 40px rgba(0,0,0,0.18)", overflow: "hidden",
        }}>
          <button type="button" role="menuitem" style={ligne} onClick={() => { setOuvert(false); setSignaler(true); }}>
            <Flag size={15} color="var(--text-muted)" aria-hidden="true" /> {t("fiche.signaler")}
          </button>
          {gerable && slug && (
            <Link role="menuitem" href={`/revendiquer/${slug}`} style={{ ...ligne, borderTop: "1px solid var(--border)" }} onClick={() => setOuvert(false)}>
              <Building2 size={15} color="var(--text-muted)" aria-hidden="true" />
              <span>{t("fiche.votreEntreprise")} <span style={{ color: "var(--text-muted)" }}>{t("fiche.gererFiche")}</span></span>
            </Link>
          )}
        </div>,
        document.body,
      )}
      <ReportButton targetType="company" targetId={companyId} targetLabel={companyName} isLoggedIn={isLoggedIn}
        variant="aucun" ouvert={signaler} onFermer={() => setSignaler(false)} />
    </div>
  );
}
