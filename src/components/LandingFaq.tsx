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
        travail — ambiance, management, équilibre de vie, salaire. Les avis viennent
        exclusivement des utilisateurs. Aucune entreprise ne peut acheter, écrire ou faire
        retirer un avis parce qu'il lui déplaît.
      </>
    ),
  },
  {
    q: "Les avis sont-ils vraiment anonymes ?",
    texte:
      "Ton nom n'est jamais publié et ton identifiant de compte n'est pas transmis au navigateur avec les avis. Ton adresse IP est conservée côté serveur pour la seule détection d'abus, et effacée lorsque tu supprimes ton compte.",
    r: (
      <>
        Ton nom n'est jamais publié. L'identifiant de ton compte n'est pas transmis au
        navigateur avec les avis, ce qui veut dire qu'aucun visiteur — ni aucune entreprise —
        ne peut relier un avis à un profil en inspectant la page.
        <br /><br />
        Une donnée reste conservée côté serveur : ton adresse IP au moment de la publication.
        Elle sert uniquement à repérer les abus, par exemple plusieurs avis rédigés depuis le
        même endroit pour gonfler ou descendre une note. Elle n'est jamais affichée, et elle
        est effacée lorsque tu supprimes ton compte.
        <br /><br />
        Ce que nous ne pouvons pas promettre : si tu décris ton poste avec assez de détails
        pour être la seule personne à y correspondre, ton employeur pourra te reconnaître. Le
        seul rempart, là, c'est ce que tu choisis d'écrire.
      </>
    ),
  },
  {
    q: "D'où viennent les informations sur les entreprises ?",
    texte:
      "Les fiches ne contiennent que des informations d'entreprise publiques : nom, secteur, canton, site officiel. Aucune donnée interne ou confidentielle. Les appréciations viennent uniquement des avis d'utilisateurs.",
    r: (
      <>
        Une fiche d'entreprise ne contient que des informations publiques : la dénomination, le
        secteur, le canton, le site officiel. Rien d'interne, rien de confidentiel, aucun
        document d'entreprise.
        <br /><br />
        Tout ce qui relève de l'appréciation — notes, ambiance, salaires, management — provient
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
        Il faut un compte dont l'adresse e-mail est confirmée et qui existe depuis au moins
        24 heures. Cette attente n'est pas une formalité : elle rend coûteuse la création de
        comptes jetables destinés à fabriquer de faux avis.
        <br /><br />
        S'ajoutent deux limites : un seul avis par entreprise et par personne, et trois avis
        au maximum sur 24 heures. Les comptes rattachés à une entreprise ne peuvent pas voter
        sur les avis qui la concernent.
      </>
    ),
  },
  {
    q: "Comment luttez-vous contre les faux avis ?",
    texte:
      "Filtrage des contenus interdits, détection des avis très similaires sur une même entreprise, repérage des envois répétés depuis une même adresse, et file de modération alimentée par les signalements.",
    r: (
      <>
        Plusieurs contrôles se cumulent, automatiques et humains :
        <br /><br />
        · un filtrage des contenus interdits — diffamation, propos haineux, discrimination ;<br />
        · une détection des avis très ressemblants déposés sur une même entreprise ;<br />
        · un repérage des publications répétées depuis une même adresse réseau ;<br />
        · une file de modération alimentée par les signalements, relue à la main.
        <br /><br />
        Aucun dispositif n'est infaillible. C'est pourquoi le signalement est ouvert à tous, y
        compris aux entreprises concernées.
      </>
    ),
  },
  {
    q: "Je représente une entreprise et un avis me paraît faux",
    texte:
      "Signalez-le depuis la fiche : il part en modération et sera relu. Un avis n'est pas retiré parce qu'il est négatif, mais il l'est s'il enfreint nos règles — propos diffamatoires, haineux, discriminatoires, ou expérience manifestement inventée.",
    r: (
      <>
        Signalez-le depuis la fiche de l'entreprise. Le signalement part en modération et
        l'avis est relu.
        <br /><br />
        Soyons clairs sur la ligne : un avis n'est pas retiré parce qu'il est négatif, ni parce
        qu'il déplaît. Il l'est s'il enfreint nos règles — propos diffamatoires, haineux ou
        discriminatoires, attaque contre une personne nommée, ou expérience manifestement
        inventée. Un jugement défavorable exprimé de bonne foi sur des conditions de travail
        reste publié.
        <br /><br />
        Les détails figurent dans les{" "}
        <Link href="/cgu" style={{ color: "#8b5cf6" }}>conditions générales</Link>.
      </>
    ),
  },
  {
    q: "Workie est-il suisse ? Où sont hébergées les données ?",
    texte:
      "Workie est opéré depuis la Suisse et consacré aux entreprises suisses. L'hébergement applicatif est assuré par Vercel (États-Unis) et la base de données par Supabase sur des serveurs situés en Europe.",
    r: (
      <>
        Workie est opéré depuis la Suisse et consacré aux entreprises suisses — 1 033
        entreprises référencées, dans les 26 cantons.
        <br /><br />
        L'infrastructure, en revanche, n'est pas suisse et nous préférons le dire franchement :
        l'application est hébergée par Vercel, aux États-Unis, et la base de données par
        Supabase sur des serveurs situés en Europe. Le détail figure dans les{" "}
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
        identifiés comme tels et n'influencent ni les notes, ni le classement.
      </>
    ),
  },
  {
    q: "Comment récupérer ou supprimer mes données ?",
    texte:
      "Depuis ton profil, tu peux télécharger l'ensemble de tes données et supprimer ton compte. La suppression détache tes avis de ton identité et efface l'adresse IP conservée pour la détection d'abus.",
    r: (
      <>
        Depuis ton profil, deux boutons : télécharger l'ensemble de tes données, et supprimer
        ton compte.
        <br /><br />
        La suppression détache tes avis de ton identité et efface l'adresse IP conservée pour
        la détection d'abus. Les avis eux-mêmes peuvent rester en ligne, sans plus aucun lien
        avec toi — c'est ce qui évite qu'une entreprise puisse faire disparaître les
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
          L&apos;anonymat, les sources, la modération — sans détour.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ENTREES.map(({ q, r }) => (
            <details
              key={q}
              className="faq-item"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  listStyle: "none",
                  padding: "16px 20px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  // 44 px minimum : c'est la taille d'une cible tactile
                  // utilisable au doigt.
                  minHeight: 44,
                }}
              >
                {q}
                <span className="faq-chevron" aria-hidden="true" style={{ color: "var(--text-muted)", fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
                  +
                </span>
              </summary>
              <div style={{ padding: "0 20px 18px", fontSize: 14, lineHeight: 1.65, color: "var(--text-muted)" }}>
                {r}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
