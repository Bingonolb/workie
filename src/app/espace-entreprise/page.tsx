import Link from "next/link";
import { statsFiche } from "@/lib/actions/espaceEntreprise";
import { CANTON_NAMES } from "@/lib/types";

const PERIODES = [7, 30, 90] as const;
const nf = (n: number) => n.toLocaleString("fr-CH");

function Evolution({ maintenant, avant }: { maintenant: number; avant: number }) {
  if (avant === 0) return null;
  const pct = Math.round(((maintenant - avant) / avant) * 100);
  const couleur = pct > 0 ? "#10b981" : pct < 0 ? "#ef4444" : "var(--text-muted)";
  return <span style={{ fontSize: 12.5, fontWeight: 700, color: couleur }}>{pct > 0 ? "+" : ""}{pct} % vs période précédente</span>;
}

function Tuile({ valeur, libelle, detail }: { valeur: string; libelle: string; detail?: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px", display: "grid", gap: 4 }}>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600 }}>{libelle}</p>
      <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{valeur}</p>
      {detail && <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{detail}</div>}
    </div>
  );
}

/** Histogramme des visites par jour : barres pleines, grille discrète, dernier jour souligné. */
function Graphique({ jours }: { jours: { jour: string; visites: number }[] }) {
  const max = Math.max(1, ...jours.map(j => j.visites));
  const L = 720, H = 180, marge = 24;
  const largeur = (L - marge) / Math.max(1, jours.length);
  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${L} ${H + 22}`} width="100%" role="img" aria-label="Visites de la fiche par jour" style={{ minWidth: 480, display: "block" }}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={marge} x2={L} y1={H - H * f + 4} y2={H - H * f + 4} stroke="var(--border)" strokeWidth={1} />
        ))}
        <text x={0} y={12} fontSize={10} fill="var(--text-muted)">{max}</text>
        {jours.map((j, i) => {
          const h = (j.visites / max) * (H - 8);
          const dernier = i === jours.length - 1;
          return (
            <g key={j.jour}>
              <title>{`${new Date(j.jour).toLocaleDateString("fr-CH")} : ${j.visites} visite${j.visites > 1 ? "s" : ""}`}</title>
              <rect x={marge + i * largeur + largeur * 0.15} y={H + 4 - h} width={largeur * 0.7} height={Math.max(h, j.visites ? 2 : 0)} rx={2}
                fill={dernier ? "var(--brand)" : "color-mix(in srgb, var(--brand) 45%, transparent)"} />
            </g>
          );
        })}
        {jours.length > 0 && (
          <>
            <text x={marge} y={H + 20} fontSize={10} fill="var(--text-muted)">{new Date(jours[0].jour).toLocaleDateString("fr-CH", { day: "numeric", month: "short" })}</text>
            <text x={L} y={H + 20} fontSize={10} fill="var(--text-muted)" textAnchor="end">aujourd&apos;hui</text>
          </>
        )}
      </svg>
    </div>
  );
}

export default async function TableauDeBord({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const periode = (PERIODES as readonly number[]).includes(Number(p)) ? (Number(p) as 7 | 30 | 90) : 30;
  const s = await statsFiche(periode);
  if (!s) return <p style={{ color: "var(--text-muted)" }}>Les statistiques ne sont pas disponibles pour le moment.</p>;

  const totalCantons = s.cantons.reduce((a, c) => a + c.n, 0);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", gap: 6 }} role="group" aria-label="Période">
        {PERIODES.map(d => (
          <Link key={d} href={`/espace-entreprise?p=${d}`} style={{
            padding: "6px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: "none",
            border: "1px solid var(--border)",
            background: d === periode ? "var(--encre)" : "var(--surface)",
            color: d === periode ? "var(--encre-texte)" : "var(--text-muted)",
          }}>{d} jours</Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Tuile valeur={nf(s.visites)} libelle="Visites de la fiche" detail={<Evolution maintenant={s.visites} avant={s.visites_avant} />} />
        <Tuile valeur={nf(s.clics_offres)} libelle="Clics vers vos offres d'emploi" detail="Personnes connectées, 1 par personne" />
        <Tuile valeur={nf(s.favoris_total)} libelle="Favoris" detail={`+${nf(s.favoris_nouveaux)} sur la période`} />
        <Tuile valeur={`${nf(s.rang_secteur)}ᵉ`} libelle="Rang dans votre secteur" detail={`sur ${nf(s.total_secteur)} entreprises`} />
      </div>

      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Visites par jour</h2>
        <Graphique jours={s.par_jour} />
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          Une visite = une personne, une fois par jour. Les robots ne sont pas comptés.
        </p>
      </section>

      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>D&apos;où viennent vos visiteurs</h2>
        {s.cantons.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Pas encore assez de visites sur la période.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {s.cantons.map(c => {
              const pct = Math.round((c.n / totalCantons) * 100);
              return (
                <div key={c.canton} style={{ display: "grid", gridTemplateColumns: "140px 1fr 48px", alignItems: "center", gap: 12, fontSize: 13.5 }}>
                  <span>{CANTON_NAMES[c.canton] ?? c.canton}</span>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--surface2)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--brand)", borderRadius: 4 }} />
                  </div>
                  <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{pct} %</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
