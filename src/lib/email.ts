"use server";

import { Resend } from "resend";

/**
 * Les courriels de Workie, sous un seul gabarit.
 *
 * Chaque message portait son propre en-tête : un dégradé violet vers orange,
 * le mot « workie » tapé en texte à la place du logotype, l'accroche « Avis et
 * salaires des entreprises suisses », des emojis en guise d'icônes, le
 * tutoiement, et un compteur figé à « 1 700+ entreprises ». Tout cela datait
 * d'avant le nouveau logo et d'avant l'abandon des avis.
 *
 * Un seul gabarit désormais, que chaque message remplit : l'en-tête sombre du
 * site avec le vrai logotype, un titre, un texte, un bouton. Le logotype est
 * une image PNG et non le SVG du site : Gmail et Outlook refusent le SVG dans
 * un courriel.
 *
 * Les styles sont écrits sur chaque balise, et la mise en page tient dans des
 * tableaux. C'est archaïque, et c'est la seule façon d'être lu pareil dans
 * Gmail, Outlook et Apple Mail.
 */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = "Workie <onboarding@workie.ch>";
const BASE = "https://www.workie.ch";

const ENCRE = "#101319";
const MARQUE = "#4f3cc9";
const TEXTE = "#101319";
const DISCRET = "#5f6575";
const FILET = "#e3e6eb";
const FOND = "#f5f6f8";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

type Gabarit = {
  /** Titre du document, lu par certaines messageries. */
  titre: string;
  /** Première ligne du message, en gros. */
  accroche: string;
  /** Paragraphes, déjà échappés. */
  paragraphes: string[];
  cta?: { libelle: string; href: string };
  /** Petite ligne sous le bouton, facultative. */
  apres?: string;
};

function gabarit({ titre, accroche, paragraphes, cta, apres }: Gabarit): string {
  const corps = paragraphes
    .map(p => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${DISCRET};">${p}</p>`)
    .join("");

  const bouton = cta
    ? `<table cellpadding="0" cellspacing="0" style="margin:28px 0 0;"><tr><td style="border-radius:11px;background:${MARQUE};">
         <a href="${cta.href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:11px;">${cta.libelle}</a>
       </td></tr></table>`
    : "";

  const suite = apres
    ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${DISCRET};">${apres}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light only" />
<title>${titre}</title>
</head>
<body style="margin:0;padding:0;background:${FOND};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${FOND};padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${FILET};border-radius:16px;overflow:hidden;">
  <tr>
    <td style="background:${ENCRE};padding:28px 36px;">
      <img src="${BASE}/email-logo.png" width="134" height="36" alt="Workie" style="display:block;border:0;height:36px;width:auto;" />
    </td>
  </tr>
  <tr>
    <td style="padding:40px 36px 36px;">
      <h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:${TEXTE};">${accroche}</h1>
      ${corps}
      ${bouton}
      ${suite}
    </td>
  </tr>
  <tr>
    <td style="padding:22px 36px;border-top:1px solid ${FILET};">
      <p style="margin:0;font-size:12px;line-height:1.6;color:${DISCRET};">
        Workie · Chercher du travail devient passionnant ·
        <a href="${BASE}/confidentialite" style="color:${DISCRET};">Confidentialité</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Les messages ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  if (!resend) return;
  const nom = escapeHtml(username);
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Bienvenue sur Workie, ${username}`,
      html: gabarit({
        titre: "Bienvenue sur Workie",
        accroche: `Bienvenue, ${nom}.`,
        paragraphes: [
          "Votre compte est prêt.",
          "Découvrez les entreprises suisses, gardez celles qui vous correspondent et trouvez leurs offres d'emploi.",
          `<strong style="color:${TEXTE};">1000 entreprises · 26 cantons · 4 langues</strong>`,
        ],
        cta: { libelle: "Commencer", href: `${BASE}/explore` },
      }),
    });
  } catch { /* un courriel qui échoue ne doit pas bloquer l'inscription */ }
}

export async function sendClaimReceivedEmail(email: string, firstName: string, companyName: string): Promise<void> {
  if (!resend) return;
  const prenom = escapeHtml(firstName);
  const entreprise = escapeHtml(companyName);
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Votre demande pour ${companyName} est en cours d'examen`,
      html: gabarit({
        titre: "Demande reçue",
        accroche: `Bonjour ${prenom},`,
        paragraphes: [
          `Nous avons bien reçu votre demande pour <strong style="color:${TEXTE};">${entreprise}</strong>.`,
          `Nous l'examinons à la main. Vous recevrez un courriel dès que la fiche sera vérifiée, généralement sous <strong style="color:${TEXTE};">24 à 48 heures ouvrées</strong>.`,
        ],
        apres: "Une question ? Répondez simplement à ce courriel.",
      }),
    });
  } catch { /* sans conséquence pour la demande */ }
}

export async function sendClaimApprovedEmail(email: string, firstName: string, companyName: string): Promise<void> {
  if (!resend) return;
  const prenom = escapeHtml(firstName);
  const entreprise = escapeHtml(companyName);
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `${companyName} est vérifiée sur Workie`,
      html: gabarit({
        titre: "Entreprise vérifiée",
        accroche: `C'est fait, ${prenom}.`,
        paragraphes: [
          `<strong style="color:${TEXTE};">${entreprise}</strong> est désormais vérifiée sur Workie. Le badge est visible sur sa fiche.`,
          "Vous pouvez tenir la fiche à jour et publier vos offres d'emploi.",
        ],
        cta: { libelle: "Voir la fiche", href: `${BASE}/explore` },
        apres: "Une question ? Répondez simplement à ce courriel.",
      }),
    });
  } catch { /* sans conséquence pour la validation */ }
}

/*
 * Les deux messages liés aux avis restent déclarés, parce que le module des
 * avis les appelle encore, mais ils ne partent plus : les avis ne sont plus
 * publiés, et annoncer à une entreprise un « nouvel avis 4/5 » qu'elle ne
 * trouvera nulle part sur sa fiche serait pire que ne rien dire.
 */
export async function sendNewReviewEmail(_email: string, _companyName: string, _companyId: string, _rating: number): Promise<void> {
  return;
}

export async function sendAdminFlagAlert(
  _companyName: string,
  _flagReason: string,
  _excerpt: string,
): Promise<void> {
  return;
}
