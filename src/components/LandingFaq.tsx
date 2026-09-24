import Link from "next/link";

/**
 * Foire aux questions de la page d'accueil.
 *
 * Les réponses répondent. Elles ne se justifient pas, elles n'anticipent pas
 * un reproche, et elles ne se défendent pas d'être ce qu'elles sont : la
 * version précédente expliquait pourquoi Workie n'est pas ceci ni cela, ce qui
 * est la manière la plus sûre de faire croire qu'il y a un problème.
 *
 * Deux limites tiennent toujours. On n'affirme rien d'invérifiable, et on ne
 * donne pas de conseil juridique : on décrit ce que le site fait, ce qui se
 * vérifie dans le code et en base.
 *
 * Rendu en <details>/<summary> natifs : pas de JavaScript, donc le contenu est
 * présent dans le HTML dès le premier octet, lisible par un lecteur d'écran et
 * par un moteur de recherche.
 */

type Entree = { q: string; r: React.ReactNode; texte: string };

const ENTREES: Entree[] = [
  {
    q: "C'est quoi Workie ?",
    texte:
      "Une façon moderne de chercher du travail : la recherche commence par les entreprises elles-mêmes. En quelques secondes, vous voyez ce que fait l'une d'elles, où elle est et dans quelle langue on y travaille, puis vous arrivez sur ses offres, à la source.",
    r: (
      <>
        Une façon moderne de chercher du travail : ici, la recherche commence par les
        entreprises elles-mêmes. En quelques secondes, vous voyez ce que fait l&apos;une
        d&apos;elles, où elle se trouve et dans quelle langue on y travaille.
        <br /><br />
        Un geste pour la garder, un clic pour arriver sur ses offres, à la source, sur son
        propre site. Vous voyez tous ses postes ouverts, tels qu&apos;elle vient de les
        publier.
      </>
    ),
  },
  {
    q: "Pourquoi je ne retrouve pas dix fois la même offre ?",
    texte:
      "Parce que Workie classe des entreprises, pas des annonces. Une entreprise apparaît une fois, et ses offres sont celles de son propre site, à jour au moment où vous cliquez.",
    r: (
      <>
        Parce qu&apos;ici, on classe des entreprises. Une entreprise apparaît une fois,
        quel que soit le nombre de postes qu&apos;elle publie.
        <br /><br />
        Et ses offres sont celles de son site, affichées telles qu&apos;elles y sont au
        moment où vous cliquez. Ce que vous lisez est donc ce qui est ouvert aujourd&apos;hui.
      </>
    ),
  },
  {
    q: "D'où viennent les informations ?",
    texte:
      "De sources publiques et librement consultables, Zefix et les sites officiels des entreprises. Chaque fiche est écrite à la main, une par une. Aucune information confidentielle.",
    r: (
      <>
        De sources publiques et librement consultables : le registre du commerce (Zefix) et
        les sites officiels des entreprises.
        <br /><br />
        Chaque fiche est ensuite écrite à la main, une par une : le nom tel que les gens le
        disent, le secteur, la ville et le canton, et l&apos;adresse de la{" "}
        <strong>page carrière du site officiel</strong>.
        <br /><br />
        Aucune information confidentielle, aucune donnée interne, rien qui ne soit déjà
        public.
      </>
    ),
  },
  {
    q: "Comment fonctionne le classement ?",
    texte:
      "Il suit l'intérêt des visiteurs : un favori vaut 10 points, une visite 1, un partage 50. Aucune place ne s'achète.",
    r: (
      <>
        Il suit l&apos;intérêt des visiteurs. Un favori vaut 10 points, une visite 1, un
        partage 50 : partager coûte quelque chose, on engage son nom auprès de quelqu&apos;un
        d&apos;autre, donc ça pèse le plus.
        <br /><br />
        Aucune place ne s&apos;achète.
      </>
    ),
  },
  {
    q: "Je représente une entreprise, je veux corriger notre fiche.",
    texte:
      "Écrivez à contact@workie.ch : correction, complément ou retrait, les demandes sont traitées à la main.",
    r: (
      <>
        Écrivez à{" "}
        <a href="mailto:contact@workie.ch" style={{ color: "var(--brand)" }}>contact@workie.ch</a>.
        Correction, complément, changement d&apos;adresse ou retrait : les demandes sont
        traitées à la main, sous 24 à 48 heures ouvrées.
      </>
    ),
  },
  {
    q: "Où sont hébergées les données ?",
    texte:
      "Workie est opéré depuis la Suisse. L'application est servie par Vercel, la base de données par Supabase sur des serveurs situés en Europe, et la messagerie par Infomaniak, en Suisse.",
    r: (
      <>
        Workie est opéré depuis la Suisse, pour les 26 cantons.
        <br /><br />
        L&apos;application est servie par Vercel, la base de données par Supabase sur des
        serveurs situés en Europe, et la messagerie par Infomaniak, en Suisse. Le détail
        figure dans les{" "}
        <Link href="/mentions-legales" style={{ color: "var(--brand)" }}>mentions légales</Link> et
        dans la{" "}
        <Link href="/confidentialite" style={{ color: "var(--brand)" }}>politique de confidentialité</Link>.
      </>
    ),
  },
  {
    q: "Est-ce payant ?",
    texte:
      "Non. Chercher, garder des entreprises et gérer son compte sont gratuits, sans abonnement. Le site se finance par la publicité, qui n'influence pas le classement.",
    r: (
      <>
        Non, et il n&apos;y a pas d&apos;abonnement. Chercher, garder des entreprises,
        gérer son compte : tout est gratuit.
        <br /><br />
        Le site se finance par la publicité. Les annonces sont signalées comme telles et
        n&apos;entrent pas dans le classement.
      </>
    ),
  },
  {
    q: "Comment récupérer ou supprimer mes données ?",
    texte:
      "Depuis les réglages de votre profil : téléchargez l'ensemble de vos données, ou supprimez votre compte. La suppression efface vos favoris, votre historique et l'adresse IP conservée contre les abus.",
    r: (
      <>
        Depuis les réglages de votre profil : téléchargez l&apos;ensemble de vos données, ou
        supprimez votre compte.
        <br /><br />
        La suppression efface vos favoris, votre historique de consultation et
        l&apos;adresse IP conservée contre les abus.
      </>
    ),
  },
];

export function LandingFaq() {
  return (
    <section
      className="landing-section landing-ton"
      style={{ padding: "60px 24px" }}
      aria-labelledby="faq-titre"
    >
      {/* Données structurées : elles décrivent à un moteur de recherche ce que
          la page contient réellement. Elles reprennent mot pour mot les
          réponses affichées — une donnée structurée qui diverge du texte visible
          est une faute, et Google la sanctionne. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: ENTREES.map(({ q, texte }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: texte },
            })),
          }),
        }}
      />

      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h2
          id="faq-titre"
          style={{ textAlign: "center", fontSize: "clamp(24px, 5vw, 40px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}
        >
          Questions fréquentes
        </h2>
        <p style={{ textAlign: "center", fontSize: 15, color: "var(--text-muted)", marginBottom: 40 }}>
          Ce que vous trouverez ici, d&apos;où viennent les informations, et ce que ça coûte.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ENTREES.map(({ q, r }) => (
            // Apparence entièrement en CSS : un style en ligne l'emporte sur
            // une feuille de style, donc les règles d'état ouvert ne pouvaient
            // pas reprendre la main sur la bordure ni sur la couleur.
            <details key={q} className="faq-item">
              <summary className="faq-question">
                {q}
                <span className="faq-chevron" aria-hidden="true">+</span>
              </summary>
              {/* Un trait sépare la réponse de la question. Sans lui, les deux
                  blocs se confondaient : même fond, même gouttière, seul le
                  gras distinguait l'un de l'autre. */}
              <div className="faq-reponse">
                {r}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
