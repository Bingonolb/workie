import { describe, it, expect } from "vitest";
import { decalerFin, montantARembourser, estSuspendueParSignalements } from "@/lib/ads/remboursement";

const t = (s: string) => new Date(s).getTime();

describe("campagne signalée", () => {
  it("rembourse les jours non diffusés, pas le jour de l'arrêt", () => {
    // Fin le 10, arrêt le 5 : restent 6, 7, 8, 9, 10.
    expect(montantARembourser({ end_date: "2026-12-10", paused_at: "2026-12-05T14:00:00Z", daily_budget_chf: "4", total_budget_chf: "40" })).toBe(20);
  });
  it("ne rembourse jamais plus que le prix payé", () => {
    expect(montantARembourser({ end_date: "2026-12-30", paused_at: "2026-12-01T00:00:00Z", daily_budget_chf: 10, total_budget_chf: 70 })).toBe(70);
  });
  it("rien après la fin", () => {
    expect(montantARembourser({ end_date: "2026-12-01", paused_at: "2026-12-03T00:00:00Z", daily_budget_chf: 10, total_budget_chf: 70 })).toBe(0);
  });
  it("rend les jours d'examen à une campagne rétablie", () => {
    expect(decalerFin("2026-12-10", "2026-12-05T10:00:00Z", t("2026-12-08T11:00:00Z"))).toBe("2026-12-13");
  });
  it("reconnaît la suspension automatique", () => {
    expect(estSuspendueParSignalements("Mise en pause automatique : 2 signalements.")).toBe(true);
    expect(estSuspendueParSignalements(null)).toBe(false);
  });
});
