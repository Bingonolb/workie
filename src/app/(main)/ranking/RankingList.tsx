"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Search } from "lucide-react";
import type { Company } from "@/lib/types";
import { SECTOR_COLORS } from "@/lib/types";

// Or, argent, bronze. Les trois premiers portaient des médailles en émoji,
// dont le dessin change d'un système à l'autre et qui donnent à un classement
// professionnel un air de tableau de jeu. Le rang reste un nombre ; seule sa
// couleur distingue le podium.
const COULEURS_PODIUM = ["#d4a017", "#94a3b8", "#b45309"];

export function RankingTable({ companies }: { companies: Company[] }) {
  const [search, setSearch] = useState("");
  const [secteur, setSecteur] = useState("");

  // Les secteurs sont tires des entreprises presentes, pas du catalogue.
  // Le catalogue en compte vingt-neuf ; proposer un secteur dont le classement
  // ne contient aucune ligne, c'est offrir un filtre qui ne peut que vider la
  // liste.
  const secteurs = [...new Set(companies.map(c => c.sector).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "fr"));

  const q = search.trim().toLowerCase();
  const filtered = companies.filter(c =>
    (!secteur || c.sector === secteur) &&
    (!q || c.name.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q))
  );
  // Le rang est une position dans le classement, pas un numero de ligne.
  // Il etait recalcule sur la liste filtree : chercher « Roche » affichait
  // « 01 », et filtrer sur Tech renumerotait le secteur de un a vingt-quatre.
  // Un nombre qui change selon ce qu'on a tape ne mesure plus rien. Il vient
  // desormais toujours du classement complet, quitte a ce que la liste filtree
  // saute de 03 a 07, ce que le sous-titre explique.
  const globalRankMap = new Map(companies.map((c, i) => [c.id, i]));
  const isFiltered = q.length > 0 || secteur !== "";

  return (
    // Filtre sur un secteur, la colonne « Secteur » repete la meme valeur a
    // chaque ligne : elle ne distingue plus rien et ne fait qu'occuper le
    // tiers de la largeur. Elle s'efface, et la ligne se redistribue.
    <div className={secteur ? "ranking-sans-secteur" : undefined}>
      <div style={{ padding: "20px 20px 16px" }}>
        {/* Le titre dit ce qu'on regarde.
            Filtre sur un secteur, il annoncait « Top 200 » au-dessus de trois
            lignes de cabinets d'avocats, et le mot « Droit » n'apparaissait
            qu'en petit dans le sous-titre. La colonne « Secteur » ayant ete
            retiree parce qu'elle repetait la meme valeur a chaque ligne, plus
            rien ne nommait franchement ce qu'on avait sous les yeux.

            Le secteur devient donc le titre : dit une fois, en grand, plutot
            que trois fois en petit. Le decompte descend d'un cran. */}
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 2 }}>
          {secteur || `Top ${companies.length}`}
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, marginBottom: 16 }}>
          {secteur
            ? `${filtered.length} entreprise${filtered.length > 1 ? "s" : ""} sur ${companies.length}`
            : q
              ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""} sur ${companies.length}`
              : "Trié par score communautaire"}
        </p>

        {/* Chercher et filtrer sont deux intentions distinctes : on cherche une
            entreprise qu'on a en tete, on filtre pour parcourir un domaine.
            Deux commandes, mais une seule ligne, et aucune couche visuelle
            supplementaire au-dessus du tableau. */}
        <div className="ranking-controles">
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              className="ranking-champ ranking-recherche"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Chercher une entreprise ou une ville"
              placeholder="Chercher une entreprise ou une ville..."
            />
          </div>
          <select
            className={`ranking-champ ranking-filtre${secteur ? " ranking-filtre--actif" : ""}`}
            value={secteur}
            onChange={e => setSecteur(e.target.value)}
            aria-label="Filtrer par secteur"
          >
            <option value="">Tous les secteurs</option>
            {secteurs.map(sect => (
              <option key={sect} value={sect}>{sect}</option>
            ))}
          </select>
        </div>
      </div>

      {/* En-tête.
          Il annonçait six colonnes : « # », « Entreprise », « Secteur »,
          « Note · Avis », « Score avis », « Score total ». Les deux dernières
          exposaient le détail du calcul, points de note d'un côté et points de
          communauté de l'autre, sous la forme « +284 » et « +15 ». Ce sont des
          quantités internes : elles n'ont de sens que rapportées à une formule
          que le lecteur n'a pas, et elles occupaient à elles seules le tiers
          droit de la ligne.

          Il en reste quatre, dont une seule colonne de chiffres. */}
      <div className="ranking-header">
        {[
          { label: "#", cls: "", align: "left" },
          { label: "Entreprise", cls: "", align: "left" },
          { label: "Secteur", cls: "ranking-col-sector", align: "left" },
          { label: "Score", cls: "", align: "right" },
        ].map(({ label, cls, align }) => (
          <span key={label} className={cls} style={{
            // Un en-tête de tableau n'est pas du texte de lecture : il se
            // repère, il ne se lit pas. La capitale et l'interlettrage
            // suffisent à le distinguer sans monter en taille.
            fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
            letterSpacing: "0.07em", textTransform: "uppercase",
            whiteSpace: "nowrap",
            textAlign: align as "left" | "right",
          }}>{label}</span>
        ))}
      </div>

      {/* Lignes */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filtered.map(c => {
          const displayRank = globalRankMap.get(c.id) ?? 0;
          const sectorColor = SECTOR_COLORS[c.sector] ?? "#8b5cf6";
          const score = Number(c.score ?? 0);
          const avgRating = Number(c.avg_rating ?? 0);
          const reviewCount = Number(c.review_count ?? 0);

          return (
            <Link key={c.id} href={`/company/${c.id}`} className="ranking-row">
              {/* Rang */}
              <span style={{
                fontSize: 14.5, fontWeight: 800,
                color: COULEURS_PODIUM[displayRank] ?? "var(--text-muted)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {String(displayRank + 1).padStart(2, "0")}
              </span>

              {/* Entreprise */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                {c.logo_url && (
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, overflow: "hidden",
                    flexShrink: 0, background: "var(--surface3)",
                    border: "1px solid var(--border)",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.logo_url} alt="" loading="lazy" decoding="async" className="img-fade" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} onError={e => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none"; }} />
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: 14, fontWeight: 700, color: "var(--text)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {c.name}
                    {c.is_verified && (
                      <svg viewBox="0 0 22 22" style={{ display: "inline", verticalAlign: "middle", marginLeft: 5, width: 14, height: 14, flexShrink: 0 }} aria-label="Entreprise vérifiée">
                        <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
                        <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
                      </svg>
                    )}
                  </p>
                  {/* La note descend sous le nom, avec la ville.
                      Elle avait sa colonne, alignée à droite face au score :
                      deux nombres côte à côte, dont l'un ordonne la liste et
                      l'autre non. Une note de 4,5 pouvait ainsi figurer sous
                      une note de 4,2, et la liste paraissait mal triée.

                      Sous le nom, elle se lit comme ce qu'elle est : la pièce
                      justificative, pas un second classement. Et elle survit à
                      l'écran étroit, où la colonne était purement masquée. */}
                  <p style={{
                    fontSize: 12.5, color: "var(--text-muted)",
                    display: "flex", alignItems: "center", gap: 5,
                    overflow: "hidden", whiteSpace: "nowrap",
                  }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.city}</span>
                    {avgRating > 0 && reviewCount > 0 && (
                      <>
                        <span aria-hidden="true" style={{ opacity: 0.45 }}>&middot;</span>
                        <Star size={11} fill="#f59e0b" color="#f59e0b" aria-hidden="true" style={{ flexShrink: 0 }} />
                        <span style={{ color: "#f59e0b", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                          {avgRating.toFixed(1)}
                        </span>
                        <span style={{ flexShrink: 0 }}>({reviewCount})</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Secteur : un aplat, sans contour.
                  La pastille cumulait une couleur de texte, un fond teinté et
                  une bordure teintée, soit trois traitements pour une seule
                  étiquette, répétés sur deux cents lignes. */}
              <span className="ranking-col-sector" style={{
                fontSize: 11.5, fontWeight: 600, color: sectorColor,
                background: `${sectorColor}1f`,
                borderRadius: 5, padding: "3px 9px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                // La pastille est elle-meme la cellule de la grille : sans
                // justify-self, elle s'etire sur toute la colonne et « Conseil »
                // occupait la meme largeur qu'« Hotellerie & Restauration ».
                // Elle epouse maintenant son texte, et ne se tronque qu'au-dela.
                display: "inline-block", justifySelf: "start", maxWidth: 172,
              }}>
                {c.sector}
              </span>

              {/* Score : le seul nombre aligné à droite, donc le seul qui puisse
                  être lu comme celui qui ordonne la liste. La flèche ascendante
                  qui l'accompagnait annonçait une progression que ce nombre ne
                  mesure pas. */}
              <span style={{
                fontSize: 15.5, fontWeight: 800, textAlign: "right",
                color: score > 0 ? "var(--text)" : "var(--text-muted)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {score > 0 ? score : "—"}
              </span>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 14 }}>
              {secteur && !q
                ? `Aucune entreprise du secteur ${secteur} dans ce classement.`
                : "Aucune entreprise ne correspond à cette recherche."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
