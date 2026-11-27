// Module serveur : jamais importé par un composant client.
import { createHash } from "crypto";

/**
 * Empreinte anonyme d'un visiteur, valable une journée : hachage de l'IP, du
 * navigateur et de la date avec un secret serveur. Elle reconnaît le même
 * visiteur pendant la journée sans conserver son adresse IP, et change chaque
 * jour, ce qui empêche de le suivre dans le temps.
 */
export function empreinteDuJour(ip: string, ua: string): string {
  const sel = process.env.EMPREINTE_SEL ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const jour = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${sel}|${jour}|${ip}|${ua}`).digest("hex").slice(0, 32);
}

export const ROBOT = /bot|crawl|spider|slurp|preview|fetch|curl|wget|python|headless|lighthouse|whatsapp|facebookexternalhit|telegram|slack|discord/i;

/**
 * La clé qui identifie la personne pour les compteurs « une fois par jour » :
 * son compte si elle est connectée, sinon l'empreinte du jour. Null pour un
 * robot (aperçus de lien WhatsApp, moteurs de recherche) : il ne compte pas.
 */
export function cleVisiteur(h: Headers, userId: string | null | undefined): string | null {
  const ua = h.get("user-agent") ?? "";
  if (!ua || ROBOT.test(ua)) return null;
  if (userId) return `u:${userId}`;
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  return empreinteDuJour(ip, ua);
}
