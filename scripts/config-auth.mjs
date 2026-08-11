#!/usr/bin/env node
/**
 * Lit et modifie la configuration d'authentification du projet Supabase.
 *
 * Ce réglage n'est pas dans la base : il vit dans la configuration du projet,
 * hors de portée des outils qui interrogent Postgres. Il fallait donc passer
 * par l'API de gestion, ce que fait ce script.
 *
 * Le point qui a motivé son écriture : « Confirm email » était désactivé, donc
 * Supabase confirmait les adresses lui-même à la création. Constaté en base,
 * un compte créé à 13:26:40.363 était confirmé à 13:26:40.409 — 46 millisecondes.
 * Le contrôle applicatif sur `email_confirmed_at` passait donc toujours, et
 * n'importe qui pouvait s'inscrire avec une adresse qui ne lui appartient pas.
 *
 * ── Utilisation ─────────────────────────────────────────────────────────────
 *
 *   node scripts/config-auth.mjs lire
 *   node scripts/config-auth.mjs exiger-confirmation
 *   node scripts/config-auth.mjs ne-pas-exiger-confirmation
 *
 * Il faut un jeton d'accès personnel Supabase, à créer une fois sur
 * https://supabase.com/dashboard/account/tokens puis à fournir ainsi :
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/config-auth.mjs lire
 *
 * Le jeton n'est jamais écrit sur disque ni affiché par ce script.
 */

const REF = process.env.SUPABASE_PROJECT_REF ?? "xtbdxfzbbuedlktpqpna";
const JETON = process.env.SUPABASE_ACCESS_TOKEN;
const BASE = `https://api.supabase.com/v1/projects/${REF}/config/auth`;

const commande = process.argv[2];

if (!JETON) {
  console.error(`
  Jeton manquant.

  1. Ouvre https://supabase.com/dashboard/account/tokens
  2. « Generate new token », nomme-le par exemple « workie-cli »
  3. Relance en le fournissant :

     SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/config-auth.mjs ${commande ?? "lire"}
`);
  process.exit(1);
}

async function appeler(methode, corps) {
  const r = await fetch(BASE, {
    method: methode,
    headers: {
      Authorization: `Bearer ${JETON}`,
      "Content-Type": "application/json",
    },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  if (!r.ok) {
    const detail = await r.text();
    throw new Error(`API de gestion : ${r.status} — ${detail.slice(0, 300)}`);
  }
  return r.json();
}

function afficher(config) {
  const oui = v => (v ? "oui" : "non");
  console.log(`
  Projet ${REF}

  Confirmation d'e-mail exigée      ${oui(!config.mailer_autoconfirm)}
  Inscriptions ouvertes             ${oui(!config.disable_signup)}
  Longueur minimale du mot de passe ${config.password_min_length ?? "—"}
  Validité du lien de connexion     ${config.mailer_otp_exp ?? "—"} s
  Durée d'une session               ${config.jwt_exp ?? "—"} s
  URL de redirection autorisées     ${config.uri_allow_list || "(aucune)"}
`);
  if (config.mailer_autoconfirm) {
    console.log("  ⚠  Les adresses sont confirmées automatiquement : personne ne vérifie sa boîte mail.\n");
  }
}

try {
  if (commande === "lire" || !commande) {
    afficher(await appeler("GET"));
  } else if (commande === "exiger-confirmation") {
    console.log("  Activation de la confirmation d'e-mail…");
    afficher(await appeler("PATCH", { mailer_autoconfirm: false }));
    console.log("  Fait. Les comptes déjà confirmés le restent ; seuls les nouveaux sont concernés.\n");
  } else if (commande === "ne-pas-exiger-confirmation") {
    console.log("  Désactivation de la confirmation d'e-mail…");
    afficher(await appeler("PATCH", { mailer_autoconfirm: true }));
  } else {
    console.error(`  Commande inconnue : ${commande}\n  Attendu : lire | exiger-confirmation | ne-pas-exiger-confirmation\n`);
    process.exit(1);
  }
} catch (e) {
  console.error(`\n  Échec : ${e.message}\n`);
  process.exit(1);
}
