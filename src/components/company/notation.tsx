import { Star } from "lucide-react";
import { partDeOui, texteSynthese, type Synthese } from "@/lib/synthese";

/**
 * Éléments d'affichage des notes, partagés entre la synthèse de la fiche
 * (rendue sur le serveur) et la liste des avis (rendue sur le client).
 *
 * Module volontairement neutre — ni « use client » ni « use server » — pour que
 * les deux côtés puissent l'importer. Il ne contient que du présentationnel :
 * aucun accès aux cookies, à la base ni au réseau.
 */

// Score-driven colour so a weak rating reads as weak at a glance — a flat
// gradient made 1/5 and 5/5 look identical.
export function ratingColor(value: number): string {
  if (value >= 4) return "#10b981";   // solide
  if (value >= 3) return "#f59e0b";   // moyen
  if (value >= 2) return "#f97316";   // faible
  return "#ef4444";                   // critique
}

export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span aria-hidden="true" style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size}
          fill={n <= Math.round(rating) ? "#f59e0b" : "transparent"}
          color={n <= Math.round(rating) ? "#f59e0b" : "var(--border2)"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export function RatingRow({ label, value }: { label: string; value: number | null }) {
  const color = value !== null ? ratingColor(value) : "var(--text-muted)";
  const pct = value !== null ? (value / 5) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ flex: "1 1 0", minWidth: 0, fontSize: 13.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </span>
      {/* Barre volontairement étroite : dans une carte d'avis en 2 colonnes,
          chaque colonne fait ~215px et les libellés longs (« Diversité &
          inclusion ») étaient tronqués au-delà de 56px de barre. */}
      <div style={{ flex: "0 0 56px", height: 6, background: "var(--surface3)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ flex: "0 0 26px", textAlign: "right", fontSize: 13.5, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>
        {value !== null ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

/**
 * Synthèse d'une question oui / non / nuance (recommandation, retour).
 *
 * L'affichage prend la forme que les données autorisent, et pas une de plus :
 * un pourcentage seulement quand il y a assez de réponses pour qu'il veuille
 * dire quelque chose, une fraction en dessous, et le mot « partagé » quand
 * personne n'a tranché. Le détail du raisonnement est dans `@/lib/synthese`,
 * avec les tests qui l'exercent sur toutes les combinaisons.
 */
export function StatPill({ label, synthese }: { label: string; synthese: Synthese }) {
  const part = partDeOui(synthese);
  const color =
    part === null ? (synthese.forme === "partagee" ? "#f59e0b" : "var(--text-muted)")
    : part >= 0.7 ? "#10b981"
    : part >= 0.4 ? "#f59e0b"
    : "#ef4444";

  const { valeur, detail } = texteSynthese(synthese);

  // `minWidth: 0` : sans lui, une pastille refuse de descendre sous la largeur
  // de son contenu et pousse la page en débordement horizontal. Avec, elle
  // renvoie son texte à la ligne. C'est ce qui tient à 320 px le jour où une
  // fiche affichera « sur 1 200 avis · 300 mitigés ».
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 7, minWidth: 0, maxWidth: "100%", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "8px 13px" }}>
      <span style={{ fontSize: synthese.forme === "partagee" ? 13 : 16, fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
        {valeur}
      </span>
      <span style={{ fontSize: 13, color: "var(--text-muted)", minWidth: 0, overflowWrap: "anywhere" }}>
        {label}
        {detail && <span style={{ color: "var(--text-sub)" }}>{" · "}{detail}</span>}
      </span>
    </div>
  );
}

/**
 * Répartition des notes, de 5 à 1 étoile.
 *
 * C'est ce qui distingue une synthèse d'un avis isolé. Les deux blocs
 * affichaient jusqu'ici les mêmes lignes de catégories, avec les mêmes barres :
 * l'œil ne pouvait pas les séparer, et le résumé n'apprenait rien de plus que
 * la carte du dessous.
 *
 * Une répartition ne peut exister qu'au pluriel, et elle dit ce qu'une moyenne
 * cache : une note de 3,5 issue de deux avis opposés n'est pas la même chose
 * qu'une note de 3,5 partagée par tout le monde.
 */
export function RepartitionNotes({ notes }: { notes: number[] }) {
  if (notes.length === 0) return null;

  const paliers = [5, 4, 3, 2, 1].map(etoile => ({
    etoile,
    // Une note de 4,5 compte pour 5 : c'est ainsi que la lisent les gens.
    nombre: notes.filter(n => Math.round(n) === etoile).length,
  }));
  const maximum = Math.max(...paliers.map(p => p.nombre), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }} aria-label="Répartition des notes">
      {paliers.map(({ etoile, nombre }) => (
        <div key={etoile} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: "0 0 26px", fontSize: 13, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
            {etoile} ★
          </span>
          <div style={{ flex: 1, height: 8, background: "var(--surface3)", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                width: `${(nombre / maximum) * 100}%`,
                height: "100%",
                borderRadius: 4,
                background: nombre > 0 ? "linear-gradient(90deg, #8b5cf6, #f97316)" : "transparent",
              }}
            />
          </div>
          <span style={{ flex: "0 0 20px", textAlign: "right", fontSize: 13, fontWeight: 700, color: nombre > 0 ? "var(--text)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
            {nombre}
          </span>
        </div>
      ))}
    </div>
  );
}
