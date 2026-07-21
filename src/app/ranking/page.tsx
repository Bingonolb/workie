export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCachedTopCompanies, getCachedReviewCount } from "@/lib/actions/scores";
import { TrendingUp, Users, Star, Trophy } from "lucide-react";
import { RankingTable } from "./RankingList";
import type { Company } from "@/lib/types";
import { getBusinessCompanyId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Classement des entreprises suisses · Workie",
  description: "Le vrai classement des entreprises en Suisse — calculé sur les avis anonymes, les salaires et les votes de la communauté.",
  openGraph: {
    title: "Classement des meilleurs employeurs suisses · Workie",
    description: "200 entreprises classées par note, salaire et votes anonymes d'employés.",
    url: "https://www.workie.ch/ranking",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Classement des employeurs suisses · Workie" },
};

type MyRankData = {
  name: string;
  id: string;
  score: number;
  avg_rating: number;
  review_count: number;
  cover_url: string | null;
  rank: number;
  total: number;
} | null;

async function getMyBusinessRank(): Promise<MyRankData> {
  const companyId = await getBusinessCompanyId();
  if (!companyId) return null;

  const supabase = createAdminClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, score, avg_rating, review_count, cover_url, is_subscribed")
    .eq("id", companyId)
    .maybeSingle();

  if (!company || !company.is_subscribed) return null;

  const myScore = Number(company.score ?? 0);

  const [{ count: above }, { count: total }] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }).gt("score", myScore),
    supabase.from("companies").select("*", { count: "exact", head: true }).gt("score", 0),
  ]);

  return {
    id: company.id,
    name: company.name,
    score: myScore,
    avg_rating: Number(company.avg_rating ?? 0),
    review_count: Number(company.review_count ?? 0),
    cover_url: company.cover_url ?? null,
    rank: (above ?? 0) + 1,
    total: total ?? 0,
  };
}

export default async function RankingPage() {
  const [companies, reviewCount, myRank] = await Promise.all([
    getCachedTopCompanies(200).catch(() => [] as Company[]),
    getCachedReviewCount().catch(() => 0),
    getMyBusinessRank().catch(() => null),
  ]);
  const typedCompanies = companies as Company[];

  const withRating = typedCompanies.filter(c => Number(c.avg_rating) > 0);
  const avgRating = withRating.length
    ? withRating.reduce((s, c) => s + Number(c.avg_rating), 0) / withRating.length
    : 0;
  const totalReviews = reviewCount;

  return (
    <div className="page-root">
      <Navbar />
      <main className="page-main-md">

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Mis à jour toutes les minutes
            </span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 8 }}>
            Classement des entreprises
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Score calculé sur les étoiles des avis, les flammes et les boosts de la communauté.
          </p>
        </div>

        {/* KPI strip */}
        <div className="stat-grid-3" style={{ marginBottom: 32 }}>
          {[
            { icon: <Users size={16} color="#8b5cf6" />, value: typedCompanies.length, label: "Entreprises classées", color: "#8b5cf6" },
            { icon: <Star size={16} color="#f59e0b" fill="#f59e0b" />, value: totalReviews, label: "Avis publiés", color: "#f59e0b" },
            { icon: <TrendingUp size={16} color="#10b981" />, value: avgRating > 0 ? Number(avgRating).toFixed(2) : "—", label: "Note moyenne", color: "#10b981" },
          ].map(({ icon, value, label, color }) => (
            <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{value}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* My business rank banner — visible only to subscribed business accounts */}
        {myRank && (
          <Link href={`/company/${myRank.id}`} style={{ textDecoration: "none", display: "block", marginBottom: 24 }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(249,115,22,0.06))",
              border: "1.5px solid rgba(139,92,246,0.35)",
              borderRadius: 18,
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap" as const,
            }}>
              {/* Logo */}
              <div style={{
                width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0,
                background: "linear-gradient(135deg, #8b5cf644, #f9731622)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {myRank.cover_url
                  ? <img src={myRank.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <Trophy size={22} color="#8b5cf6" />}
              </div>

              {/* Label + name */}
              <div style={{ flex: 1, minWidth: 160 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#8b5cf6", marginBottom: 3 }}>
                  Votre position dans le classement
                </p>
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>
                  {myRank.name}
                </p>
                {myRank.avg_rating > 0 && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    ★ {myRank.avg_rating.toFixed(1)} · {myRank.review_count} avis · Score {myRank.score}
                  </p>
                )}
              </div>

              {/* Rank badge */}
              <div style={{ textAlign: "center" as const, flexShrink: 0 }}>
                <p style={{
                  fontSize: 38, fontWeight: 900, letterSpacing: "-0.04em",
                  background: "linear-gradient(135deg, #8b5cf6, #f97316)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  lineHeight: 1, fontVariantNumeric: "tabular-nums",
                }}>
                  #{myRank.rank}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginTop: 3 }}>
                  sur {myRank.total.toLocaleString("fr-CH")} entreprises
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Table */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
          <div style={{ padding: "20px 20px 0" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
              Top {companies.length} · trié par score global
            </p>
          </div>

          {companies.length === 0 ? (
            <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Pas encore de données</p>
              <p style={{ fontSize: 13 }}>Explore les entreprises et dépose des avis pour alimenter le classement.</p>
            </div>
          ) : (
            <RankingTable companies={typedCompanies} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
