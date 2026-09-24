import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowRight, ShieldCheck, Lock, Gauge,
         GraduationCap, Briefcase, Landmark, Home as IconeMaison, Check,
       } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LandingFaq } from "@/components/LandingFaq";
import { ApercuSwipe } from "@/components/ApercuSwipe";
import { languesDeTravail } from "@/lib/langues";
import { Logo } from "@/components/Logo";

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

/**
 * Les dix entreprises de la pile d'accueil.
 *
 * Tirees des secteurs que Luc a repris a la main, fiche par fiche : ce sont
 * les seules dont on sait que le nom, la description et l'adresse sont justes.
 * La page d'accueil est l'endroit ou une erreur se voit le plus.
 *
 * Une par secteur d'abord, les mieux suivies, puis on complete : dix cartes de
 * la meme branche feraient croire a un site specialise.
 */
const SECTEURS_REPRIS = [
  "Administration publique", "Aéronautique & Spatial", "Agriculture",
  "Alimentation", "Association", "Assurances", "Automobile",
];

const getApercuEntreprises = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("companies")
      .select("id, name, sector, subsector, city, canton, description, cover_url, website_url, employee_range, langues")
      .in("sector", SECTEURS_REPRIS)
      .not("cover_url", "is", null)
      .not("description", "is", null)
      .order("score", { ascending: false })
      .limit(120);

    type Ligne = NonNullable<typeof data>[number];
    const parSecteur = new Map<string, Ligne[]>();
    for (const c of data ?? []) {
      const liste = parSecteur.get(c.sector) ?? [];
      liste.push(c);
      parSecteur.set(c.sector, liste);
    }

    // Tour a tour dans chaque secteur, jusqu'a dix.
    const retenues: Ligne[] = [];
    for (let tour = 0; retenues.length < 10 && tour < 10; tour++) {
      for (const secteur of SECTEURS_REPRIS) {
        const c = parSecteur.get(secteur)?.[tour];
        if (c && retenues.length < 10) retenues.push(c);
      }
    }

    return retenues.map(c => {
      const saisies = (c as { langues?: string[] | null }).langues ?? [];
      const langues = saisies.length > 0
        ? saisies
        : languesDeTravail(c.canton ?? null, c.website_url ?? null, c.employee_range ?? null);
      return {
        id: c.id,
        name: c.name,
        sector: c.sector,
        subsector: c.subsector,
        lieu: `${c.city}${c.canton ? `, ${c.canton}` : ""}`,
        langues: langues.join(" · "),
        description: c.description,
        cover_url: c.cover_url,
      };
    });
  },
  ["landing-apercu-10"],
  { revalidate: 300, tags: ["companies"] }
);

export const metadata: Metadata = {
  title: "Workie : chercher du travail devient passionnant",
  description: "Découvrez des entreprises suisses, trouvez celles qui vous correspondent et accédez directement à leurs offres d'emploi.",
  openGraph: {
    title: "Workie : chercher du travail devient passionnant",
    description: "Découvrez des entreprises suisses, trouvez celles qui vous correspondent et accédez directement à leurs offres d'emploi.",
    url: "https://www.workie.ch",
    siteName: "Workie",
    type: "website",
    locale: "fr_CH",
  },
  twitter: {
    card: "summary_large_image",
    title: "Workie : chercher du travail devient passionnant",
    description: "Découvrez des entreprises suisses, trouvez celles qui vous correspondent et accédez directement à leurs offres d'emploi.",
  },
  alternates: { canonical: "https://www.workie.ch" },
};

export default async function Home() {
  const [counts, apercu] = await Promise.all([getLandingCounts(), getApercuEntreprises()]);
  const nCompanies = counts.companies;

  // Vitrine fixe plutôt que tirée du classement.
  //
  // Elle affichait l'entreprise la mieux notée du moment : vivant, mais la
  // qualité de la page d'accueil dépendait alors d'une photographie qu'on ne
  // choisit pas, et le jour où la première du classement a une couverture
  // médiocre, l'accueil l'a aussi.
  //
  // La vitrine figee a cede la place a la pile : les cinq entreprises
  // viennent du catalogue, avec leurs vraies photos et leurs vraies langues.

  return (
    <main className="landing-tons" style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
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
        /* Rythme des fonds.

           Les sections alternaient entre --bg et --surface2 : 2 % d'ecart,
           invisible. Ces deux tons creusent l'ecart jusqu'a ce qu'il se voie,
           et le ton d'accent donne a la page un moment colore la ou l'on veut
           que l'oeil s'arrete.

           En theme sombre, le ton souleve va vers le clair : sur un fond
           sombre, une surface qui s'eclaircit se lit comme un panneau pose au
           dessus, alors qu'une surface qui s'assombrit se lit comme un trou. */
        .landing-tons {
          --ton: #1e2129;
          --ton-carte: #2a2e3a;
          --ton-accent: #1a1338;
          --ton-accent-bord: rgba(139,92,246,0.22);
        }
        html.light .landing-tons {
          --ton: #e5e9f0;
          --ton-carte: #ffffff;
          --ton-accent: #ebe6fb;
          --ton-accent-bord: rgba(91,63,214,0.16);
        }
        .landing-ton {
          background: var(--ton);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        /* Une carte posee sur le ton souleve doit se souleve a son tour :
           laissee sur --surface, elle devient plus sombre que la section qui
           la porte en theme sombre, et le rapport s'inverse. */
        .landing-ton .landing-parcours-etape,
        .landing-ton .faq-item { background: var(--ton-carte); }
        .landing-accent {
          background: var(--ton-accent);
          border-top: 1px solid var(--ton-accent-bord);
          border-bottom: 1px solid var(--ton-accent-bord);
        }

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
        /* Un titre suivi d'un chapeau resserre sa marge basse : les 46 px
           prevus pour un titre qui precede directement le contenu s'ajoutaient
           aux 44 px du chapeau, et titre, phrase et cartes flottaient a egale
           distance sans que rien ne dise lequel appartenait a lequel. */
        .landing-h2.avec-chapo { margin-bottom: 14px; }
        .landing-chapo {
          font-size: 15.5px;
          color: var(--text-muted);
          line-height: 1.65;
          max-width: 560px;
          margin: 0 auto 40px;
          text-align: center;
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
        /* Seconde bande : une autre vue, et un cadrage plus bas, pour que les
           deux images ne se ressemblent pas. */
        .landing-bande-2 {
          background-image: url("https://images.pexels.com/photos/27678917/pexels-photo-27678917.jpeg?auto=compress&cs=tinysrgb&w=1880");
          background-position: center 55%;
          min-height: 340px;
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
        .landing-quatre {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 980px) { .landing-quatre { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 560px) { .landing-quatre { grid-template-columns: 1fr; gap: 12px; } }
        .landing-pub {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 56px;
          align-items: center;
        }
        @media (max-width: 900px) { .landing-pub { grid-template-columns: 1fr; gap: 36px; } }
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
          /* La regle « .landing-apercu > div { padding: 18px } » a ete retiree.
             Elle servait l'ancien apercu statique, une carte a marges ; posee
             sur la pile, elle ajoutait dix-huit pixels autour de la carte
             entiere, et la photo flottait au milieu d'un cadre vide. */
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
        <Logo taille={30} />
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
          {/* Six mots, pas dix. A 58 px, dix mots donnaient quatre lignes :
              le titre remplissait l'écran à lui seul et plus rien ne se lisait
              après lui. Un titre de page d'accueil se saisit d'un coup d'œil,
              il ne se lit pas. Le corps redescend de 58 à 50 px. */}
          <h1 className="hero-titre" style={{ fontSize: "clamp(32px, 4.4vw, 50px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.035em", marginBottom: 20, maxWidth: 560 }}>
            Chercher du travail devient passionnant.
          </h1>

          {/* Douze mots, pas vingt-sept. La phrase enumérait les données puis
              les trois verbes du parcours : deux phrases pour ce qui en
              demande une. Elle dit maintenant d'où viennent les notes, ce qui
              est la seule chose qu'un titre ne peut pas porter. */}
          <p className="hero-accroche" style={{ fontSize: "clamp(15.5px, 1.4vw, 17.5px)", color: "var(--text-sub)", maxWidth: 470, lineHeight: 1.6, marginBottom: 32 }}>
            Découvrez des entreprises suisses, trouvez celles qui vous correspondent et accédez directement à leurs offres d&apos;emploi.
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
              { valeur: nCompanies.toLocaleString("fr-CH"), libelle: "entreprises" },
              { valeur: "26", libelle: "cantons" },
              { valeur: "36", libelle: "secteurs" },
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
        {/* La pile se manipule vraiment : cinq entreprises du catalogue, le
            geste du site, et rien d'enregistre puisque le visiteur n'a pas
            encore de compte. Une capture dit ce que le site montre ; une carte
            qu'on fait glisser dit ce qu'on y fait. */}
        <ApercuSwipe entreprises={apercu} />
      </section>

      {/* La section « En trois étapes » a été retirée d'ici.

          Elle annonçait Chercher, Comparer, Contribuer, alors que l'accroche
          du hero dit déjà « Comparez, choisissez, et notez le vôtre à votre
          tour » : les mêmes trois verbes, à deux écrans d'intervalle. C'est le
          genre de section que toute page d'accueil possède et que personne ne
          lit, et son départ rend au hero la place qu'il avait perdue. */}

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
          <p style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.025em", color: "#fff", maxWidth: 700, textWrap: "balance" }}>
            Plus de 1000 entreprises en Suisse.
          </p>
          <p style={{ fontSize: "clamp(14px, 1.5vw, 16.5px)", color: "rgba(255,255,255,0.72)", lineHeight: 1.65, maxWidth: 700, marginTop: 18, textWrap: "balance" }}>
            {/* Cette phrase a d'abord répété trois éléments déjà lus plus haut,
                puis énoncé une évidence (« une moyenne ne dit pas… »). Elle
                donne maintenant le cas concret qui justifie le titre : c'est
                l'écart entre deux notes globales identiques qui rend le détail
                utile, et ça, une généralité ne peut pas le montrer. */}
            Des grands groupes aux équipes de 3 personnes. Au même endroit.
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
      <section className="landing-section landing-ton" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
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
          {/* « Tous les employeurs » etait faux : le catalogue en compte un
              millier, pas la totalite des employeurs suisses, et il ne les aura
              jamais tous. L'exhaustivite promise n'est pas la : elle porte sur
              les offres d'un employeur donne, dont on voit la totalite parce
              qu'on va les lire chez lui. C'est ce que dit le chapeau, et c'est
              ce que le titre annonce maintenant. */}
          <h2 className="landing-h2 avec-chapo">Plus qu&apos;une annonce.</h2>

          <p className="landing-chapo">
            Chaque offre a une entreprise derrière elle. Rencontrez-la d&apos;abord.
          </p>

          {/* Les quatre questions qu'on se pose en cherchant du travail (où
              postuler, qui recrute autour de moi, pourquoi certaines entreprises
              n'apparaissent nulle part) trouvent chacune leur réponse ici, dans
              l'ordre où on les rencontre. */}
          <div className="landing-quatre">
            {[
              { etape: "Trouvez", titre: "Les entreprises autour de vous",
                desc: "Par canton, par ville, par secteur. Y compris celles qui recrutent seulement sur leur propre site." },
              { etape: "Découvrez", titre: "L'essentiel sur chacune",
                desc: "Ce qu'elle fait, où elle se trouve, dans quelle langue on y travaille." },
              { etape: "Gardez", titre: "Vos favoris, au même endroit",
                desc: "Une flamme, et l'entreprise rejoint votre liste." },
              { etape: "Postulez", titre: "Directement chez elle",
                desc: "Tous ses postes ouverts, sur son site." },
            ].map(({ etape, titre, desc }) => (
              <div key={etape} className="landing-parcours-etape">
                <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 12 }}>
                  {etape}
                </p>
                <h3 style={{ fontSize: 17.5, fontWeight: 700, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.02em" }}>
                  {titre}
                </h3>
                <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {desc}
                </p>
              </div>
            ))}
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
              Où que vous en soyez.
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
                desc: "Les employeurs de votre domaine, même ceux que vous ne connaissez pas." },
              { Icone: Briefcase, titre: "Vous envisagez de changer",
                desc: "Qui recrute dans votre métier, en quelques minutes." },
              { Icone: Landmark, titre: "Vous êtes dans le public",
                desc: "Le privé, secteur par secteur." },
              { Icone: IconeMaison, titre: "Vous reprenez une activité",
                desc: "Les employeurs de votre canton, gardés pour le bon moment." },
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

      {/* ── Ce qui rend le catalogue fiable ──
          Les trois garanties portaient sur les avis : anonymat, un seul avis
          par entreprise, moderation. Les avis ne sont plus affiches, et
          promettre ce qu'on ne fait plus est la pire des promesses. Elles
          portent desormais sur ce qui fait la valeur du site aujourd'hui :
          un catalogue tenu a la main, des liens qui menent chez l'employeur,
          et aucun jugement publie. */}
      <section className="landing-section landing-ton" style={{ padding: "88px 24px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <p className="landing-eyebrow">Notre promesse</p>
          <h2 className="landing-h2">Simple, et juste.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 22 }}>
            {[
              // « Aucun texte libre » énonçait une interdiction, et la suite
              // parlait de récits inventés et de règlements de comptes : trois
              // tournures négatives pour décrire un choix qui est positif. Le
              // fait est que les avis sont chiffrés, donc comparables. C'est ce
              // que la carte dit maintenant.
              { Icone: Gauge, titre: "Un catalogue tenu à la main",
                desc: "Chaque fiche est vérifiée, une par une." },
              { Icone: ShieldCheck, titre: "Rien entre vous et l'employeur",
                desc: "Vous postulez chez lui, directement." },
              { Icone: Lock, titre: "Des faits",
                desc: "Le métier, le lieu, la langue. Le jugement vous appartient." },
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

      {/* ── Bande photographique, seconde ──
          Deux aplats se touchaient ici, le gris souleve des engagements puis
          le violet pale de l'appel a l'action : une couture, pas une
          transition. L'image separe les deux et donne une respiration avant
          la derniere demande. */}
      <section className="landing-bande landing-bande-2">
        <div className="landing-bande-voile" />
        <div className="landing-bande-texte">
          <p style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.025em", color: "#fff", maxWidth: 700, textWrap: "balance" }}>
            26 cantons, 4 langues, 1000 employeurs.
          </p>
          <p style={{ fontSize: "clamp(14px, 1.5vw, 16.5px)", color: "rgba(255,255,255,0.72)", lineHeight: 1.65, maxWidth: 700, marginTop: 18, textWrap: "balance" }}>
            Vous avez l&apos;impression de toujours voir les mêmes offres ? Ici, ce ne sera jamais le cas.
          </p>
        </div>
      </section>

      {/* ── Appel à l'action ── */}
      <section className="landing-section landing-accent" style={{ padding: "92px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px, 3.6vw, 34px)", fontWeight: 750, letterSpacing: "-0.03em", marginBottom: 14 }}>
            Commencez par votre secteur.
          </h2>
          <p style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 32 }}>
            Gratuit. Sans inscription.
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

      {/* ── Publicité ──
          Montrer plutôt qu'expliquer : la pile mêle cinq fiches et cinq
          annonces d'exemple, et c'est en la faisant glisser qu'on voit qu'une
          annonce a ici la forme du contenu qui l'entoure. */}
      <section className="landing-section" style={{ padding: "88px 24px", borderTop: "1px solid var(--border)" }}>
        <div className="landing-pub" style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div>
            <p className="landing-eyebrow" style={{ textAlign: "left" }}>Annonceurs</p>
            <h2 style={{ fontSize: "clamp(23px, 3.2vw, 32px)", fontWeight: 750, letterSpacing: "-0.03em", lineHeight: 1.18, marginBottom: 14 }}>
              Vos annonces au milieu de leur recherche.
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 22, maxWidth: 500 }}>
              Changer de travail est une décision qui en entraîne beaucoup d&apos;autres :
              déménager, acheter une voiture, revoir son assurance, reprendre une
              formation. Les gens qui vivent ce moment sont ici, et ils sont attentifs à
              tout ce qui peut les aider à le traverser.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
              {[
                "Ciblage par canton et secteur",
                "7, 14 ou 30 jours",
                "Paiement unique",
                "Statistiques en temps réel",
              ].map(f => (
                <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 550, padding: "5px 12px", borderRadius: 50, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text-muted)" }}>
                  <Check size={12} color="var(--brand)" strokeWidth={2.5} aria-hidden="true" /> {f}
                </span>
              ))}
            </div>
            <Link href="/annonceurs" className="btn btn-clair">
              Faire de la publicité <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {/* La pile mêlant fiches et annonces reste sur la page Annonceurs.
              L'accueil a déjà la sienne, en haut, et deux piles sur une même
              page font se demander laquelle est le site. Ici, les deux
              silhouettes disent l'emplacement, ce qui suffit. */}
          <div className="landing-ads-aside">
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
                </div>
              </div>
            ))}
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
              <Logo taille={26} className="logo-pied" />
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>Chercher du travail devient passionnant.</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Explorer</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[{ href: "/explore", label: "Entreprises" }, { href: "/ranking", label: "Classement" }, { href: "/annonceurs", label: "Faire de la publicité" }].map(({ href, label }) => (
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
