"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProfileForm } from "@/components/ProfileForm";
import { ProfileReviews } from "./ProfileReviews";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { SignOutButton } from "@/components/SignOutButton";
import type { Profile, Review } from "@/lib/types";
import { lireCache, ecrireCache, CLE_PROFIL } from "@/lib/cacheSession";

type Donnees = {
  authentifie: boolean;
  email: string;
  creeLe: string | null;
  profile: Profile | null;
  reviews: (Review & { company_name: string })[];
  favCount: number;
  adsActives: number;
};

/**
 * Contenu de /profile, chargé après affichage.
 *
 * La page était rendue à la demande, ce qui imposait à chaque visite la
 * validation du jeton auprès de Supabase puis trois requêtes en base avant le
 * premier octet. La coquille part maintenant du cache et tout arrive ici en un
 * seul aller-retour vers /api/user/profile.
 *
 * La mise en page est identique pendant l'attente et après : mêmes blocs,
 * mêmes hauteurs, seules les valeurs changent. C'est ce qui évite que le
 * contenu saute quand les données arrivent.
 */
export function ProfilClient() {
  // On repart de la dernière réponse connue : au retour sur la page, le
  // contenu est là avant même le premier rendu, plus de squelette à revoir.
  const [d, setD] = useState<Donnees | null>(() => lireCache<Donnees>(CLE_PROFIL) ?? null);
  const [echec, setEchec] = useState(false);

  useEffect(() => {
    let annule = false;
    fetch("/api/user/profile")
      .then(async r => {
        // Session expirée entre le service de la coquille et cet appel : la
        // page est en cache, elle a donc pu être servie à quelqu'un qui n'a
        // plus de session valide. On repasse par la déconnexion, qui purge
        // les cookies avant d'envoyer vers la connexion.
        if (r.status === 401) { window.location.href = "/api/auth/signout?next=/login"; return null; }
        return r.json();
      })
      .then(j => { if (j && !annule) { ecrireCache(CLE_PROFIL, j); setD(j); } })
      // Sans cet état, un échec laissait la page sur son squelette
      // indéfiniment, sans un mot : constaté en production pendant une
      // interruption de l'API. Un écran figé n'apprend rien à personne.
      .catch(() => { if (!annule) setEchec(true); });
    return () => { annule = true; };
  }, []);

  if (echec) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "48px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Impossible de charger ton profil</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Tes données sont intactes, c&apos;est l&apos;affichage qui a échoué.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff",
            fontWeight: 700, border: "none", borderRadius: 10, padding: "11px 26px",
            fontSize: 14, cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  const profile = d?.profile ?? null;
  const reviews = d?.reviews ?? [];
  const adsActives = d?.adsActives ?? 0;
  const displayName = profile?.full_name || profile?.username || (d ? "Workie User" : " ");
  const memberSince = d?.creeLe
    ? new Date(d.creeLe).toLocaleDateString("fr-CH", { month: "long", year: "numeric" })
    : "—";
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.rating_overall), 0) / reviews.length).toFixed(1)
    : null;

  // Le fondu ne s'applique qu'à la première arrivée des données. Au retour
  // depuis le cache, le contenu est déjà là : le faire réapparaître serait une
  // animation gratuite, et c'est ce qui donne l'impression de rechargement.
  return (
    <div className={d ? "apparition" : undefined}>
      {/* ── Header ── */}
      <div className="profile-header" style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 20,
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        {/* Name zone — dark panel with "Workie" watermark text */}
        <div style={{
          position: "relative",
          padding: "32px 32px 28px",
          background: "linear-gradient(160deg, #0d0d14 0%, #131320 100%)",
          overflow: "hidden",
        }}>
          {/* Watermark */}
          <span aria-hidden="true" style={{
            position: "absolute",
            right: -8, top: "50%",
            transform: "translateY(-50%)",
            fontSize: 96, fontWeight: 900,
            color: "rgba(255,255,255,0.04)",
            letterSpacing: "-0.05em",
            userSelect: "none",
            lineHeight: 1,
            pointerEvents: "none",
          }}>
            Workie
          </span>
          {/* Accent line */}
          <div style={{
            width: 32, height: 3, borderRadius: 2,
            background: "linear-gradient(90deg, #8b5cf6, #f97316)",
            marginBottom: 14,
          }} />
          <h1 style={{
            fontSize: 28, fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.035em",
            lineHeight: 1.1,
            margin: 0,
          }}>
            {displayName}
          </h1>
        </div>

        {/* Info row */}
        <div style={{
          padding: "16px 32px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{d?.email ?? " "}</span>
          {(profile?.city || profile?.country) && (
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {[profile.city, profile.country].filter(Boolean).join(", ")}
            </span>
          )}
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Membre depuis {memberSince}</span>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="profile-kpi" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {([
          { emoji: "⭐", value: avgRating ?? "—", label: "Note moyenne donnée", color: "#f59e0b", href: null },
          { emoji: "🔥", value: d ? String(d.favCount) : "—", label: "Entreprises sauvegardées", color: "#f97316", href: "/favorites" },
          { emoji: "📊", value: d ? String(reviews.length) : "—", label: "Avis publiés", color: "#10b981", href: null },
          // Dès qu'une campagne tourne, la tuile affiche le compte comme ses
          // trois voisines : un nombre, un libellé. Le mot « Pub » à la place
          // du chiffre cassait l'alignement de lecture et, surtout, ne disait
          // pas qu'une campagne était en cours. Sans campagne, elle redevient
          // une invitation.
          adsActives > 0
            ? { emoji: "📣", value: String(adsActives), label: `Pub${adsActives > 1 ? "s" : ""} active${adsActives > 1 ? "s" : ""}`, color: "#8b5cf6", href: "/profile/ads" }
            : { emoji: "📣", value: "Pub", label: "Faire de la publicité", color: "#8b5cf6", href: "/profile/ads" },
        ] as { emoji: string; value: string; label: string; color: string; href: string | null }[]).map(({ emoji, value, label, color, href }) => {
          const inner = (
            <>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {emoji}
              </div>
              <div>
                <p style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{label}</p>
              </div>
            </>
          );
          return href ? (
            <Link key={label} href={href} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
              {inner}
            </Link>
          ) : (
            <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* ── Main grid ── */}
      <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

        {/* Reviews table */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 18, overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 22px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              Mes avis · <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                {d ? `${reviews.length} publié${reviews.length !== 1 ? "s" : ""}` : "…"}
              </span>
            </p>
          </div>
          {d ? <ProfileReviews reviews={reviews} /> : <div style={{ height: 180 }} aria-hidden="true" />}
        </div>

        {/* Right column */}
        <div className="profile-sidebar" style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Edit form */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 18, overflow: "hidden",
          }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Modifier le profil</p>
            </div>
            <div style={{ padding: 22 }}>
              {/* Monté seulement une fois les valeurs connues : le formulaire
                  initialise ses champs à la première image et ne les
                  rafraîchit pas ensuite. */}
              {d ? <ProfileForm profile={profile} email={d.email} /> : <div style={{ height: 320 }} aria-hidden="true" />}
            </div>
          </div>

          {/* Réglages */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 18, overflow: "hidden",
          }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Réglages</p>
            </div>
            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              <ThemeToggle />
              <a
                href="/api/user/export"
                download
                style={{
                  display: "block", width: "100%", padding: "11px 16px", borderRadius: 10,
                  background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)",
                  color: "#8b5cf6", fontWeight: 600, fontSize: 13, cursor: "pointer",
                  textDecoration: "none", textAlign: "left",
                }}
              >
                ⬇ Télécharger mes données (RGPD)
              </a>
              <SignOutButton />
              <DeleteAccountButton />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
