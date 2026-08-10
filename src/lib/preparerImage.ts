"use client";

/**
 * Réduit une image dans le navigateur avant l'envoi.
 *
 * Trois limites se superposaient sans se parler : le code annonçait 10 Mo, la
 * requête Next.js s'arrête à 8, et le bucket accepte 20. Une photo de 9 Mo
 * échouait donc *avant* d'atteindre le contrôle applicatif, sans message
 * utile — d'où l'impression que l'envoi « bugue » sans raison.
 *
 * Plutôt que d'afficher une limite et de renvoyer l'utilisateur à son logiciel
 * de retouche, on redimensionne sur place. Une photo de 40 Mo sortie d'un
 * appareil devient un fichier de quelques centaines de kilo-octets, et l'envoi
 * passe toujours.
 *
 * Sur la largeur : une bannière s'affiche au plus sur 1280 px. 2560 couvre les
 * écrans à densité double, ce qui est le maximum utile — au-delà, le poids
 * augmente sans qu'aucun œil ne voie la différence. Une image 16K pèse plus de
 * cent mégaoctets pour un résultat strictement identique à l'écran.
 *
 * Le WebP est choisi quand le navigateur sait l'écrire : à qualité visuelle
 * égale il pèse environ un tiers de moins qu'un JPEG.
 */

export const LARGEUR_MAX = 2560;
export const POIDS_MAX_OCTETS = 6 * 1024 * 1024; // marge sous la limite de requête

export type ImagePreparee = { fichier: File; reduite: boolean; avant: number; apres: number };

export async function preparerImage(fichier: File): Promise<ImagePreparee> {
  const avant = fichier.size;

  // Les formats que le navigateur ne sait pas décoder (HEIC de certains
  // iPhone) sont transmis tels quels : mieux vaut laisser le serveur répondre
  // clairement que produire une image vide.
  if (!/^image\/(jpeg|png|webp|gif)$/.test(fichier.type)) {
    return { fichier, reduite: false, avant, apres: avant };
  }

  // Une image animée perdrait son animation en passant par le canevas.
  if (fichier.type === "image/gif") {
    return { fichier, reduite: false, avant, apres: avant };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(fichier);
  } catch {
    return { fichier, reduite: false, avant, apres: avant };
  }

  const facteur = Math.min(1, LARGEUR_MAX / bitmap.width);
  const dejaLegere = avant <= POIDS_MAX_OCTETS;

  // Rien à gagner : image déjà petite et déjà légère.
  if (facteur === 1 && dejaLegere) {
    bitmap.close();
    return { fichier, reduite: false, avant, apres: avant };
  }

  const largeur = Math.round(bitmap.width * facteur);
  const hauteur = Math.round(bitmap.height * facteur);

  const canevas = document.createElement("canvas");
  canevas.width = largeur;
  canevas.height = hauteur;
  const ctx = canevas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { fichier, reduite: false, avant, apres: avant };
  }
  ctx.drawImage(bitmap, 0, 0, largeur, hauteur);
  bitmap.close();

  const typeSortie = canevas.toDataURL("image/webp").startsWith("data:image/webp")
    ? "image/webp"
    : "image/jpeg";

  const blob = await new Promise<Blob | null>(resoudre =>
    canevas.toBlob(resoudre, typeSortie, 0.85)
  );
  if (!blob) return { fichier, reduite: false, avant, apres: avant };

  // Cas rare mais réel : sur une image déjà très compressée, le réencodage
  // peut alourdir. On garde alors l'original.
  if (blob.size >= avant) {
    return { fichier, reduite: false, avant, apres: avant };
  }

  const extension = typeSortie === "image/webp" ? "webp" : "jpg";
  const nom = fichier.name.replace(/\.[^.]+$/, "") + "." + extension;
  const reduit = new File([blob], nom, { type: typeSortie, lastModified: Date.now() });

  return { fichier: reduit, reduite: true, avant, apres: reduit.size };
}

/** « 2,4 Mo », pour un message lisible. */
export function formaterPoids(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}
