"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Eye, MousePointerClick, ExternalLink, Flame, Trophy } from "lucide-react";
import { useT, useLangue } from "@/i18n/FournisseurLangue";

type Jour = { jour: string; visites: number; postuler: number; site: number; favoris: number };
type Cle = "visites" | "postuler" | "site" | "favoris";

/**
 * Le cœur du tableau de bord : les chiffres de la période et leur courbe,
 * dans une seule carte.
 *
 * Les chiffres sont aussi les onglets du graphique : on touche « Visites »,
 * la courbe montre les visites. Une seule série à la fois, une seule couleur,
 * pas de légende à déchiffrer. La courbe remplace l'histogramme : sur trente
 * ou quatre-vingt-dix jours, une rangée de barres fines se lisait comme un
 * code-barres.
 */
export function Activite({ jours, periode, totaux, visitesAvant, favorisTotal, rang, totalSecteur, secteur }: {
  jours: Jour[]; periode: number;
  totaux: Record<Cle, number>; visitesAvant: number; favorisTotal: number;
  rang: number; totalSecteur: number; secteur: string;
}) {
  const t = useT();
  const loc = useLangue() === "de" ? "de-CH" : "fr-CH";
  const nf = (n: number) => Number(n).toLocaleString(loc);
  const [cle, setCle] = useState<Cle>("visites");

  const series: { cle: Cle; libelle: string; Icone: typeof Eye; couleur: string; valeur: number; detail?: React.ReactNode }[] = [
    { cle: "visites", libelle: t("espace.sVisites"), Icone: Eye, couleur: "#7c5cff", valeur: totaux.visites, detail: <Evolution maintenant={totaux.visites} avant={visitesAvant} periode={periode} /> },
    { cle: "postuler", libelle: t("espace.sPostuler"), Icone: MousePointerClick, couleur: "#10b981", valeur: totaux.postuler, detail: t("espace.tPostulerAide") },
    { cle: "site", libelle: t("espace.sSite"), Icone: ExternalLink, couleur: "#f59e0b", valeur: totaux.site, detail: t("espace.tSiteAide") },
    { cle: "favoris", libelle: t("espace.sFavoris"), Icone: Flame, couleur: "#f43f5e", valeur: favorisTotal, detail: t("espace.tFavorisAide", { n: `${totaux.favoris > 0 ? "+" : ""}${nf(totaux.favoris)}` }) },
  ];
  const active = series.find(s => s.cle === cle)!;

  return (
    <section className="carte-espace">
      <div className="carte-titre">
        <h2>{t("espace.activite")}</h2>
        <div role="group" aria-label={t("espace.periode")} className="segment">
          {[7, 30, 90].map(d => (
            <Link key={d} href={`/espace-entreprise?p=${d}`} scroll={false} aria-current={d === periode ? "true" : undefined}>{t("espace.jours", { n: d })}</Link>
          ))}
        </div>
      </div>

      <div className="kpis" role="tablist" aria-label={t("graphique.donnee")}>
        {series.map(s => {
          const on = s.cle === cle;
          return (
            <button key={s.cle} type="button" role="tab" aria-selected={on} className="kpi" onClick={() => setCle(s.cle)}
              style={{ boxShadow: on ? `inset 0 -2px 0 ${s.couleur}` : undefined }}>
              <span className="kpi-tete">
                <span className="kpi-pastille" style={{ background: `${s.couleur}1f` }}><s.Icone size={15} color={s.couleur} strokeWidth={2} aria-hidden="true" /></span>
                {s.libelle}
              </span>
              <span className="kpi-valeur">{nf(s.valeur)}</span>
              <span className="kpi-detail">{s.detail}</span>
            </button>
          );
        })}
        <div className="kpi kpi-fixe">
          <span className="kpi-tete">
            <span className="kpi-pastille" style={{ background: "var(--surface2)" }}><Trophy size={15} color="var(--text-muted)" strokeWidth={2} aria-hidden="true" /></span>
            {t("espace.rangCourt")}
          </span>
          <span className="kpi-valeur">{t("espace.rang", { n: nf(rang) })}</span>
          <span className="kpi-detail">{t("espace.rangSur", { n: nf(totalSecteur), secteur })}</span>
        </div>
      </div>

      <div style={{ padding: "18px 22px 20px" }}>
        <Courbe jours={jours} cle={cle} couleur={active.couleur} libelle={active.libelle} />
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>{t("espace.uneVisite")}</p>
      </div>
    </section>
  );
}

function Evolution({ maintenant, avant, periode }: { maintenant: number; avant: number; periode: number }) {
  const t = useT();
  if (avant === 0) return maintenant > 0 ? <span className="badge-evol" data-sens="neutre">{t("espace.nouveau")}</span> : null;
  const pct = Math.round(((maintenant - avant) / avant) * 100);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <span className="badge-evol" data-sens={pct > 0 ? "haut" : pct < 0 ? "bas" : "neutre"}>{pct > 0 ? "+" : ""}{pct} %</span>
      {t("espace.evolAide", { n: periode })}
    </span>
  );
}

/** Graduation ronde au-dessus du maximum : 1, 2, 5, 10, 20, 50… */
function plafond(max: number): number {
  if (max <= 4) return Math.max(2, Math.ceil(max / 2) * 2);
  const p = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= max) return m * p;
  return 10 * p;
}

/**
 * Courbe monotone (Fritsch-Carlson) : elle passe par chaque point sans jamais
 * descendre sous zéro ni inventer un pic entre deux jours.
 */
function trace(pts: [number, number][]): string {
  const n = pts.length;
  if (n < 2) return n ? `M${pts[0][0]},${pts[0][1]}` : "";
  const dx = pts.slice(1).map((p, i) => p[0] - pts[i][0]);
  const pente = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / dx[i]);
  const m = pts.map((_, i) => (i === 0 ? pente[0] : i === n - 1 ? pente[n - 2] : pente[i - 1] * pente[i] <= 0 ? 0 : (pente[i - 1] + pente[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (pente[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / pente[i], b = m[i + 1] / pente[i];
    const h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); m[i] = k * a * pente[i]; m[i + 1] = k * b * pente[i]; }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], h = dx[i] / 3;
    d += `C${x0 + h},${y0 + m[i] * h} ${x1 - h},${y1 - m[i + 1] * h} ${x1},${y1}`;
  }
  return d;
}

function Courbe({ jours, cle, couleur, libelle }: { jours: Jour[]; cle: Cle; couleur: string; libelle: string }) {
  const t = useT();
  const loc = useLangue() === "de" ? "de-CH" : "fr-CH";
  const boite = useRef<HTMLDivElement>(null);
  const [l, setL] = useState(640);
  const [survol, setSurvol] = useState<number | null>(null);
  const H = 190, haut = 12, bas = 26, gauche = 0, droite = 30;

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setL(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const valeurs = jours.map(j => Number(j[cle] ?? 0));
  const max = plafond(Math.max(1, ...valeurs));
  const x = (i: number) => gauche + (jours.length < 2 ? 0 : (i / (jours.length - 1)) * (l - gauche - droite));
  const y = (v: number) => haut + (1 - v / max) * (H - haut - bas);
  const pts = useMemo(() => valeurs.map((v, i) => [x(i), y(v)] as [number, number]), [valeurs.join(","), l, max]); // eslint-disable-line react-hooks/exhaustive-deps
  const ligne = trace(pts);
  const aire = pts.length ? `${ligne}L${pts[pts.length - 1][0]},${y(0)}L${pts[0][0]},${y(0)}Z` : "";
  const dateCourte = (j: string) => new Date(`${j}T12:00:00`).toLocaleDateString(loc, { day: "numeric", month: "short" });
  const dateLongue = (j: string) => new Date(`${j}T12:00:00`).toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" });
  const nf = (n: number) => n.toLocaleString(loc);
  const i = survol ?? jours.length - 1;
  const total = valeurs.reduce((a, b) => a + b, 0);
  const id = `aire-${cle}`;

  if (jours.length === 0) return <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{t("graphique.vide")}</p>;

  const choisir = (clientX: number) => {
    const r = boite.current?.getBoundingClientRect();
    if (!r) return;
    const rel = (clientX - r.left - gauche) / (l - gauche - droite);
    setSurvol(Math.max(0, Math.min(jours.length - 1, Math.round(rel * (jours.length - 1)))));
  };

  return (
    <div>
      {/* Le jour lu : au survol ou au doigt, sinon aujourd'hui. */}
      <p aria-live="polite" style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10, minHeight: 20 }}>
        <strong style={{ color: "var(--text)", fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums", marginRight: 6 }}>{nf(valeurs[i])}</strong>
        {libelle.toLowerCase()} · {survol === null ? t("graphique.aujourdhuiDate", { date: dateLongue(jours[i].jour) }) : dateLongue(jours[i].jour)}
      </p>
      <div ref={boite} style={{ position: "relative", touchAction: "pan-y" }}
        onPointerMove={e => choisir(e.clientX)} onPointerDown={e => choisir(e.clientX)} onPointerLeave={() => setSurvol(null)}>
        <svg width={l} height={H} viewBox={`0 0 ${l} ${H}`} role="img" aria-label={t("graphique.parJour", { serie: libelle, n: nf(total) })} style={{ display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={couleur} stopOpacity="0.22" />
              <stop offset="100%" stopColor={couleur} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map(f => (
            <g key={f}>
              <line x1={0} x2={l - droite} y1={y(max * f)} y2={y(max * f)} stroke="var(--border)" strokeWidth={1} strokeDasharray={f === 0 ? undefined : "2 4"} />
              <text x={l} y={y(max * f) + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)" style={{ fontVariantNumeric: "tabular-nums" }}>{nf(max * f)}</text>
            </g>
          ))}
          <path d={aire} fill={`url(#${id})`} />
          <path d={ligne} fill="none" stroke={couleur} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {survol !== null && <line x1={pts[i][0]} x2={pts[i][0]} y1={haut} y2={y(0)} stroke="var(--text-muted)" strokeOpacity={0.35} strokeWidth={1} />}
          <circle cx={pts[i][0]} cy={pts[i][1]} r={4.5} fill={couleur} stroke="var(--surface)" strokeWidth={2} />
          {[0, Math.floor((jours.length - 1) / 2), jours.length - 1].map((k, n) => (
            <text key={k} x={pts[k][0]} y={H - 6} fontSize={11} fill="var(--text-muted)" textAnchor={n === 0 ? "start" : n === 2 ? "end" : "middle"}>
              {n === 2 ? t("graphique.aujourdhui") : dateCourte(jours[k].jour)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
