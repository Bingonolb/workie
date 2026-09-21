"use client";

import { useState } from "react";
import { estRedimensionnable, largeurCouverture } from "@/lib/coverUrl";

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
 * Candidats proposés au navigateur.
 *
 * Le plafond était initialement à 1600, et le navigateur téléchargeait
 * effectivement un 1600 px pour un emplacement de 358 — 198 Ko au lieu de 28.
 * Descendu à 940, il a résolu le poids mais sous-servait les écrans à forte
 * densité : une carte pleine largeur sur un téléphone à densité triple demande
 * plus de 1000 px, et l'image paraissait moins nette qu'avant.
 *
 * 1280 est donc le bon plafond : il couvre le mobile haute densité sans jamais
 * être choisi sur un écran de bureau, où `sizes` annonce 400 px. Ce qui
 * empêchait auparavant `sizes` d'être respecté, ce sont les attributs
 * width/height à 1600x900, qui poussaient le navigateur vers les gros
 * candidats ; ils valent maintenant 640x360.
 */
/*
 * Les largeurs proposees au navigateur.
 *
 * La plus petite etait 320 pixels. Or les listes de suggestions affichent des
 * vignettes de 56 pixels : sur un ecran a deux fois la densite, il en faut
 * 112, et le navigateur telechargeait la seule candidate disponible, trois
 * fois trop grande. Quatre suggestions par groupe, trois groupes par fiche,
 * plus huit sur le profil : cela fait vingt images inutilement lourdes par
 * page.
 *
 * Les petites tailles sont donc ajoutees en tete. Le navigateur choisit
 * toujours la plus petite qui couvre le besoin reel ; encore faut-il la lui
 * proposer.
 */
const LARGEURS = [128, 192, 256, 320, 480, 640, 940, 1280];

export function CoverImage({
  src,
  color,
  alt = "",
  sizes,
  priority = false,
  className,
  vignette = false,
}: {
  src: string | null | undefined;
  color?: string | null;
  alt?: string;
  sizes: string;
  /** Vrai pour les cartes visibles sans défiler : elles se chargent tout de suite. */
  priority?: boolean;
  className?: string;
  /** Vignette de liste : quelques dizaines de pixels, jamais une banniere. */
  vignette?: boolean;
}) {
  const [charge, setCharge] = useState(false);
  const fond = color || "var(--surface2)";

  if (!src) return <div className={className} style={{ position: "absolute", inset: 0, background: fond }} />;

  const srcSet = estRedimensionnable(src)
    ? LARGEURS.map(w => `${largeurCouverture(src, w)} ${w}w`).join(", ")
    : undefined;

  return (
    <div className={className} style={{ position: "absolute", inset: 0, background: fond }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        // Repli pour les navigateurs sans srcset, et premiere candidate que
        // certains prennent au pied de la lettre : une vignette n'a pas besoin
        // de 640 pixels de large.
        src={largeurCouverture(src, vignette ? 192 : 640)}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        // La hauteur réelle est imposée par le conteneur ; ces attributs ne
        // donnent que le ratio, pour éviter un décalage de mise en page pendant
        // le chargement. Ils restent petits : annoncer 1600x900 poussait le
        // navigateur vers les plus gros candidats du srcset.
        width={640}
        height={360}
        // `eager` seulement pour les cartes visibles sans défiler.
        //
        // Tout était en `eager` auparavant, pour éviter que le téléchargement
        // se voie au défilement sur un lot de 24 cartes. Sur /favorites le
        // compte n'est pas plafonné : mesuré sur un écran de 375 px, 72 images
        // en `eager` dont 62 déjà téléchargées alors que deux seulement
        // étaient à l'écran. C'est toute la bande passante d'un téléphone
        // dépensée pour rien.
        //
        // `lazy` ne réintroduit pas l'à-coup redouté : les navigateurs
        // déclenchent le chargement bien avant que l'image entre dans la vue,
        // avec une avance de l'ordre du millier de pixels. Le vrai levier
        // reste `priority`, que les grilles passent à leurs premières cartes.
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
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
    if (!url || !estRedimensionnable(url)) continue;
    const img = new Image();
    img.src = largeurCouverture(url, largeur);
    void img.decode?.().catch(() => { /* image indisponible : sans conséquence */ });
  }
}
