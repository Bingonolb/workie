import type { Metadata } from "next";
import Link from "next/link";
import { catalogueEmploi, nombre, CANTONS } from "@/lib/pagesEmploi";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Emploi en Suisse par secteur et par canton",
  description: "Les employeurs suisses référencés sur Workie, classés par secteur et par canton. Accédez directement à leurs pages carrière officielles.",
  alternates: { canonical: "https://www.workie.ch/emploi" },
};

export default async function IndexEmploi() {
  const { pages, total } = await catalogueEmploi();
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
        <h1 style={{ fontSize: "clamp(22px, 3.2vw, 30px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 10 }}>Emploi en Suisse</h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 640, marginBottom: 28 }}>
          {total} employeurs référencés sur Workie, classés par secteur et par canton.
        </p>
        <Groupe titre="Par secteur" items={secteurs.map(p => ({ href: `/emploi/${p.slug}`, label: p.type === "secteur" ? p.secteur : "", n: nombre(p) }))} />
        <Groupe titre="Par canton" items={cantons.map(p => ({ href: `/emploi/${p.slug}`, label: p.type === "canton" ? CANTONS[p.canton].nom : "", n: nombre(p) }))} />
      </main>
    </div>
  );
}
