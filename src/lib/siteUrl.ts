/**
 * L'adresse du site qui tourne : workie.ch en production, l'adresse d'essai
 * sinon. Sert aux liens qui ressortent du site (e-mails, retours de Stripe) :
 * un paiement lancé depuis l'essai doit revenir sur l'essai.
 */
export const SITE_URL = process.env.VERCEL_ENV === "preview"
  ? "https://workie-test.vercel.app"
  : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch");
