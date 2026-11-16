/**
 * Le domaine officiel d'une entreprise, tiré de son site, et le test qui dit
 * si une adresse e-mail en fait partie.
 *
 * « https://www.jobs.omega.ch/fr » donne « omega.ch », et une adresse en
 * « @omega.ch » ou « @rh.omega.ch » correspond. On compare le domaine
 * enregistrable (les deux derniers niveaux), ce qui suffit pour la Suisse et
 * les domaines génériques ; les rares « .co.uk » tombent en validation
 * manuelle, ce qui reste sûr.
 *
 * Les messageries publiques ne prouvent rien : elles passent toujours en
 * validation manuelle.
 */

const MESSAGERIES = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "hotmail.ch", "live.com", "msn.com",
  "yahoo.com", "yahoo.fr", "icloud.com", "me.com", "gmx.ch", "gmx.net", "gmx.de", "bluewin.ch",
  "sunrise.ch", "hispeed.ch", "protonmail.com", "proton.me", "orange.fr", "free.fr", "wanadoo.fr",
]);

function registrable(hote: string): string {
  const parties = hote.toLowerCase().replace(/\.$/, "").split(".").filter(Boolean);
  return parties.slice(-2).join(".");
}

export function domaineOfficiel(siteWeb: string | null | undefined): string | null {
  if (!siteWeb) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(siteWeb) ? siteWeb : `https://${siteWeb}`);
    const d = registrable(url.hostname);
    return d.includes(".") && !MESSAGERIES.has(d) ? d : null;
  } catch {
    return null;
  }
}

export function emailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

/** Vrai si l'adresse appartient au domaine officiel (sous-domaines compris). */
export function emailDuDomaine(email: string, domaine: string | null): boolean {
  if (!domaine || !emailValide(email)) return false;
  const hote = email.split("@")[1].toLowerCase();
  if (MESSAGERIES.has(hote)) return false;
  return hote === domaine || hote.endsWith(`.${domaine}`);
}
