import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getTopCompanies } from "@/lib/actions/scores";
import { createClient } from "@/lib/supabase/server";
import { TrendingUp, Users, Star } from "lucide-react";
import { RankingTable } from "./RankingList";
import type { Company } from "@/lib/types";

export const revalidate = 60;

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

export default async function RankingPage() {
  const supabase = await createClient();
  const [companies, { count: reviewCount }] = await Promise.all([
    getTopCompanies(200).catch(() => [] as Company[]),
    Promise.resolve(supabase.from("reviews").select("*", { count: "exact", head: true })).catch(() => ({ count: 0 })),
  ]);
  const typedCompanies = companies as Company[];

  const withRating = typedCompanies.filter(c => Number(c.avg_rating) > 0);
  const avgRating = withRating.length
    ? withRating.reduce((s, c) => s + Number(c.avg_rating), 0) / withRating.length
    : 0;
  const totalReviews = reviewCount ?? 0;

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
