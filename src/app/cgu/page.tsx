import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation · Workie",
  description: "Conditions générales d'utilisation de la plateforme Workie.",
};

export default function CGUPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <Navbar />
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 100px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 8 }}>
          Conditions générales d&apos;utilisation
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 48 }}>
          Dernière mise à jour : 15 juillet 2026
        </p>

        <Section title="1. Présentation de Workie">
          <p>Workie est une plateforme en ligne permettant aux employés de partager anonymement leurs avis sur les entreprises suisses, ainsi que des informations sur les salaires et les conditions de travail. Workie est exploité par Workie Sàrl, Suisse.</p>
          <p>En accédant à la plateforme ou en créant un compte, vous acceptez les présentes CGU dans leur intégralité.</p>
        </Section>

        <Section title="2. Accès et inscription">
          <p>L&apos;accès à certaines fonctionnalités (publication d&apos;avis, favoris, système de score) nécessite la création d&apos;un compte. Vous devez :</p>
          <ul>
            <li>Avoir au moins 18 ans</li>
            <li>Fournir une adresse email valide</li>
            <li>Confirmer votre email avant de publier un avis</li>
            <li>Ne pas créer plusieurs comptes pour contourner les règles</li>
          </ul>
          <p>Les comptes entreprises (Business) sont réservés aux représentants légalement habilités de la société concernée.</p>
        </Section>

        <Section title="3. Règles de publication d'avis">
          <p>Les avis publiés sur Workie doivent être :</p>
          <ul>
            <li><strong>Véridiques</strong> — basés sur une expérience professionnelle réelle</li>
            <li><strong>Respectueux</strong> — sans propos diffamatoires, discriminatoires ou haineux</li>
            <li><strong>Pertinents</strong> — relatifs à l&apos;entreprise et aux conditions de travail</li>
            <li><strong>Non-confidentiels</strong> — sans divulgation d&apos;informations couvertes par un accord de confidentialité</li>
          </ul>
          <p>Workie se réserve le droit de supprimer tout contenu qui violerait ces règles, sans préavis.</p>
          <p>Chaque utilisateur peut publier <strong>un seul avis par entreprise</strong>. Les avis sont publiés anonymement — votre identité n&apos;est jamais révélée publiquement.</p>
        </Section>

        <Section title="4. Système de score et boutons d'évaluation">
          <p>La plateforme propose des outils d&apos;évaluation communautaire :</p>
          <ul>
            <li><strong>Flamme</strong> : marquer une entreprise comme recommandable (+1 pt)</li>
            <li><strong>Boost</strong> : soutenir une entreprise (+100 pts)</li>
            <li><strong>Pénalité (-100 pts)</strong> : signaler une entreprise toxique, accessible via un pack payant (10 CHF / 10 utilisations)</li>
          </ul>
          <p>Ces actions sont réservées aux comptes employés (non-business). Elles ne constituent pas une recommandation financière ou professionnelle de Workie.</p>
        </Section>

        <Section title="5. Comptes Business">
          <p>Les comptes Business permettent aux entreprises de :</p>
          <ul>
            <li>Revendiquer et gérer leur fiche entreprise</li>
            <li>Répondre aux avis des employés</li>
            <li>Publier des offres d&apos;emploi</li>
            <li>Diffuser des campagnes publicitaires</li>
          </ul>
          <p>L&apos;abonnement Business est mensuel et résiliable à tout moment. En cas de résiliation, l&apos;accès reste actif jusqu&apos;à la fin de la période en cours.</p>
        </Section>

        <Section title="6. Paiements">
          <p>Les paiements sont traités par <strong>Stripe</strong>, prestataire de paiement sécurisé. Workie ne stocke aucune donnée bancaire. En cas de problème de paiement, contactez-nous à <a href="mailto:contact@workie.ch" style={{ color: "#8b5cf6" }}>contact@workie.ch</a>.</p>
          <p>Les achats de packs pénalité sont non-remboursables une fois les crédits utilisés.</p>
        </Section>

        <Section title="7. Propriété intellectuelle">
          <p>Le contenu de la plateforme (design, code, marque Workie) est protégé par le droit suisse de la propriété intellectuelle. Les avis publiés par les utilisateurs restent leur propriété, mais ils accordent à Workie une licence d&apos;utilisation non exclusive pour les afficher sur la plateforme.</p>
        </Section>

        <Section title="8. Limitation de responsabilité">
          <p>Workie est une plateforme d&apos;expression communautaire. Les avis publiés reflètent l&apos;opinion personnelle de leurs auteurs et n&apos;engagent pas Workie. La plateforme ne peut être tenue responsable des préjudices éventuels résultant de la consultation de ces avis.</p>
        </Section>

        <Section title="9. Droit applicable">
          <p>Les présentes CGU sont régies par le droit suisse. Tout litige sera soumis à la juridiction des tribunaux du canton de Genève, Suisse.</p>
        </Section>

        <Section title="10. Contact">
          <p>Pour toute question relative aux présentes CGU : <a href="mailto:contact@workie.ch" style={{ color: "#8b5cf6" }}>contact@workie.ch</a></p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/confidentialite" style={{ fontSize: 13, color: "#8b5cf6", textDecoration: "none", fontWeight: 600 }}>Politique de confidentialité →</Link>
          <Link href="/explore" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>Retour à l&apos;accueil</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 14, letterSpacing: "-0.01em" }}>{title}</h2>
      <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}
