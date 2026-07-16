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
      <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);letter-spacing:0.05em;text-transform:uppercase;">Avis d'employés &amp; salaires réels en Suisse</p>
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
