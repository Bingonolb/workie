"use client";

import { useEffect, useRef, useState } from "react";
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
  const [ouvert, setOuvert] = useState(false);
  const [signaler, setSignaler] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOuvert(false); };
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(false); };
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", echap);
    return () => { document.removeEventListener("mousedown", dehors); document.removeEventListener("keydown", echap); };
  }, [ouvert]);

  const ligne: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px",
    background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text)",
    textDecoration: "none", textAlign: "left", fontFamily: "inherit",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="btn btn-photo" aria-label="Plus d'options" aria-haspopup="menu" aria-expanded={ouvert}
        onClick={() => setOuvert(o => !o)} style={{ padding: "8px 10px" }}>
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>
      {ouvert && (
        <div role="menu" style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50, minWidth: 250,
          background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 14,
          boxShadow: "0 16px 40px rgba(0,0,0,0.18)", overflow: "hidden",
        }}>
          <button type="button" role="menuitem" style={ligne} onClick={() => { setOuvert(false); setSignaler(true); }}>
            <Flag size={15} color="var(--text-muted)" aria-hidden="true" /> Signaler cette fiche
          </button>
          {gerable && slug && (
            <Link role="menuitem" href={`/revendiquer/${slug}`} style={{ ...ligne, borderTop: "1px solid var(--border)" }} onClick={() => setOuvert(false)}>
              <Building2 size={15} color="var(--text-muted)" aria-hidden="true" />
              <span>C&apos;est votre entreprise ? <span style={{ color: "var(--text-muted)" }}>Gérer la fiche</span></span>
            </Link>
          )}
        </div>
      )}
      <ReportButton targetType="company" targetId={companyId} targetLabel={companyName} isLoggedIn={isLoggedIn}
        variant="aucun" ouvert={signaler} onFermer={() => setSignaler(false)} />
    </div>
  );
}
