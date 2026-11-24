"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useTransition, useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const TELEPHONE = "(max-width: 640px)";
function abonnerTelephone(rappel: () => void) {
  const m = window.matchMedia(TELEPHONE);
  m.addEventListener("change", rappel);
  return () => m.removeEventListener("change", rappel);
}
import { SECTOR_COLORS } from "@/lib/types";
import { useVerrouDefilement } from "@/lib/useVerrouDefilement";
import { useT, useLangue } from "@/i18n/FournisseurLangue";
import { nomSecteur } from "@/i18n/secteurs";
import { nomCanton } from "@/i18n/cantons";

/** Les quatre langues de travail que les fiches peuvent porter. */
const LANGUES = ["FR", "DE", "IT", "EN"] as const;
const CONTRATS = ["CDI", "CDD", "Stage", "Apprentissage", "Temporaire", "Non précisé"] as const;

/** « GE,VD » devient ["GE", "VD"]. */
function liste(valeur: string | undefined): string[] {
  return (valeur ?? "").split(",").map(v => v.trim()).filter(Boolean);
}

export function ExploreFilters({
  sectors,
  cantons,
  current,
  onFilter,
  onClear,
  avant,
  offres = false,
}: {
  sectors: readonly string[];
  cantons: { code: string; name: string }[];
  current: { sector?: string; canton?: string; langue?: string; view?: string; sort?: string; contrat?: string };
  onFilter?: (key: string, value: string | undefined) => void;
  onClear?: () => void;
  /** Posé avant le bouton Filtres, sur la même ligne (le choix Entreprises | Offres). */
  avant?: React.ReactNode;
  /** Vue Offres : rubrique « Contrat », langue de l'annonce, pas de tri. */
  offres?: boolean;
}) {
  const t = useT();
  const langueSite = useLangue();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // Téléphone : feuille plein écran, page figée derrière. Ordinateur : simple
  // menu déroulant, la page reste libre.
  const estMobile = useSyncExternalStore(
    abonnerTelephone,
    () => window.matchMedia(TELEPHONE).matches,
    () => false,
  );
  useVerrouDefilement(showPanel && estMobile);

  const view = current.view ?? "grid";
  const sort = current.sort ?? "recent";

  /*
   * Chaque filtre porte une liste, pas une valeur.
   *
   * Cliquer un canton remplaçait le précédent : chercher « Genève ou Vaud »
   * demandait deux recherches. La règle est maintenant « ou » dans une liste,
   * « et » entre les listes, ce qui élargit la zone sans relâcher le métier.
   */
  const secteursActifs = liste(current.sector);
  const cantonsActifs = liste(current.canton);
  const languesActives = liste(current.langue);
  const contratsActifs = liste(current.contrat);
  const basculer = (cle: string, actuels: string[], valeur: string) => {
    const suite = actuels.includes(valeur) ? actuels.filter(v => v !== valeur) : [...actuels, valeur];
    push(cle, suite.join(",") || undefined);
  };
  const activeCount = secteursActifs.length + cantonsActifs.length + languesActives.length
    + (offres ? contratsActifs.length : (sort !== "recent" && view !== "swipe" ? 1 : 0));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const btn = document.getElementById("filter-btn");
        if (!btn?.contains(e.target as Node)) setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const push = (key: string, value: string | undefined) => {
    if (onFilter) { onFilter(key, value); return; }
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  const clearAll = () => {
    setShowPanel(false);
    if (onClear) { onClear(); return; }
    const p = new URLSearchParams();
    if (view !== "grid") p.set("view", view);
    startTransition(() => router.push(`${pathname}${p.toString() ? `?${p}` : ""}`));
  };

  // Les rubriques du panneau, communes au menu (ordinateur) et à la feuille (téléphone).
  const contenu = (
    <>
            {/* Sectors */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{t("filtres.secteur")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
              {sectors.map(s => {
                const color = SECTOR_COLORS[s] ?? "var(--brand)";
                const active = secteursActifs.includes(s);
                return (
                  <button key={s} onClick={() => basculer("sector", secteursActifs, s)}
                    style={{
                      padding: "5px 13px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: active ? `1.5px solid ${color}` : "1px solid var(--border2)",
                      background: active ? `color-mix(in srgb, ${color} 15%, transparent)` : "transparent",
                      color: active ? color : "var(--text-muted)", transition: "all 0.1s",
                    }}>
                    {nomSecteur(s, langueSite)}
                  </button>
                );
              })}
            </div>
      
            {/* Cantons */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{t("filtres.canton")}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 5, marginBottom: view !== "swipe" ? 18 : 0 }}>
              {cantons.map(c => {
                const active = cantonsActifs.includes(c.code);
                return (
                  <button key={c.code} onClick={() => basculer("canton", cantonsActifs, c.code)}
                    style={{
                      padding: "6px 4px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      border: active ? "1.5px solid #f97316" : "1px solid var(--border)",
                      background: active ? "rgba(249,115,22,0.15)" : "transparent",
                      color: active ? "#f97316" : "var(--text-muted)",
                      textAlign: "center", lineHeight: 1.4, transition: "all 0.1s",
                    }}>
                    {/* « CH » n'est pas un canton : Multi-sites s'affiche seul. */}
                    {c.code !== "CH" && <div style={{ fontSize: 9, opacity: 0.5 }}>{c.code}</div>}
                    {nomCanton(c.code, langueSite, c.name)}
                  </button>
                );
              })}
            </div>
      
            {/* Langue de travail.
                Une offre à Zurich ne sert à rien à qui ne parle pas
                allemand : après le lieu, c'est la première chose qui
                décide si une entreprise est atteignable. */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "18px 0 10px" }}>{offres ? t("filtres.langueAnnonce") : t("filtres.langueTravail")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: view !== "swipe" ? 18 : 0 }}>
              {LANGUES.map(code => {
                const active = languesActives.includes(code);
                return (
                  <button key={code} onClick={() => basculer("langue", languesActives, code)}
                    style={{
                      padding: "5px 13px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: active ? "1.5px solid #3b82f6" : "1px solid var(--border2)",
                      background: active ? "rgba(59,130,246,0.15)" : "transparent",
                      color: active ? "#3b82f6" : "var(--text-muted)", transition: "all 0.1s",
                    }}>
                    {t(`filtres.${code}`)}
                  </button>
                );
              })}
            </div>
      
            {/* Contrat : vue Offres seulement */}
            {offres && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{t("filtres.contrat")}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {/* « Non précisé » : l'employeur n'a pas indiqué le contrat (un tiers des offres). */}
                  {CONTRATS.map(c => {
                    const active = contratsActifs.includes(c);
                    return (
                      <button key={c} onClick={() => basculer("contrat", contratsActifs, c)}
                        style={{
                          padding: "5px 13px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          border: active ? "1.5px solid #8b5cf6" : "1px solid var(--border2)",
                          background: active ? "var(--surface2)" : "transparent",
                          color: active ? "#8b5cf6" : "var(--text-muted)", transition: "all 0.1s",
                        }}>
                        {t(`contrat.${c}`)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Sort — grid only */}
            {view !== "swipe" && !offres && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{t("filtres.trier")}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {([
                    { v: "recent", label: t("filtres.recentes") },
                    { v: "score", label: t("filtres.score") },
                    { v: "name", label: t("filtres.az") },
                  ]).map(({ v, label }) => (
                    <button key={v} onClick={() => push("sort", v === "recent" ? undefined : v)}
                      style={{
                        padding: "5px 13px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        border: sort === v ? "1.5px solid #8b5cf6" : "1px solid var(--border2)",
                        background: sort === v ? "var(--surface2)" : "transparent",
                        color: sort === v ? "#8b5cf6" : "var(--text-muted)", transition: "all 0.1s",
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
    </>
  );

  return (
    <div style={{ marginBottom: 20, opacity: isPending ? 0.65 : 1, transition: "opacity 0.15s" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        {avant}

        {/* Filtres button */}
        <div style={{ position: "relative" }}>
          <button
            id="filter-btn"
            aria-expanded={showPanel}
            aria-controls="filter-panel"
            onClick={() => setShowPanel(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              height: 42, padding: "0 16px", borderRadius: 12,
              border: showPanel || activeCount > 0 ? "1.5px solid #8b5cf6" : "1px solid var(--border2)",
              background: showPanel || activeCount > 0 ? "var(--surface2)" : "var(--surface)",
              color: activeCount > 0 ? "#8b5cf6" : "var(--text-muted)",
              cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
            }}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span>{t("filtres.bouton")}</span>
            {activeCount > 0 && (
              <span style={{ background: "#8b5cf6", color: "#fff", borderRadius: 50, fontSize: 10, fontWeight: 800, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                {activeCount}
              </span>
            )}
          </button>

          {showPanel && !estMobile && (
            <div ref={panelRef} id="filter-panel" className="filter-panel" role="dialog" aria-label={t("filtres.bouton")}>
              {contenu}
              {activeCount > 0 && (
                <div style={{ borderTop: "1px solid var(--border)", marginTop: 18, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button type="button" onClick={clearAll} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    {t("filtres.reinitialiser")}
                  </button>
                  <button type="button" onClick={() => setShowPanel(false)} style={{ padding: "7px 18px", borderRadius: 9, background: "var(--encre)", color: "var(--encre-texte)", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    {t("filtres.voirResultats")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Téléphone : une feuille plein écran posée sur le document, hors de
              la page. Trois étages fixes : en-tête, une seule zone qui défile,
              pied. Plus d'éléments « collants » dans une zone qui défile : c'est
              ce qui faisait accrocher le glissé. */}
          {showPanel && estMobile && createPortal(
            <div className="feuille-filtres" role="dialog" aria-modal="true" aria-label={t("filtres.bouton")}>
              <div className="feuille-entete">
                <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{t("filtres.bouton")}</p>
                <button type="button" onClick={() => setShowPanel(false)} aria-label={t("filtres.fermer")} className="feuille-fermer">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="feuille-corps">{contenu}</div>
              <div className="feuille-pied">
                <button type="button" onClick={clearAll} disabled={activeCount === 0} className="btn btn-fantome" style={{ opacity: activeCount === 0 ? 0.4 : 1 }}>
                  {t("filtres.effacer")}
                </button>
                <button type="button" onClick={() => setShowPanel(false)} className="btn btn-encre" style={{ flex: 1 }}>
                  {t("filtres.voirResultats")}
                </button>
              </div>
            </div>,
            document.body,
          )}
        </div>

      </div>

      {/* Aucune pastille de filtre, ni ici ni dans le swipe.
          Treize secteurs coches faisaient quatre rangees de pastilles : dans le
          swipe elles poussaient la flamme hors de l ecran, et dans la grille
          elles repoussaient les entreprises sous la ligne de flottaison. Ce
          qu on cherche a voir, ce sont les fiches. Le compteur du bouton
          Filtres dit combien sont actifs, le panneau dit lesquels. */}
    </div>
  );
}
