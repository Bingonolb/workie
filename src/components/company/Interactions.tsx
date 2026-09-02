"use client";

import { Pencil } from "lucide-react";

import Link from "next/link";
import { useEtatFiche } from "./EtatFiche";
import { SaveButton } from "@/components/SaveButton";
import { GuestSaveButton } from "@/components/GuestSaveButton";
import { ReportButton } from "@/components/ReportButton";
import { CompanyVoteButtons } from "@/components/CompanyVoteButtons";
import { GuestContentGate } from "@/components/GuestContentGate";
import { ReviewForm } from "@/components/ReviewForm";

/**
 * Zones d'une fiche entreprise qui dépendent du visiteur.
 *
 * Elles étaient rendues côté serveur à partir du cookie de session, ce qui
 * forçait Next à traiter toute la route comme dynamique — donc impossible à
 * précharger au survol d'un lien. Les voici isolées côté client, alimentées par
 * le contexte, pour que le reste de la page redevienne cacheable.
 */

export function ActionsFiche({ companyId, companyName }: { companyId: string; companyName: string }) {
  const { isLoggedIn, isFav, isAdmin } = useEtatFiche();
  return (
    <>
      {/* Raccourci d'administration, pas une autorisation.
          `isAdmin` vaut faux tant que /api/company/[id]/me n'a pas répondu :
          la fiche étant une coquille rendue une fois pour tout le monde, ce
          bouton ne peut pas se trouver dans le HTML partagé. Et s'il finissait
          malgré tout sous les yeux d'un visiteur, il ne lui donnerait rien :
          /admin redirige les non-admins, la page d'édition revérifie le rôle,
          et adminUpdateCompany lève « Accès refusé » après l'avoir lu en base.
          Trois barrières côté serveur ; celle-ci n'en est pas une. */}
      {isAdmin && (
        <Link
          href={`/admin/company/${companyId}`}
          aria-label="Modifier cette fiche"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "10px 16px", minHeight: 44, boxSizing: "border-box",
            borderRadius: 10, fontSize: 13.5, fontWeight: 700,
            color: "#fff", textDecoration: "none",
            background: "rgba(139,92,246,0.85)",
            border: "1px solid rgba(255,255,255,0.22)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <Pencil size={15} aria-hidden="true" /> Modifier
        </Link>
      )}
      {isLoggedIn ? <SaveButton companyId={companyId} initialFav={isFav} /> : <GuestSaveButton />}
      <ReportButton
        targetType="company"
        targetId={companyId}
        targetLabel={companyName}
        isLoggedIn={isLoggedIn}
        variant="icon"
      />
    </>
  );
}

export function VotesFiche({ companyId, initialScore }: { companyId: string; initialScore: number }) {
  const { isLoggedIn, isAdmin, penaltyCredits, boosted, penalized } = useEtatFiche();
  return (
    <CompanyVoteButtons
      companyId={companyId}
      isLoggedIn={isLoggedIn}
      isAdmin={isAdmin}
      penaltyCredits={penaltyCredits}
      initialBoosted={boosted}
      initialPenalized={penalized}
      initialScore={initialScore}
      variant="card"
    />
  );
}

/** Contenu réservé : flouté pour un visiteur, entier une fois connecté. */
export function PorteInvite({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useEtatFiche();
  return <GuestContentGate isGuest={!isLoggedIn}>{children}</GuestContentGate>;
}

export function FormulaireAvis({ companyId }: { companyId: string }) {
  const { isLoggedIn } = useEtatFiche();
  if (isLoggedIn) return <ReviewForm companyId={companyId} />;
  return (
    <div style={{ textAlign: "center", padding: "24px" }}>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>
        Connectez-vous pour publier un avis anonyme.
      </p>
      <Link href="/login" style={{
        display: "inline-block", background: "var(--brand)",
        color: "#fff", fontWeight: 700, borderRadius: 10, padding: "12px 28px",
        textDecoration: "none", fontSize: 14,
      }}>
        Se connecter
      </Link>
    </div>
  );
}
