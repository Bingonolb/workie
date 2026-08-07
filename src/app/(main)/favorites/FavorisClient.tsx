"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import { CompanyCard } from "@/components/CompanyCard";
import type { Company } from "@/lib/types";

/**
 * Liste des favoris, chargée après affichage.
 *
 * La page était rendue à la demande : chaque visite attendait la validation du
 * jeton auprès de Supabase, puis la requête en base, avant de renvoyer le
 * moindre octet. La coquille arrive maintenant du cache et cette liste se
 * remplit ensuite.
 *
 * Pendant l'attente on affiche des cartes grises aux dimensions exactes des
 * vraies. C'est ce qui évite le sursaut : sans elles, la page passerait d'un
 * écran vide à une grille pleine, en poussant tout vers le bas.
 */
export function FavorisClient() {
  const [companies, setCompanies] = useState<Company[] | null>(null);

  useEffect(() => {
    let annule = false;
    fetch("/api/user/favorites")
      .then(async r => {
        // Session expirée entre le service de la coquille (en cache) et cet
        // appel. On repasse par la déconnexion, qui purge les cookies avant
        // d'envoyer vers la connexion — afficher « aucun favori » ferait
        // croire à une perte de données.
        if (r.status === 401) { window.location.href = "/api/auth/signout?next=/login"; return null; }
        return r.json();
      })
      .then(d => { if (d && !annule) setCompanies(d.companies ?? []); })
      .catch(() => { if (!annule) setCompanies([]); });
    return () => { annule = true; };
  }, []);

  if (companies === null) return <GrilleAttente />;

  if (companies.length === 0) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "64px 32px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Flame size={28} color="#f97316" aria-hidden="true" />
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
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
      {companies.map((c, i) => (
        <CompanyCard key={c.id} company={c} isFav isLoggedIn priority={i < 4} />
      ))}
    </div>
  );
}

/** Mêmes dimensions que les vraies cartes, pour que rien ne bouge à l'arrivée. */
function GrilleAttente() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="company-card" aria-hidden="true" style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 20, overflow: "hidden",
        }}>
          <div className="card-cover img-placeholder" style={{ height: 210 }} />
          <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ height: 12, width: "45%", borderRadius: 4, background: "var(--surface3)" }} />
            <div style={{ height: 11, width: "90%", borderRadius: 4, background: "var(--surface3)" }} />
            <div style={{ height: 11, width: "65%", borderRadius: 4, background: "var(--surface3)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
