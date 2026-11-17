"use client";

import { useState } from "react";

export type Serie = { cle: string; libelle: string; couleur: string };
type Jour = { jour: string } & Record<string, number | string>;

const nf = (n: number) => n.toLocaleString("fr-CH");
/** « 2026-11-17 » lu comme une date du calendrier suisse, sans décalage horaire. */
const date = (j: string) => new Date(`${j}T12:00:00`);
const court = (j: string) => date(j).toLocaleDateString("fr-CH", { day: "numeric", month: "short" });
const long = (j: string) => date(j).toLocaleDateString("fr-CH", { weekday: "long", day: "numeric", month: "long" });

/**
 * Histogramme par jour, lisible au doigt comme à la souris.
 *
 * - Toute la hauteur de chaque colonne réagit, pas seulement la barre : une
 *   barre à zéro reste touchable.
 * - Le détail du jour choisi s'affiche sous le graphique, avec toutes les
 *   séries, au lieu d'une info-bulle que le doigt cache.
 * - Sans choix, c'est le dernier jour (aujourd'hui) qui est détaillé.
 */
export function GraphiqueJours({ jours, series, hauteur = 160 }: { jours: Jour[]; series: Serie[]; hauteur?: number }) {
  const [serie, setSerie] = useState(series[0].cle);
  const [choisi, setChoisi] = useState<number | null>(null);
  const s = series.find(x => x.cle === serie) ?? series[0];
  const valeurs = jours.map(j => Number(j[s.cle] ?? 0));
  const max = Math.max(1, ...valeurs);
  const total = valeurs.reduce((a, b) => a + b, 0);
  const idx = choisi ?? jours.length - 1;
  const detail = jours[idx];
  const peu = jours.length <= 31;

  if (jours.length === 0) return <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Pas encore de données sur la période.</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {series.length > 1 && (
        <div role="tablist" aria-label="Donnée affichée" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {series.map(x => {
            const actif = x.cle === s.cle;
            const somme = jours.reduce((a, j) => a + Number(j[x.cle] ?? 0), 0);
            return (
              <button key={x.cle} type="button" role="tab" aria-selected={actif} onClick={() => setSerie(x.cle)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7, minHeight: 40, padding: "0 14px", borderRadius: 999, cursor: "pointer",
                  fontSize: 13, fontWeight: 650, border: `1px solid ${actif ? x.couleur : "var(--border)"}`,
                  background: actif ? `color-mix(in srgb, ${x.couleur} 12%, var(--surface))` : "var(--surface)",
                  color: actif ? "var(--text)" : "var(--text-muted)",
                }}>
                <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 3, background: x.couleur }} />
                {x.libelle}
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800 }}>{nf(somme)}</span>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ position: "relative" }}>
        {/* Repères : le maximum en haut, la moitié au milieu. */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[1, 0.5].map(f => (
            <div key={f} style={{ position: "absolute", left: 0, right: 0, top: hauteur * (1 - f), borderTop: "1px dashed var(--border)" }}>
              <span style={{ position: "absolute", right: 0, top: -16, fontSize: 10.5, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{nf(Math.round(max * f))}</span>
            </div>
          ))}
        </div>
        <div role="group" aria-label={`${s.libelle} par jour, ${nf(total)} au total`}
          style={{ display: "flex", alignItems: "stretch", height: hauteur, gap: peu ? 3 : 1, borderBottom: "1px solid var(--border)" }}>
          {jours.map((j, i) => {
            const v = valeurs[i];
            const actif = i === idx;
            return (
              <button key={j.jour} type="button" onClick={() => setChoisi(i)} onMouseEnter={() => setChoisi(i)}
                aria-label={`${long(j.jour)} : ${nf(v)} ${s.libelle.toLowerCase()}`} aria-pressed={actif}
                style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-end", padding: 0, border: "none", background: actif ? "color-mix(in srgb, var(--text) 5%, transparent)" : "transparent", cursor: "pointer", borderRadius: 4 }}>
                <span style={{
                  display: "block", width: "100%", height: v ? Math.max(3, (v / max) * (hauteur - 6)) : 2, borderRadius: "3px 3px 0 0",
                  background: s.couleur, opacity: v ? (actif ? 1 : 0.55) : 0.2, transition: "opacity .12s, height .2s",
                }} />
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>
          <span>{court(jours[0].jour)}</span>
          {jours.length > 10 && <span>{court(jours[Math.floor(jours.length / 2)].jour)}</span>}
          <span>Aujourd&apos;hui</span>
        </div>
      </div>

      {detail && (
        <div aria-live="polite" style={{ background: "var(--surface2)", borderRadius: 12, padding: "12px 14px", display: "grid", gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, textTransform: "capitalize" }}>{idx === jours.length - 1 ? `Aujourd'hui, ${long(detail.jour)}` : long(detail.jour)}</p>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(series.length, 4)}, minmax(0, 1fr))`, gap: 10 }}>
            {series.map(x => (
              <div key={x.cle}>
                <p style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{nf(Number(detail[x.cle] ?? 0))}</p>
                <p style={{ fontSize: 11.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                  <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 2, background: x.couleur, flexShrink: 0 }} />{x.libelle}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      <p style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Touchez ou survolez un jour pour voir son détail.</p>
    </div>
  );
}
