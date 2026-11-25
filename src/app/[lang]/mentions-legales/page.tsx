import Link from "next/link";
import { NavbarClient } from "@/components/NavbarClient";
import { Footer } from "@/components/Footer";
import { meta } from "@/i18n/meta";
import { langueDeLaPage } from "@/i18n/page";
import { Section, VersionFaitFoi, styleTitre, styleDate } from "@/components/juridique/Juridique";

export const generateMetadata = () => meta({ titre: "juridique.mentionsTitre", description: "juridique.mentionsDescription", chemin: "/mentions-legales" });

/** Mentions légales. Le texte français fait foi ; toute modification se fait dans les deux langues. */
export default async function MentionsLegalesPage() {
  const langue = await langueDeLaPage();
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <NavbarClient />
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 100px" }}>
        {langue === "de" ? <MentionsDe /> : <MentionsFr />}
      </main>
      <Footer />
    </div>
  );
}

const mail = <a href="mailto:contact@workie.ch" style={{ color: "var(--brand)", textDecoration: "none" }}>contact@workie.ch</a>;
const lien = (texte: string) => <Link href="/confidentialite" style={{ color: "var(--brand)", textDecoration: "none" }}>{texte}</Link>;

function MentionsFr() {
  return (
    <>
      <h1 style={styleTitre}>Mentions légales</h1>
      <p style={styleDate}>Dernière mise à jour : 25 novembre 2026</p>

      <Section title="Exploitant de la plateforme">
        <p>La plateforme Workie est exploitée par :</p>
        <address style={{ fontStyle: "normal", lineHeight: 1.9 }}>
          <strong>Workie</strong><br />
          Suisse<br />
          Contact : {mail}
        </address>
      </Section>

      <Section title="Hébergement">
        <p>La plateforme est hébergée par <strong>Vercel Inc.</strong> (340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis), avec des fonctions exécutées en Irlande (région dub1), et utilise les services de base de données de <strong>Supabase Inc.</strong> sur des serveurs localisés en Irlande (région eu-west-1). Les e-mails du site sont envoyés par <strong>Resend</strong> ; la messagerie de contact est hébergée par <strong>Infomaniak</strong>, en Suisse.</p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>L&apos;ensemble des contenus présents sur Workie (textes, logos, interface, code source) sont la propriété exclusive de Workie ou font l&apos;objet d&apos;une licence accordée à Workie. Toute reproduction, distribution ou utilisation sans autorisation écrite préalable est interdite.</p>
        <p>Les noms, marques, visuels et offres d&apos;emploi des entreprises référencées appartiennent à leurs titulaires : ils ne sont cités qu&apos;à des fins d&apos;information. Les visuels fournis par un annonceur restent sa propriété, sous licence non exclusive limitée à sa campagne.</p>
      </Section>

      <Section title="Responsabilité des contenus">
        <p>Les fiches d&apos;entreprise sont établies par Workie à partir d&apos;informations publiques, ou par l&apos;entreprise elle-même lorsqu&apos;elle gère sa fiche. Les offres d&apos;emploi sont publiées par les employeurs, sur Workie ou sur leurs propres sites, d&apos;où Workie les reprend avec un lien vers l&apos;offre d&apos;origine. Workie s&apos;engage à corriger ou retirer, dans les meilleurs délais, toute information signalée comme inexacte ou illicite.</p>
        <p>Pour signaler un contenu : {mail}</p>
      </Section>

      <Section title="Protection des données (LPD)">
        <p>Workie traite les données personnelles conformément à la loi fédérale suisse sur la protection des données (LPD, en vigueur depuis le 1er septembre 2023). Pour toute demande relative à vos données (accès, rectification, suppression, portabilité), consultez notre {lien("politique de confidentialité")}.</p>
      </Section>

      <Section title="Droit applicable et for juridique">
        <p>Les présentes mentions légales sont régies par le droit suisse. Tout litige est soumis à la compétence exclusive des tribunaux du canton de domicile de l&apos;exploitant, sous réserve des dispositions impératives applicables au consommateur.</p>
      </Section>

      <Section title="Liens externes">
        <p>Workie contient des liens vers des sites tiers, notamment vers les offres d&apos;emploi des employeurs. Ces liens sont fournis à titre informatif uniquement. Workie n&apos;assume aucune responsabilité quant au contenu ou à la politique de confidentialité de ces sites.</p>
      </Section>

      <Section title="Langues">
        <p>Ces mentions sont rédigées en français ; en cas de divergence entre les versions, seule la version française fait foi.</p>
      </Section>
    </>
  );
}

function MentionsDe() {
  return (
    <>
      <h1 style={styleTitre}>Impressum</h1>
      <p style={styleDate}>Letzte Aktualisierung: 25. November 2026</p>
      <VersionFaitFoi />

      <Section title="Betreiberin der Plattform">
        <p>Die Plattform Workie wird betrieben von:</p>
        <address style={{ fontStyle: "normal", lineHeight: 1.9 }}>
          <strong>Workie</strong><br />
          Schweiz<br />
          Kontakt: {mail}
        </address>
      </Section>

      <Section title="Hosting">
        <p>Die Plattform wird von <strong>Vercel Inc.</strong> (340 Pine Street, Suite 701, San Francisco, CA 94104, USA) gehostet, mit in Irland ausgeführten Funktionen (Region dub1), und nutzt die Datenbankdienste von <strong>Supabase Inc.</strong> auf Servern in Irland (Region eu-west-1). Die E-Mails der Website werden über <strong>Resend</strong> versendet; das Kontaktpostfach wird von <strong>Infomaniak</strong> in der Schweiz gehostet.</p>
      </Section>

      <Section title="Geistiges Eigentum">
        <p>Sämtliche Inhalte auf Workie (Texte, Logos, Benutzeroberfläche, Quellcode) sind ausschliessliches Eigentum von Workie oder werden Workie unter Lizenz zur Verfügung gestellt. Jede Vervielfältigung, Verbreitung oder Nutzung ohne vorgängige schriftliche Genehmigung ist untersagt.</p>
        <p>Namen, Marken, Bilder und Stellenangebote der aufgeführten Unternehmen gehören ihren Inhabern: Sie werden nur zu Informationszwecken genannt. Von einem Werbekunden gelieferte Bilder bleiben sein Eigentum, unter einer nicht ausschliesslichen, auf seine Kampagne beschränkten Lizenz.</p>
      </Section>

      <Section title="Verantwortung für Inhalte">
        <p>Die Unternehmensprofile werden von Workie auf Grundlage öffentlicher Informationen erstellt oder vom Unternehmen selbst, wenn es sein Profil verwaltet. Die Stellenangebote werden von den Arbeitgebern veröffentlicht, auf Workie oder auf ihren eigenen Websites, von wo Workie sie mit einem Link zum ursprünglichen Inserat übernimmt. Workie verpflichtet sich, jede als unrichtig oder rechtswidrig gemeldete Information so rasch wie möglich zu korrigieren oder zu entfernen.</p>
        <p>Um einen Inhalt zu melden: {mail}</p>
      </Section>

      <Section title="Datenschutz (DSG)">
        <p>Workie bearbeitet Personendaten gemäss dem schweizerischen Bundesgesetz über den Datenschutz (DSG, in Kraft seit 1. September 2023). Für Anliegen zu Ihren Daten (Auskunft, Berichtigung, Löschung, Datenübertragbarkeit) lesen Sie unsere {lien("Datenschutzerklärung")}.</p>
      </Section>

      <Section title="Anwendbares Recht und Gerichtsstand">
        <p>Dieses Impressum untersteht schweizerischem Recht. Streitigkeiten unterliegen der ausschliesslichen Zuständigkeit der Gerichte am Wohnsitzkanton der Betreiberin, vorbehaltlich zwingender Bestimmungen zum Schutz der Konsumentinnen und Konsumenten.</p>
      </Section>

      <Section title="Externe Links">
        <p>Workie enthält Links zu Websites Dritter, insbesondere zu den Stellenangeboten der Arbeitgeber. Diese Links dienen ausschliesslich der Information. Workie übernimmt keine Verantwortung für den Inhalt oder die Datenschutzbestimmungen dieser Websites.</p>
      </Section>

      <Section title="Sprachen">
        <p>Dieses Impressum ist auf Französisch verfasst; bei Abweichungen zwischen den Fassungen ist allein die französische Fassung massgebend.</p>
      </Section>
    </>
  );
}
