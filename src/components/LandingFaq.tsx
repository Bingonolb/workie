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
      "Workie est un annuaire suisse des employeurs. On y cherche une entreprise plutôt qu'une annonce : par secteur, par canton, par langue de travail. Quand une entreprise vous intéresse, vous la gardez, et vous postulez sur son propre site.",
    r: (
      <>
        Workie est un annuaire suisse des employeurs. On y cherche une entreprise plutôt
        qu&apos;une annonce : par secteur, par canton, par langue de travail.
        <br /><br />
        Quand une entreprise vous intéresse, vous la gardez d&apos;un geste, et vous postulez
        sur son propre site. Workie n&apos;héberge aucune offre et ne s&apos;interpose pas entre
        vous et l&apos;employeur.
      </>
    ),
  },
  {
    q: "Pourquoi n'y a-t-il pas de note sur les entreprises ?",
    texte:
      "Parce qu'une note moyenne ne dit pas où postuler. Workie ne classe pas les bons et les mauvais employeurs : le site donne des faits, le secteur, le lieu, la langue de travail et le lien vers les offres, et vous décidez.",
    r: (
      <>
        Parce qu&apos;une note moyenne ne dit pas où postuler. Deux entreprises notées
        pareil n&apos;ont ni le même métier, ni le même lieu, ni la même langue de travail,
        et ce sont ces trois choses-là qui décident d&apos;une candidature.
        <br /><br />
        Workie ne classe pas les bons et les mauvais employeurs. Le site donne des faits et
        vous laisse décider.
      </>
    ),
  },
  {
    q: "D'où viennent les informations sur les entreprises ?",
    texte:
      "Les fiches sont établies à la main, une par une : le nom tel qu'on le dit, le secteur, la ville et le canton, et l'adresse de la page carrière du site officiel. Jamais un site d'annonces.",
    r: (
      <>
        Les fiches sont établies à la main, une par une : le nom tel que les gens le disent,
        le secteur, la ville et le canton, et l&apos;adresse de la{" "}
        <strong style={{ color: "var(--text)" }}>page carrière du site officiel</strong>.
        Jamais un site d&apos;annonces intermédiaire.
        <br /><br />
        Les langues de travail sont déduites du canton et du domaine du site quand
        l&apos;entreprise ne les a pas renseignées elle-même.
      </>
    ),
  },
  {
    q: "Comment fonctionne le classement ?",
    texte:
      "Il mesure l'intérêt réel des utilisateurs, pas un jugement : un favori vaut dix points, une visite un point, un partage cinquante. Il se recalcule tout seul.",
    r: (
      <>
        Il mesure l&apos;intérêt réel des utilisateurs, et rien d&apos;autre : un favori vaut
        dix points, une visite un point, un partage cinquante. Le partage vaut le plus parce
        qu&apos;il coûte le plus, il engage celui qui le fait auprès de quelqu&apos;un
        d&apos;autre.
        <br /><br />
        Aucune entreprise ne peut acheter sa place, et aucune note n&apos;entre dans le calcul.
      </>
    ),
  },
  {
    q: "Une entreprise peut-elle faire retirer sa fiche ?",
    texte:
      "Une fiche ne contient que des informations publiques : nom, secteur, lieu, adresse du site. Une entreprise peut demander une correction ou un retrait en écrivant à contact@workie.ch.",
    r: (
      <>
        Une fiche ne contient que des informations publiques : le nom, le secteur, la ville
        et l&apos;adresse du site officiel. Il n&apos;y a ni note, ni témoignage, ni
        appréciation.
        <br /><br />
        Une entreprise qui souhaite une correction, un complément ou un retrait peut écrire à{" "}
        <a href="mailto:contact@workie.ch" style={{ color: "var(--brand)" }}>contact@workie.ch</a>.
        Les demandes sont traitées à la main.
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
      "Non. Chercher une entreprise, la garder en favori et gérer son compte sont gratuits, sans abonnement. La plateforme se finance par la publicité.",
    r: (
      <>
        Non. Chercher une entreprise, la garder de côté, gérer son compte : tout est gratuit
        et sans abonnement.
        <br /><br />
        La plateforme se finance par la publicité, ce qui permet de ne rien facturer à ceux
        qui cherchent du travail. Les emplacements publicitaires sont identifiés comme tels
        et n&apos;influencent pas le classement.
      </>
    ),
  },
  {
    q: "Comment récupérer ou supprimer mes données ?",
    texte:
      "Depuis les réglages de votre profil : télécharger l'ensemble de vos données, ou supprimer votre compte. La suppression efface vos favoris, votre historique de consultation et l'adresse IP conservée pour la détection d'abus.",
    r: (
      <>
        Depuis les réglages de votre profil : télécharger l&apos;ensemble de vos données, ou
        supprimer votre compte.
        <br /><br />
        La suppression efface vos favoris, votre historique de consultation et
        l&apos;adresse IP conservée pour la détection d&apos;abus. Rien de ce que vous avez
        consulté n&apos;est conservé après coup.
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
