import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ficheGeree } from "@/lib/actions/espaceEntreprise";
import { NavbarClient } from "@/components/NavbarClient";
import { OngletsEspace } from "./OngletsEspace";
import { SansEntreprise } from "./SansEntreprise";
import { BandeauVueAdmin } from "./BandeauVueAdmin";
import { meta } from "@/i18n/meta";
import { tServeur, langueDeLaPage } from "@/i18n/page";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const generateMetadata = () => meta({ titre: "espace.titre", indexer: false });

export default async function LayoutEspace({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/espace-entreprise");
  const [c, t, langue] = await Promise.all([ficheGeree(), tServeur(), langueDeLaPage()]);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <NavbarClient />
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 16px 72px" }}>
        {c ? (
          <>
            {c.vueAdmin && <BandeauVueAdmin nom={c.name} retour={`/entreprise/${c.slug}`} />}
            {/* En-tête dans la langue du profil : bandeau sombre, filet violet,
                puis l'état de l'abonnement et les onglets dans la même carte. */}
            <header className="espace-entete">
              <div className="espace-bandeau">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="espace-filigrane" src="/workie-mot.svg" alt="" aria-hidden="true" />
                <div style={{ width: 32, height: 3, borderRadius: 2, background: "var(--brand)", marginBottom: 14 }} />
                <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>Workie Business</p>
                <h1 style={{ fontSize: "clamp(24px, 3.2vw, 30px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>{c.name}</h1>
              </div>
              <div className="espace-etat">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: c.subscription_cancel_at_period_end ? "#f59e0b" : "#10b981" }} />
                  <strong style={{ color: "var(--text)", fontWeight: 650 }}>{t("espace.etatActif")}</strong>
                </span>
                {c.subscription_ends_at && (
                  <span>{t(c.subscription_cancel_at_period_end ? "espace.etatFin" : "espace.renouv", { date: new Date(c.subscription_ends_at).toLocaleDateString(langue === "de" ? "de-CH" : "fr-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Zurich" }) })}</span>
                )}
              </div>
              <OngletsEspace slug={c.slug} />
            </header>
            <style>{`
              .espace-entete { border-radius: 16px; overflow: hidden; border: 1px solid var(--border); background: var(--surface); margin-bottom: 16px; }
              .espace-bandeau { position: relative; overflow: hidden; background: #101319; padding: 30px 32px 26px; }
              .espace-filigrane { position: absolute; right: 32px; top: 50%; transform: translateY(-50%); height: 72px; width: auto; opacity: 0.08; pointer-events: none; user-select: none; }
              .espace-etat { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 18px; padding: 13px 32px; font-size: 13.5px; color: var(--text-muted); border-bottom: 1px solid var(--border); }
              @media (max-width: 700px) {
                .espace-filigrane { display: none; }
                .espace-bandeau { padding: 24px 18px 20px; }
                .espace-etat { padding: 12px 18px; }
              }
            `}</style>
            {c.subscription_cancel_at_period_end && c.subscription_ends_at && (() => {
              // Résiliation programmée : l'espace reste ouvert jusqu'à la fin de la
              // période payée, et chaque page le rappelle avec les jours restants.
              const fin = new Date(c.subscription_ends_at);
              const jours = Math.max(0, Math.ceil((fin.getTime() - Date.now()) / 86_400_000));
              const date = fin.toLocaleDateString(langue === "de" ? "de-CH" : "fr-CH", { day: "numeric", month: "long", timeZone: "Europe/Zurich" });
              return (
                <div role="status" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)", fontSize: 14 }}>
                  <span>{jours === 0 ? t("espace.finAujourdhui") : t("espace.finBandeau", { n: jours, date })}</span>
                  <Link href="/espace-entreprise/abonnement" className="btn btn-clair btn-sm">{t("espace.reactiver")}</Link>
                </div>
              );
            })()}
            <div>{children}</div>
          </>
        ) : (
          <SansEntreprise />
        )}
      </main>
    </div>
  );
}
