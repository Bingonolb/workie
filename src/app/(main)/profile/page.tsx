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
        @media (max-width: 700px) {
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
