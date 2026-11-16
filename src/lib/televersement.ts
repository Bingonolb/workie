/**
 * Envoi des bannières et logos dans le stockage, partagé entre l'administration
 * et l'espace entreprise. Ce n'est PAS un fichier d'actions serveur : rien ici
 * n'est appelable depuis le navigateur. Chaque appelant vérifie les droits.
 */
import { randomUUID } from "crypto";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logoAffichable } from "@/lib/logo";
import { avecCadrage, lireCadrage, CADRAGE_NEUTRE, ZOOM_MAX, variantesARechauffer, type Cadrage } from "@/lib/coverUrl";

/**
 * Le cadrage choisi dans l'éditeur, lu depuis le formulaire et borné.
 *
 * Il est rattaché à l'adresse finale de la bannière, après un éventuel
 * téléversement : sans cela, une image tout juste envoyée perdrait le cadrage
 * qu'on venait de régler sur son aperçu.
 */
function cadrageDuFormulaire(formData: FormData): Cadrage {
  const brut = String(formData.get("cover_cadrage") || "");
  const [x, y, zoom] = brut.split(",").map(Number);
  if (![x, y, zoom].every(Number.isFinite)) return CADRAGE_NEUTRE;
  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
    zoom: Math.min(ZOOM_MAX, Math.max(1, zoom)),
  };
}

export function banniereCadree(url: string | null, formData: FormData): string | null {
  if (!url) return null;
  return avecCadrage(lireCadrage(url).src, cadrageDuFormulaire(formData)) || null;
}

/**
 * Dépose la bannière envoyée et renvoie son adresse publique.
 *
 * Un problème d'image n'annule jamais l'enregistrement du texte. Auparavant un
 * format inattendu ou un envoi en échec interrompait toute l'action : la
 * saisie était perdue et il fallait tout recommencer, sans savoir pourquoi.
 * Les deux sujets restent séparés, ici comme à la création.
 *
 * Le chemin porte l'identifiant de la fiche, donc à la création cette fonction
 * n'est appelée qu'une fois la ligne insérée.
 */
export async function televerserCouverture(
  admin: ReturnType<typeof createAdminClient>,
  companyId: string,
  coverFile: FormDataEntryValue | null,
  // Le logo suit exactement le même chemin que la bannière, dans son propre dossier.
  dossier: "covers" | "logos" = "covers",
): Promise<{ url?: string; avertissement?: string }> {
  const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const EXT_MAP: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
  // 7 Mo, et non 10 : la requête elle-même est plafonnée à 8 Mo. Annoncer une
  // limite que la plateforme n'accorde pas produisait un échec sans message,
  // avant même d'arriver ici.
  const MAX_IMG = 7 * 1024 * 1024;

  if (!(coverFile instanceof File) || coverFile.size === 0) return {};
  if (!ALLOWED_IMG.includes(coverFile.type)) {
    return { avertissement: "Le texte est enregistré. L'image a été ignorée : format non supporté (JPG, PNG, WebP, GIF)." };
  }
  if (coverFile.size > MAX_IMG) {
    return { avertissement: "Le texte est enregistré. L'image a été ignorée : trop lourde (7 Mo maximum)." };
  }

  const ext = EXT_MAP[coverFile.type] ?? "jpg";
  const path = `${dossier}/${companyId}/${randomUUID()}.${ext}`;
  // Cache d'un an : le nom du fichier est un UUID, une image ne change donc
  // jamais à adresse égale. Avec le réglage par défaut d'une heure, le
  // navigateur redemandait chaque bannière à chaque retour sur le site.
  const { error } = await admin.storage.from("covers").upload(path, coverFile, { contentType: coverFile.type, upsert: true, cacheControl: "31536000" });
  if (error) {
    // L'échec était jusqu'ici parfaitement silencieux : l'ancienne image
    // restait en place sans que personne ne sache pourquoi.
    return { avertissement: "Le texte est enregistré. L'envoi de l'image a échoué." };
  }
  const { data: pub } = admin.storage.from("covers").getPublicUrl(path);
  // Toutes ses tailles préparées d'avance, une fois la réponse partie : le
  // premier visiteur ne paie pas la demi-seconde de redimensionnement.
  after(() => (dossier === "logos" ? rechaufferLogo(pub.publicUrl) : rechaufferBanniere(pub.publicUrl)));
  return { url: pub.publicUrl };
}

async function rechaufferLogo(url: string): Promise<void> {
  const v = logoAffichable(url);
  if (v) await fetch(v, { headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" } }).then(r => r.arrayBuffer()).catch(() => null);
}

async function rechaufferBanniere(url: string): Promise<void> {
  const variantes = variantesARechauffer(url);
  for (let i = 0; i < variantes.length; i += 3) {
    await Promise.all(variantes.slice(i, i + 3).map(v =>
      fetch(v, { headers: { Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" } }).then(r => r.arrayBuffer()).catch(() => null),
    ));
  }
}

