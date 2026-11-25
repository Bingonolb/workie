import type { Traduire } from "@/i18n/traduire";
import type { Notification } from "@/lib/actions/notifications";

/**
 * Titre et texte d'une notification dans la langue de la page.
 *
 * La base garde un titre en français, écrit au moment de l'envoi. Pour les
 * types connus, on le refait à partir des données ; le texte enregistré ne
 * sert qu'aux types inconnus.
 */
export function texteNotification(n: Notification, t: Traduire): { titre: string; corps: string | null } {
  const d = (n.data ?? {}) as Record<string, string> & { companies?: unknown[] };
  switch (n.type) {
    case "new_companies": {
      const nb = Array.isArray(d.companies) ? d.companies.length : 1;
      return { titre: t("notifs.nouvellesEntreprises", { n: nb }), corps: null };
    }
    case "new_job_offer":
      return d.company_name
        ? { titre: t("notifs.nouvelleOffre", { nom: d.company_name }), corps: n.body }
        : { titre: n.title, corps: n.body };
    case "ad_campaign_completed":
      return d.headline
        ? {
            titre: t("notifs.campagneTerminee"),
            corps: t("notifs.campagneBilan", { titre: d.headline, vues: Number(d.impressions ?? 0), clics: Number(d.clics ?? 0) }),
          }
        : { titre: n.title, corps: n.body };
    default:
      return { titre: n.title, corps: n.body };
  }
}

/** « il y a 5 min », « vor 5 Min. ». */
export function depuis(date: string, t: Traduire): string {
  const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (m < 1) return t("notifs.instant");
  if (m < 60) return t("notifs.minutes", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("notifs.heures", { n: h });
  return t("notifs.jours", { n: Math.floor(h / 24) });
}
