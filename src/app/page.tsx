import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowRight, Search, BarChart3, PenLine, ShieldCheck, Lock, Gauge,
         GraduationCap, Briefcase, Landmark, Home as IconeMaison, Check } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LandingFaq } from "@/components/LandingFaq";
import { largeurCouverture } from "@/lib/coverUrl";

export const revalidate = 300; // ISR — redirect for logged-in users handled in middleware

const getLandingCounts = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const [{ count: companyCount }, { count: reviewCount }] = await Promise.all([
      admin.from("companies").select("*", { count: "exact", head: true }),
      admin.from("reviews").select("*", { count: "exact", head: true }),
    ]);
    return { companies: companyCount ?? 0, reviews: reviewCount ?? 0 };
  },
  ["landing-counts"],
  { revalidate: 300, tags: ["landing-counts"] }
);

export const metadata: Metadata = {
  title: "Workie : avis d'employés et salaires réels en Suisse",
  description: "Comparez les entreprises suisses sur les avis anonymes de leurs employés et les salaires réels, puis allez voir les postes ouverts de celle que vous choisissez.",
  openGraph: {
    title: "Workie : avis d'employés et salaires réels en Suisse",
    description: "Avis anonymes, salaires réels, classement des meilleurs employeurs suisses.",
    url: "https://www.workie.ch",
    siteName: "Workie",
    type: "website",
    locale: "fr_CH",
    images: [{ url: "https://www.workie.ch/og-default.png", width: 1200, height: 630, alt: "Workie : avis et salaires en Suisse" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Workie : avis d'employés et salaires réels en Suisse",
    description: "Avis anonymes, salaires réels, classement des meilleurs employeurs suisses.",
    images: ["https://www.workie.ch/og-default.png"],
  },
  alternates: { canonical: "https://www.workie.ch" },
};

export default async function Home() {
  const counts = await getLandingCounts();
  const nCompanies = counts.companies;

  // Vitrine fixe plutôt que tirée du classement.
  //
  // Elle affichait l'entreprise la mieux notée du moment : vivant, mais la
  // qualité de la page d'accueil dépendait alors d'une photographie qu'on ne
  // choisit pas, et le jour où la première du classement a une couverture
  // médiocre, l'accueil l'a aussi.
  //
  // Les chiffres sont illustratifs et le disent. UBS a deux avis réels et une
  // moyenne de 3,5 : publier « 4.2 sur 34 avis » sous le nom d'une banque
  // nommée serait une évaluation fausse d'une institution réelle, ce qui
  // contredit frontalement l'argument de fiabilité du site. La mention
  // « Exemple » lève l'ambiguïté sans rien retirer à la démonstration.
  const vedette = {
    name: "UBS",
    sector: "Finance",
    city: "Zurich",
    cover_url: "https://images.pexels.com/photos/35599425/pexels-photo-35599425.jpeg?auto=compress&cs=tinysrgb&w=1200",
  };

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      {/* Pas de WebSite déclaré ici : le layout en publie déjà un, plus
          complet, sur toutes les pages. Deux entités WebSite pour une même
          URL obligent Google à choisir laquelle décrit le site. */}

      {/* Styles de la page, posés ici plutôt que dans la feuille globale.
          Constaté en production : le paquet CSS restait figé d'un déploiement
          à l'autre alors que le JavaScript et le HTML se mettaient bien à
          jour. La page arrivait donc avec son nouveau balisage et sans les
          règles qui le mettent en forme, ce qui la laissait en une colonne
          collée au bord. Ces règles voyagent désormais avec la page, comme
          celles de la fiche entreprise, et ne peuvent plus se désynchroniser
          de leur balisage. */}
      <style>{`
        .landing-hero-deux-col {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 56px;
          align-items: center;
          max-width: 1120px;
          margin: 0 auto;
          padding: 76px 24px 84px;
          width: 100%;
        }
        .landing-chiffres {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 26px;
          max-width: 430px;
          padding-top: 30px;
          border-top: 1px solid var(--border);
        }
        .landing-eyebrow {
          text-align: center;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 14px;
        }
        .landing-h2 {
          text-align: center;
          font-size: clamp(23px, 3.4vw, 34px);
          font-weight: 750;
          letter-spacing: -0.032em;
          margin-bottom: 46px;
        }
        .landing-bande {
          position: relative;
          min-height: 420px;
          display: flex;
          align-items: center;
          background-image: url("https://images.pexels.com/photos/303335/pexels-photo-303335.jpeg?auto=compress&cs=tinysrgb&w=1880");
          background-size: cover;
          background-position: center 42%;
        }
        .landing-bande-voile {
          position: absolute;
          inset: 0;
          /* Assombrissement uniforme plutôt qu'un dégradé latéral. L'ancien
             laissait la droite en pleine lumière : sur un thème sombre, la
             bande s'y déchirait, et les détails de la photo se battaient avec
             le texte. */
          background: linear-gradient(90deg, rgba(8,10,16,0.86) 0%, rgba(8,10,16,0.74) 60%, rgba(8,10,16,0.62) 100%);
        }
        .landing-bande-texte {
          position: relative;
          max-width: 1120px;
          margin: 0 auto;
          padding: 64px 24px;
          width: 100%;
        }
        /* Silhouettes des deux emplacements publicitaires. Le trait plein
           marque l'annonce, les traits creux le contenu autour. */
        .apercu-format {
          flex-shrink: 0;
          width: 46px;
          display: grid;
          gap: 3px;
          padding: 5px;
          border: 1px solid var(--border2);
          border-radius: 7px;
          background: var(--surface);
        }
        .apercu-format span { border-radius: 2px; background: var(--surface3); display: block; }
        .apercu-carre {
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 15px 15px;
        }
        .apercu-carre span:nth-child(1) { background: var(--brand); }
        .apercu-plein {
          grid-template-rows: 8px 20px 5px;
        }
        .apercu-plein span:nth-child(2) { background: var(--brand); }

        /* Les cartes d'une même rangée finissent à la même hauteur. Sans
           cela, la plus courte laisse un blanc sous elle et la rangée paraît
           bancale. */
        .landing-cartes {
          display: grid;
          gap: 22px;
          align-items: stretch;
        }
        .landing-cartes > * {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 26px 24px;
          position: relative;
        }

        /* Les deux etapes du parcours, reliees par une fleche. Sur telephone
           elles s'empilent et la fleche pivote d'un quart de tour : une fleche
           horizontale entre deux blocs empiles designerait le vide a droite. */
        .landing-parcours {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 32px;
          align-items: center;
        }
        .landing-parcours-etape {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px 26px;
        }
        .landing-parcours-fleche { flex-shrink: 0; }
        @media (max-width: 760px) {
          .landing-parcours {
            grid-template-columns: 1fr;
            gap: 18px;
            justify-items: stretch;
          }
          .landing-parcours-fleche {
            transform: rotate(90deg);
            justify-self: center;
          }
        }

        .landing-pourqui {
          display: grid;
          grid-template-columns: 0.72fr 1.28fr;
          gap: 56px;
          max-width: 1000px;
          margin: 0 auto;
          align-items: start;
        }
        @media (max-width: 900px) {
          .landing-hero-deux-col {
            grid-template-columns: 1fr;
            gap: 0;
            padding: 30px 20px 48px;
          }
          /* Sur téléphone, l'ordre suit le raisonnement plutôt que l'effet.
             Une version précédente mettait l'aperçu tout en haut : on voyait
             une carte de notes sans savoir de quoi il s'agissait. On annonce
             d'abord ce qu'on fait, on le prouve ensuite, on propose d'agir en
             dernier.

             La règle display:contents dissout la colonne de texte pour que ses
             enfants deviennent des cases de la grille et puissent être
             ordonnés un à un. */
          .hero-texte { display: contents; }
          .hero-titre    { order: 1; margin-bottom: 14px; }
          .hero-accroche { order: 2; margin-bottom: 26px; }
          .landing-apercu { order: 3; margin-bottom: 30px; }
          .hero-cta-row  { order: 4; margin-bottom: 30px; }
          .landing-chiffres { order: 5; }
          .landing-chiffres { grid-template-columns: repeat(3, 1fr); gap: 0 16px; max-width: none; }
        }
        @media (max-width: 900px) {
          .landing-apercu > div { padding: 18px; border-radius: 14px; }
          .landing-apercu .landing-apercu-note { font-size: 34px; }
        }

        /* Sur téléphone, on retire ce qui n'aide pas à lire.
           Les chapeaux en capitales (« COMMENT ÇA MARCHE », « POUR QUI »)
           étiquettent une section qu'on voit d'un coup d'œil sur grand écran.
           Sur une colonne unique, où l'on découvre la page section par
           section, ils ajoutent une ligne et un temps de lecture sans rien
           apprendre : le titre juste en dessous dit déjà de quoi il s'agit.

           Et les sections passent de 88 à 56 pixels de marge verticale : la
           respiration d'un grand écran devient du vide sur un téléphone, où
           chaque écran de défilement compte. */
        @media (max-width: 768px) {
          .landing-eyebrow { display: none; }
          .landing-section { padding-top: 56px !important; padding-bottom: 56px !important; }
          .landing-h2 { margin-bottom: 30px; font-size: clamp(22px, 6.5vw, 27px); }
          .landing-bande-texte { padding: 48px 20px; }
        }

        @media (max-width: 820px) {
          .landing-pourqui { grid-template-columns: 1fr; gap: 34px; }
          .landing-bande { min-height: 340px; background-position: center; }
          .landing-bande-voile {
            background: linear-gradient(180deg, rgba(8,10,16,0.7) 0%, rgba(8,10,16,0.88) 100%);
          }
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav className="landing-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 100 }}>
        <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          workie
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeToggle />
          <Link href="/login" className="nav-login-link" style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--border2)", fontWeight: 600, fontSize: 14, color: "var(--text-muted)", textDecoration: "none" }}>
            Connexion
          </Link>
          {/* Accent plein, pas le dégradé : le dégradé est celui du logo et il
              perd sa valeur d'emblème s'il habille aussi les boutons. */}
          <Link href="/signup" style={{ padding: "9px 18px", borderRadius: 8, fontWeight: 650, fontSize: 14, textDecoration: "none", background: "var(--brand)", color: "#fff" }}>
            S&apos;inscrire
          </Link>
        </div>
      </nav>

      {/* ── Hero ──
          Aligné à gauche et non centré : un texte centré sur toute la largeur
          n'a pas de point d'entrée pour l'œil, et c'est la mise en page qu'on
          obtient quand aucune décision n'a été prise. Plus de dégradé sur le
          titre ni sur les boutons, plus de taches colorées en fond : un seul
          accent, employé avec parcimonie. Le logo garde le sien. */}
      <section className="landing-hero-deux-col">
        <div className="hero-texte">
          <h1 className="hero-titre" style={{ fontSize: "clamp(34px, 5.2vw, 58px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.035em", marginBottom: 22, maxWidth: 620 }}>
            Les entreprises suisses vues de l&apos;intérieur, avant d&apos;y postuler.
          </h1>

          <p className="hero-accroche" style={{ fontSize: "clamp(16px, 1.6vw, 19px)", color: "var(--text-sub)", maxWidth: 560, lineHeight: 1.65, marginBottom: 34 }}>
            {/* La phrase s'arrêtait sur les données. Un lecteur en concluait
                que Workie renseigne sur les entreprises et rien d'autre. Elle
                nomme maintenant le parcours entier, dont la candidature. */}
            Notes détaillées, salaires réels et conditions de travail, publiés
            anonymement par celles et ceux qui y travaillent. Comparez,
            choisissez, et notez le vôtre à votre tour.
          </p>

          <div className="hero-cta-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 34 }}>
            <Link href="/explore" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 26px", borderRadius: 10, background: "var(--brand)", color: "#fff", fontWeight: 650, fontSize: 15.5, textDecoration: "none" }}>
              Consulter les entreprises <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", padding: "14px 24px", borderRadius: 10, border: "1px solid var(--border2)", color: "var(--text)", fontWeight: 600, fontSize: 15.5, textDecoration: "none" }}>
              Créer un compte
            </Link>
          </div>

          {/* Les chiffres qui portent la crédibilité.
              Le nombre d'avis n'y figure pas : il est de dix-huit, et l'annoncer
              en grand sur la première page dit surtout que le site est vide.

              « 0 texte libre » y a figuré un temps et se lisait comme un manque
              au premier coup d'œil : un bandeau de chiffres doit dire ce qu'on
              a, pas ce qu'on n'a pas. L'argument garde toute sa force, mais à
              sa place, dans « Des garanties vérifiables ». */}
          <div className="landing-chiffres">
            {[
              // Trois chiffres, pas quatre : « 8 critères notés » relève du
              // fonctionnement, pas de ce qui décide quelqu'un à entrer. Le
              // détail reste dans « Chercher, comparer, contribuer », où il est
              // à sa place.
              { valeur: nCompanies.toLocaleString("fr-CH"), libelle: "entreprises référencées" },
              { valeur: "26", libelle: "cantons couverts" },
              { valeur: "100%", libelle: "anonyme" },
            ].map(({ valeur, libelle }, i) => (
              <div key={libelle} style={{
                // Filets verticaux plutôt que quatre blocs posés côte à côte :
                // ils font lire la rangée comme un ensemble.
                paddingLeft: i === 0 ? 0 : 26,
                borderLeft: i === 0 ? "none" : "1px solid var(--border)",
              }}>
                <p style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{valeur}</p>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 7, lineHeight: 1.4 }}>{libelle}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Aperçu du produit.
            Construit en balisage plutôt qu'en image : net à toute résolution,
            suit le thème clair comme sombre, et ne se périme pas quand la
            fiche évolue. Rien ne crédibilise autant que de montrer ce qu'on
            vend, et la page n'en montrait rien. */}
        <div className="landing-apercu" aria-hidden="true">
          <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 16, overflow: "hidden", boxShadow: "0 18px 50px rgba(0,0,0,0.13)" }}>
            {/* En-tête d'une entreprise réelle, couverture comprise.
                Le visuel du hero ne montrait que des barres de notes : juste,
                mais sec, et sans image. Les meilleures pages d'accueil n'ont
                qu'un visuel principal, et il porte à la fois le produit et
                l'image. Celui-ci fait les deux, ce qui a permis de retirer la
                composition qui faisait double emploi plus bas. */}
            {vedette && (
              <div style={{ position: "relative", height: 132 }}>
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundColor: "var(--surface3)",
                  backgroundImage: vedette.cover_url ? `url(${largeurCouverture(vedette.cover_url, 940)})` : undefined,
                  backgroundSize: "cover", backgroundPosition: "center",
                }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.86) 100%)" }} />
                <div style={{ position: "absolute", left: 20, right: 20, bottom: 14 }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{vedette.name}</p>
                  <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.72)", marginTop: 3 }}>
                    {vedette.sector}{vedette.city ? ` · ${vedette.city}` : ""}
                  </p>
                </div>
              </div>
            )}

            <div style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Synthèse des avis
              </p>
              {/* Les chiffres ci-dessous illustrent la mise en forme ; ils ne
                  sont pas ceux d'UBS. Le dire est la moindre des choses sur un
                  site dont l'argument est l'exactitude. */}
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", border: "1px solid var(--border2)", borderRadius: 5, padding: "2px 7px" }}>
                Exemple
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 18 }}>
              <span className="landing-apercu-note" style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 0.9 }}>4.2</span>
              <span style={{ fontSize: 12.5, color: "var(--text-muted)", paddingBottom: 4 }}>sur 34 avis</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
              {[
                { l: "Management", v: 78 },
                { l: "Vie pro / perso", v: 86 },
                { l: "Rémunération", v: 64 },
                { l: "Évolution", v: 71 },
              ].map(({ l, v }) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ flex: "1 1 0", fontSize: 12.5, color: "var(--text-muted)" }}>{l}</span>
                  <div style={{ flex: "0 0 92px", height: 5, background: "var(--surface3)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${v}%`, height: "100%", background: "var(--brand)", borderRadius: 3 }} />
                  </div>
                  <span style={{ flex: "0 0 26px", textAlign: "right", fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    {(v / 20).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 15, borderTop: "1px solid var(--border)" }}>
              {[
                { g: "82%", p: "recommandent" },
                { g: "CHF 96k", p: "salaire médian" },
              ].map(({ g, p }) => (
                <div key={p} style={{ display: "flex", alignItems: "baseline", gap: 6, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 9, padding: "7px 12px" }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{g}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{p}</span>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ──
          Pas de bordure basse : la bande photographique suit immédiatement, et
          son fond sombre sépare les deux à lui seul. Le trait d'un pixel se
          voyait posé sur l'image comme un défaut. */}
      <section className="landing-section" style={{ padding: "88px 24px", background: "var(--surface2)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <p className="landing-eyebrow">Ce que vous faites ici</p>
          {/* Le titre reprenait mot pour mot les trois cartes qu'il annonce :
              on lisait « Chercher, comparer, contribuer » puis « Chercher »,
              « Comparer », « Contribuer ». Il se contente maintenant de
              compter les étapes, ce que les cartes ne disent pas. */}
          <h2 className="landing-h2">En trois étapes.</h2>
          <div className="landing-cartes" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
            {[
              { n: "01", Icone: Search, titre: "Chercher",
                desc: "Par nom, canton ou secteur. Des PME aux multinationales, dans toute la Suisse." },
              { n: "02", Icone: BarChart3, titre: "Comparer",
                desc: "Management, culture, rémunération, évolution : huit critères notés par des employés en poste et d'anciens collaborateurs." },
              { n: "03", Icone: PenLine, titre: "Contribuer",
                desc: "Vous notez votre expérience anonymement. Chaque contribution rend la suivante plus utile." },
            ].map(({ n, Icone, titre, desc }) => (
              <div key={n} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "26px 24px", position: "relative" }}>
                <span style={{ position: "absolute", top: 22, right: 22, fontSize: 11.5, fontWeight: 700, color: "var(--border2)", letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums" }}>{n}</span>
                <Icone size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />
                <h3 style={{ fontSize: 16.5, fontWeight: 700, color: "var(--text)", margin: "15px 0 9px" }}>{titre}</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.62 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bande photographique ──
          Trois sections de cartes se suivaient, avec le même chapeau centré et
          le même titre : cette monotonie est la signature d'un gabarit. Une
          image pleine largeur donne à la page un moment, et une respiration.

          Un lieu plutôt que des personnes : la photographie de bureau avec des
          collaborateurs souriants est le cliché qui déclasse une page. Zurich
          sur la Limmat situe la plateforme sans rien prétendre. */}
      <section className="landing-bande" aria-hidden="false">
        <div className="landing-bande-voile" />
        <div className="landing-bande-texte">
          <p style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.025em", color: "#fff", maxWidth: 760 }}>
            Choisir son employeur, pas seulement son poste.
          </p>
          <p style={{ fontSize: "clamp(14px, 1.5vw, 16.5px)", color: "rgba(255,255,255,0.72)", lineHeight: 1.65, maxWidth: 620, marginTop: 18 }}>
            {/* Cette phrase a d'abord répété trois éléments déjà lus plus haut,
                puis énoncé une évidence (« une moyenne ne dit pas… »). Elle
                donne maintenant le cas concret qui justifie le titre : c'est
                l'écart entre deux notes globales identiques qui rend le détail
                utile, et ça, une généralité ne peut pas le montrer. */}
            Deux employeurs notés 3.8 ne se ressemblent pas : chez l&apos;un la note
            tient à la rémunération, chez l&apos;autre à l&apos;encadrement.
          </p>
        </div>
      </section>

      {/* ── Postuler ──
          Traitement volontairement different des autres sections : ni cartes
          en grille, ni colonnes reglees, mais les deux etapes du parcours
          posees cote a cote avec la fleche qui les relie. La page montre ici
          le chemin au lieu de le decrire.

          Aucun chiffre : les offres ne sont pas hebergees sur Workie, elles
          sont chez l'employeur. Annoncer un nombre reviendrait a compter ce
          qui ne nous appartient pas, et a promettre un volume qui varie
          chaque semaine. */}
      <section className="landing-section" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <p className="landing-eyebrow">Postuler</p>
          {/* Le vrai écart avec un site d'annonces, et donc la raison d'être de
              cette section. Un site d'annonces ne peut montrer que ce qu'on lui
              a confié : son catalogue s'arrête aux employeurs qui ont choisi de
              publier chez lui. Workie part de l'employeur, pas de l'annonce, et
              atteint donc aussi ceux qui recrutent uniquement sur leur propre
              site.

              Aucun concurrent n'est nommé : le fait suffit, et une plateforme
              qui prend ses concurrents à partie sur sa page d'accueil se
              disqualifie avant d'avoir convaincu. */}
          {/* Le titre faisait deux lignes la ou tous les autres h2 de la page
              tiennent en trois ou quatre mots. La phrase entiere est passee
              juste en dessous, ou elle a la place de s'expliquer. */}
          <h2 className="landing-h2">Tous les employeurs, pas une sélection.</h2>

          <p style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 640, margin: "0 auto 44px", textAlign: "center" }}>
            Un site d&apos;annonces ne montre que les offres qu&apos;on lui a confiées.
            Workie référence les employeurs eux-mêmes : chaque fiche mène à leur
            page emploi, y compris celle des entreprises qui recrutent sans
            passer par une plateforme.
          </p>

          <div className="landing-parcours">
            <div className="landing-parcours-etape">
              <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
                Sur Workie
              </p>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>
                Vous jugez l&apos;employeur
              </h3>
              {/* Cette phrase reprenait presque mot pour mot l'accroche du
                  haut de page : « Notes détaillées, salaires... et conditions
                  de travail, par celles et ceux qui y travaillent ». */}
              <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.65 }}>
                Sa note globale, le détail critère par critère, et les salaires
                déclarés pour le poste que vous visez.
              </p>
            </div>

            <ArrowRight className="landing-parcours-fleche" size={26} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />

            <div className="landing-parcours-etape">
              <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
                Chez l&apos;employeur
              </p>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>
                Vous voyez tous ses postes
              </h3>
              <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.65 }}>
                Le lien de la fiche mène à sa page emploi, tenue par ses propres
                équipes : tous les postes ouverts, et aucun qui ne le soit plus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pour qui ──
          Section absente jusqu'ici. Une page qui parle à tout le monde en
          général ne parle à personne en particulier : nommer les situations
          permet à chacun de se reconnaître, de l'étudiant au cadre confirmé. */}
      <section className="landing-section" style={{ padding: "96px 24px" }}>
        <div className="landing-pourqui">
          <div>
            <p className="landing-eyebrow" style={{ textAlign: "left" }}>Pour qui</p>
            <h2 style={{ fontSize: "clamp(24px, 3.4vw, 36px)", fontWeight: 700, letterSpacing: "-0.032em", lineHeight: 1.18, maxWidth: 380, marginBottom: 26 }}>
              Quatre façons de s&apos;en servir.
            </h2>
            {/* Éventail de trois fiches réelles.
                Une photographie d'illustration occupait cette place : elle
                remplissait le vide sans rien dire du produit. Trois cartes en
                éventail montrent le swipe, qui est la signature de Workie, et
                leurs couvertures apportent les images. Les entreprises sont
                tirées de la base, donc elles ne peuvent pas mentir. */}
          </div>

          {/* Une liste, pas une quatrième grille de cartes. Le filet fin et le
              retrait suffisent à séparer les entrées, et le texte respire. */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { Icone: GraduationCap, titre: "Vous terminez vos études",
                desc: "Situer le salaire d'un premier poste dans votre domaine, et repérer les employeurs qui encadrent réellement leurs débutants." },
              { Icone: Briefcase, titre: "Vous envisagez de changer",
                desc: "Comparer votre employeur actuel à ceux qui recrutent, sur des critères précis plutôt que sur une réputation." },
              { Icone: Landmark, titre: "Vous êtes dans le public",
                desc: "Comparer avec le privé sur des bases concrètes : rémunération, charge de travail et flexibilité." },
              { Icone: IconeMaison, titre: "Vous reprenez une activité",
                desc: "Identifier les employeurs que leurs équipes jugent souples sur les horaires et attentifs aux parcours interrompus." },
            ].map(({ Icone, titre, desc }, i) => (
              <div key={titre} style={{
                display: "flex", gap: 18, padding: "22px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--border)",
              }}>
                <Icone size={19} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} />
                <div>
                  <h3 style={{ fontSize: 16.5, fontWeight: 700, color: "var(--text)", marginBottom: 7 }}>{titre}</h3>
                  <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 520 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ce qui rend l'information fiable ──
          Ces garanties n'existaient que dans la foire aux questions, tout en
          bas. Ce sont pourtant elles qui distinguent la plateforme, et la
          première d'entre elles, le format entièrement chiffré des avis, est aussi
          ce qui la protège juridiquement. */}
      <section className="landing-section" style={{ padding: "88px 24px", background: "var(--surface2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <p className="landing-eyebrow">Ce qui rend l&apos;information fiable</p>
          <h2 className="landing-h2">Des garanties vérifiables.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 22 }}>
            {[
              // « Aucun texte libre » énonçait une interdiction, et la suite
              // parlait de récits inventés et de règlements de comptes : trois
              // tournures négatives pour décrire un choix qui est positif. Le
              // fait est que les avis sont chiffrés, donc comparables. C'est ce
              // que la carte dit maintenant.
              { Icone: Gauge, titre: "Uniquement des données chiffrées",
                desc: "Chaque avis est un ensemble de notes, accompagné du contexte du poste. Des valeurs comparables d'une entreprise à l'autre, lisibles d'un coup d'oeil." },
              { Icone: Lock, titre: "Anonymat par construction",
                desc: "Votre nom n'est jamais publié, et aucune page ne relie un compte à un avis. Ce n'est pas un réglage, c'est la façon dont les données sont servies." },
              { Icone: ShieldCheck, titre: "Contrôles à la publication",
                desc: "Adresse confirmée, compte de plus de vingt-quatre heures, un seul avis par entreprise, et une modération alimentée par les signalements." },
            ].map(({ Icone, titre, desc }) => (
              <div key={titre}>
                <Icone size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "14px 0 9px" }}>{titre}</h3>
                <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.62 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Appel à l'action ── */}
      <section className="landing-section" style={{ padding: "92px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px, 3.6vw, 34px)", fontWeight: 750, letterSpacing: "-0.03em", marginBottom: 14 }}>
            Commencez par votre secteur.
          </h2>
          <p style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 32 }}>
            La consultation est libre et ne demande pas de compte. Chaque fiche mène à l'employeur et à ses postes ouverts.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/explore" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 30px", borderRadius: 10, background: "var(--brand)", color: "#fff", fontWeight: 650, fontSize: 15.5, textDecoration: "none" }}>
              Consulter les entreprises <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/ranking" style={{ display: "inline-flex", alignItems: "center", padding: "14px 26px", borderRadius: 10, border: "1px solid var(--border2)", color: "var(--text)", fontWeight: 600, fontSize: 15.5, textDecoration: "none" }}>
              Voir le classement
            </Link>
          </div>
        </div>
      </section>

      {/* ── Publicité ── */}
      <section style={{ padding: "68px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <div className="landing-ads-grid">
            <div>
              <p className="landing-eyebrow" style={{ textAlign: "left" }}>Annonceurs</p>
              <h2 style={{ fontSize: "clamp(21px, 2.8vw, 28px)", fontWeight: 750, letterSpacing: "-0.03em", marginBottom: 13 }}>
                Touchez des candidats actifs en Suisse.
              </h2>
              <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 22, maxWidth: 520 }}>
                Que vous représentiez une entreprise ou un projet personnel, vous
                diffusez une annonce sans abonnement. Vous fixez votre budget et
                votre ciblage, et vous ne payez que ce que vous consommez.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {[
                  "À partir de CHF 5 par jour",
                  "Paiement unique",
                  "Ciblage par canton et secteur",
                  "Statistiques en temps réel",
                  "Sans abonnement",
                ].map(f => (
                  <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 550, padding: "5px 12px", borderRadius: 50, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text-muted)" }}>
                    <Check size={12} color="var(--brand)" strokeWidth={2.5} aria-hidden="true" /> {f}
                  </span>
                ))}
              </div>
              <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, background: "var(--brand)", color: "#fff", fontWeight: 650, fontSize: 14.5, textDecoration: "none" }}>
                Créer une campagne <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            {/* Même tarif pour les deux formats : rien n'établit qu'une
                impression en plein écran vaille davantage, et deux prix pour
                un service dont on ignore encore le rendement se défendent mal
                auprès d'un annonceur. */}
            <div className="landing-ads-aside" style={{ flexDirection: "column", gap: 10, minWidth: 210 }}>
              {/* Un aperçu de chaque format plutôt que son seul nom.
                  Le bloc n'était que du texte : on lisait « format carré » sans
                  voir de quoi il s'agit. Deux silhouettes dessinées en CSS
                  valent mieux qu'une description, et se comprennent d'un coup
                  d'œil. */}
              {[
                { label: "Format carré", desc: "Dans la grille des entreprises", forme: "carre" },
                { label: "Format plein écran", desc: "Dans le swipe, toutes les dix cartes", forme: "plein" },
              ].map(({ label, desc, forme }) => (
                <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "15px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div className={`apercu-format apercu-${forme}`} aria-hidden="true">
                    <span /><span /><span />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{label}</p>
                    <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5 }}>{desc}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--brand)", marginTop: 7 }}>dès CHF 4 pour mille affichages</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <LandingFaq />

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "36px 24px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, marginBottom: 32 }}>
            <div>
              <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "block", marginBottom: 8 }}>workie</span>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>La transparence du marché du travail suisse.</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Explorer</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[{ href: "/explore", label: "Entreprises" }, { href: "/ranking", label: "Classement" }, { href: "/salaires", label: "Salaires" }, { href: "/profile/ads", label: "Faire de la publicité" }].map(({ href, label }) => (
                  <Link key={href} href={href} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Légal</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[{ href: "/cgu", label: "CGU" }, { href: "/confidentialite", label: "Confidentialité" }].map(({ href, label }) => (
                  <Link key={href} href={href} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>© 2026 Workie</span>
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Plateforme suisse, données hébergées en Europe</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
