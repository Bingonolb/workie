import type { User } from "@supabase/supabase-js";

/**
 * Conditions à remplir pour qu'un compte puisse peser sur le contenu public.
 *
 * Publier un avis les exigeait déjà. Les gestes qui modifient le classement —
 * flamme, boost, pénalité — n'exigeaient rien : un compte créé dans la seconde
 * pouvait déplacer une entreprise dans le palmarès. C'est exactement le levier
 * qu'utilise quiconque veut fabriquer une réputation, et il était ouvert.
 *
 * Deux conditions, les mêmes que pour un avis :
 *
 *   · l'adresse e-mail est confirmée — elle rattache le compte à quelqu'un ;
 *   · le compte a plus de 24 heures — créer des comptes jetables en série
 *     devient coûteux en temps, ce qui suffit à décourager l'essentiel.
 *
 * À noter : la première condition ne vaut que si le projet Supabase exige
 * réellement la confirmation. Tant que l'option est désactivée côté
 * fournisseur, `email_confirmed_at` est renseigné à la création et le contrôle
 * passe toujours. Le contrôle d'ancienneté, lui, s'applique immédiatement.
 */
export const DELAI_AVANT_CONTRIBUTION_MS = 24 * 60 * 60 * 1000;

export function refusDeContribution(user: User | null): string | null {
  if (!user) return "Tu dois être connecté.";
  if (!user.email_confirmed_at) return "Confirme ton adresse email avant de participer.";
  const age = Date.now() - new Date(user.created_at).getTime();
  if (age < DELAI_AVANT_CONTRIBUTION_MS) {
    return "Ton compte doit avoir au moins 24h pour agir sur le classement.";
  }
  return null;
}
