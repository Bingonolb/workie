export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { CompanyCard } from "@/components/CompanyCard";
import { getFavorites } from "@/lib/actions/favorites";
import { getUser } from "@/lib/supabase/server";
import { Flame } from "lucide-react";

export const metadata: Metadata = {
  title: "Mes favoris · Workie",
};

export default async function FavoritesPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const companies = await getFavorites().catch(() => []);
  const favIds = companies.map(c => c.id);

  return (
    <div className="page-root">
      <Navbar />
      <main className="page-main-md">
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          Mes favoris 🔥
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>
          {companies.length} entreprise{companies.length > 1 ? "s" : ""} sauvegardée{companies.length > 1 ? "s" : ""}
        </p>

        {companies.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "64px 32px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Flame size={28} color="#f97316" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Aucun favori pour l&apos;instant</p>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>Clique sur 🔥 sur une entreprise pour la sauvegarder ici.</p>
            <Link href="/explore" style={{
              display: "inline-block", background: "linear-gradient(135deg, #8b5cf6, #f97316)",
              color: "#fff", fontWeight: 700, borderRadius: 10, padding: "12px 28px", textDecoration: "none", fontSize: 14,
            }}>
              Explorer les entreprises
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {companies.map(c => (
              <CompanyCard key={c.id} company={c} isFav={favIds.includes(c.id)} isLoggedIn={true} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
