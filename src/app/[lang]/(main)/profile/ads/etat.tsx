import { Clock, CheckCircle, XCircle, PauseCircle, CreditCard } from "lucide-react";
import type { AdCampaign } from "@/lib/actions/ads";
import type { Traduire } from "@/i18n/traduire";

/**
 * Ce que la liste des campagnes et la carte ont besoin de savoir en commun.
 *
 * Ces fonctions vivaient dans la page. La carte en ayant besoin une fois
 * sortie dans son fichier, les garder la aurait cree une dependance de la
 * carte vers la page qui l'affiche, donc un cycle.
 */
export const STATUS_CONFIG = {
  payment_pending: { label: "pubs.sPaiement", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: <CreditCard size={12} aria-hidden="true" />, dot: "#ef4444" },
  pending:         { label: "pubs.sRevision",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: <Clock size={12} aria-hidden="true" />,       dot: "#f59e0b" },
  active:          { label: "pubs.sActive",    color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: <CheckCircle size={12} aria-hidden="true" />, dot: "#10b981" },
  // En pause est un arret, pas une mise en avant : gris ardoise, comme un
  // etat qui attend. Le violet le faisait ressembler a une nouveaute.
  paused:          { label: "pubs.sPause",     color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: <PauseCircle size={12} aria-hidden="true" />, dot: "#64748b" },
  completed:       { label: "pubs.sTerminee",  color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: <CheckCircle size={12} aria-hidden="true" />, dot: "#6b7280" },
  rejected:        { label: "pubs.sRejetee",   color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: <XCircle size={12} aria-hidden="true" />,    dot: "#ef4444" },
} as const;

export function budgetPct(spent: number, total: number) {
  return total ? Math.min(100, Math.round((spent / total) * 100)) : 0;
}
export function ctr(imp: number, clk: number) {
  return imp ? `${((clk / imp) * 100).toFixed(1)}%` : "–";
}

/** Une date ISO en français court : « 27 juil. ». */
export function jour(iso: string | null, langue: string = "fr"): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(langue === "de" ? "de-CH" : "fr-CH", { day: "numeric", month: "short" });
}

export function estExpiree(endDate: string | null): boolean {
  if (!endDate) return false;
  return new Date(endDate).getTime() < Date.now();
}

export function joursRestants(endDate: string | null, t: Traduire): { label: string; urgent: boolean } | null {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return { label: t("pubs.dernierJour"), urgent: true };
  return { label: t("pubs.joursRestants", { n: diff }), urgent: diff <= 3 };
}

/**
 * L'état d'une campagne, dit une seule fois.
 *
 * La carte affichait deux pastilles qui se contredisaient : « Paiement
 * requis » d'un côté, « Expirée » de l'autre. Les deux étaient vraies, et
 * ensemble elles ne voulaient rien dire. Une campagne dont les dates sont
 * passées et qui n'a jamais été payée n'est pas en attente de paiement : elle
 * est morte, et la payer n'achèterait rien.
 */
export function etat(c: AdCampaign, t: Traduire): { label: string; color: string; bg: string; icon: React.ReactNode } {
  const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending;
  const expiree = estExpiree(c.end_date);

  if (expiree && c.status === "payment_pending") {
    return { label: t("pubs.sExpireeSansPaiement"), color: "#6b7280", bg: "rgba(107,114,128,0.12)", icon: <Clock size={12} aria-hidden="true" /> };
  }
  if (expiree && (c.status === "active" || c.status === "pending")) {
    return { label: t("pubs.sTerminee"), color: "#6b7280", bg: "rgba(107,114,128,0.12)", icon: <CheckCircle size={12} aria-hidden="true" /> };
  }
  return { label: t(st.label), color: st.color, bg: st.bg, icon: st.icon };
}
