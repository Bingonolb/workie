"use client";

import { useState } from "react";
import { estPexels, aLaLargeur } from "@/lib/coverUrl";

/**
 * Bannière d'entreprise, servie directement par le CDN Pexels.
 *
 * On n'utilise pas next/image ici, et c'est délibéré. next/image route chaque
 * photo par /_next/image : à froid, le serveur doit télécharger l'original,
 * le décoder, le redimensionner et le réencoder avant de répondre. Sur une
 * grille de 24 cartes, cela veut dire 24 transformations déclenchées au moment
 * du clic sur « voir plus » — c'est exactement l'attente visible qu'on cherche
 * à supprimer.
 *
 * Les URL Pexels acceptent la largeur en paramètre et leur CDN redimensionne
 * à la volée, déjà en cache côté edge. On construit donc le srcset nous-mêmes
 * et le navigateur télécharge une seule image, à la bonne taille, sans hop
 * intermédiaire.
 *
 * Le fond prend la couleur dominante de la photo (avg_color de Pexels), donc
 * la carte est colorée dès le premier rendu : il n'y a jamais de rectangle gris,
 * même sur une connexion lente. L'image se fond ensuite par-dessus.
 */

/**
 * Candidats proposés au navigateur. On s'arrête à 940 volontairement.
 *
 * Une carte mesure 358 px de large sur un écran de 1280, et au plus la largeur
 * de l'écran sur mobile. Laisser des candidats à 1280 et 1600 ne servait rien :
 * le navigateur est libre de prendre un candidat plus grand que nécessaire — il
 * le fait notamment quand une variante est déjà en cache — et il téléchargeait
 * un 1600 px pour un emplacement de 358. Mesuré sur /explore avant correction.
 */
const LARGEURS = [320, 480, 640, 940];

export function CoverImage({
  src,
  color,
  alt = "",
  sizes,
  priority = false,
  className,
}: {
  src: string | null | undefined;
  color?: string | null;
  alt?: string;
  sizes: string;
  /** Vrai pour les cartes visibles sans défiler : elles se chargent tout de suite. */
  priority?: boolean;
  className?: string;
}) {
  const [charge, setCharge] = useState(false);
  const fond = color || "var(--surface2)";

  if (!src) return <div className={className} style={{ position: "absolute", inset: 0, background: fond }} />;

  const srcSet = estPexels(src)
    ? LARGEURS.map(w => `${aLaLargeur(src, w)} ${w}w`).join(", ")
    : undefined;

  return (
    <div className={className} style={{ position: "absolute", inset: 0, background: fond }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={estPexels(src) ? aLaLargeur(src, 640) : src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        // La hauteur réelle est imposée par le conteneur ; ces attributs ne
        // donnent que le ratio, pour éviter un décalage de mise en page pendant
        // le chargement. Ils restent petits : annoncer 1600x900 poussait le
        // navigateur vers les plus gros candidats du srcset.
        width={640}
        height={360}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onLoad={() => setCharge(true)}
        onError={() => setCharge(false)}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%", objectFit: "cover",
          opacity: charge ? 1 : 0,
          transition: "opacity 0.25s ease-out",
        }}
      />
    </div>
  );
}

/**
 * Précharge des bannières avant qu'elles soient demandées.
 *
 * Appelé quand le lot suivant est connu mais pas encore affiché : au moment où
 * l'utilisateur clique sur « voir plus », les images sont déjà dans le cache HTTP
 * et l'affichage est immédiat.
 *
 * On passe par le décodage complet plutôt qu'un simple `new Image()` : sans
 * `decode()`, le navigateur a le fichier mais doit encore le décoder au moment
 * de l'afficher, ce qui laisse un à-coup visible sur les grandes photos.
 */
export function prechargerCouvertures(urls: (string | null | undefined)[], largeur = 940) {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    if (!url || !estPexels(url)) continue;
    const img = new Image();
    img.src = aLaLargeur(url, largeur);
    void img.decode?.().catch(() => { /* image indisponible : sans conséquence */ });
  }
}
