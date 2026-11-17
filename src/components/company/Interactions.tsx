"use client";

import { Pencil } from "lucide-react";

import Link from "next/link";
import { useEtatFiche } from "./EtatFiche";
import { SaveButton } from "@/components/SaveButton";
import { GuestSaveButton } from "@/components/GuestSaveButton";
import { MenuFiche } from "./MenuFiche";
import { GuestContentGate } from "@/components/GuestContentGate";
import { BoutonVueEntreprise } from "./BoutonVueEntreprise";

/**
 * Zones d'une fiche entreprise qui dépendent du visiteur.
 *
 * Elles étaient rendues côté serveur à partir du cookie de session, ce qui
 * forçait Next à traiter toute la route comme dynamique — donc impossible à
 * précharger au survol d'un lien. Les voici isolées côté client, alimentées par
 * le contexte, pour que le reste de la page redevienne cacheable.
 */

export function ActionsFiche({ companyId, companyName, slug = null, gerable = false }: { companyId: string; companyName: string; slug?: string | null; gerable?: boolean }) {
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
          className="btn btn-photo"
        >
          <Pencil size={15} aria-hidden="true" /> Modifier
        </Link>
      )}
      {isAdmin && <BoutonVueEntreprise companyId={companyId} />}
      {isLoggedIn ? <SaveButton companyId={companyId} initialFav={isFav} /> : <GuestSaveButton />}
      <MenuFiche companyId={companyId} companyName={companyName} slug={slug} gerable={gerable} isLoggedIn={isLoggedIn} />
    </>
  );
}

/** Contenu réservé : flouté pour un visiteur, entier une fois connecté. */
export function PorteInvite({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useEtatFiche();
  return <GuestContentGate isGuest={!isLoggedIn}>{children}</GuestContentGate>;
}
