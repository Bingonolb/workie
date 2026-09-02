import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { NavbarClient } from "@/components/NavbarClient";
import { Footer } from "@/components/Footer";
import { TrendingUp, Users, Briefcase, Lock } from "lucide-react";
import { SECTOR_COLORS } from "@/lib/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Salaires en Suisse par secteur · Workie",
  description: "Salaires réels et anonymes des employés suisses par secteur, poste et type de contrat. Données issues d'avis vérifiés sur Workie.",
  alternates: { canonical: "https://www.workie.ch/salaires" },
  openGraph: {
    title: "Salaires en Suisse par secteur · Workie",
    description: "Salaires bruts anonymes par secteur : Tech, Finance, Pharma et plus. Données réelles d'employés suisses.",
    url: "https://www.workie.ch/salaires",
    siteName: "Workie",
    type: "website",
    locale: "fr_CH",
    images: [{ url: "https://www.workie.ch/og-default.png", width: 1200, height: 630, alt: "Salaires en Suisse · Workie" }],
  },
  twitter: { card: "summary_large_image", title: "Salaires en Suisse · Workie", images: ["https://www.workie.ch/og-default.png"] },
};

type SectorStat = {
  sector: string;
  avg: number;
  median: number;
  p25: number;
  p75: number;
  count: number;
};

// Les postes etaient decrits par leur moyenne quand les secteurs l'etaient par
// leur mediane, sur la meme page et sans que rien ne le signale. Deux mesures
// differentes ne se comparent pas : un lecteur qui lit « Conseil : 135k » puis
// « Technical Lead : 128k » croit lire deux fois la meme chose. La mediane
// s'impose pour des salaires, ou quelques tres hauts revenus tirent la moyenne
// vers le haut sans decrire ce que touche la plupart des gens.
type JobStat = {
  job_title: string;
  median: number;
  p25: number;
  p75: number;
  count: number;
};

type ContractStat = {
  type: string;
  median: number;
  count: number;
  pct: number;
};

function formatSalary(n: number) {
  if (n >= 1000) return `CHF ${Math.round(n / 1000)}k`;
  return `CHF ${Math.round(n)}`;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export default async function SalairesPage() {
  const supabase = createAdminClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("salary_chf, job_title, employment_type, company_id, companies(sector)")
    .gt("salary_chf", 10000)
    .lt("salary_chf", 500000);

  const all = (reviews ?? []) as unknown as Array<{
    salary_chf: number;
    job_title: string;
    employment_type: string;
    company_id: string;
    companies: { sector: string } | null;
  }>;

  const totalCount = all.length;

  // Aggregate by sector
  const sectorMap: Record<string, number[]> = {};
  all.forEach(r => {
    const sector = r.companies?.sector;
    if (!sector) return;
    if (!sectorMap[sector]) sectorMap[sector] = [];
    sectorMap[sector].push(Number(r.salary_chf));
  });

  const sectorStats: SectorStat[] = Object.entries(sectorMap)
    .map(([sector, salaries]) => {
      const sorted = [...salaries].sort((a, b) => a - b);
      return {
        sector,
        avg: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
        median: Math.round(median(sorted)),
        p25: Math.round(percentile(sorted, 25)),
        p75: Math.round(percentile(sorted, 75)),
        count: salaries.length,
      };
    })
    .filter(s => s.count >= 2)
    .sort((a, b) => b.median - a.median);

  // Aggregate by job title
  const jobMap: Record<string, number[]> = {};
  all.forEach(r => {
    const title = r.job_title?.trim();
    if (!title || title.length < 3) return;
    if (!jobMap[title]) jobMap[title] = [];
    jobMap[title].push(Number(r.salary_chf));
  });

  const jobStats: JobStat[] = Object.entries(jobMap)
    .filter(([, s]) => s.length >= 2)
    .map(([job_title, salaries]) => {
      const sorted = [...salaries].sort((a, b) => a - b);
      return {
        job_title,
        median: Math.round(median(sorted)),
        p25: Math.round(percentile(sorted, 25)),
        p75: Math.round(percentile(sorted, 75)),
        count: salaries.length,
      };
    })
    .sort((a, b) => b.median - a.median)
    .slice(0, 20);

  // Employment type breakdown
  const contractMap: Record<string, number[]> = {};
  all.forEach(r => {
    const t = r.employment_type?.trim() || "Non précisé";
    if (!contractMap[t]) contractMap[t] = [];
    contractMap[t].push(Number(r.salary_chf));
  });

  // Derniere section encore en moyenne alors que les secteurs et les postes
  // sont passes en mediane : sur une meme page, deux mesures qui ne se
  // comparent pas.
  const contractStats: ContractStat[] = Object.entries(contractMap)
    .map(([type, salaries]) => ({
      type,
      median: Math.round(median([...salaries].sort((a, b) => a - b))),
      count: salaries.length,
      pct: Math.round((salaries.length / totalCount) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Overall stats
  const allSalaries = all.map(r => Number(r.salary_chf)).sort((a, b) => a - b);
  const overallAvg = allSalaries.length > 0
    ? Math.round(allSalaries.reduce((a, b) => a + b, 0) / allSalaries.length)
    : 0;
  const overallMedian = allSalaries.length > 0 ? Math.round(median(allSalaries)) : 0;
  const overallP25 = allSalaries.length > 0 ? Math.round(percentile(allSalaries, 25)) : 0;
  const overallP75 = allSalaries.length > 0 ? Math.round(percentile(allSalaries, 75)) : 0;

  // JSON-LD: Dataset for salary data + FAQ
  const salairesJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": "Salaires en Suisse par secteur | Workie",
      "description": `Données anonymes sur ${totalCount} salaires déclarés par des employés suisses, agrégés par secteur et type de poste.`,
      "url": "https://www.workie.ch/salaires",
      "creator": { "@type": "Organization", "name": "Workie", "url": "https://www.workie.ch" },
      "keywords": ["salaires suisse", "salaires par secteur", "salaire moyen suisse", "salaire tech suisse", "salaire pharma suisse"],
      "temporalCoverage": "2024/..",
      "spatialCoverage": { "@type": "Place", "name": "Suisse" },
      "variableMeasured": sectorStats.slice(0, 5).map(s => ({
        "@type": "PropertyValue",
        "name": `Salaire médian ${s.sector}`,
        "value": s.median,
        "unitCode": "CHF",
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Quel est le salaire moyen en Suisse ?",
          "acceptedAnswer": { "@type": "Answer", "text": overallAvg > 0 ? `D'après les données anonymes de Workie, le salaire annuel brut moyen en Suisse est de CHF ${overallAvg.toLocaleString("fr-CH")} (médiane : CHF ${overallMedian.toLocaleString("fr-CH")}) sur la base de ${totalCount} déclarations.` : "Les données sont en cours de collecte." }
        },
        ...sectorStats.slice(0, 3).map(s => ({
          "@type": "Question",
          "name": `Quel est le salaire moyen dans le secteur ${s.sector} en Suisse ?`,
          "acceptedAnswer": { "@type": "Answer", "text": `Dans le secteur ${s.sector}, le salaire médian est de CHF ${s.median.toLocaleString("fr-CH")} par an (moyenne : CHF ${s.avg.toLocaleString("fr-CH")}), sur la base de ${s.count} salaires déclarés anonymement sur Workie.` }
        })),
      ],
    },
  ];

  return (
    <div className="page-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(salairesJsonLd).replace(/<\/script>/gi, "<\\/script>") }} />
      <NavbarClient />

      {/* Hero */}
      <section style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)", padding: "52px 24px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 50, padding: "5px 14px", marginBottom: 20, fontSize: 12, fontWeight: 700, color: "#10b981" } as React.CSSProperties}>
            <Lock size={12} strokeWidth={2.4} aria-hidden="true" />
            100% anonyme · données issues d&apos;avis vérifiés
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--text)", marginBottom: 12, lineHeight: 1.1 }}>
            Salaires en Suisse,{" "}
            <span style={{ background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              par les employés.
            </span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 540, lineHeight: 1.7 }}>
            Des chiffres réels partagés anonymement. Situez votre profil avant d'entrer en négociation.
          </p>
        </div>
      </section>

      <main className="page-main-sm">

        {totalCount === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <TrendingUp size={56} aria-hidden="true" style={{ opacity: 0.15, margin: "0 auto 24px", display: "block" }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Données bientôt disponibles</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>
              Les statistiques de salaires apparaîtront dès que suffisamment d&apos;employés auront partagé leur expérience.
            </p>
          </div>
        ) : (
          <>
            {/* Un seul bloc, une seule phrase chiffree.

                Il y avait trois cartes et une barre, soit cinq nombres pour
                dire une chose. « Salaire median CH » et « Salaire moyen CH »
                s'affichaient cote a cote, a six mille francs d'ecart, sans que
                rien n'indique lequel regarder : l'ecart entre les deux est une
                subtilite statistique, pas une information pour qui prepare une
                negociation. La mediane reste, parce que quelques tres hauts
                revenus tirent une moyenne de salaires sans decrire ce que
                touche la plupart des gens. La moyenne continue d'alimenter les
                donnees structurees, ou elle a sa place.

                La mediane etait ensuite repetee sous la barre, et les bornes
                s'annoncaient « P25 » et « P75 » : c'est la notation d'un
                statisticien, elle se dit en francais. La phrase remplace du
                meme coup le libelle en capitales qui tentait de la traduire. */}

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "26px 26px 22px", marginBottom: 28 }}>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>
                Salaire médian en Suisse
              </p>
              <p style={{ fontSize: "clamp(30px, 6vw, 44px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: overallP25 > 0 ? 22 : 12 }}>
                {formatSalary(overallMedian)}
              </p>

              {overallP25 > 0 && (
                <>
                  <div style={{ position: "relative", height: 8, background: "var(--border)", borderRadius: 4, marginBottom: 12 }}>
                    <div style={{
                      position: "absolute",
                      left: `${(overallP25 / (overallP75 * 1.1)) * 100}%`,
                      width: `${((overallP75 - overallP25) / (overallP75 * 1.1)) * 100}%`,
                      maxWidth: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, #8b5cf6, #f97316)",
                      borderRadius: 4,
                    }} />
                  </div>
                  <p style={{ fontSize: 13.5, color: "var(--text-sub)", lineHeight: 1.6 }}>
                    La moitié des salaires déclarés se situent entre{" "}
                    <strong style={{ color: "var(--text)" }}>{formatSalary(overallP25)}</strong> et{" "}
                    <strong style={{ color: "var(--text)" }}>{formatSalary(overallP75)}</strong>.
                  </p>
                </>
              )}

              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                Sur {totalCount} salaire{totalCount > 1 ? "s" : ""} déclaré{totalCount > 1 ? "s" : ""} anonymement, en brut annuel.
              </p>
            </div>

            {/* Salaires par secteur */}
            {sectorStats.length > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "28px", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <TrendingUp size={18} color="#8b5cf6" aria-hidden="true" />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Salaires par secteur</h2>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Médiane du secteur, et la fourchette qui couvre la moitié des salaires.</p>

                <div className="table-scroll"><div className="salaire-liste" style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 380 }}>
                  {sectorStats.map(({ sector, median: med, p25, p75, count }) => {
                    const color = SECTOR_COLORS[sector] ?? "#8b5cf6";
                    // normalize against max p75 for a consistent scale
                    const scale = Math.max(...sectorStats.map(s => s.p75), 1);
                    const p25Pct = (p25 / scale) * 100;
                    const bandPct = ((p75 - p25) / scale) * 100;
                    const medPct = (med / scale) * 100;
                    return (
                      <div key={sector}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span className="salaire-nom" style={{ fontSize: 12, fontWeight: 700, color, width: 155, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sector}</span>
                          {/* Range bar */}
                          <div className="salaire-barre" style={{ flex: 1, height: 10, background: "var(--border)", borderRadius: 5, position: "relative", overflow: "visible" }}>
                            {/* P25–P75 band */}
                            <div style={{ position: "absolute", left: `${p25Pct}%`, width: `${bandPct}%`, height: "100%", background: `${color}33`, borderRadius: 5 }} />
                            {/* Median tick */}
                            <div style={{ position: "absolute", left: `${medPct}%`, transform: "translateX(-50%)", width: 3, height: "100%", background: color, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", width: 76, textAlign: "right", flexShrink: 0 }}>
                            {formatSalary(med)}
                          </span>
                          <span className="salaire-compte" style={{ fontSize: 11, color: "var(--text-muted)", width: 44, textAlign: "right", flexShrink: 0 }}>
                            {count} avis
                          </span>
                        </div>
                        <div className="salaire-fourchette" style={{ paddingLeft: 165, fontSize: 11, color: "var(--text-muted)" }}>
                          {formatSalary(p25)} – {formatSalary(p75)}
                        </div>
                      </div>
                    );
                  })}
                </div></div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  Secteurs avec minimum 2 données · Salaires bruts annuels en CHF · Données anonymes
                </p>
              </div>
            )}

            {/* Top postes */}
            {jobStats.length > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "28px", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Users size={18} color="#f97316" aria-hidden="true" />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Salaires par poste</h2>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Médiane du poste, et la fourchette qui couvre la moitié des salaires.</p>

                <div className="table-scroll"><div className="salaire-liste" style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 380 }}>
                  {jobStats.map(({ job_title, median: med, p25, p75, count }, i) => {
                    const scale = Math.max(...jobStats.map(j => j.p75), 1);
                    const p25Pct = (p25 / scale) * 100;
                    const bandPct = ((p75 - p25) / scale) * 100;
                    const medPct = (med / scale) * 100;
                    return (
                      <div key={job_title} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", width: 18, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>{i + 1}</span>
                        <span className="salaire-nom" style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, width: 190, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job_title}</span>
                        <div className="salaire-barre" style={{ flex: 1, height: 10, background: "var(--border)", borderRadius: 5, position: "relative" }}>
                          <div style={{ position: "absolute", left: `${p25Pct}%`, width: `${bandPct}%`, height: "100%", background: "rgba(249,115,22,0.2)", borderRadius: 5 }} />
                          <div style={{ position: "absolute", left: `${medPct}%`, transform: "translateX(-50%)", width: 3, height: "100%", background: "#f97316", borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", width: 72, textAlign: "right", flexShrink: 0 }}>
                          {formatSalary(med)}
                        </span>
                        {/* « 4x » se lisait comme une multiplication. Les
                            secteurs, juste au-dessus, comptent en « avis ». */}
                        <span className="salaire-compte" style={{ fontSize: 11, color: "var(--text-muted)", width: 44, textAlign: "right", flexShrink: 0 }}>
                          {count} avis
                        </span>
                      </div>
                    );
                  })}
                </div></div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  Postes avec minimum 2 données · Salaires bruts annuels en CHF · Intitulés librement saisis par les employés
                </p>
              </div>
            )}

            {/* Types de contrat */}
            {contractStats.length > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "28px", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <Briefcase size={18} color="#10b981" aria-hidden="true" />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Salaire par type de contrat</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {contractStats.map(({ type, median: med, count, pct }) => (
                    <div key={type} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Le type sort de la base en minuscules : la page affichait « cdi »
                          et « cdd » la ou le reste du site ecrit ces sigles en capitales. */}
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", width: 140, flexShrink: 0 }}>{type.toUpperCase()}</span>
                      <div style={{ flex: 1, height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #10b981, #8b5cf6)", borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", width: 76, textAlign: "right", flexShrink: 0 }}>{formatSalary(med)}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", width: 52, textAlign: "right", flexShrink: 0 }}>{pct}% · {count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(249,115,22,0.04))", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 18, padding: "28px 32px", textAlign: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
                Ces données viennent d&apos;employés en poste.
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.7 }}>
                Partagez votre salaire anonymement et aidez les autres à négocier en connaissance de cause.
              </p>
              <a href="/explore" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                Trouver mon entreprise et laisser un avis
              </a>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
