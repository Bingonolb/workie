import Link from "next/link";
import { statsFiche, ficheGeree, listerOffres } from "@/lib/actions/espaceEntreprise";
import { Completude } from "./Completude";
import { CANTON_NAMES } from "@/lib/types";
import { GraphiqueJours } from "@/components/GraphiqueJours";
import { tServeur, langueDeLaPage } from "@/i18n/page";
import { riche } from "@/i18n/riche";
import { nomCanton } from "@/i18n/cantons";
import type { Traduire } from "@/i18n/traduire";

const PERIODES = [7, 30, 90] as const;
// La langue passe par une variable de requête, jamais par une variable de
// module : celle-ci est partagée entre les requêtes simultanées, et une page
// allemande pouvait sortir avec les dates d'une page française.
type Fmt = { nf: (n: number) => string; jourCourt: (j: string) => string };
const formats = (loc: string): Fmt => ({
  nf: n => Number(n).toLocaleString(loc),
  jourCourt: j => new Date(`${j}T12:00:00`).toLocaleDateString(loc, { day: "numeric", month: "long", timeZone: "Europe/Zurich" }),
});

/** Évolution par rapport à la période précédente de même durée. */
function Evolution({ maintenant, avant, t, nf }: { maintenant: number; avant: number; t: Traduire; nf: Fmt["nf"] }) {
  if (avant === 0) return maintenant > 0 ? <span>{t("espace.premierePeriode")}</span> : null;
  const pct = Math.round(((maintenant - avant) / avant) * 100);
  const couleur = pct > 0 ? "#10b981" : pct < 0 ? "#ef4444" : "var(--text-muted)";
  return <span>{riche(t("espace.evolution", { pct: `${pct > 0 ? "+" : ""}${pct}`, avant: nf(avant) }), { b: x => <strong style={{ color: couleur }}>{x}</strong> })}</span>;
}

function Tuile({ valeur, libelle, detail, couleur }: { valeur: string; libelle: string; detail?: React.ReactNode; couleur?: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 18px", display: "grid", gap: 4, alignContent: "start" }}>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
        {couleur && <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: couleur }} />}{libelle}
      </p>
      <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{valeur}</p>
      {detail && <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.45 }}>{detail}</div>}
    </div>
  );
}

const carte: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 18px" };

export default async function TableauDeBord({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const periode = (PERIODES as readonly number[]).includes(Number(p)) ? (Number(p) as 7 | 30 | 90) : 30;
  const [s, c, offres, t, langue] = await Promise.all([statsFiche(periode), ficheGeree(), listerOffres(), tServeur(), langueDeLaPage()]);
  const { nf, jourCourt } = formats(langue === "de" ? "de-CH" : "fr-CH");
  if (!s) return <p style={{ color: "var(--text-muted)" }}>{t("espace.statsIndispo")}</p>;

  const localisees = s.cantons.reduce((a, x) => a + Number(x.n), 0);
  const totalVisites = localisees + s.non_localisees;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {c && <Completude c={c} offres={offres} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }} role="group" aria-label={t("espace.periode")}>
          {PERIODES.map(d => (
            <Link key={d} href={`/espace-entreprise?p=${d}`} aria-current={d === periode ? "true" : undefined} style={{
              display: "inline-flex", alignItems: "center", minHeight: 40, padding: "0 14px", borderRadius: 999, fontSize: 13, fontWeight: 650, textDecoration: "none",
              border: "1px solid var(--border)",
              background: d === periode ? "var(--encre)" : "var(--surface)",
              color: d === periode ? "var(--encre-texte)" : "var(--text-muted)",
            }}>{t("espace.jours", { n: d })}</Link>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{t("espace.duAu", { du: jourCourt(s.du), au: jourCourt(s.au) })}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))", gap: 12 }}>
        <Tuile couleur="#7c5cff" valeur={nf(s.visites)} libelle={t("espace.tVisites")} detail={<Evolution maintenant={s.visites} avant={s.visites_avant} t={t} nf={nf} />} />
        <Tuile couleur="#10b981" valeur={nf(s.postuler)} libelle={t("espace.tPostuler")} detail={t("espace.tPostulerAide")} />
        <Tuile couleur="#f59e0b" valeur={nf(s.clics_offres)} libelle={t("espace.tSite")} detail={t("espace.tSiteAide")} />
        <Tuile couleur="#ef4444" valeur={nf(s.favoris_total)} libelle={t("espace.tFavoris")} detail={t("espace.tFavorisAide", { n: `${s.favoris_nouveaux > 0 ? "+" : ""}${nf(s.favoris_nouveaux)}` })} />
        <Tuile valeur={t("espace.rang", { n: nf(s.rang_secteur) })} libelle={t("espace.tRang")} detail={t("espace.tRangAide", { n: nf(s.total_secteur) })} />
      </div>

      <section style={carte}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{t("espace.parJour")}</h2>
        <GraphiqueJours jours={s.par_jour} series={[
          { cle: "visites", libelle: t("espace.sVisites"), couleur: "#7c5cff" },
          { cle: "postuler", libelle: t("espace.sPostuler"), couleur: "#10b981" },
          { cle: "site", libelle: t("espace.sSite"), couleur: "#f59e0b" },
          { cle: "favoris", libelle: t("espace.sFavoris"), couleur: "#ef4444" },
        ]} />
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.5 }}>
          {t("espace.uneVisite")}
        </p>
      </section>

      {s.offres.length > 0 && (
        <section style={carte}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{t("espace.vosOffres")}</h2>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>{t("espace.vosOffresAide")}</p>
          <div style={{ display: "grid" }}>
            {s.offres.map((o, i) => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: i ? "1px solid var(--border)" : "none", fontSize: 14 }}>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.titre}</span>
                <strong style={{ fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{nf(o.clics)}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={carte}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{t("espace.provenance")}</h2>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>{t("espace.provenanceAide", { n: nf(totalVisites) })}</p>
        {totalVisites === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{t("espace.pasDeVisites")}</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {[...s.cantons.map(x => ({ nom: nomCanton(x.canton, langue, CANTON_NAMES[x.canton] ?? x.canton), n: Number(x.n), autre: false })), ...(s.non_localisees ? [{ nom: t("espace.nonLocalisees"), n: s.non_localisees, autre: true }] : [])].map(x => {
              const pct = (x.n / totalVisites) * 100;
              return (
                <div key={x.nom} style={{ display: "grid", gridTemplateColumns: "minmax(90px, 140px) 1fr auto", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.nom}</span>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--surface2)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: x.autre ? "var(--border2)" : "#7c5cff", borderRadius: 4 }} />
                  </div>
                  <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    <strong style={{ color: "var(--text)" }}>{nf(x.n)}</strong> · {pct < 1 ? "<1" : Math.round(pct)} %
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
