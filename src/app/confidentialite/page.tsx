import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité · Workie",
  description: "Comment Workie collecte, utilise et protège vos données personnelles.",
  alternates: { canonical: "https://www.workie.ch/confidentialite" },
  robots: { index: true, follow: false },
};

export default function ConfidentialitePage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <Navbar />
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 100px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 8 }}>
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 48 }}>
          Dernière mise à jour : 15 juillet 2026 — conforme à la LPD (loi fédérale sur la protection des données) et au RGPD
        </p>

        <Section title="1. Responsable du traitement">
          <p>Workie Sàrl, Suisse — <a href="mailto:contact@workie.ch" style={{ color: "#8b5cf6" }}>contact@workie.ch</a></p>
        </Section>

        <Section title="2. Données collectées">
          <p><strong>Données de compte</strong> : adresse email, nom d&apos;utilisateur, date de création du compte.</p>
          <p><strong>Données de profil</strong> (optionnelles) : photo de profil, ville, pays, biographie.</p>
          <p><strong>Avis et salaires</strong> : contenu publié anonymement — votre identité n&apos;est jamais affichée publiquement associée à un avis.</p>
          <p><strong>Données techniques</strong> : adresse IP (pour la détection de fraude et la géolocalisation approximative), type de navigateur, pages visitées.</p>
          <p><strong>Données de paiement</strong> : traitées exclusivement par Stripe. Workie ne stocke aucun numéro de carte bancaire.</p>
        </Section>

        <Section title="3. Finalités du traitement">
          <ul>
            <li>Fourniture et amélioration des services Workie</li>
            <li>Authentification et sécurité des comptes</li>
            <li>Prévention de la fraude et des avis falsifiés</li>
            <li>Envoi de notifications liées à votre compte (nouvelles offres d&apos;emploi des entreprises suivies)</li>
            <li>Traitement des paiements</li>
            <li>Respect de nos obligations légales</li>
          </ul>
        </Section>

        <Section title="4. Anonymat des avis">
          <p>Les avis publiés sur Workie sont anonymes. Votre nom, votre email et votre identité ne sont <strong>jamais affichés</strong> en lien avec vos avis sur la plateforme publique.</p>
          <p>Workie conserve en interne l&apos;association entre votre compte et vos avis uniquement pour :</p>
          <ul>
            <li>Prévenir les doublons (1 avis max par entreprise)</li>
            <li>Répondre à d&apos;éventuelles demandes légales</li>
            <li>Assurer l&apos;intégrité de la plateforme</li>
          </ul>
        </Section>

        <Section title="5. Partage des données">
          <p>Workie ne vend jamais vos données personnelles. Les données peuvent être partagées avec :</p>
          <ul>
            <li><strong>Supabase</strong> (hébergement base de données, UE)</li>
            <li><strong>Vercel</strong> (hébergement web, UE)</li>
            <li><strong>Stripe</strong> (paiements, certifié PCI DSS)</li>
          </ul>
          <p>Ces prestataires sont contractuellement tenus de protéger vos données conformément à la LPD et au RGPD.</p>
        </Section>

        <Section title="6. Cookies">
          <p>Workie utilise uniquement des cookies <strong>essentiels au fonctionnement</strong> de la plateforme :</p>
          <ul>
            <li>Cookie de session d&apos;authentification (Supabase Auth)</li>
            <li>Préférence de thème (clair/sombre)</li>
          </ul>
          <p>Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé sans votre consentement.</p>
        </Section>

        <Section title="7. Conservation des données">
          <ul>
            <li><strong>Compte actif</strong> : données conservées tant que le compte existe</li>
            <li><strong>Compte supprimé</strong> : données supprimées sous 30 jours, sauf obligation légale</li>
            <li><strong>Avis supprimés</strong> : supprimés immédiatement de l&apos;affichage public</li>
          </ul>
        </Section>

        <Section title="8. Vos droits">
          <p>Conformément à la LPD et au RGPD, vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Accès</strong> : obtenir une copie de vos données</li>
            <li><strong>Rectification</strong> : corriger des données inexactes</li>
            <li><strong>Suppression</strong> : demander la suppression de votre compte et données</li>
            <li><strong>Portabilité</strong> : recevoir vos données dans un format structuré</li>
            <li><strong>Opposition</strong> : vous opposer à certains traitements</li>
          </ul>
          <p>Pour exercer ces droits : <a href="mailto:contact@workie.ch" style={{ color: "#8b5cf6" }}>contact@workie.ch</a> — réponse sous 30 jours.</p>
        </Section>

        <Section title="9. Sécurité">
          <p>Vos données sont chiffrées en transit (HTTPS/TLS) et au repos. L&apos;accès à la base de données est contrôlé par des politiques de sécurité strictes (Row Level Security). Les mots de passe sont hachés et jamais stockés en clair.</p>
        </Section>

        <Section title="10. Contact & réclamations">
          <p>Pour toute question sur vos données : <a href="mailto:contact@workie.ch" style={{ color: "#8b5cf6" }}>contact@workie.ch</a></p>
          <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès du <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" style={{ color: "#8b5cf6" }}>Préposé fédéral à la protection des données (PFPDT)</a>.</p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/cgu" style={{ fontSize: 13, color: "#8b5cf6", textDecoration: "none", fontWeight: 600 }}>Conditions générales d&apos;utilisation →</Link>
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
