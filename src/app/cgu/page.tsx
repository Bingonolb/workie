import type { Metadata } from "next";
import { NavbarClient } from "@/components/NavbarClient";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "Conditions générales d'utilisation de la plateforme Workie.",
  alternates: { canonical: "https://www.workie.ch/cgu" },
  robots: { index: true, follow: false },
};

export default function CGUPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <NavbarClient />
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 100px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 8 }}>
          Conditions générales d&apos;utilisation
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 48 }}>
          Dernière mise à jour : 23 septembre 2026
        </p>

        <Section title="1. Présentation de Workie">
          <p>Workie est un catalogue en ligne des entreprises suisses : ce qu&apos;elles font, où elles se trouvent, dans quelle langue on y travaille, et le lien vers leurs offres d&apos;emploi. Workie est exploité depuis la Suisse.</p>
          <p>Workie ne publie aucun avis, aucune note et aucun salaire. Les candidatures se font directement chez l&apos;employeur, sur son propre site.</p>
          <p>En accédant à la plateforme ou en créant un compte, vous acceptez les présentes CGU dans leur intégralité.</p>
        </Section>

        <Section title="2. Accès et inscription">
          <p>Le catalogue est consultable sans compte. La création d&apos;un compte donne accès aux favoris, aux recherches récentes et aux notifications. Vous devez :</p>
          <ul>
            <li>Avoir au moins 18 ans</li>
            <li>Fournir une adresse email valide et la confirmer</li>
            <li>Ne pas créer plusieurs comptes pour contourner les règles</li>
          </ul>
          <p>Les comptes entreprises (Business) sont réservés aux représentants légalement habilités de la société concernée.</p>
        </Section>

        <Section title="3. Contenu des fiches">
          <p>Les fiches d&apos;entreprise sont établies par Workie à partir d&apos;informations publiques, et vérifiées une par une. Elles sont factuelles : nom, secteur, lieu, langues de travail, description et adresse du site officiel.</p>
          <p>Une entreprise peut demander la correction ou la suppression de sa fiche en écrivant à <a href="mailto:contact@workie.ch" style={{ color: "var(--brand)" }}>contact@workie.ch</a>.</p>
        </Section>

        <Section title="4. Classement">
          <p>Le classement reflète l&apos;intérêt que les visiteurs portent à une entreprise : mises en favori, consultations de la fiche et partages. Il ne constitue ni une évaluation de l&apos;employeur, ni une recommandation professionnelle ou financière de Workie.</p>
        </Section>

        <Section title="5. Comptes Business">
          <p>Les comptes Business permettent aux entreprises de :</p>
          <ul>
            <li>Revendiquer et tenir à jour leur fiche</li>
            <li>Publier leurs offres d&apos;emploi</li>
            <li>Diffuser des campagnes publicitaires</li>
          </ul>
          <p>La revendication d&apos;une fiche est vérifiée à la main avant d&apos;être accordée.</p>
        </Section>

        <Section title="6. Paiements">
          <p>Les campagnes publicitaires sont vendues au forfait, pour une durée de 7, 14 ou 30 jours, payée une fois. Le prix dépend du nombre de cantons et de secteurs visés.</p>
          <p>Les paiements sont traités par <strong>Stripe</strong>, prestataire de paiement sécurisé. Workie ne stocke aucune donnée bancaire. En cas de problème de paiement, écrivez à <a href="mailto:contact@workie.ch" style={{ color: "var(--brand)" }}>contact@workie.ch</a>.</p>
          <p>Une campagne payée est diffusée après validation. Si elle est refusée, elle est remboursée.</p>
        </Section>

        <Section title="7. Propriété intellectuelle">
          <p>Le contenu de la plateforme (design, code, marque Workie) est protégé par le droit suisse de la propriété intellectuelle. Les noms, marques et visuels des entreprises référencées appartiennent à leurs titulaires ; ils ne sont cités qu&apos;à des fins d&apos;information.</p>
          <p>Les visuels fournis par un annonceur restent sa propriété ; il accorde à Workie une licence d&apos;utilisation non exclusive, limitée à la diffusion de sa campagne.</p>
        </Section>

        <Section title="8. Limitation de responsabilité">
          <p>Workie rassemble des informations publiques et les tient à jour avec soin, sans garantir qu&apos;elles soient complètes ou exactes à tout instant. Les offres d&apos;emploi sont publiées et gérées par les employeurs, sur leurs propres sites : Workie n&apos;est pas partie au processus de recrutement et ne peut être tenue responsable de son déroulement.</p>
        </Section>

        <Section title="9. Droit applicable">
          <p>Les présentes CGU sont régies par le droit suisse. Tout litige sera soumis à la juridiction des tribunaux du canton de Genève, Suisse.</p>
        </Section>

        <Section title="10. Contact">
          <p>Pour toute question relative aux présentes CGU : <a href="mailto:contact@workie.ch" style={{ color: "var(--brand)" }}>contact@workie.ch</a></p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/confidentialite" style={{ fontSize: 13, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>Politique de confidentialité →</Link>
          <Link href="/explore" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>Retour à l&apos;accueil</Link>
        </div>
      </main>
      <Footer />
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
