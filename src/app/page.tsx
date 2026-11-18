import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowRight, ShieldCheck, Lock, Gauge,
         GraduationCap, Briefcase, Landmark, Home as IconeMaison, Check,
       } from "lucide-react";
import { LandingFaq } from "@/components/LandingFaq";
import { ApercuSwipe } from "@/components/ApercuSwipe";
import { PiedAccueil } from "@/components/PiedAccueil";
import { StylesLanding, NavLanding } from "@/components/StylesLanding";
import { RechercheRevendication } from "@/app/pour-les-entreprises/RechercheRevendication";
import { getApercuEntreprises } from "@/lib/apercuAccueil";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";
import { revendicationOuverte, accueilCompact } from "@/lib/ouverture";
import { AccueilCompact } from "@/components/AccueilCompact";
import { fetchGridPage } from "@/lib/actions/companies";
import type { Company } from "@/lib/types";

export const revalidate = 300; // ISR — redirect for logged-in users handled in middleware

const getLandingCounts = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const enLigne = await getSecteursEnLigne();
    const [{ count: companyCount }, { count: reviewCount }] = await Promise.all([
      admin.from("companies").select("*", { count: "exact", head: true }).in("sector", enLigne),
      admin.from("reviews").select("*", { count: "exact", head: true }),
    ]);
    return { companies: companyCount ?? 0, reviews: reviewCount ?? 0 };
  },
  ["landing-counts-v2"],
  { revalidate: 300, tags: ["landing-counts-v2"] }
);

export const metadata: Metadata = {
  // Le titre est le premier signal pour Google : « Emploi », « job » et
  // « Suisse » y figurent, la marque vient après. « absolute » évite que le
  // gabarit du site n'ajoute « · Workie » une seconde fois.
  title: { absolute: "Emploi en Suisse : trouvez votre job chez le bon employeur · Workie" },
  description: "Emploi et jobs en Suisse : découvrez les entreprises par métier, secteur et canton, puis postulez directement sur leurs offres officielles.",
  openGraph: {
    title: "Emploi en Suisse : trouvez votre job chez le bon employeur · Workie",
    description: "Emploi et jobs en Suisse : découvrez les entreprises par métier, secteur et canton, puis postulez directement sur leurs offres officielles.",
    url: "https://www.workie.ch",
    siteName: "Workie",
    type: "website",
    locale: "fr_CH",
  },
  twitter: {
    card: "summary_large_image",
    title: "Emploi en Suisse : trouvez votre job chez le bon employeur · Workie",
    description: "Emploi et jobs en Suisse : découvrez les entreprises par métier, secteur et canton, puis postulez directement sur leurs offres officielles.",
  },
  alternates: { canonical: "https://www.workie.ch" },
};

export default async function Home() {
  // Accueil compact à l'essai : actif seulement là où l'interrupteur est posé.
  if (accueilCompact) {
    const [counts, secteurs, grille] = await Promise.all([
      getLandingCounts(), getSecteursEnLigne(),
      fetchGridPage({}, 0).catch(() => ({ companies: [] as Company[], total: 0 })),
    ]);
    return <AccueilCompact entreprises={grille.companies} total={counts.companies}
      secteurs={[...secteurs].sort((a, b) => a.localeCompare(b, "fr"))} />;
  }

  const [counts, apercu, secteursEnLigne] = await Promise.all([getLandingCounts(), getApercuEntreprises(), getSecteursEnLigne()]);
  const nCompanies = counts.companies;
  const nSecteurs = secteursEnLigne.length;

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
      <StylesLanding />

      {/* ── Navbar ── */}
      <NavLanding />

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
              { valeur: String(nSecteurs), libelle: "secteurs" },
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
        <ApercuSwipe entreprises={apercu} total={nCompanies} />
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
            {nCompanies} entreprises en Suisse.
          </p>
          <p style={{ fontSize: "clamp(14px, 1.5vw, 16.5px)", color: "rgba(255,255,255,0.72)", lineHeight: 1.65, maxWidth: 700, marginTop: 18, textWrap: "balance" }}>
            {/* Cette phrase a d'abord répété trois éléments déjà lus plus haut,
                puis énoncé une évidence (« une moyenne ne dit pas… »). Elle
                donne maintenant le cas concret qui justifie le titre : c'est
                l'écart entre deux notes globales identiques qui rend le détail
                utile, et ça, une généralité ne peut pas le montrer. */}
            Vous avez l&apos;impression de toujours voir les mêmes offres ? Ici, ce ne sera jamais le cas.
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
              { etape: "Sauvegardez", titre: "Vos favoris, au même endroit",
                desc: "Une flamme, et l'entreprise rejoint vos favoris." },
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
          <h2 className="landing-h2">Vous savez ce que vous lisez.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 22 }}>
            {[
              // « Aucun texte libre » énonçait une interdiction, et la suite
              // parlait de récits inventés et de règlements de comptes : trois
              // tournures négatives pour décrire un choix qui est positif. Le
              // fait est que les avis sont chiffrés, donc comparables. C'est ce
              // que la carte dit maintenant.
              { Icone: Gauge, titre: "Des informations vérifiées",
                desc: "Le nom, le secteur, le lieu et le lien officiel sont contrôlés avant publication." },
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
            26 cantons, 4 langues, {nCompanies.toLocaleString("fr-CH")} employeurs.
          </p>
          <p style={{ fontSize: "clamp(14px, 1.5vw, 16.5px)", color: "rgba(255,255,255,0.72)", lineHeight: 1.65, maxWidth: 700, marginTop: 18, textWrap: "balance" }}>
            Des grands groupes aux équipes de 3 personnes. Au même endroit.
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

      {/* ── Employeurs ──
          Visible quand la revendication est ouverte au public. */}
      {revendicationOuverte && (
      <section className="landing-section" style={{ padding: "88px 24px", borderTop: "1px solid var(--border)" }}>
        <div className="landing-pub" style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div>
            <p className="landing-eyebrow" style={{ textAlign: "left" }}>Employeurs</p>
            <h2 style={{ fontSize: "clamp(23px, 3.2vw, 32px)", fontWeight: 750, letterSpacing: "-0.03em", lineHeight: 1.18, marginBottom: 14 }}>
              Votre entreprise est déjà sur Workie. Prenez-en les commandes.
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 22, maxWidth: 500 }}>
              Revendiquez votre fiche : présentez l&apos;entreprise avec vos mots et vos images,
              menez les candidats droit vers votre page carrière, et voyez qui s&apos;intéresse
              à vous, jour après jour.
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 22 }}>
              129 CHF par mois <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>· ou 1 290 CHF par an, 2 mois offerts</span>
            </p>
            <RechercheRevendication />
            <Link href="/pour-les-entreprises" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
              Tout savoir sur l&apos;offre entreprise <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="landing-ads-aside">
            {[
              { t: "Une fiche à votre image", d: "Présentation, bannière, logo, langues de travail et lien carrière." },
              { t: "Votre fréquentation", d: "Visites par jour, favoris, clics vers vos offres et cantons des visiteurs." },
              { t: "Le badge vérifié", d: "Les candidats savent que la fiche est tenue par l'entreprise." },
            ].map(({ t, d }) => (
              <div key={t} style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "15px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Check size={16} color="var(--brand)" strokeWidth={2.5} aria-hidden="true" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{t}</p>
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5 }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Bande photographique entre les deux offres ── */}
      {revendicationOuverte && (
        <section className="landing-bande" style={{ backgroundImage: 'url("https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1880")', backgroundPosition: "center 40%", minHeight: 320 }}>
          <div className="landing-bande-voile" />
          <div className="landing-bande-texte">
            <p style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.025em", color: "#fff", maxWidth: 700, textWrap: "balance" }}>
              Les candidats vous cherchent déjà.
            </p>
            <p style={{ fontSize: "clamp(14px, 1.5vw, 16.5px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, maxWidth: 640, marginTop: 16 }}>
              Avant de postuler, ils ouvrent votre fiche. C&apos;est souvent la première chose qu&apos;ils lisent de vous.
            </p>
          </div>
        </section>
      )}

      {/* ── Publicité ──
          Montrer plutôt qu'expliquer : la pile mêle cinq fiches et cinq
          annonces d'exemple, et c'est en la faisant glisser qu'on voit qu'une
          annonce a ici la forme du contenu qui l'entoure. */}
      <section className="landing-section" style={{ padding: "88px 24px", borderTop: "1px solid var(--border)" }}>
        <div className="landing-pub" style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div>
            <p className="landing-eyebrow" style={{ textAlign: "left" }}>Annonceurs</p>
            <h2 style={{ fontSize: "clamp(23px, 3.2vw, 32px)", fontWeight: 750, letterSpacing: "-0.03em", lineHeight: 1.18, marginBottom: 14 }}>
              Votre publicité au milieu de leur recherche.
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 22, maxWidth: 500 }}>
              Changer de travail est une décision qui en entraîne beaucoup d&apos;autres :
              déménager, acheter une voiture, revoir son assurance, reprendre une
              formation. Les gens qui vivent ce moment sont ici, et ils sont attentifs à
              tout ce qui peut les aider à le traverser. Votre publicité paraît là, ciblée par
              canton et par secteur.
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

      <PiedAccueil />

    </main>
  );
}
