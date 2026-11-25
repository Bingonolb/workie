import type { Metadata } from "next";
import type { Traduire } from "@/i18n/traduire";
import type { Langue } from "@/i18n/config";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LigneSuggestion } from "@/components/company/LigneSuggestion";
import { catalogueEmploi, pageEmploi, nombre, CANTONS, slugifier, type Page, type FicheEmploi } from "@/lib/pagesEmploi";
import { urlFiche } from "@/lib/urlFiche";
import { tServeur, langueDeLaPage } from "@/i18n/page";
import { alternates, adresse } from "@/i18n/meta";
import { nomSecteur } from "@/i18n/secteurs";
import { nomCanton, dansCanton } from "@/i18n/cantons";
import { localiserEntreprises } from "@/lib/traductionsEntreprises";

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

/** Le secteur et le lieu d'une page, dans la langue de la page. */
function mots(p: Page, langue: Langue) {
  const secteur = p.type === "canton" ? "" : nomSecteur(p.secteur, langue);
  const dans = p.type === "secteur" ? "" : dansCanton(p.canton, langue, CANTONS[p.canton].dans, CANTONS[p.canton].nom);
  return { secteur, dans };
}

function titre(p: Page, t: Traduire, langue: Langue): string {
  const v = mots(p, langue);
  return t(p.type === "secteur" ? "emploi.titreSecteur" : p.type === "canton" ? "emploi.titreCanton" : "emploi.titreCroise", v);
}

function h1(p: Page, t: Traduire, langue: Langue): string {
  const v = mots(p, langue);
  return t(p.type === "secteur" ? "emploi.h1Secteur" : p.type === "canton" ? "emploi.h1Canton" : "emploi.h1Croise", v);
}

function intro(p: Page, t: Traduire, langue: Langue): string {
  const v = mots(p, langue);
  const fin = t("emploi.introFin");
  if (p.type === "secteur") {
    const c = new Set(p.fiches.map(f => f.canton).filter(x => x && x !== "CH")).size;
    return `${t("emploi.introSecteur", { ...v, n: nombre(p), c })} ${fin}`;
  }
  const debut = t(p.type === "croise" ? "emploi.introCroise" : "emploi.introCanton", { ...v, n: p.locales.length });
  const nat = p.nationales.length > 0 ? ` ${t("emploi.introNationales", { n: p.nationales.length })}` : "";
  return `${debut}${nat} ${fin}`;
}

export async function generateMetadata({ params }: { params: Promise<{ chemin: string[] }> }): Promise<Metadata> {
  const [r, tr, langue] = await Promise.all([pageEmploi((await params).chemin.join("/")), tServeur(), langueDeLaPage()]);
  if (!r) return { title: tr("emploi.introuvable") };
  const p = r.page;
  const chemin = `/emploi/${p.slug}`;
  // « emploi » et « job » : les deux mots que les gens tapent réellement.
  const t = tr("emploi.metaTitre", { titre: titre(p, tr, langue), n: nombre(p) });
  const description = intro(p, tr, langue).slice(0, 158);
  return {
    title: t,
    description,
    alternates: alternates(chemin, langue),
    openGraph: { title: `${t} · Workie`, description, url: adresse(chemin, langue), siteName: "Workie", type: "website", locale: langue === "de" ? "de_CH" : "fr_CH" },
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
  const [t, langue] = await Promise.all([tServeur(), langueDeLaPage()]);
  const v = mots(p, langue);
  const nomC = (code: string) => nomCanton(code, langue, CANTONS[code].nom);

  // Maillage interne : depuis un secteur, ses cantons ; depuis un canton, ses
  // secteurs ; depuis une page croisée, les deux pages parentes.
  const croisees = pages.filter((x): x is Extract<Page, { type: "croise" }> => x.type === "croise");
  let liens: { titre: string; liens: { href: string; label: string; n: number }[] }[] = [];
  if (p.type === "secteur") {
    liens = [{ titre: t("emploi.parCanton"), liens: croisees.filter(x => x.secteur === p.secteur).map(x => ({ href: `/emploi/${x.slug}`, label: nomC(x.canton), n: nombre(x) })) }];
  } else if (p.type === "canton") {
    liens = [{ titre: t("emploi.parSecteur"), liens: croisees.filter(x => x.canton === p.canton).map(x => ({ href: `/emploi/${x.slug}`, label: nomSecteur(x.secteur, langue), n: nombre(x) })) }];
  } else {
    const sect = pages.find(x => x.type === "secteur" && x.secteur === p.secteur);
    const cant = pages.find(x => x.type === "canton" && x.canton === p.canton);
    liens = [{ titre: t("emploi.elargir"), liens: [
      ...(sect ? [{ href: `/emploi/${sect.slug}`, label: t("emploi.secteurSuisse", { secteur: v.secteur }), n: nombre(sect) }] : []),
      ...(cant ? [{ href: `/emploi/${cant.slug}`, label: t("emploi.toutCanton", { canton: nomC(p.canton) }), n: nombre(cant) }] : []),
    ] }];
  }

  const ariane = [
    { name: "Workie", item: BASE_URL },
    { name: t("emploi.emploi"), item: `${BASE_URL}/emploi` },
    ...(p.type === "croise"
      ? [{ name: v.secteur, item: `${BASE_URL}/emploi/${slugifier(p.secteur)}` }, { name: nomC(p.canton), item: `${BASE_URL}/emploi/${p.slug}` }]
      : [{ name: p.type === "secteur" ? v.secteur : nomC(p.canton), item: `${BASE_URL}/emploi/${p.slug}` }]),
  ];
  const brutes = p.type === "secteur" ? p.fiches : [...p.locales, ...p.nationales];
  // Sous-secteurs dans la langue de la page.
  const tous = await localiserEntreprises(brutes, langue);
  const parId = new Map(tous.map(f => [f.id, f]));
  const loc = (l: FicheEmploi[]) => l.map(f => parId.get(f.id) ?? f);
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: ariane.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.name, item: a.item })) },
    { "@context": "https://schema.org", "@type": "ItemList", name: h1(p, t, langue), numberOfItems: tous.length,
      itemListElement: tous.slice(0, 50).map((f, i) => ({ "@type": "ListItem", position: i + 1, name: f.name, url: `${BASE_URL}${urlFiche(f)}` })) },
  ];

  return (
    <div className="page-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\/script>/gi, "<\\/script>") }} />
      <main className="page-main-md">
        <nav aria-label={t("emploi.ariane")} style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Link href="/emploi" style={{ color: "inherit" }}>{t("emploi.emploi")}</Link>
          {p.type === "croise" && <><span aria-hidden="true">/</span><Link href={`/emploi/${slugifier(p.secteur)}`} style={{ color: "inherit" }}>{v.secteur}</Link></>}
        </nav>
        <h1 style={{ fontSize: "clamp(22px, 3.2vw, 30px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 10, textWrap: "balance" }}>{h1(p, t, langue)}</h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 640, marginBottom: 24 }}>{intro(p, t, langue)}</p>

        {liens.map(l => <Liens key={l.titre} {...l} />)}

        {p.type === "secteur"
          ? <Liste fiches={loc(p.fiches)} />
          : <>
              <Liste titre={t("emploi.basees", { dans: v.dans })} fiches={loc(p.locales)} />
              <Liste titre={t("emploi.nationales")} fiches={loc(p.nationales)} />
            </>}
      </main>
    </div>
  );
}
