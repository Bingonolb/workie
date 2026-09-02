"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Flame, Star } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import type { Company } from "@/lib/types";
import { SECTOR_COLORS } from "@/lib/types";
import { CoverImage } from "@/components/CoverImage";
import { logoAffichable } from "@/lib/logo";
import { useEtatSynchronise } from "@/lib/useEtatSynchronise";

const SECTOR_GRADIENTS: Record<string, string> = {
  "Tech":                  "linear-gradient(135deg, #6d28d9 0%, #1e40af 100%)",
  "Finance":               "linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)",
  "Assurances":            "linear-gradient(135deg, #0284c7 0%, #1e3a5f 100%)",
  "Pharma":                "linear-gradient(135deg, #059669 0%, #0c2d20 100%)",
  "Santé":                 "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
  "Conseil":               "linear-gradient(135deg, #d97706 0%, #7c2d12 100%)",
  "Industrie":             "linear-gradient(135deg, #475569 0%, #0f172a 100%)",
  "Automobile":            "linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)",
  "Horlogerie":            "linear-gradient(135deg, #ea580c 0%, #431407 100%)",
  "Commerce":              "linear-gradient(135deg, #9333ea 0%, #3b0764 100%)",
  "Alimentation":          "linear-gradient(135deg, #65a30d 0%, #1a2e05 100%)",
  "Agriculture":           "linear-gradient(135deg, #4d7c0f 0%, #1a2e05 100%)",
  "Éducation & Recherche": "linear-gradient(135deg, #0891b2 0%, #0c4a6e 100%)",
  "Sports & Fashion":      "linear-gradient(135deg, #db2777 0%, #500724 100%)",
  "Transport":             "linear-gradient(135deg, #0d9488 0%, #134e4a 100%)",
  "Énergie":               "linear-gradient(135deg, #ca8a04 0%, #451a03 100%)",
};

function getCoverGradient(sector: string, sectorColor: string): string {
  return SECTOR_GRADIENTS[sector] ?? `linear-gradient(135deg, ${sectorColor} 0%, #0f172a 100%)`;
}

function getInitials(name: string): string {
  const words = name.trim().replace(/[^a-zA-ZÀ-ÿ\s]/g, " ").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Star size={13} fill="#f59e0b" color="#f59e0b" aria-hidden="true" />
      <span style={{ fontSize: 14.5, fontWeight: 700, color: "#f59e0b" }}>{Number(rating).toFixed(1)}</span>
    </span>
  );
}

function getOgCover(company: Company): string {
  return `/api/og?title=${encodeURIComponent(company.name)}&sub=${encodeURIComponent(company.sector ?? "")}`;
}


// Neutral blur placeholder — shows instantly before the real image loads
const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyMDIwMzAiLz48L3N2Zz4=";

export function CompanyCard({ company, isFav = false, isLoggedIn = false, priority = false, loading = "eager" }: {
  company: Company;
  isFav?: boolean;
  isLoggedIn?: boolean;
  priority?: boolean;
  loading?: "eager" | "lazy";
}) {
  const router = useRouter();
  // Suit la propriété : sur /explore, page statique, le favori n'est connu
  // qu'après l'arrivée du contexte. Figé, l'état laissait la flamme éteinte
  // sur une entreprise pourtant enregistrée.
  const [fav, setFav] = useEtatSynchronise(isFav);
  const [score, setScore] = useEtatSynchronise(Number(company.score));
  const [coverFailed, setCoverFailed] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [pending, startTransition] = useTransition();
  const sectorColor = SECTOR_COLORS[company.sector] ?? "#8b5cf6";

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    const prev = fav;
    const prevScore = score;
    const next = !fav;
    setFav(next);
    if (next) setScore(s => s + 1);
    else setScore(s => Math.max(0, s - 1));
    startTransition(async () => {
      try { await toggleFavorite(company.id); }
      catch { setFav(prev); setScore(prevScore); }
    });
  };

  return (
    <Link
      href={`/company/${company.id}`}
      aria-label={`Voir la fiche ${company.name}${Number(company.review_count) > 0 ? `, ${Number(company.avg_rating).toFixed(1)}/5 (${company.review_count} avis)` : ""}`}
      style={{ textDecoration: "none", display: "block" }}
      // Next précharge les liens entrant dans la fenêtre, mais seulement quand
      // le navigateur est inactif : un clic juste après un défilement arrive
      // avant. Mesuré sur build de production — une fiche déjà préchargée
      // s'ouvre en 19 à 27 ms, une fiche qui ne l'est pas encore en 345 à 996.
      // On déclenche donc dès l'intention, au survol ou au premier contact du
      // doigt, ce qui donne quelques centaines de millisecondes d'avance.
      onPointerEnter={() => router.prefetch(`/company/${company.id}`)}
      onTouchStart={() => router.prefetch(`/company/${company.id}`)}
    >
      {/* Le panneau reste.
          Il a ete retire un temps, au profit d'une photo flottante et d'un
          texte pose sur le fond, a la maniere d'Airbnb. Sans bordure, les
          fiches n'avaient plus de limite : la ou s'arretait l'une et ou
          commencait l'autre ne se lisait plus, et la grille donnait des carres
          en suspens plutot qu'un ensemble ordonne. Le cadre n'etait pas le
          probleme, c'est lui qui tient la grille.

          Ce qui manquait etait l'espace entre les fiches, traite dans la
          grille, et le poids de la description, ramenee a deux lignes. */}
      <div className="company-card" style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
      }}>
        {/* Cover */}
        <div className="card-cover" style={{ height: 210, position: "relative", overflow: "hidden", background: "var(--surface2)" }}>
          <CoverImage
            src={(company.cover_url && !coverFailed) ? company.cover_url : getOgCover(company)}
            color={company.cover_color}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            priority={priority}
          />

          {/* Voile sombre sous la photo.
              Il montait à 0,82 en bas, ce qui suffit sur une image sombre et
              pas sur une image claire : le nom en blanc devenait illisible sur
              les couvertures lumineuses. Il commence plus haut et va plus loin,
              de sorte que le nom se lise quelle que soit la photo. */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 30%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.88) 100%)" }} />

          {/* Le secteur, seulement quand rien de plus precis ne le dit.
              « COMMERCE » en haut, « Distribution et mode » en bas de la meme
              photo, « #commerce » sous la description : la carte nommait trois
              fois l'activite, dont deux fois au meme endroit. Le sous-secteur
              est le plus precis des trois, c'est lui qu'on garde ; le badge ne
              sert plus que de repli. */}
          {!company.subsector && company.sector && (
          <div style={{
            position: "absolute", top: 11, left: 11,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            borderRadius: 50, padding: "3px 10px", fontSize: 11.5, fontWeight: 700,
            color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase",
            border: "1px solid rgba(255,255,255,0.12)",
          }}>
            {company.sector}
          </div>
          )}

          {/* Le compteur de flammes est descendu avec les autres chiffres.
              Il occupait le coin superieur droit, colle au bouton favori, qui
              est lui aussi une flamme : deux flammes voisines dont l'une
              compte et l'autre agit. On ne savait pas laquelle cliquer.

              Le coin ne porte plus qu'une seule chose, et c'est la commande. */}

          {/* Flame / Favorite */}
          <button
            type="button"
            onClick={handleFav}
            disabled={pending}
            aria-pressed={fav}
            aria-label={fav ? `Retirer ${company.name} des favoris` : `Ajouter ${company.name} aux favoris`}
            style={{
              position: "absolute", top: 8, right: 8,
              width: 40, height: 40, borderRadius: "50%",
              background: fav ? "rgba(249,115,22,0.88)" : "rgba(13,13,19,0.55)",
              border: fav ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.18s",
            }}
          >
            {/* Deux flammes superposées dont l'opacité se croise.
                Le cercle avait bien une transition, mais le remplissage d'un
                SVG bascule d'un coup : l'icône claquait pendant que le fond
                fondait. L'état arrive après l'affichage — il vient de
                /api/user/context — donc ce changement est systématiquement
                visible, et c'est ce qui donnait l'impression d'une apparition
                brutale. */}
            <span style={{ position: "relative", width: 15, height: 15, display: "block" }} aria-hidden="true">
              <Flame size={15} fill="none" color="rgba(255,255,255,0.7)"
                     style={{ position: "absolute", inset: 0, opacity: fav ? 0 : 1, transition: "opacity 0.18s" }} />
              <Flame size={15} fill="#fff" color="#fff"
                     style={{ position: "absolute", inset: 0, opacity: fav ? 1 : 0, transition: "opacity 0.18s" }} />
            </span>
          </button>

          {/* Bottom: logo/initials + company name */}
          <div style={{ position: "absolute", bottom: 12, left: 12, right: 60, display: "flex", alignItems: "flex-end", gap: 9 }}>
            {/* Logo or initials */}
            <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 9, overflow: "hidden", position: "relative",
              background: logoLoaded ? "#fff" : `${sectorColor}33`,
              border: logoLoaded ? "1.5px solid rgba(255,255,255,0.25)" : `1.5px solid ${sectorColor}66`,
            }}>
              {/* Initials — hidden once logo loads */}
              {!logoLoaded && (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                  {getInitials(company.name)}
                </div>
              )}
              {/* Logo — seulement s'il est hébergé chez nous (voir logoAffichable) */}
              {logoAffichable(company.logo_url) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoAffichable(company.logo_url)!}
                  alt=""
                  width={38}
                  height={38}
                  loading="eager"
                  onLoad={() => setLogoLoaded(true)}
                  onError={() => setLogoLoaded(false)}
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "contain", padding: 3,
                    opacity: logoLoaded ? 1 : 0,
                    transition: "opacity 0.25s ease",
                  }}
                />
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <p className="card-company-name" style={{
                fontSize: 17.5, fontWeight: 700, color: "#fff",
                letterSpacing: "-0.02em", lineHeight: 1.2,
                display: "-webkit-box", WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical", overflow: "hidden",
              } as React.CSSProperties}>
                {company.name}
                {company.is_verified && (
                  <svg viewBox="0 0 22 22" style={{ display: "inline", verticalAlign: "middle", marginLeft: 5, width: 15, height: 15, flexShrink: 0 }} aria-label="Entreprise vérifiée">
                    <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
                    <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
                  </svg>
                )}
              </p>
              {company.subsector && (
                <p style={{ fontSize: 12.5, fontWeight: 500, color: "rgba(255,255,255,0.62)", marginTop: 3 }}>{company.subsector}</p>
              )}
            </div>
          </div>
        </div>

        {/* Corps de la carte.
            Il empilait quatre blocs : la note, la description, une rangee de
            puces a icones, puis trois etiquettes. Les etiquettes redisaient le
            secteur en minuscules et n'ont jamais decide d'un clic ; la fiche
            les porte deja. Le reste tenait sur une ligne.

            Ne restent donc que deux choses : ce que fait l'entreprise, et les
            chiffres qui la situent. */}
        <div style={{ padding: "16px 16px 18px" }}>
          {/* Description : deux lignes, coupees net, sans bouton.
              La carte entiere est deja un lien vers la fiche. Y ajouter un
              « plus » creait deux cibles concurrentes dans le meme bloc.

              La hauteur est reservee meme quand le texte tient sur une ligne,
              sans quoi la ligne de chiffres se pose a des hauteurs
              differentes d'une carte a l'autre et la rangee parait assemblee
              plutot que composee. */}
          {company.description && (
            <p style={{
              fontSize: 14, color: "var(--text-sub)", lineHeight: 1.62,
              marginBottom: 14, minHeight: 45,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            } as React.CSSProperties}>
              {company.description}
            </p>
          )}

          {/* Une seule ligne de chiffres, separes par des points mediant.
              Chaque donnee avait sa puce, son icone et son cadre : la ville
              seule mobilisait une epingle et une rangee entiere pour un mot.
              Une ligne de texte suffit, et les points laissent voir d'un coup
              d'oeil combien on en sait sur cette entreprise.

              Une note ne s'affiche que si des avis l'appuient : la condition
              acceptait une note seule, et 24 entreprises montraient des
              etoiles a cote de « 0 avis ». */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
            fontSize: 13.5, color: "var(--text-muted)", minHeight: 20,
          }}>
            {Number(company.review_count) > 0 && Number(company.avg_rating) > 0 && (
              <>
                <StarDisplay rating={Number(company.avg_rating)} />
                <span>{company.review_count} avis</span>
                <Separateur />
              </>
            )}
            <span>{company.city}</span>
            {Number(company.avg_salary_chf) > 0 && (
              <>
                <Separateur />
                <span style={{ color: "#10b981", fontWeight: 600 }}>
                  CHF {(Number(company.avg_salary_chf) / 1000).toFixed(0)}k
                </span>
              </>
            )}
            {score > 0 && (
              <>
                <Separateur />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <Flame size={12} fill="#f97316" color="#f97316" aria-hidden="true" />
                  <span style={{ color: "#f97316", fontWeight: 700 }}>{score}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Separateur() {
  // En var(--border2) le point disparaissait : c'est la couleur d'un trait de
  // cadre, pensee pour s'effacer. Un separateur doit se voir juste assez pour
  // qu'on sente ou une donnee s'arrete, sans peser autant que les donnees.
  return <span aria-hidden="true" style={{ color: "var(--text-muted)", opacity: 0.45 }}>&middot;</span>;
}

