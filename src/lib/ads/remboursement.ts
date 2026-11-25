/**
 * Une campagne suspendue après signalements, puis tranchée par l'équipe.
 *
 * Rétablie, elle retrouve les jours perdus pendant l'examen. Refusée, les jours
 * qui n'ont pas été diffusés sont remboursés : l'annonceur ne paie que ce qui a
 * été affiché.
 */

const JOUR = 86_400_000;

/** Repère posé par le déclencheur `suspendre_annonce_signalee`. */
export function estSuspendueParSignalements(note: string | null | undefined): boolean {
  return !!note?.startsWith("Mise en pause automatique");
}

/** Repousse la fin d'autant de jours entiers que la pause a duré. */
export function decalerFin(fin: string | null, pauseLe: string | null, maintenant = Date.now()): string | null {
  if (!fin || !pauseLe) return fin;
  const jours = Math.max(0, Math.floor((maintenant - new Date(pauseLe).getTime()) / JOUR));
  const d = new Date(`${fin}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

/**
 * Les jours restants au moment de l'arrêt, au tarif journalier, jamais plus
 * que le prix payé. La fin est incluse : une campagne qui finit le 10 diffuse
 * encore le 10. Le jour de l'arrêt, commencé, n'est pas remboursé.
 */
export function montantARembourser(
  c: { end_date: string | null; paused_at: string | null; daily_budget_chf: number | string; total_budget_chf: number | string },
  maintenant = Date.now(),
): number {
  if (!c.end_date) return 0;
  const arret = c.paused_at ? new Date(c.paused_at).getTime() : maintenant;
  const jourArret = Math.floor(arret / JOUR);
  const jourFin = Math.floor(new Date(`${c.end_date}T00:00:00Z`).getTime() / JOUR);
  const restants = Math.max(0, jourFin - jourArret);
  const montant = Math.min(restants * Number(c.daily_budget_chf), Number(c.total_budget_chf));
  return Math.round(montant * 100) / 100;
}
