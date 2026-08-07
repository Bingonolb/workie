import type { Metadata } from "next";
import { ProfilClient } from "./ProfilClient";

/**
 * Page profil.
 *
 * Coquille statique. La version précédente était en force-dynamic : validation
 * du jeton auprès de Supabase puis trois requêtes en base avant le premier
 * octet — 965 ms à froid, 300 à 400 ms ensuite, pendant lesquelles l'écran ne
 * bougeait pas. Le contenu arrive maintenant via /api/user/profile.
 *
 * L'accès reste protégé : le middleware garde ce chemin, et la route d'API
 * refait la vérification côté serveur. Rien de personnel n'est mis en cache —
 * la coquille ne contient que la mise en page.
 */
export const metadata: Metadata = {
  title: "Mon profil · Workie",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <div className="page-root">
      <style>{`
        /* 900 et non 700 : la barre latérale fait 340 px de large, donc en
           dessous de 900 il ne reste plus assez de place à gauche pour le
           tableau des avis. Ses colonnes fixes (contrat, note, salaire, date)
           occupent 330 px ; le nom de l'entreprise se retrouvait écrasé à
           quelques pixels et, comme il est en nowrap sous overflow hidden,
           il disparaissait complètement. La variante compacte du tableau ne
           prenait le relais qu'à 600 px : toute la bande 600–900 affichait
           des lignes sans nom d'entreprise. */
        @media (max-width: 900px) {
          .profile-kpi { grid-template-columns: 1fr !important; }
          .profile-grid { grid-template-columns: 1fr !important; }
          .profile-sidebar { position: static !important; }
        }
      `}</style>
      <main className="page-main-md">
        <ProfilClient />
      </main>
    </div>
  );
}
