import type { Metadata } from "next";
import Link from "next/link";
import { catalogueEmploi, nombre, CANTONS } from "@/lib/pagesEmploi";
import { meta } from "@/i18n/meta";
import { tServeur, langueDeLaPage } from "@/i18n/page";
import { nomSecteur } from "@/i18n/secteurs";
import { nomCanton } from "@/i18n/cantons";

export const revalidate = 300;

export const generateMetadata = (): Promise<Metadata> => meta({ titre: "emploi.indexTitre", description: "emploi.indexDescription", chemin: "/emploi" });

export default async function IndexEmploi() {
  const { pages, total } = await catalogueEmploi();
  const [t, langue] = await Promise.all([tServeur(), langueDeLaPage()]);
  const secteurs = pages.filter(p => p.type === "secteur").sort((a, b) => nombre(b) - nombre(a));
  const cantons = pages.filter(p => p.type === "canton").sort((a, b) => nombre(b) - nombre(a));

  const Groupe = ({ titre, items }: { titre: string; items: { href: string; label: string; n: number }[] }) => (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{titre}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map(i => (
          <Link key={i.href} href={i.href} className="lien-emploi">
            {i.label} <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{i.n}</span>
          </Link>
        ))}
      </div>
    </section>
  );

  return (
    <div className="page-root">
      <main className="page-main-md">
        <h1 style={{ fontSize: "clamp(22px, 3.2vw, 30px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 10 }}>{t("emploi.indexH1")}</h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 640, marginBottom: 28 }}>
          {t("emploi.indexIntro", { n: total })}
        </p>
        <Groupe titre={t("emploi.parSecteur")} items={secteurs.map(p => ({ href: `/emploi/${p.slug}`, label: p.type === "secteur" ? nomSecteur(p.secteur, langue) : "", n: nombre(p) }))} />
        <Groupe titre={t("emploi.parCanton")} items={cantons.map(p => ({ href: `/emploi/${p.slug}`, label: p.type === "canton" ? nomCanton(p.canton, langue, CANTONS[p.canton].nom) : "", n: nombre(p) }))} />
      </main>
    </div>
  );
}
