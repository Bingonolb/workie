import { ficheGeree, synchroniserAbonnement } from "@/lib/actions/espaceEntreprise";
import { BoutonPortail } from "./BoutonPortail";
import { tServeur, langueDeLaPage } from "@/i18n/page";

export default async function PageAbonnement() {
  const avant = await ficheGeree();
  if (avant) await synchroniserAbonnement(avant.id);
  const [c, t, langue] = await Promise.all([ficheGeree(), tServeur(), langueDeLaPage()]);
  if (!c) return null;
  const fin = c.subscription_ends_at ? new Date(c.subscription_ends_at).toLocaleDateString(langue === "de" ? "de-CH" : "fr-CH", { timeZone: "Europe/Zurich" }) : null;

  return (
    <section style={{ maxWidth: 640, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 24px", display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, color: c.subscription_cancel_at_period_end ? "#f59e0b" : "#10b981", background: c.subscription_cancel_at_period_end ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)" }}>
          {c.subscription_cancel_at_period_end ? t("espace.aboResilie") : t("espace.aboActif")}
        </span>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>{t("espace.aboTitre")}</h2>
      </div>
      <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
        {c.subscription_cancel_at_period_end
          ? t("espace.aboFin", { date: fin ?? "" })
          : fin ? t("espace.aboRenouvellement", { date: fin }) : t("espace.aboActifTexte")}
      </p>
      <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
        {t("espace.aboStripe")}
      </p>
      <BoutonPortail />
    </section>
  );
}
