import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Mentions légales — Workie",
  description: "Informations légales de la plateforme Workie, opérée en Suisse.",
};

export default function MentionsLegalesPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 28px 100px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 8 }}>
          Mentions légales
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 40 }}>
          Dernière mise à jour : juillet 2026
        </p>

        <Section title="Exploitant de la plateforme">
          <p>La plateforme Workie est exploitée par :</p>
          <address style={{ fontStyle: "normal", marginTop: 12, lineHeight: 1.9 }}>
            <strong>Workie</strong><br />
            Suisse<br />
            Contact : <a href="mailto:support@workie.ch" style={{ color: "var(--accent)", textDecoration: "none" }}>support@workie.ch</a>
          </address>
        </Section>

        <Section title="Hébergement">
          <p>
            La plateforme est hébergée par <strong>Vercel Inc.</strong> (340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis)
            et utilise les services de base de données de <strong>Supabase Inc.</strong> sur des serveurs localisés en Europe (région eu-west-1).
          </p>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>
            L'ensemble des contenus présents sur Workie — textes, logos, interface, code source — sont la propriété exclusive de Workie
            ou font l'objet d'une licence accordée à Workie. Toute reproduction, distribution ou utilisation sans autorisation écrite préalable est interdite.
          </p>
          <p style={{ marginTop: 12 }}>
            Les avis publiés par les utilisateurs restent leur propriété. En les soumettant, l'utilisateur accorde à Workie une licence
            non exclusive, mondiale et gratuite pour les afficher sur la plateforme.
          </p>
        </Section>

        <Section title="Responsabilité des contenus">
          <p>
            Workie est une plateforme d'hébergement de contenus générés par des tiers au sens de la loi fédérale suisse sur les services de communication électronique.
            Workie n'est pas responsable des avis publiés par ses utilisateurs, mais s'engage à retirer tout contenu signalé comme illicite dans les meilleurs délais.
          </p>
          <p style={{ marginTop: 12 }}>
            Pour signaler un contenu : <a href="mailto:support@workie.ch" style={{ color: "var(--accent)", textDecoration: "none" }}>support@workie.ch</a>
          </p>
        </Section>

        <Section title="Protection des données (nFADP)">
          <p>
            Workie traite les données personnelles conformément à la loi fédérale suisse sur la protection des données (nFADP, entrée en vigueur le 1er septembre 2023).
            Pour toute demande relative à vos données (accès, rectification, suppression, portabilité), consultez notre{" "}
            <a href="/confidentialite" style={{ color: "var(--accent)", textDecoration: "none" }}>Politique de confidentialité</a>.
          </p>
        </Section>

        <Section title="Droit applicable et for juridique">
          <p>
            Les présentes mentions légales sont régies par le droit suisse.
            Tout litige est soumis à la compétence exclusive des tribunaux du canton de domicile de l'exploitant,
            sous réserve des dispositions impératives applicables au consommateur.
          </p>
        </Section>

        <Section title="Liens externes">
          <p>
            Workie peut contenir des liens vers des sites tiers. Ces liens sont fournis à titre informatif uniquement.
            Workie n'assume aucune responsabilité quant au contenu ou à la politique de confidentialité de ces sites.
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{
        fontSize: 16, fontWeight: 800, color: "var(--text)",
        letterSpacing: "-0.01em", marginBottom: 12,
        paddingBottom: 10, borderBottom: "1px solid var(--border)",
      }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  );
}
