"use client";

import { useT, useLangue } from "@/i18n/FournisseurLangue";

import { ChoixLangue } from "@/i18n/ChoixLangue";
import Link from "next/link";
import { Flame, TrendingUp, Megaphone, Building2, ChevronRight, Check } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useFavorisInvite } from "@/lib/favorisInvite";
import { revendicationOuverte } from "@/lib/ouverture";

const carte: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 };
const ligne: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", textDecoration: "none", color: "var(--text)", fontSize: 14.5, fontWeight: 600 };

/**
 * Le profil d'un visiteur sans compte.
 *
 * Tout ce qui se fait sans compte est ici, utilisable tout de suite ; le
 * compte est proposé pour ce qu'il ajoute vraiment (retrouver ses favoris
 * partout), jamais comme une porte fermée.
 */
export function ProfilVisiteur() {
  const t = useT();
  const nbFavoris = useFavorisInvite().size;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="profil-bandeau" style={{ background: "#101319", borderRadius: 18, padding: "28px 26px", color: "#fff" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>{t("profil.visiteur")}</p>
        <h1 style={{ fontSize: 26, fontWeight: 850, letterSpacing: "-0.02em", wordSpacing: "0.12em", marginTop: 6 }}>{t("profil.bienvenue")}</h1>
        <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.72)", marginTop: 8, lineHeight: 1.55, maxWidth: 520 }}>
          {t("profil.visiteurAide")}
        </p>
      </div>

      <Link href="/favorites" style={{ ...carte, ...ligne, padding: "18px" }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(249,115,22,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Flame size={19} color="#f97316" aria-hidden="true" />
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{nbFavoris}</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{t("profil.favorisAppareil", { n: nbFavoris })}</span>
        </span>
        <ChevronRight size={18} color="var(--text-muted)" aria-hidden="true" />
      </Link>

      <div style={{ ...carte, padding: "20px 20px 22px", display: "grid", gap: 14 }}>
        <p style={{ fontSize: 16, fontWeight: 800 }}>{t("profil.compteTitre")}</p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 9 }}>
          {[
            t("profil.avantage1"),
            t("profil.avantage2"),
            t("profil.avantage3"),
          ].map(texte => (
            <li key={texte} style={{ display: "flex", gap: 9, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.45 }}>
              <Check size={16} color="#10b981" strokeWidth={2.6} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} /> {texte}
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/signup?next=/profile" className="btn btn-marque" style={{ flex: "1 1 180px", justifyContent: "center" }}>{t("profil.creerCompteGratuit")}</Link>
          <Link href="/login?next=/profile" className="btn btn-clair" style={{ flex: "1 1 140px", justifyContent: "center" }}>{t("profil.seConnecter")}</Link>
        </div>
      </div>

      <div style={{ ...carte, padding: "18px 20px" }}>
        <ChoixLangue />
      </div>

      <div style={{ ...carte, overflow: "hidden" }}>
        <div style={{ ...ligne, justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
          <span>{t("profil.theme")}</span>
          <ThemeToggle />
        </div>
        <Link href="/ranking" style={{ ...ligne, borderBottom: "1px solid var(--border)" }}>
          <TrendingUp size={18} color="var(--brand)" aria-hidden="true" />
          <span style={{ flex: 1 }}>{t("profil.classement")}</span>
          <ChevronRight size={18} color="var(--text-muted)" aria-hidden="true" />
        </Link>
        <Link href="/annonceurs" style={{ ...ligne, borderBottom: revendicationOuverte ? "1px solid var(--border)" : "none" }}>
          <Megaphone size={18} color="var(--brand)" aria-hidden="true" />
          <span style={{ flex: 1 }}>{t("profil.publicite")}</span>
          <ChevronRight size={18} color="var(--text-muted)" aria-hidden="true" />
        </Link>
        {revendicationOuverte && (
          <Link href="/pour-les-entreprises" style={ligne}>
            <Building2 size={18} color="var(--brand)" aria-hidden="true" />
            <span style={{ flex: 1 }}>{t("profil.representez")}</span>
            <ChevronRight size={18} color="var(--text-muted)" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
