"use server";

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = "Workie <onboarding@workie.ch>";
const BASE = "https://www.workie.ch";

function welcomeHtml(username: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Bienvenue sur Workie !</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 0;">
<tr><td align="center">

<!-- Card -->
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Header gradient -->
  <tr>
    <td style="background:linear-gradient(135deg,#8b5cf6 0%,#f97316 100%);padding:48px 40px 40px;text-align:center;">
      <h1 style="margin:0;font-size:36px;font-weight:900;letter-spacing:-0.03em;color:#ffffff;">workie</h1>
      <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-style:italic;letter-spacing:0.01em;">Les entreprises suisses, sans filtre.</p>
    </td>
  </tr>

  <!-- Main content -->
  <tr>
    <td style="padding:48px 40px 32px;">
      <h2 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.02em;">
        Bienvenue, ${username} ! 🎉
      </h2>
      <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.7;">
        Ton compte Workie est prêt. Tu rejoins des milliers d'employés suisses qui partagent leurs expériences pour aider les autres à trouver le bon environnement de travail.
      </p>

      <!-- Divider -->
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 32px;" />

      <!-- 3 features -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 0 24px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:48px;height:48px;background:rgba(139,92,246,0.1);border-radius:12px;text-align:center;vertical-align:middle;font-size:22px;">🔍</td>
                <td style="padding-left:16px;vertical-align:middle;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">Explorer 1700+ entreprises</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">Tech, Finance, Pharma, Conseil et bien plus.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 24px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:48px;height:48px;background:rgba(249,115,22,0.1);border-radius:12px;text-align:center;vertical-align:middle;font-size:22px;">💰</td>
                <td style="padding-left:16px;vertical-align:middle;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">Découvrir les vrais salaires</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">Données anonymes partagées par des employés comme toi.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 8px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:48px;height:48px;background:rgba(16,185,129,0.1);border-radius:12px;text-align:center;vertical-align:middle;font-size:22px;">⭐</td>
                <td style="padding-left:16px;vertical-align:middle;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">Publier ton avis anonymement</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">Aide les autres à choisir leur prochain employeur.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;">
        <tr>
          <td align="center">
            <a href="${BASE}/explore" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#f97316);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:-0.01em;">
              Explorer les entreprises →
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Stats band -->
  <tr>
    <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:28px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align:center;border-right:1px solid #e5e7eb;">
            <p style="margin:0;font-size:22px;font-weight:900;color:#8b5cf6;">1 700+</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Entreprises</p>
          </td>
          <td style="text-align:center;border-right:1px solid #e5e7eb;">
            <p style="margin:0;font-size:22px;font-weight:900;color:#f97316;">100%</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Anonyme</p>
          </td>
          <td style="text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:900;color:#10b981;">🇨🇭</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Suisse uniquement</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:28px 40px;text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
        Tu reçois cet email car tu viens de créer un compte sur
        <a href="${BASE}" style="color:#8b5cf6;text-decoration:none;">workie.ch</a>.
      </p>
      <p style="margin:0;font-size:12px;color:#d1d5db;">
        © ${new Date().getFullYear()} Workie · Suisse ·
        <a href="${BASE}/confidentialite" style="color:#d1d5db;text-decoration:none;">Confidentialité</a>
      </p>
    </td>
  </tr>

</table>
<!-- /Card -->

</td></tr>
</table>
<!-- /Wrapper -->

</body>
</html>`;
}

function claimReceivedHtml(firstName: string, companyName: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>Demande reçue — Workie Business</title></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <tr>
    <td style="background:linear-gradient(135deg,#111827 0%,#1f2937 100%);padding:48px 40px 40px;text-align:center;">
      <h1 style="margin:0 0 4px;font-size:32px;font-weight:900;letter-spacing:-0.03em;color:#ffffff;">workie</h1>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:0.05em;text-transform:uppercase;">Business</p>
    </td>
  </tr>

  <tr>
    <td style="padding:48px 40px 40px;">
      <div style="display:inline-block;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:6px 14px;font-size:12px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:24px;">En cours d'examen</div>
      <h2 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.02em;">Bonjour ${firstName},</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#6b7280;line-height:1.7;">Nous avons bien reçu votre demande de revendication pour <strong style="color:#111827;">${companyName}</strong>.</p>
      <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.7;">Notre équipe examine votre dossier. Vous recevrez une notification par email dès que votre entreprise sera vérifiée, généralement sous <strong style="color:#111827;">24 à 48 heures ouvrées</strong>.</p>

      <div style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:14px;padding:24px;">
        <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.06em;">Ce qui se passe ensuite</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${[
            ["✅", "Votre paiement est confirmé"],
            ["🔍", "Notre équipe vérifie votre identité et votre entreprise"],
            ["🏆", "Le badge vérifié ✓ apparaît sur votre profil"],
          ].map(([icon, text]) => `
          <tr><td style="padding:0 0 12px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:32px;font-size:18px;vertical-align:middle;">${icon}</td>
              <td style="padding-left:12px;font-size:14px;color:#6b7280;vertical-align:middle;">${text}</td>
            </tr></table>
          </td></tr>`).join("")}
        </table>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;">
        <tr><td align="center">
          <a href="${BASE}/business/dashboard" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#f97316);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 36px;border-radius:12px;">
            Accéder à mon espace →
          </a>
        </td></tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;">Une question ? Répondez directement à cet email.</p>
      <p style="margin:0;font-size:12px;color:#d1d5db;">© ${new Date().getFullYear()} Workie · <a href="${BASE}/confidentialite" style="color:#d1d5db;text-decoration:none;">Confidentialité</a></p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function claimApprovedHtml(firstName: string, companyName: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>Entreprise vérifiée — Workie Business</title></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <tr>
    <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:48px 40px 40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🏆</div>
      <h1 style="margin:0 0 4px;font-size:32px;font-weight:900;letter-spacing:-0.03em;color:#ffffff;">workie</h1>
      <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Entreprise vérifiée ✓</p>
    </td>
  </tr>

  <tr>
    <td style="padding:48px 40px 40px;">
      <div style="display:inline-block;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:6px 14px;font-size:12px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:24px;">✓ Approuvée</div>
      <h2 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.02em;">Félicitations ${firstName} !</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#6b7280;line-height:1.7;"><strong style="color:#111827;">${companyName}</strong> est maintenant officiellement vérifiée sur Workie.</p>
      <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.7;">Le badge <strong style="color:#10b981;">✓ Vérifié</strong> est maintenant visible sur votre profil entreprise. Vous pouvez répondre aux avis, consulter vos analytics et gérer votre présence.</p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:24px;margin-bottom:32px;">
        <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.06em;">Votre espace business</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${[
            ["💬", "Répondre aux avis de vos employés"],
            ["📊", "Consulter vos analytics en temps réel"],
            ["💼", "Publier vos offres d'emploi"],
          ].map(([icon, text]) => `
          <tr><td style="padding:0 0 10px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:32px;font-size:18px;vertical-align:middle;">${icon}</td>
              <td style="padding-left:12px;font-size:14px;color:#6b7280;vertical-align:middle;">${text}</td>
            </tr></table>
          </td></tr>`).join("")}
        </table>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
          <a href="${BASE}/business/dashboard" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 36px;border-radius:12px;">
            Accéder à mon dashboard →
          </a>
        </td></tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;">Une question ? Répondez directement à cet email.</p>
      <p style="margin:0;font-size:12px;color:#d1d5db;">© ${new Date().getFullYear()} Workie · <a href="${BASE}/confidentialite" style="color:#d1d5db;text-decoration:none;">Confidentialité</a></p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendClaimReceivedEmail(email: string, firstName: string, companyName: string): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Votre demande pour ${companyName} est en cours d'examen`,
      html: claimReceivedHtml(firstName, companyName),
    });
  } catch { /* non-blocking */ }
}

export async function sendClaimApprovedEmail(email: string, firstName: string, companyName: string): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `✓ ${companyName} est maintenant vérifiée sur Workie !`,
      html: claimApprovedHtml(firstName, companyName),
    });
  } catch { /* non-blocking */ }
}

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  if (!resend) return; // fail silently if RESEND_API_KEY not set
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Bienvenue sur Workie, ${username} ! 🎉`,
      html: welcomeHtml(username),
    });
  } catch {
    // Non-blocking — signup succeeds even if email fails
  }
}
