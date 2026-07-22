import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/Navbar";

export const revalidate = 60; // ISR: rebuild every 60s, or on revalidatePath("/jobs")
import { MapPin, Briefcase, ArrowRight, BadgeCheck } from "lucide-react";
import { SECTOR_COLORS } from "@/lib/types";
import { JobApplyButton } from "@/components/JobApplyButton";

export const metadata: Metadata = {
  title: "Offres d'emploi en Suisse · Workie",
  description: "Toutes les offres d'emploi des entreprises vérifiées sur Workie. Salaires, culture, avis — choisissez en connaissance de cause.",
  alternates: { canonical: "https://www.workie.ch/jobs" },
  openGraph: {
    title: "Offres d'emploi en Suisse · Workie",
    description: "Les jobs des meilleurs employeurs suisses — avec avis anonymes et salaires réels.",
    url: "https://www.workie.ch/jobs",
    siteName: "Workie",
    type: "website",
    locale: "fr_CH",
    images: [{ url: "https://www.workie.ch/og-default.png", width: 1200, height: 630, alt: "Offres d'emploi en Suisse · Workie" }],
  },
  twitter: { card: "summary_large_image", title: "Jobs en Suisse · Workie", images: ["https://www.workie.ch/og-default.png"] },
};

const CONTRACT_COLORS: Record<string, { bg: string; color: string }> = {
  CDI:        { bg: "rgba(16,185,129,0.1)",  color: "#10b981" },
  CDD:        { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b" },
  Stage:      { bg: "rgba(139,92,246,0.1)",  color: "#8b5cf6" },
  Alternance: { bg: "rgba(249,115,22,0.1)",  color: "#f97316" },
  Freelance:  { bg: "rgba(6,182,212,0.1)",   color: "#06b6d4" },
};

type Job = {
  id: string;
  title: string;
  location: string | null;
  contract_type: string | null;
  work_mode: string | null;
  experience_level: string | null;
  salary_range: string | null;
  description: string | null;
  apply_url: string | null;
  created_at: string;
  companies: {
    id: string;
    name: string;
    city: string;
    sector: string;
    logo_url: string | null;
    is_verified: boolean;
    avg_rating: number;
    review_count: number;
  } | null;
};

function timeAgo(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days}j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ sector?: string; contract?: string }> }) {
  const { sector: filterSector, contract: filterContract } = await searchParams;
  const supabase = createAdminClient();
  const { data: jobs } = await Promise.resolve(
    supabase.from("job_offers")
      .select("id, title, location, contract_type, work_mode, experience_level, salary_range, description, apply_url, created_at, companies(id, name, city, sector, logo_url, is_verified, avg_rating, review_count)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
  ).catch(() => ({ data: null }));

  const allJobs = (jobs ?? []) as unknown as Job[];

  // Group unique sectors and contract types from jobs
  const sectors = [...new Set(allJobs.map(j => j.companies?.sector).filter(Boolean))] as string[];
  const contracts = [...new Set(allJobs.map(j => j.contract_type).filter(Boolean))] as string[];

  // Apply filters
  const filteredJobs = allJobs.filter(j => {
    if (filterSector && j.companies?.sector !== filterSector) return false;
    if (filterContract && j.contract_type !== filterContract) return false;
    return true;
  });

  // Google Jobs rich snippet — JobPosting schema for each active job
  const jobsJsonLd = filteredJobs.slice(0, 20).map(job => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "datePosted": job.created_at?.slice(0, 10),
    "validThrough": new Date(new Date(job.created_at).getTime() + 90 * 86400000).toISOString().slice(0, 10),
    "description": job.description ?? `${job.title} chez ${job.companies?.name ?? "une entreprise suisse"}`,
    "employmentType": job.contract_type === "CDI" ? "FULL_TIME" : job.contract_type === "CDD" ? "CONTRACTOR" : job.contract_type === "Stage" ? "INTERN" : "OTHER",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.companies?.name ?? "Entreprise Workie",
      "sameAs": `https://www.workie.ch/company/${job.companies?.id ?? ""}`,
    },
    "jobLocation": {
      "@type": "Place",
      "address": { "@type": "PostalAddress", "addressLocality": job.location ?? job.companies?.city ?? "Suisse", "addressCountry": "CH" },
    },
    ...(job.work_mode === "remote" || job.work_mode === "Remote" || job.work_mode === "télétravail" ? { "jobLocationType": "TELECOMMUTE" } : {}),
    ...(job.salary_range ? { "baseSalary": { "@type": "MonetaryAmount", "currency": "CHF", "value": { "@type": "QuantitativeValue", "value": job.salary_range, "unitText": "YEAR" } } } : {}),
    "directApply": !!job.apply_url,
    "url": job.apply_url ?? `https://www.workie.ch/jobs`,
  }));

  return (
    <div className="page-root">
      {jobsJsonLd.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobsJsonLd).replace(/<\/script>/gi, "<\\/script>") }} />
      )}
      <Navbar />

      {/* Hero */}
      <section style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)", padding: "52px 24px 40px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 50, padding: "5px 14px", marginBottom: 20, fontSize: 12, fontWeight: 700, color: "#8b5cf6" } as React.CSSProperties}>
            <BadgeCheck size={13} /> Entreprises vérifiées uniquement
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--text)", marginBottom: 12, lineHeight: 1.1 }}>
            Offres d&apos;emploi<br />
            <span style={{ background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              en connaissance de cause.
            </span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 520, lineHeight: 1.7, marginBottom: 0 }}>
            Toutes les offres viennent d&apos;entreprises qui ont revendiqué leur fiche Workie. Consultez leurs avis, leur culture et leurs salaires avant de postuler.
          </p>
        </div>
      </section>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "36px 20px calc(72px + env(safe-area-inset-bottom))" }}>

        {/* Stats + filters */}
        {allJobs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
                <strong style={{ color: "var(--text)" }}>{filteredJobs.length}</strong>
                {filteredJobs.length !== allJobs.length ? ` / ${allJobs.length}` : ""} offre{allJobs.length > 1 ? "s" : ""}
              </span>
              {(filterSector || filterContract) && (
                <Link href="/jobs" style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 50, background: "rgba(239,68,68,0.1)", color: "#ef4444", textDecoration: "none" }}>
                  ✕ Effacer les filtres
                </Link>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {contracts.map(c => {
                const style = CONTRACT_COLORS[c] ?? { bg: "var(--surface2)", color: "var(--text-muted)" };
                const active = filterContract === c;
                const params = new URLSearchParams();
                if (!active) params.set("contract", c);
                if (filterSector) params.set("sector", filterSector);
                return (
                  <Link key={c} href={`/jobs?${params}`} style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 50, background: active ? style.color : style.bg, color: active ? "#fff" : style.color, textDecoration: "none", border: `1px solid ${style.color}44` }}>
                    {c}
                  </Link>
                );
              })}
              {sectors.map(s => {
                const active = filterSector === s;
                const params = new URLSearchParams();
                if (!active) params.set("sector", s);
                if (filterContract) params.set("contract", filterContract);
                return (
                  <Link key={s} href={`/jobs?${params}`} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 50, background: active ? "var(--text)" : "var(--surface2)", color: active ? "var(--bg)" : "var(--text-muted)", textDecoration: "none", border: "1px solid var(--border2)" }}>
                    {s}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Job list */}
        {allJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <Briefcase size={56} style={{ opacity: 0.15, margin: "0 auto 24px", display: "block" }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Aucune offre pour le moment</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32, lineHeight: 1.7, maxWidth: 400, margin: "0 auto 32px" }}>
              Les offres d&apos;emploi apparaîtront ici dès que des entreprises vérifiées les publieront.
            </p>
            <Link href="/business" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              Vous êtes RH ? Publier une offre <ArrowRight size={16} />
            </Link>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Aucune offre pour ce filtre</p>
            <Link href="/jobs" style={{ fontSize: 14, color: "#8b5cf6", textDecoration: "none", fontWeight: 600 }}>Voir toutes les offres</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredJobs.map(job => {
              const co = job.companies;
              if (!co) return null;
              const sectorColor = SECTOR_COLORS[co.sector] ?? "#8b5cf6";
              const contractStyle = job.contract_type ? (CONTRACT_COLORS[job.contract_type] ?? { bg: "var(--surface2)", color: "var(--text-muted)" }) : null;

              return (
                <div key={job.id} className="job-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "22px 24px" }}>
                  <div>
                    {/* Job title + badges */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0 }}>{job.title}</h2>
                      {contractStyle && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 50, background: contractStyle.bg, color: contractStyle.color }}>
                          {job.contract_type}
                        </span>
                      )}
                      {job.work_mode && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 50, background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
                          {job.work_mode}
                        </span>
                      )}
                      {job.experience_level && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 50, background: "rgba(249,115,22,0.08)", color: "#f97316" }}>
                          {job.experience_level}
                        </span>
                      )}
                    </div>

                    {/* Company info */}
                    <Link href={`/company/${co.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 10 }}>
                      {co.logo_url ? (
                        <img src={co.logo_url} alt={co.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)" }} />
                      ) : (
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${sectorColor}, #f97316)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                          {co.name[0]}
                        </div>
                      )}
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)" }}>{co.name}</span>
                      {co.is_verified && (
                        <svg viewBox="0 0 22 22" style={{ width: 16, height: 16, flexShrink: 0 }}>
                          <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
                          <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
                        </svg>
                      )}
                    </Link>

                    {/* Meta */}
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                      {job.location && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
                          <MapPin size={13} /> {job.location}
                        </span>
                      )}
                      {job.salary_range && (
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>💰 {job.salary_range}</span>
                      )}
                      {Number(co.avg_rating) > 0 && (
                        <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>⭐ {Number(co.avg_rating).toFixed(1)} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({co.review_count} avis)</span></span>
                      )}
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{timeAgo(job.created_at)}</span>
                    </div>

                    {job.description && (
                      <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginTop: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                        {job.description}
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="job-card-cta" style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
                    {job.apply_url ? (
                      <JobApplyButton jobId={job.id} companyId={co.id} applyUrl={job.apply_url} />
                    ) : (
                      <Link href={`/company/${co.id}`}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 20px", borderRadius: 10, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
                        Voir la fiche <ArrowRight size={13} />
                      </Link>
                    )}
                    <Link href={`/company/${co.id}`} style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none", textAlign: "right" }}>
                      {co.name} · {co.sector}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA recruteurs */}
        <div style={{ marginTop: 48, background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(249,115,22,0.04))", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 20, padding: "32px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Vous recrutez ?</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Publiez vos offres sur Workie et touchez des candidats qui connaissent déjà votre culture d&apos;entreprise.
            </p>
          </div>
          <Link href="/business" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap" }}>
            Espace entreprise <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    </div>
  );
}
