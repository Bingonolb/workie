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
          "Découvrez des entreprises suisses, trouvez celles qui vous correspondent et accédez directement à leurs offres d'emploi.",
          `<strong style="color:${TEXTE};">26 cantons · 4 langues</strong>`,
        ],
        cta: { libelle: "Commencer", href: `${BASE}/explore` },
      }),
    });
  } catch { /* un courriel qui échoue ne doit pas bloquer l'inscription */ }
}

// ── Revendication d'une fiche ─────────────────────────────────────────────

/** Le code à 6 chiffres qui prouve l'accès à l'adresse professionnelle. */
export async function sendCodeRevendication(email: string, prenom: string, entreprise: string, code: string): Promise<boolean> {
  if (!resend) return false;
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `${code} : votre code pour gérer ${entreprise} sur Workie`,
      html: gabarit({
        titre: "Votre code de vérification",
        accroche: `Bonjour ${escapeHtml(prenom)},`,
        paragraphes: [
          `Voici votre code pour confirmer que vous représentez <strong style="color:${TEXTE};">${escapeHtml(entreprise)}</strong> :`,
          `<span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:0.25em;color:${TEXTE};font-variant-numeric:tabular-nums;">${escapeHtml(code)}</span>`,
          "Il est valable 30 minutes.",
        ],
        apres: "Vous n'avez rien demandé ? Ignorez simplement ce courriel : rien ne se passera.",
      }),
    });
    return !error;
  } catch {
    return false;
  }
}

/** Prévient l'administration qu'une demande attend une validation manuelle. */
export async function sendRevendicationAValider(entreprise: string, demandeur: string, emailDemandeur: string, creation = false): Promise<void> {
  const destinataire = process.env.ADMIN_EMAIL?.trim();
  if (!resend || !destinataire) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: destinataire,
      subject: creation ? `Nouvelle entreprise à valider : ${entreprise}` : `Revendication à valider : ${entreprise}`,
      html: gabarit({
        titre: creation ? "Nouvelle entreprise à valider" : "Revendication à valider",
        accroche: `${escapeHtml(entreprise)}`,
        paragraphes: [
          creation
            ? `${escapeHtml(demandeur)} (${escapeHtml(emailDemandeur)}) propose de créer cette fiche. Relisez-la avant de l'accepter : elle sera publiée dès le paiement.`
            : `${escapeHtml(demandeur)} (${escapeHtml(emailDemandeur)}) demande à gérer cette fiche. Son adresse n'appartient pas au domaine officiel de l'entreprise.`,
        ],
        cta: { libelle: "Examiner la demande", href: `${BASE}/admin/revendications` },
      }),
    });
  } catch { /* la demande reste visible dans l'admin */ }
}

/** La demande manuelle est acceptée : il ne reste qu'à s'abonner. */
export async function sendRevendicationAcceptee(email: string, prenom: string, entreprise: string, lien: string): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Votre demande pour ${entreprise} est acceptée`,
      html: gabarit({
        titre: "Demande acceptée",
        accroche: `C'est bon, ${escapeHtml(prenom)}.`,
        paragraphes: [
          `Votre demande pour <strong style="color:${TEXTE};">${escapeHtml(entreprise)}</strong> est acceptée. Il reste à activer l'abonnement pour ouvrir votre espace entreprise.`,
        ],
        cta: { libelle: "Activer l'abonnement", href: lien },
      }),
    });
  } catch { /* le lien reste accessible depuis la fiche */ }
}

/** La demande manuelle n'est pas retenue : la personne le sait, avec une porte de sortie. */
export async function sendRevendicationRefusee(email: string, prenom: string, entreprise: string): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Votre demande pour ${entreprise}`,
      html: gabarit({
        titre: "Demande non retenue",
        accroche: `Bonjour ${escapeHtml(prenom)},`,
        paragraphes: [
          `Nous n'avons pas pu confirmer votre lien avec <strong style="color:${TEXTE};">${escapeHtml(entreprise)}</strong> à partir des informations reçues.`,
          "Le plus simple : recommencez la demande avec une adresse e-mail de l'entreprise. La vérification est alors immédiate.",
        ],
        apres: "Une question ? Répondez simplement à ce courriel.",
      }),
    });
  } catch { /* la décision reste visible sur la page de revendication */ }
}

/** Confirmation : l'abonnement est actif, l'espace entreprise est ouvert. */
export async function sendAbonnementActif(email: string, prenom: string, entreprise: string): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Bienvenue : ${entreprise} est à vous sur Workie`,
      html: gabarit({
        titre: "Abonnement actif",
        accroche: `Bienvenue, ${escapeHtml(prenom)}.`,
        paragraphes: [
          `Vous gérez désormais <strong style="color:${TEXTE};">${escapeHtml(entreprise)}</strong> sur Workie. Le badge vérifié est visible sur la fiche.`,
          "Depuis votre espace entreprise, vous pouvez mettre la fiche à jour et suivre sa fréquentation.",
        ],
        cta: { libelle: "Ouvrir mon espace", href: `${BASE}/espace-entreprise` },
        apres: "Une question ? Répondez simplement à ce courriel.",
      }),
    });
  } catch { /* sans conséquence pour l'abonnement */ }
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
