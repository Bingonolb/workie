import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { getTopCompanies } from "@/lib/actions/scores";
import { Flame } from "lucide-react";
import { RankingPodium, RankingRow } from "./RankingList";
import type { Company } from "@/lib/types";

export const revalidate = 60;

export default async function RankingPage() {
  const companies = (await getTopCompanies(100)) as Company[];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "36px 32px 80px" }}>
        <div style={{ marginBottom: 36, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 50, padding: "6px 18px", marginBottom: 16 }}>
            <Flame size={14} color="#f97316" fill="#f97316" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f97316" }}>Classement en temps réel</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 8 }}>Top 100 🔥</h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)" }}>Classé par flammes reçues de la communauté Workie</p>
        </div>

        {companies.length >= 3 && <RankingPodium companies={companies} />}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {companies.map((c, i) => <RankingRow key={c.id} company={c} index={i} />)}
        </div>

        {companies.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Pas encore de classement</p>
            <p style={{ fontSize: 14, marginBottom: 24 }}>Explore les entreprises et envoie des flammes !</p>
            <Link href="/explore?view=swipe" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 50, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
              Explorer en mode Swipe
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
