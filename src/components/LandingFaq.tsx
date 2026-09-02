import Link from "next/link";

/**
 * Foire aux questions de la page d'accueil.
 *
 * Deux règles ont guidé la rédaction.
 *
 * D'abord, ne rien affirmer d'invérifiable. Une plateforme d'avis engage sa
 * responsabilité sur ce qu'elle promet : une phrase comme « anonymat garanti »
 * est une obligation de résultat, et il suffit d'une faille pour qu'elle
 * devienne un manquement. Les réponses ci-dessous décrivent donc ce que le
 * système fait réellement — vérifiable dans le code et en base — plutôt que ce
 * qu'on aimerait promettre.
 *
 * Ensuite, ne pas donner de conseil juridique. On explique les règles de la
 * plateforme et les recours qu'elle ouvre, pas ce que dit le droit suisse à la
 * place d'un avocat.
 *
 * Rendu en <details>/<summary> natifs : pas de JavaScript, donc le contenu est
 * présent dans le HTML dès le premier octet — lisible par un lecteur d'écran,
 * par un moteur de recherche, et fonctionnel même si le script échoue.
 */

type Entree = { q: string; r: React.ReactNode; texte: string };

const ENTREES: Entree[] = [
  {
    q: "Qu'est-ce que Workie ?",
    texte:
      "Workie est une plateforme suisse où des employés partagent anonymement leur expérience de travail : ambiance, management, équilibre, salaire. Les avis viennent des utilisateurs, jamais des entreprises.",
    r: (
      <>
        Workie est une plateforme suisse où des employés partagent anonymement leur expérience de
        travail : ambiance, management, équilibre de vie, salaire. Les avis viennent
        exclusivement des utilisateurs. Aucune entreprise ne peut acheter, écrire ou faire
        retirer un avis parce qu&apos;il lui déplaît.
      </>
    ),
  },
  {
    q: "Les avis sont-ils vraiment anonymes ?",
    texte:
      "Votre nom n'est jamais publié et l'identifiant de votre compte n'est pas transmis au navigateur avec les avis. Votre adresse IP est conservée côté serveur pour la seule détection d'abus, et effacée lorsque vous supprimez votre compte.",
    r: (
      <>
        Votre nom n&apos;est jamais publié. L&apos;identifiant de votre compte n&apos;est pas transmis au
        navigateur avec les avis, ce qui veut dire qu&apos;aucun visiteur, ni aucune entreprise,
        ne peut relier un avis à un profil en inspectant la page.
        <br /><br />
        Une donnée reste conservée côté serveur : votre adresse IP au moment de la publication.
        Elle sert uniquement à repérer les abus, par exemple plusieurs avis rédigés depuis le
        même endroit pour gonfler ou descendre une note. Elle n&apos;est jamais affichée, et elle
        est effacée lorsque vous supprimez votre compte.
        <br /><br />
        Ce que nous ne pouvons pas promettre : si vous occupez un poste que personne
        d&apos;autre n&apos;occupe dans votre entreprise, l&apos;intitulé seul peut suffire à vous
        désigner. C&apos;est la raison pour laquelle un avis ne contient aucun texte
        libre : il n&apos;y a rien à y glisser qui puisse vous trahir.
      </>
    ),
  },
  {
    q: "D'où viennent les informations sur les entreprises ?",
    texte:
      "Les fiches ne contiennent que des informations d'entreprise publiques : nom, secteur, canton, site officiel. Aucune donnée interne ou confidentielle. Les appréciations viennent uniquement des avis d'utilisateurs.",
    r: (
      <>
        Une fiche d&apos;entreprise ne contient que des informations publiques : la dénomination, le
        secteur, le canton, le site officiel. Rien d&apos;interne, rien de confidentiel, aucun
        document d&apos;entreprise.
        <br /><br />
        Tout ce qui relève de l&apos;appréciation (notes, ambiance, salaires, management) provient
        uniquement des avis déposés par les utilisateurs. Workie ne produit aucune évaluation
        de son côté.
        <br /><br />
        Une information vous paraît inexacte sur votre fiche ? Écrivez-nous, nous la corrigeons.
      </>
    ),
  },
  {
    q: "Qui peut publier un avis ?",
    texte:
      "Il faut un compte avec adresse e-mail confirmée, âgé d'au moins 24 heures. Un seul avis par entreprise et par personne, et trois avis maximum par 24 heures.",
    r: (
      <>
        Il faut un compte dont l&apos;adresse e-mail est confirmée et qui existe depuis au moins
        24 heures. Cette attente n&apos;est pas une formalité : elle rend coûteuse la création de
        comptes jetables destinés à fabriquer de faux avis.
        <br /><br />
        S&apos;ajoutent deux limites : un seul avis par entreprise et par personne, et trois avis
        au maximum sur 24 heures. Les comptes rattachés à une entreprise ne peuvent pas voter
        sur les avis qui la concernent.
      </>
    ),
  },
  {
    q: "Comment luttez-vous contre les faux avis ?",
    texte:
      "Engagement signé avant de noter, compte confirmé de plus de 24 heures, un seul avis par entreprise et par personne, trois avis maximum par 24 heures, repérage des publications répétées depuis une même adresse réseau, et file de modération alimentée par les signalements.",
    r: (
      <>
        Un avis Workie ne contient aucun texte libre : uniquement des notes et
        le contexte du poste. Cela retire d&apos;emblée ce qui fait l&apos;essentiel des
        faux avis ailleurs : les récits inventés, les règlements de comptes, les
        messages écrits par l&apos;entreprise elle-même.
        <br /><br />
        S&apos;y ajoutent des contrôles sur qui peut déposer un avis :
        <br /><br />
        · un engagement signé avant de noter : avoir travaillé dans
        l&apos;entreprise, et rendre compte de son expérience réelle sans chercher
        à nuire ;<br />
        · un compte à l&apos;adresse confirmée, existant depuis plus de 24 heures ;<br />
        · un seul avis par entreprise et par personne ;<br />
        · trois avis au maximum sur 24 heures ;<br />
        · un repérage des publications répétées depuis une même adresse réseau ;<br />
        · une file de modération alimentée par les signalements, relue à la main.
        <br /><br />
        Aucun dispositif n&apos;est infaillible. C&apos;est pourquoi le signalement est ouvert à tous, y
        compris aux entreprises concernées.
      </>
    ),
  },
  {
    q: "Je représente une entreprise et un avis me paraît faux",
    texte:
      "Signalez-le depuis la fiche : il part en modération et sera relu. Un avis n'est pas retiré parce qu'il est négatif, mais il l'est s'il enfreint nos règles : expérience manifestement inventée, avis déposé par quelqu'un qui n'a pas travaillé là, ou notes portées pour nuire plutôt que pour rendre compte.",
    r: (
      <>
        Signalez-le depuis la fiche de l&apos;entreprise. Le signalement part en modération et
        l&apos;avis est relu.
        <br /><br />
        Soyons clairs sur la ligne : un avis n&apos;est pas retiré parce qu&apos;il est négatif, ni parce
        qu&apos;il déplaît. Il l&apos;est s&apos;il enfreint nos règles : expérience manifestement inventée,
        avis déposé par quelqu&apos;un qui n&apos;a pas travaillé là, ou notes portées pour nuire plutôt
        que pour rendre compte. Un jugement défavorable exprimé de bonne foi sur des conditions
        de travail reste publié.
        <br /><br />
        Un avis ne contenant aucun texte libre, la question n&apos;est jamais celle des mots
        employés : elle est celle de la sincérité de la démarche.
        <br /><br />
        Les détails figurent dans les{" "}
        <Link href="/cgu" style={{ color: "#8b5cf6" }}>conditions générales</Link>.
      </>
    ),
  },
  {
    q: "Workie est-il suisse ? Où sont hébergées les données ?",
    texte:
      "Workie est opéré depuis la Suisse et consacré aux entreprises suisses. L'application est servie par Vercel, la base de données par Supabase sur des serveurs situés en Europe, et la messagerie par Infomaniak, en Suisse.",
    r: (
      <>
        Workie est opéré depuis la Suisse et consacré aux entreprises suisses : 1 033
        entreprises référencées, dans les 26 cantons.
        <br /><br />
        L&apos;infrastructure est répartie entre plusieurs prestataires. L&apos;application est
        servie par Vercel, la base de données par Supabase sur des serveurs situés en Europe,
        et la messagerie par Infomaniak, en Suisse. Le détail figure dans les{" "}
        <Link href="/mentions-legales" style={{ color: "#8b5cf6" }}>mentions légales</Link> et
        dans la{" "}
        <Link href="/confidentialite" style={{ color: "#8b5cf6" }}>politique de confidentialité</Link>.
      </>
    ),
  },
  {
    q: "Est-ce payant ?",
    texte:
      "Non. Consulter les avis, en publier et gérer son compte sont gratuits, sans abonnement. La plateforme se finance par la publicité.",
    r: (
      <>
        Non. Consulter les avis, en publier, gérer son compte : tout est gratuit et sans
        abonnement.
        <br /><br />
        La plateforme se finance par la publicité, ce qui permet de ne facturer ni les
        employés qui témoignent, ni les lecteurs. Les emplacements publicitaires sont
        identifiés comme tels et n&apos;influencent ni les notes, ni le classement.
      </>
    ),
  },
  {
    q: "Comment récupérer ou supprimer mes données ?",
    texte:
      "Depuis votre profil, vous pouvez télécharger l'ensemble de vos données et supprimer votre compte. La suppression détache vos avis de votre identité et efface l'adresse IP conservée pour la détection d'abus.",
    r: (
      <>
        Depuis votre profil, deux boutons : télécharger l&apos;ensemble de vos données, et supprimer
        votre compte.
        <br /><br />
        La suppression détache vos avis de votre identité et efface l&apos;adresse IP conservée pour
        la détection d&apos;abus. Les avis eux-mêmes peuvent rester en ligne, sans plus aucun lien
        avec vous. C&apos;est ce qui évite qu&apos;une entreprise puisse faire disparaître les
        témoignages la concernant en poussant leurs auteurs à fermer leur compte.
      </>
    ),
  },
];

export function LandingFaq() {
  return (
    <section
      className="landing-section"
      style={{ padding: "60px 24px", background: "var(--surface2)", borderTop: "1px solid var(--border)" }}
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
          L&apos;anonymat, les sources, la modération, sans détour.
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
