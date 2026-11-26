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
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 16px 72px" }}>
        {c ? (
          <>
            {c.vueAdmin && <BandeauVueAdmin nom={c.name} retour={`/entreprise/${c.slug}`} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>{t("espace.titre")}</p>
                <h1 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800, letterSpacing: "-0.025em" }}>{c.name}</h1>
              </div>
            </div>
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
            <OngletsEspace slug={c.slug} />
            <div style={{ marginTop: 22 }}>{children}</div>
          </>
        ) : (
          <SansEntreprise />
        )}
      </main>
    </div>
  );
}
