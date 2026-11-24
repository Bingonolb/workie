import { ficheGeree } from "@/lib/actions/espaceEntreprise";
import { BoutonPortail } from "./BoutonPortail";

export default async function PageAbonnement() {
  const c = await ficheGeree();
  if (!c) return null;
  const fin = c.subscription_ends_at ? new Date(c.subscription_ends_at).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich" }) : null;

  return (
    <section style={{ maxWidth: 640, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 24px", display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, color: c.subscription_cancel_at_period_end ? "#f59e0b" : "#10b981", background: c.subscription_cancel_at_period_end ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)" }}>
          {c.subscription_cancel_at_period_end ? "Résiliation programmée" : "Actif"}
        </span>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>Abonnement Workie Entreprise</h2>
      </div>
      <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
        {c.subscription_cancel_at_period_end
          ? `Votre abonnement prend fin le ${fin}. Jusque-là, tout reste accessible.`
          : fin ? `Prochain renouvellement le ${fin}.` : "Votre abonnement est actif."}
      </p>
      <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Factures, carte de paiement, passage au mensuel ou à l&apos;annuel, résiliation : tout se gère sur la page sécurisée de Stripe.
      </p>
      <BoutonPortail />
    </section>
  );
}
