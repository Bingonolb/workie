import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TrendingUp, Users, Briefcase } from "lucide-react";
import { SECTOR_COLORS } from "@/lib/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Salaires en Suisse par secteur · Workie",
  description: "Salaires réels et anonymes des employés suisses par secteur, poste et type de contrat. Données issues d'avis vérifiés sur Workie.",
  alternates: { canonical: "https://www.workie.ch/salaires" },
  openGraph: {
    title: "Salaires en Suisse par secteur · Workie",
    description: "Salaires bruts anonymes par secteur — Tech, Finance, Pharma et plus. Données réelles d'employés suisses.",
    url: "https://www.workie.ch/salaires",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Salaires en Suisse · Workie" },
};

type SectorStat = {
  sector: string;
  avg: number;
  median: number;
  p25: number;
  p75: number;
  count: number;
};

type JobStat = {
  job_title: string;
  avg: number;
  p25: number;
  p75: number;
  count: number;
};

type ContractStat = {
  type: string;
  avg: number;
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
  const supabase = await createClient();

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
        avg: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
        p25: Math.round(percentile(sorted, 25)),
        p75: Math.round(percentile(sorted, 75)),
        count: salaries.length,
      };
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 20);

  // Employment type breakdown
  const contractMap: Record<string, number[]> = {};
  all.forEach(r => {
    const t = r.employment_type?.trim() || "Non précisé";
    if (!contractMap[t]) contractMap[t] = [];
    contractMap[t].push(Number(r.salary_chf));
  });

  const contractStats: ContractStat[] = Object.entries(contractMap)
    .map(([type, salaries]) => ({
      type,
      avg: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
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

  const maxSectorMedian = Math.max(...sectorStats.map(s => s.median), 1);
  const maxJobAvg = Math.max(...jobStats.map(j => j.avg), 1);

  return (
    <div className="page-root">
      <Navbar />

      {/* Hero */}
      <section style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)", padding: "52px 24px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 50, padding: "5px 14px", marginBottom: 20, fontSize: 12, fontWeight: 700, color: "#10b981" } as React.CSSProperties}>
            🔒 100% anonyme · données issues d&apos;avis vérifiés
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--text)", marginBottom: 12, lineHeight: 1.1 }}>
            Salaires en Suisse,{" "}
            <span style={{ background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              par les employés.
            </span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 540, lineHeight: 1.7 }}>
            Des chiffres réels partagés anonymement. Sache ce que vaut vraiment ton profil avant de négocier.
          </p>
        </div>
      </section>

      <main className="page-main-sm">

        {totalCount === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <TrendingUp size={56} style={{ opacity: 0.15, margin: "0 auto 24px", display: "block" }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Données bientôt disponibles</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>
              Les statistiques de salaires apparaîtront dès que suffisamment d&apos;employés auront partagé leur expérience.
            </p>
          </div>
        ) : (
          <>
            {/* KPIs globaux */}
            <div className="stat-grid-3" style={{ marginBottom: 28 }}>
              {[
                { label: "Salaire médian CH", value: formatSalary(overallMedian), color: "#8b5cf6", icon: "🇨🇭" },
                { label: "Salaire moyen CH", value: formatSalary(overallAvg), color: "#f97316", icon: "📊" },
                { label: "Avis avec salaire", value: `${totalCount}`, color: "#10b981", icon: "🔒" },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 22px", textAlign: "center" }}>
                  <p style={{ fontSize: 24, marginBottom: 6 }}>{icon}</p>
                  <p style={{ fontSize: "clamp(18px, 3vw, 28px)", fontWeight: 900, color, letterSpacing: "-0.03em", marginBottom: 4 }}>{value}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Fourchette nationale P25–P75 */}
            {overallP25 > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Fourchette nationale (50% des salaires)</p>
                <div style={{ position: "relative", height: 8, background: "var(--border)", borderRadius: 4, marginBottom: 10 }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
                  <span>P25 : <strong style={{ color: "var(--text)" }}>{formatSalary(overallP25)}</strong></span>
                  <span>Médiane : <strong style={{ color: "#8b5cf6" }}>{formatSalary(overallMedian)}</strong></span>
                  <span>P75 : <strong style={{ color: "var(--text)" }}>{formatSalary(overallP75)}</strong></span>
                </div>
              </div>
            )}

            {/* Salaires par secteur */}
            {sectorStats.length > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "28px", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <TrendingUp size={18} color="#8b5cf6" />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Salaires par secteur</h2>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Médiane · la barre montre la fourchette P25–P75 (50% des salaires du secteur)</p>

                <div className="table-scroll"><div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 380 }}>
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
                          <span style={{ fontSize: 12, fontWeight: 700, color, width: 155, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sector}</span>
                          {/* Range bar */}
                          <div style={{ flex: 1, height: 10, background: "var(--border)", borderRadius: 5, position: "relative", overflow: "visible" }}>
                            {/* P25–P75 band */}
                            <div style={{ position: "absolute", left: `${p25Pct}%`, width: `${bandPct}%`, height: "100%", background: `${color}33`, borderRadius: 5 }} />
                            {/* Median tick */}
                            <div style={{ position: "absolute", left: `${medPct}%`, transform: "translateX(-50%)", width: 3, height: "100%", background: color, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", width: 76, textAlign: "right", flexShrink: 0 }}>
                            {formatSalary(med)}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", width: 44, textAlign: "right", flexShrink: 0 }}>
                            {count} avis
                          </span>
                        </div>
                        <div style={{ paddingLeft: 165, fontSize: 11, color: "var(--text-muted)" }}>
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
                  <Users size={18} color="#f97316" />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Salaires moyens par poste</h2>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Moyenne · la barre montre la fourchette P25–P75</p>

                <div className="table-scroll"><div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 380 }}>
                  {jobStats.map(({ job_title, avg, p25, p75, count }, i) => {
                    const scale = Math.max(...jobStats.map(j => j.p75), 1);
                    const p25Pct = (p25 / scale) * 100;
                    const bandPct = ((p75 - p25) / scale) * 100;
                    const avgPct = (avg / scale) * 100;
                    return (
                      <div key={job_title} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", width: 18, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>{i + 1}</span>
                        <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, width: 190, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job_title}</span>
                        <div style={{ flex: 1, height: 10, background: "var(--border)", borderRadius: 5, position: "relative" }}>
                          <div style={{ position: "absolute", left: `${p25Pct}%`, width: `${bandPct}%`, height: "100%", background: "rgba(249,115,22,0.2)", borderRadius: 5 }} />
                          <div style={{ position: "absolute", left: `${avgPct}%`, transform: "translateX(-50%)", width: 3, height: "100%", background: "#f97316", borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", width: 72, textAlign: "right", flexShrink: 0 }}>
                          {formatSalary(avg)}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", width: 36, textAlign: "right", flexShrink: 0 }}>
                          {count}x
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
                  <Briefcase size={18} color="#10b981" />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Salaire par type de contrat</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {contractStats.map(({ type, avg, count, pct }) => (
                    <div key={type} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", width: 140, flexShrink: 0 }}>{type}</span>
                      <div style={{ flex: 1, height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #10b981, #8b5cf6)", borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", width: 76, textAlign: "right", flexShrink: 0 }}>{formatSalary(avg)}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", width: 52, textAlign: "right", flexShrink: 0 }}>{pct}% · {count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(249,115,22,0.04))", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 18, padding: "28px 32px", textAlign: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
                Ces données viennent d&apos;employés comme toi.
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.7 }}>
                Partage ton salaire anonymement et aide les autres à négocier en connaissance de cause.
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
