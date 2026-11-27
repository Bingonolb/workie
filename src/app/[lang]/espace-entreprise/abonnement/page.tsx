import { ficheGeree, synchroniserAbonnement } from "@/lib/actions/espaceEntreprise";
import { BoutonPortail } from "./BoutonPortail";
import { tServeur, langueDeLaPage } from "@/i18n/page";

export default async function PageAbonnement() {
  const avant = await ficheGeree();
  if (avant) await synchroniserAbonnement(avant.id);
  const [c, t, langue] = await Promise.all([ficheGeree(), tServeur(), langueDeLaPage()]);
  if (!c) return null;
  const fin = c.subscription_ends_at ? new Date(c.subscription_ends_at).toLocaleDateString(langue === "de" ? "de-CH" : "fr-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Zurich" }) : null;

  const resilie = !!c.subscription_cancel_at_period_end;
  return (
    <section className="carte-espace" style={{ maxWidth: 680 }}>
      <div className="carte-titre">
        <h2>{t("espace.aboTitre")}</h2>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, color: resilie ? "#d97706" : "#059669", background: resilie ? "rgba(245,158,11,0.13)" : "rgba(16,185,129,0.13)" }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
          {resilie ? t("espace.aboResilie") : t("espace.aboActif")}
        </span>
      </div>
      <dl className="liste-pro">
        {fin && (
          <div>
            <dt>{resilie ? t("espace.aboDateFin") : t("espace.aboDate")}</dt>
            <dd>{fin}</dd>
          </div>
        )}
        <div>
          <dt>{t("espace.aboGerer")}</dt>
          <dd style={{ fontWeight: 500, color: "var(--text-muted)" }}>{t("espace.aboStripe")}</dd>
        </div>
      </dl>
      {resilie && <p style={{ padding: "0 22px 4px", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55 }}>{t("espace.aboFin", { date: fin ?? "" })}</p>}
      <div style={{ padding: "8px 22px 20px" }}>
        <BoutonPortail />
      </div>
    </section>
  );
}
