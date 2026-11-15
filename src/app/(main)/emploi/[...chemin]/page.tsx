import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LigneSuggestion } from "@/components/company/LigneSuggestion";
import { catalogueEmploi, pageEmploi, nombre, CANTONS, slugifier, type Page, type FicheEmploi } from "@/lib/pagesEmploi";
import { urlFiche } from "@/lib/urlFiche";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const { pages } = await catalogueEmploi();
    return pages.map(p => ({ chemin: p.slug.split("/") }));
  } catch {
    return [];
  }
}

function titre(p: Page): string {
  if (p.type === "secteur") return `Emploi ${p.secteur} en Suisse`;
  if (p.type === "canton") return `Emploi ${CANTONS[p.canton].dans}`;
  return `Emploi ${p.secteur} ${CANTONS[p.canton].dans}`;
}

function h1(p: Page): string {
  if (p.type === "secteur") return `Entreprises ${p.secteur} en Suisse`;
  if (p.type === "canton") return `Entreprises ${CANTONS[p.canton].dans}`;
  return `Entreprises ${p.secteur} ${CANTONS[p.canton].dans}`;
}

function intro(p: Page): string {
  const n = nombre(p);
  if (p.type === "secteur") {
    const cantons = new Set(p.fiches.map(f => f.canton).filter(c => c && c !== "CH")).size;
    return `${n} employeurs du secteur ${p.secteur} référencés sur Workie, répartis dans ${cantons} cantons. Ouvrez une fiche pour découvrir l'entreprise et accéder directement à sa page carrière officielle.`;
  }
  const lieu = CANTONS[p.canton].dans;
  const quoi = p.type === "croise" ? `du secteur ${p.secteur} ` : "";
  const nat = p.nationales.length > 0
    ? ` ${p.nationales.length} autres sont présents dans toute la Suisse.`
    : "";
  return `${p.locales.length} employeurs ${quoi}basés ${lieu} sont référencés sur Workie.${nat} Ouvrez une fiche pour découvrir l'entreprise et accéder directement à sa page carrière officielle.`;
}

export async function generateMetadata({ params }: { params: Promise<{ chemin: string[] }> }): Promise<Metadata> {
  const r = await pageEmploi((await params).chemin.join("/"));
  if (!r) return { title: "Page introuvable" };
  const p = r.page;
  const url = `${BASE_URL}/emploi/${p.slug}`;
  const t = `${titre(p)} : ${nombre(p)} entreprises`;
  const description = intro(p).slice(0, 158);
  return {
    title: t,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${t} · Workie`, description, url, siteName: "Workie", type: "website", locale: "fr_CH" },
  };
}

function Liste({ titre, fiches }: { titre?: string; fiches: FicheEmploi[] }) {
  if (fiches.length === 0) return null;
  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden", marginBottom: 20 }}>
      {titre && <h2 style={{ fontSize: 15, fontWeight: 700, padding: "18px 24px 14px" }}>{titre}</h2>}
      {fiches.map(f => <LigneSuggestion key={f.id} c={f} />)}
    </section>
  );
}

function Liens({ titre, liens }: { titre: string; liens: { href: string; label: string; n: number }[] }) {
  if (liens.length === 0) return null;
  return (
    <nav aria-label={titre} style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>{titre}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {liens.map(l => (
          <Link key={l.href} href={l.href} className="lien-emploi">
            {l.label} <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{l.n}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default async function PageEmploi({ params }: { params: Promise<{ chemin: string[] }> }) {
  const r = await pageEmploi((await params).chemin.join("/"));
  if (!r) notFound();
  const { page: p, pages } = r;

  // Maillage interne : depuis un secteur, ses cantons ; depuis un canton, ses
  // secteurs ; depuis une page croisée, les deux pages parentes.
  const croisees = pages.filter((x): x is Extract<Page, { type: "croise" }> => x.type === "croise");
  let liens: { titre: string; liens: { href: string; label: string; n: number }[] }[] = [];
  if (p.type === "secteur") {
    liens = [{ titre: "Par canton", liens: croisees.filter(x => x.secteur === p.secteur).map(x => ({ href: `/emploi/${x.slug}`, label: CANTONS[x.canton].nom, n: nombre(x) })) }];
  } else if (p.type === "canton") {
    liens = [{ titre: "Par secteur", liens: croisees.filter(x => x.canton === p.canton).map(x => ({ href: `/emploi/${x.slug}`, label: x.secteur, n: nombre(x) })) }];
  } else {
    const sect = pages.find(x => x.type === "secteur" && x.secteur === p.secteur);
    const cant = pages.find(x => x.type === "canton" && x.canton === p.canton);
    liens = [{ titre: "Élargir", liens: [
      ...(sect ? [{ href: `/emploi/${sect.slug}`, label: `${p.secteur} en Suisse`, n: nombre(sect) }] : []),
      ...(cant ? [{ href: `/emploi/${cant.slug}`, label: `Tout le canton de ${CANTONS[p.canton].nom}`, n: nombre(cant) }] : []),
    ] }];
  }

  const ariane = [
    { name: "Workie", item: BASE_URL },
    { name: "Emploi", item: `${BASE_URL}/emploi` },
    ...(p.type === "croise"
      ? [{ name: p.secteur, item: `${BASE_URL}/emploi/${slugifier(p.secteur)}` }, { name: CANTONS[p.canton].nom, item: `${BASE_URL}/emploi/${p.slug}` }]
      : [{ name: p.type === "secteur" ? p.secteur : CANTONS[p.canton].nom, item: `${BASE_URL}/emploi/${p.slug}` }]),
  ];
  const tous = p.type === "secteur" ? p.fiches : [...p.locales, ...p.nationales];
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: ariane.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.name, item: a.item })) },
    { "@context": "https://schema.org", "@type": "ItemList", name: h1(p), numberOfItems: tous.length,
      itemListElement: tous.slice(0, 50).map((f, i) => ({ "@type": "ListItem", position: i + 1, name: f.name, url: `${BASE_URL}${urlFiche(f)}` })) },
  ];

  return (
    <div className="page-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\/script>/gi, "<\\/script>") }} />
      <main className="page-main-md">
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Link href="/emploi" style={{ color: "inherit" }}>Emploi</Link>
          {p.type === "croise" && <><span aria-hidden="true">/</span><Link href={`/emploi/${slugifier(p.secteur)}`} style={{ color: "inherit" }}>{p.secteur}</Link></>}
        </nav>
        <h1 style={{ fontSize: "clamp(22px, 3.2vw, 30px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 10, textWrap: "balance" }}>{h1(p)}</h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 640, marginBottom: 24 }}>{intro(p)}</p>

        {liens.map(l => <Liens key={l.titre} {...l} />)}

        {p.type === "secteur"
          ? <Liste fiches={p.fiches} />
          : <>
              <Liste titre={`Basées ${CANTONS[p.canton].dans}`} fiches={p.locales} />
              <Liste titre="Présentes dans toute la Suisse" fiches={p.nationales} />
            </>}
      </main>
    </div>
  );
}
