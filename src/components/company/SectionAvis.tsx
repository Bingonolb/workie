"use client";

import { useMemo, useState } from "react";
import { CheckCircle } from "lucide-react";
import type { Review } from "@/lib/types";
import { RATING_CATEGORIES } from "@/lib/reviewCategories";
import { HelpfulButton } from "@/components/HelpfulButton";
import { ReportButton } from "@/components/ReportButton";
import { Stars, RatingRow } from "./notation";
import { useEtatFiche } from "./EtatFiche";

/**
 * Liste des avis, avec son tri.
 *
 * Le tri passait auparavant par l'URL (`?sort=recent`) et chaque changement
 * déclenchait une navigation complète. Deux conséquences : un aller-retour
 * serveur pour réordonner une liste déjà chargée, et surtout la lecture de
 * `searchParams`, qui suffit à rendre la route dynamique — donc impossible à
 * précharger. Le tri est désormais un état local : instantané, et la fiche
 * redevient cacheable.
 */

const EMPLOYMENT_LABELS: Record<string, string> = {
  cdi: "CDI", cdd: "CDD", stage: "Stage", alternance: "Alternance", freelance: "Freelance",
};
const DURATION_LABELS: Record<string, string> = {
  moins_6mois: "< 6 mois", "6mois_2ans": "6 mois – 2 ans", plus_2ans: "+ 2 ans",
};
const WORK_MODE_LABELS: Record<string, string> = {
  "présentiel": "🏢 Présentiel", hybride: "🔀 Hybride", remote: "🏠 Remote",
};
const RECOMMEND_LABELS: Record<string, { label: string; color: string }> = {
  oui:       { label: "Recommande",          color: "#10b981" },
  non:       { label: "Ne recommande pas",   color: "#ef4444" },
  ca_depend: { label: "Recommande : mitigé", color: "#f59e0b" },
};
const RETURN_LABELS: Record<string, { label: string; color: string }> = {
  oui:       { label: "Reviendrait",             color: "#10b981" },
  peut_etre: { label: "Reviendrait : peut-être", color: "#f59e0b" },
  non:       { label: "Ne reviendrait pas",      color: "#ef4444" },
};

// ── Pertinence ───────────────────────────────────────────────────────────────
// Combinaison pondérée de la fraîcheur, des votes « utile », de la complétude
// et de la vérification de l'auteur. Chaque facteur est ramené à [0, 1].
function scorePertinence(review: Review): number {
  const ageJours = (Date.now() - new Date(review.created_at ?? 0).getTime()) / 86400000;
  // Décroissance exponentielle, demi-vie ~18 mois : un avis récent domine, mais
  // un avis de trois ans avec 20 votes bat un avis d'un mois sans vote.
  const fraicheur = Math.exp(-ageJours / 540);
  const utilite = Math.min(Math.log1p(Number(review.helpful_count ?? 0)) / Math.log1p(20), 1);
  const champs = [
    review.salary_chf,
    review.rating_culture, review.rating_management, review.rating_worklife, review.rating_career,
    review.work_mode, review.employment_type, review.duration_range,
  ];
  const completude = champs.filter(v => v !== null && v !== undefined && v !== 0 && v !== "").length / champs.length;
  const bonusVerifie = review.is_verified_author ? 0.08 : 0;
  return utilite * 0.35 + fraicheur * 0.42 + completude * 0.15 + bonusVerifie;
}

type Tri = "relevance" | "recent" | "helpful";

const ONGLETS: { v: Tri; l: string }[] = [
  { v: "relevance", l: "Pertinence" },
  { v: "recent",    l: "Récents" },
  { v: "helpful",   l: "Utiles" },
];

export function SectionAvis({ reviews, companyName }: { reviews: Review[]; companyName: string }) {
  const [tri, setTri] = useState<Tri>("relevance");
  const { isLoggedIn, votedReviewIds } = useEtatFiche();
  const votes = useMemo(() => new Set(votedReviewIds), [votedReviewIds]);

  const triees = useMemo(() => {
    const copie = [...reviews];
    if (tri === "recent") return copie.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (tri === "helpful") return copie.sort((a, b) => Number(b.helpful_count ?? 0) - Number(a.helpful_count ?? 0));
    return copie.sort((a, b) => scorePertinence(b) - scorePertinence(a));
  }, [reviews, tri]);

  return (
    <>
      {triees.length > 1 && (
        <div style={{ display: "flex", gap: 6 }}>
          {ONGLETS.map(({ v, l }) => (
            <button
              key={v}
              type="button"
              onClick={() => setTri(v)}
              aria-pressed={tri === v}
              style={{
                // 40 px de haut : ces onglets se touchent au pouce, et cinq
                // pixels de rembourrage vertical n'en faisaient que 32.
                fontSize: 13.5, fontWeight: 600, padding: "0 14px", minHeight: 40, borderRadius: 8, cursor: "pointer",
                background: tri === v ? "rgba(139,92,246,0.12)" : "var(--surface2)",
                color: tri === v ? "#8b5cf6" : "var(--text-muted)",
                border: `1px solid ${tri === v ? "rgba(139,92,246,0.35)" : "var(--border2)"}`,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      <div data-liste-avis style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {triees.map(r => (
          <CarteAvis key={r.id} review={r} isLoggedIn={isLoggedIn} companyName={companyName} initialVoted={votes.has(r.id)} />
        ))}
      </div>
    </>
  );
}

function CarteAvis({ review, isLoggedIn, companyName, initialVoted }: {
  review: Review; isLoggedIn: boolean; companyName: string; initialVoted: boolean;
}) {
  // L'ancienneté dépend de l'heure courante, donc le serveur et le navigateur
  // ne calculent pas forcément la même chose — le rendu n'est pas pur. React
  // détecte alors l'écart à l'hydratation et refait le rendu : c'est une des
  // sources des sursauts visibles à l'ouverture d'une fiche. On lui signale que
  // cet écart est attendu, ce qui évite le second rendu.
  const age = (() => {
    // eslint-disable-next-line react-hooks/purity
    const jours = Math.floor((Date.now() - new Date(review.created_at).getTime()) / 86400000);
    if (jours === 0) return "Aujourd'hui";
    if (jours < 7) return `Il y a ${jours}j`;
    if (jours < 30) return `Il y a ${Math.floor(jours / 7)} sem.`;
    return `Il y a ${Math.floor(jours / 30)} mois`;
  })();

  const rec = review.would_recommend ? RECOMMEND_LABELS[review.would_recommend] : null;
  const ret = review.would_return ? RETURN_LABELS[review.would_return] : null;
  const sousNotes = RATING_CATEGORIES.some(({ key }) => review[key]);

  // La situation de la personne, en une phrase lisible plutôt qu'en pastilles
  // alignées. Sans texte d'avis, c'est tout ce qui reste pour qu'un lecteur se
  // dise « quelqu'un occupait ce poste, dans ces conditions, et voilà ce qu'il
  // en a pensé ». En rangée de pastilles toutes identiques, on lisait un
  // tableau de bord ; en phrase, on lit une personne.
  const situation = [
    review.employment_type ? (EMPLOYMENT_LABELS[review.employment_type] ?? review.employment_type) : null,
    review.work_mode ? (WORK_MODE_LABELS[review.work_mode] ?? review.work_mode) : null,
    review.duration_range ? (DURATION_LABELS[review.duration_range] ?? review.duration_range) : null,
    review.is_current ? "encore en poste" : "a quitté l'entreprise",
  ].filter(Boolean) as string[];

  // Le salaire garde sa pastille : c'est l'information la plus recherchée de
  // la fiche, et elle doit rester repérable d'un coup d'œil.
  const salaire = Number(review.salary_chf) > 0
    ? `CHF ${Math.round(Number(review.salary_chf) / 1000)}k / an`
    : null;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(249,115,22,0.08))",
            border: "2px solid rgba(139,92,246,0.2)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{Number(review.rating_overall).toFixed(1)}</span>
            <span style={{ fontSize: 8, color: "var(--text-muted)", fontWeight: 600 }}>/ 5</span>
          </div>
          <div style={{ minWidth: 0 }}>
            {/* Le poste en titre. C'est la seule chose qui incarne l'auteur :
                le reléguer au rang de pastille, à égalité avec le type de
                contrat, effaçait la personne derrière les chiffres. */}
            <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
              {review.job_title || "Un employé"}
            </p>
            {situation.length > 0 && (
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.4 }}>
                {situation.join(" · ")}
              </p>
            )}
            <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Stars rating={Number(review.rating_overall)} size={13} />
              {rec && <span style={{ fontSize: 14, fontWeight: 700, color: rec.color }}>{rec.label}</span>}
              {ret && <span style={{ fontSize: 14, fontWeight: 700, color: ret.color }}>{ret.label}</span>}
            </div>
          </div>
          {review.is_verified_author && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 50,
              background: "rgba(16,185,129,0.1)", color: "#10b981",
              border: "1px solid rgba(16,185,129,0.25)",
            }}>
              <CheckCircle size={10} aria-hidden="true" /> Vérifié
            </span>
          )}
        </div>
        <span suppressHydrationWarning style={{ fontSize: 14, color: "var(--text-muted)", flexShrink: 0 }}>{age}</span>
      </div>

      {salaire && (
        <div style={{ marginBottom: 14 }}>
          <span style={{
            fontSize: 13.5, fontWeight: 700, padding: "4px 12px", borderRadius: 50,
            background: "rgba(16,185,129,0.08)", color: "#10b981",
            border: "1px solid rgba(16,185,129,0.25)",
          }}>
            {salaire}
          </span>
        </div>
      )}

      {sousNotes && (
        <div className="review-subratings" style={{ paddingTop: 14, borderTop: "1px solid var(--border)", marginBottom: 14 }}>
          {RATING_CATEGORIES.map(({ key, label }) => {
            const brut = review[key];
            return <RatingRow key={key} label={label} value={brut ? Number(brut) : null} />;
          })}
        </div>
      )}

      {/* Aucun texte n'est rendu : la plateforme est passée au format 100% notes.
          Les anciens avis conservent leur texte en base, seules leurs notes
          sont affichées. */}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: sousNotes || salaire ? 0 : 4 }}>
        <HelpfulButton reviewId={review.id} initialCount={review.helpful_count} initialVoted={initialVoted} />
        <ReportButton
          targetType="review"
          targetId={review.id}
          targetLabel={`[${companyName}] Avis : ${review.job_title ?? "employé"}`}
          isLoggedIn={isLoggedIn}
          variant="link"
        />
      </div>
    </div>
  );
}
