import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/supabase/server";

/**
 * Ferme l'espace annonceur au public.
 *
 * L'offre entreprise — revendication de fiche, abonnement, campagnes — n'est
 * pas ouverte : aucune entreprise ne peut aujourd'hui revendiquer sa page ni
 * souscrire. Laisser le parcours accessible reviendrait à proposer un service
 * qui n'existe pas encore.
 *
 * Le code reste en place et complet, il n'est que rendu inatteignable. La
 * garde vit dans un layout plutôt que dans chaque page : elle couvre ainsi la
 * liste, la création et le détail d'une campagne, y compris une URL saisie à
 * la main. Les liens qui y menaient — pied de page de l'accueil et tuile du
 * profil — ont été retirés en même temps.
 *
 * Les administrateurs conservent l'accès, pour pouvoir vérifier le parcours
 * avant sa réouverture.
 */
export default async function LayoutEspaceAnnonceur({ children }: { children: React.ReactNode }) {
  const estAdmin = await getIsAdmin().catch(() => false);
  if (!estAdmin) redirect("/profile");
  return <>{children}</>;
}
