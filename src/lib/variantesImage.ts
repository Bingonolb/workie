// Module serveur (sharp, clé de service) : jamais importé par un composant client.
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { LARGEURS_VARIANTES, cheminVariante } from "@/lib/coverUrl";

/**
 * Prépare une fois pour toutes les tailles d'une image déposée dans le
 * stockage (bannière ou logo), à côté de l'original.
 *
 * Le site les redemandait à Supabase à chaque largeur, et le service de
 * transformation d'images est limité à 100 images d'origine par mois sur le
 * plan Pro : le catalogue en compte près de 500. Préparées ici, les tailles
 * sont de simples fichiers : aucun coût, aucune attente à la première visite.
 *
 * Toutes les largeurs sont écrites, même au-delà de l'original (sans
 * l'agrandir) : le site peut alors demander n'importe quelle taille de la
 * liste sans jamais tomber sur un fichier absent.
 */
export async function preparerVariantes(
  admin: ReturnType<typeof createAdminClient>,
  chemin: string,
  original: Buffer,
): Promise<boolean> {
  const image = sharp(original, { failOn: "none" }).rotate();
  const envois = LARGEURS_VARIANTES.map(async w => {
    const donnees = await image.clone()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: w >= 1920 ? 80 : 84, effort: 4 })
      .toBuffer();
    const { error } = await admin.storage.from("covers").upload(cheminVariante(chemin, w), donnees, {
      contentType: "image/webp", upsert: true, cacheControl: "31536000",
    });
    return !error;
  });
  return (await Promise.all(envois)).every(Boolean);
}
