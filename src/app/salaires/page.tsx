import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { TrendingUp, Users } from "lucide-react";
import { SECTOR_COLORS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Salaires en Suisse par secteur · Workie",
  description: "Salaires réels et anonymes des employés suisses par secteur, poste et type de contrat. Données issues d'avis vérifiés sur Workie.",
  alternates: { canonical: "https://workie-biblingo.vercel.app/salaires" },
};

type SectorStat = {
  sector: string;
  avg: number;
  median: number;
  min: number;
  max: number;
  count: number;
};

type JobStat = {
  job_title: string;
  avg: number;
  count: number;
};

function formatSalary(n: number) {
  if (n >= 1000) return `CHF ${Math.round(n / 1000)}k`;
  return `CHF ${Math.round(n)}`;
}

function SalaryBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #8b5cf6, #f97316)", borderRadius: 3 }} />
    </div>
  );
}

export default async function SalairesPage() {
  const supabase = await createClient();

  // Fetch all reviews with salary + company sector
  const { data: reviews } = await supabase
    .from("reviews")
    .select("salary_chf, job_title, employment_type, company_id, companies(sector)")
    .gt("salary_chf", 10000)
    .lt("salary_chf", 500000);

  const all = (reviews ?? []) as Array<{
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
    sectorMap[sector].push(r.salary_chf);
  });

  const sectorStats: SectorStat[] = Object.entries(sectorMap)
    .map(([sector, salaries]) => {
      const sorted = [...salaries].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
      return {
        sector,
        avg: salaries.reduce((a, b) => a + b, 0) / salaries.length,
        median,
        min: sorted[0],
        max: sorted[sorted.length - 1],
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
    jobMap[title].push(r.salary_chf);
  });

  const jobStats: JobStat[] = Object.entries(jobMap)
    .filter(([, salaries]) => salaries.length >= 2)
    .map(([job_title, salaries]) => ({
      job_title,
      avg: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
      count: salaries.length,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 20);

  // Overall stats
  const allSalaries = all.map(r => r.salary_chf).sort((a, b) => a - b);
  const overallAvg = allSalaries.length > 0
    ? Math.round(allSalaries.reduce((a, b) => a + b, 0) / allSalaries.length)
    : 0;
  const mid = Math.floor(allSalaries.length / 2);
  const overallMedian = allSalaries.length > 0
    ? Math.round(allSalaries.length % 2 === 0 ? (allSalaries[mid - 1] + allSalaries[mid]) / 2 : allSalaries[mid])
    : 0;

  const maxSectorMedian = Math.max(...sectorStats.map(s => s.median), 1);
  const maxJobAvg = Math.max(...jobStats.map(j => j.avg), 1);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
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

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "36px 20px 80px" }}>

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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 36 }}>
              {[
                { label: "Salaire médian CH", value: formatSalary(overallMedian), color: "#8b5cf6", icon: "🇨🇭" },
                { label: "Salaire moyen CH", value: formatSalary(overallAvg), color: "#f97316", icon: "📊" },
                { label: "Données anonymes", value: `${totalCount} avis`, color: "#10b981", icon: "🔒" },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 22px", textAlign: "center" }}>
                  <p style={{ fontSize: 24, marginBottom: 6 }}>{icon}</p>
                  <p style={{ fontSize: "clamp(18px, 3vw, 28px)", fontWeight: 900, color, letterSpacing: "-0.03em", marginBottom: 4 }}>{value}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Salaires par secteur */}
            {sectorStats.length > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "28px", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                  <TrendingUp size={18} color="#8b5cf6" />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Salaire médian par secteur</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {sectorStats.map(({ sector, median, min, max, count }) => {
                    const color = SECTOR_COLORS[sector] ?? "#8b5cf6";
                    return (
                      <div key={sector}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color, width: 160, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sector}</span>
                          <SalaryBar value={median} max={maxSectorMedian} />
                          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", width: 80, textAlign: "right", flexShrink: 0 }}>
                            {formatSalary(median)}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", width: 48, textAlign: "right", flexShrink: 0 }}>
                            {count} avis
                          </span>
                        </div>
                        <div style={{ paddingLeft: 172, fontSize: 11, color: "var(--text-muted)" }}>
                          {formatSalary(min)} – {formatSalary(max)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  Secteurs avec minimum 2 données · Salaires bruts annuels en CHF · Données anonymes issues d&apos;avis employés
                </p>
              </div>
            )}

            {/* Top postes */}
            {jobStats.length > 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "28px", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                  <Users size={18} color="#f97316" />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Salaires moyens par poste</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {jobStats.map(({ job_title, avg, count }, i) => (
                    <div key={job_title} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", width: 20, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, width: 200, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job_title}</span>
                      <SalaryBar value={avg} max={maxJobAvg} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", width: 72, textAlign: "right", flexShrink: 0 }}>
                        {formatSalary(avg)}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", width: 40, textAlign: "right", flexShrink: 0 }}>
                        {count}x
                      </span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  Postes avec minimum 2 données · Salaires bruts annuels en CHF · Les intitulés de postes sont saisis librement par les employés
                </p>
              </div>
            )}

            {/* CTA partager */}
            <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(249,115,22,0.04))", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 18, padding: "28px 32px", textAlign: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
                Ces données viennent d&apos;employés comme toi.
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.7 }}>
                Partage ton salaire anonymement et aide les autres à négocier en connaissance de cause.
              </p>
              <a href="/explore" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                Trouver mon entreprise et contribuer
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
