import type { Metadata } from "next";
import { meta } from "@/i18n/meta";
import { Suspense } from "react";
import { FavorisClient } from "./FavorisClient";

/**
 * Page des favoris.
 *
 * Coquille statique. La version précédente était en force-dynamic : chaque
 * visite attendait la validation du jeton auprès de Supabase, puis la requête
 * en base, avant de renvoyer le moindre octet — 250 ms pendant lesquels
 * l'écran ne bougeait pas. La page part maintenant du cache et la liste se
 * charge derrière, via /api/user/favorites.
 *
 * L'authentification n'est pas perdue pour autant : le middleware protège
 * toujours ce chemin, et la route d'API refait la vérification côté serveur.
 * Un visiteur non connecté est renvoyé vers la connexion avant d'arriver ici.
 */
export const generateMetadata = () => meta({ titre: "meta.favorisTitre", indexer: false });

export default function FavoritesPage() {
  return (
    <div className="page-root">
      <main className="page-main-md">
        {/* Le choix Entreprises | Offres se lit dans l'adresse : sur une page
            statique, cette lecture doit être enveloppée. */}
        <Suspense fallback={null}>
          <FavorisClient />
        </Suspense>
      </main>
    </div>
  );
}
