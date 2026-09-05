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
        /* Sur telephone, les trois tuiles passaient en colonne unique : trois
           cartes pleine largeur, soit pres de trois cents pixels de hauteur
           avant d'atteindre « Mes avis », pour trois nombres a un ou deux
           chiffres. Elles reprennent le traitement des chiffres de la page
           d'accueil : une ligne, pas de cadre, pas d'icone, des filets pour
           separer. Le carre d'icone porte la couleur du theme, qui ne manque
           pas a la lecture d'un nombre. */
        @media (max-width: 900px) {
          .profile-kpi {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0 14px !important;
          }
          .profile-kpi > * {
            background: transparent !important;
            border: none !important;
            border-left: 1px solid var(--border) !important;
            border-radius: 0 !important;
            padding: 2px 0 2px 14px !important;
            gap: 5px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .profile-kpi > *:first-child { border-left: none !important; padding-left: 0 !important; }
          .profile-kpi .kpi-icone { display: none !important; }
          .profile-grid { grid-template-columns: 1fr !important; }
          .profile-sidebar { position: static !important; }
        }
        /* Le bandeau du nom, sur telephone.

           Le filigrane « workie » passait derriere le nom : a soixante-seize
           pixels de haut, le mot en fait deux cent dix de large, pour un
           bandeau qui en offre deux cent quatre-vingts entre ses marges. Il se
           retire plutot que de retrecir, et les marges se resserrent pour
           rendre au nom la largeur qu'elles lui prenaient. */
        @media (max-width: 700px) {
          .profil-filigrane { display: none !important; }
          .profil-bandeau { padding: 24px 20px 22px !important; }
          .profil-bandeau h1 { font-size: 23px !important; }
          .profil-infos {
            padding: 14px 20px 18px !important;
            font-size: 13.5px !important;
            gap: 7px !important;
          }
        }
      `}</style>
      <main className="page-main-md">
        <ProfilClient />
      </main>
    </div>
  );
}
