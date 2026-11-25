import { NavbarClient } from "@/components/NavbarClient";
import { Footer } from "@/components/Footer";
import { meta } from "@/i18n/meta";
import { langueDeLaPage } from "@/i18n/page";
import { revendicationOuverte } from "@/lib/ouverture";
import { ABONNEMENT as TARIFS } from "@/lib/tarifs";
import { Section, VersionFaitFoi, PiedJuridique, styleTitre, styleDate } from "@/components/juridique/Juridique";

export const generateMetadata = () => meta({ titre: "juridique.cguTitre", description: "juridique.cguDescription", chemin: "/cgu" });

/**
 * Conditions générales d'utilisation.
 *
 * Le texte français fait foi. Chaque langue a son propre texte complet, écrit
 * pour être lu, plutôt qu'une suite de clés : un contrat se relit d'un bloc.
 * Toute modification se fait dans les deux versions à la fois.
 */
export default async function CGUPage() {
  const langue = await langueDeLaPage();
  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <NavbarClient />
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 100px" }}>
        {langue === "de" ? <CguDe /> : <CguFr />}
        <PiedJuridique autre="/confidentialite" />
      </main>
      <Footer />
    </div>
  );
}

const mail = <a href="mailto:contact@workie.ch" style={{ color: "var(--brand)" }}>contact@workie.ch</a>;

function CguFr() {
  return (
    <>
      <h1 style={styleTitre}>Conditions générales d&apos;utilisation</h1>
      <p style={styleDate}>Dernière mise à jour : 25 novembre 2026</p>

      <Section title="1. Présentation de Workie">
        <p>Workie est un catalogue en ligne des entreprises suisses : ce qu&apos;elles font, où elles se trouvent, dans quelle langue on y travaille, et leurs offres d&apos;emploi. Workie est exploité depuis la Suisse.</p>
        <p>Workie ne publie aucun avis, aucune note et aucun salaire. Les candidatures se font directement chez l&apos;employeur, sur son propre site.</p>
        <p>En accédant à la plateforme ou en créant un compte, vous acceptez les présentes CGU dans leur intégralité.</p>
      </Section>

      <Section title="2. Accès et inscription">
        <p>Le catalogue et les offres d&apos;emploi sont consultables sans compte. Sans compte, les entreprises et les offres que vous gardez sont enregistrées sur votre appareil uniquement.</p>
        <p>La création d&apos;un compte permet de retrouver vos favoris et vos offres enregistrées sur tous vos appareils, et donne accès aux notifications. Vous devez :</p>
        <ul>
          <li>Avoir au moins 18 ans</li>
          <li>Fournir une adresse email valide et la confirmer</li>
          <li>Ne pas créer plusieurs comptes pour contourner les règles</li>
        </ul>
        <p>Les comptes entreprises (Business) sont réservés aux représentants habilités de la société concernée.</p>
      </Section>

      <Section title="3. Contenu des fiches">
        <p>Les fiches d&apos;entreprise sont établies par Workie à partir d&apos;informations publiques, et vérifiées une par une. Elles sont factuelles : nom, secteur, lieu, langues de travail, description et adresse du site officiel. Une entreprise qui gère sa fiche peut la compléter elle-même.</p>
        <p>Une entreprise peut demander la correction ou la suppression de sa fiche en écrivant à {mail}.</p>
      </Section>

      <Section title="4. Offres d'emploi">
        <p>Les offres d&apos;emploi affichées sur Workie proviennent des employeurs : soit publiées par l&apos;entreprise sur Workie, soit reprises de la page carrière de son site officiel, avec un lien vers l&apos;offre d&apos;origine. Elles sont mises à jour chaque jour ; une offre retirée par l&apos;employeur est signalée comme clôturée.</p>
        <p>Les offres sont affichées dans la langue où l&apos;employeur les a publiées. Workie ne les traduit pas et n&apos;en modifie pas le contenu.</p>
      </Section>

      <Section title="5. Classement">
        <p>Le classement reflète l&apos;intérêt que les visiteurs portent à une entreprise : mises en favori, consultations de la fiche et clics vers les offres d&apos;emploi. Il ne constitue ni une évaluation de l&apos;employeur, ni une recommandation professionnelle ou financière de Workie. Aucune place ne s&apos;achète.</p>
      </Section>

      <Section title="6. Comptes Business">
        <p>Les comptes Business permettent aux entreprises de :</p>
        <ul>
          {revendicationOuverte && <li>Gérer et tenir à jour leur fiche</li>}
          <li>Publier leurs offres d&apos;emploi</li>
          <li>Diffuser des campagnes publicitaires</li>
        </ul>
        {revendicationOuverte && <p>La demande de gestion d&apos;une fiche est vérifiée avant d&apos;être accordée : par un code envoyé à une adresse email du domaine officiel de l&apos;entreprise, ou à la main par notre équipe.</p>}
      </Section>

      <Section title="7. Paiements">
        {revendicationOuverte && <p>La gestion d&apos;une fiche est proposée par abonnement : {TARIFS.mensuel.libelle} ou {TARIFS.annuel.libelle}, sans engagement. L&apos;abonnement se résilie à tout moment depuis l&apos;espace entreprise ; il reste actif jusqu&apos;à la fin de la période payée.</p>}
        <p>Les campagnes publicitaires sont vendues au forfait, pour une durée de 7 à 90 jours, payée une fois. Le prix dépend des cantons et des secteurs visés.</p>
        <p>Les paiements sont traités par <strong>Stripe</strong>, prestataire de paiement sécurisé. Workie ne stocke aucune donnée bancaire. En cas de problème de paiement, écrivez à {mail}.</p>
        <p>Une campagne payée est diffusée après validation. Si elle est refusée, elle est remboursée.</p>
      </Section>

      <Section title="8. Propriété intellectuelle">
        <p>Le contenu de la plateforme (design, code, marque Workie) est protégé par le droit suisse de la propriété intellectuelle. Les noms, marques, visuels et offres d&apos;emploi des entreprises référencées appartiennent à leurs titulaires ; ils ne sont cités qu&apos;à des fins d&apos;information.</p>
        <p>Les visuels fournis par un annonceur restent sa propriété ; il accorde à Workie une licence d&apos;utilisation non exclusive, limitée à la diffusion de sa campagne.</p>
      </Section>

      <Section title="9. Limitation de responsabilité">
        <p>Workie rassemble des informations publiques et les tient à jour avec soin, sans garantir qu&apos;elles soient complètes ou exactes à tout instant. Les offres d&apos;emploi sont rédigées et gérées par les employeurs : Workie n&apos;est pas partie au processus de recrutement et ne peut être tenue responsable de son déroulement.</p>
      </Section>

      <Section title="10. Langues">
        <p>Workie est proposé en plusieurs langues. Les présentes CGU sont rédigées en français ; en cas de divergence entre les versions, seule la version française fait foi.</p>
      </Section>

      <Section title="11. Droit applicable">
        <p>Les présentes CGU sont régies par le droit suisse. Tout litige sera soumis à la juridiction des tribunaux du canton de Genève, Suisse.</p>
      </Section>

      <Section title="12. Contact">
        <p>Pour toute question relative aux présentes CGU : {mail}</p>
      </Section>
    </>
  );
}

function CguDe() {
  return (
    <>
      <h1 style={styleTitre}>Allgemeine Nutzungsbedingungen</h1>
      <p style={styleDate}>Letzte Aktualisierung: 25. November 2026</p>
      <VersionFaitFoi />

      <Section title="1. Was ist Workie">
        <p>Workie ist ein Online-Verzeichnis der Schweizer Unternehmen: was sie tun, wo sie sind, in welcher Sprache dort gearbeitet wird, und ihre Stellenangebote. Workie wird aus der Schweiz betrieben.</p>
        <p>Workie veröffentlicht keine Bewertungen, keine Noten und keine Löhne. Bewerbungen erfolgen direkt beim Arbeitgeber, auf dessen eigener Website.</p>
        <p>Mit dem Zugriff auf die Plattform oder der Erstellung eines Kontos akzeptieren Sie diese Nutzungsbedingungen vollständig.</p>
      </Section>

      <Section title="2. Zugang und Registrierung">
        <p>Das Verzeichnis und die Stellenangebote sind ohne Konto zugänglich. Ohne Konto werden die Unternehmen und Stellen, die Sie speichern, nur auf Ihrem Gerät gespeichert.</p>
        <p>Mit einem Konto finden Sie Ihre Favoriten und gespeicherten Stellen auf all Ihren Geräten wieder und erhalten Zugang zu den Benachrichtigungen. Sie müssen:</p>
        <ul>
          <li>Mindestens 18 Jahre alt sein</li>
          <li>Eine gültige E-Mail-Adresse angeben und bestätigen</li>
          <li>Keine mehreren Konten erstellen, um die Regeln zu umgehen</li>
        </ul>
        <p>Unternehmenskonten (Business) sind berechtigten Vertreterinnen und Vertretern des betreffenden Unternehmens vorbehalten.</p>
      </Section>

      <Section title="3. Inhalt der Profile">
        <p>Die Unternehmensprofile werden von Workie auf Grundlage öffentlicher Informationen erstellt und einzeln geprüft. Sie sind sachlich: Name, Branche, Ort, Arbeitssprachen, Beschreibung und Adresse der offiziellen Website. Ein Unternehmen, das sein Profil verwaltet, kann es selbst ergänzen.</p>
        <p>Ein Unternehmen kann die Korrektur oder Entfernung seines Profils verlangen, indem es an {mail} schreibt.</p>
      </Section>

      <Section title="4. Stellenangebote">
        <p>Die auf Workie angezeigten Stellenangebote stammen von den Arbeitgebern: entweder vom Unternehmen auf Workie veröffentlicht oder von der Karriereseite seiner offiziellen Website übernommen, mit einem Link zum ursprünglichen Inserat. Sie werden täglich aktualisiert; ein vom Arbeitgeber zurückgezogenes Inserat wird als besetzt gekennzeichnet.</p>
        <p>Die Inserate werden in der Sprache angezeigt, in der der Arbeitgeber sie veröffentlicht hat. Workie übersetzt sie nicht und verändert ihren Inhalt nicht.</p>
      </Section>

      <Section title="5. Rangliste">
        <p>Die Rangliste spiegelt das Interesse der Besucherinnen und Besucher an einem Unternehmen wider: Favoriten, Besuche des Profils und Klicks zu den Stellenangeboten. Sie ist weder eine Bewertung des Arbeitgebers noch eine berufliche oder finanzielle Empfehlung von Workie. Kein Platz ist käuflich.</p>
      </Section>

      <Section title="6. Business-Konten">
        <p>Mit Business-Konten können Unternehmen:</p>
        <ul>
          {revendicationOuverte && <li>Ihr Profil verwalten und aktuell halten</li>}
          <li>Ihre Stellenangebote veröffentlichen</li>
          <li>Werbekampagnen schalten</li>
        </ul>
        {revendicationOuverte && <p>Die Anfrage zur Verwaltung eines Profils wird geprüft, bevor sie gewährt wird: mit einem Code, der an eine E-Mail-Adresse der offiziellen Domain des Unternehmens gesendet wird, oder von Hand durch unser Team.</p>}
      </Section>

      <Section title="7. Zahlungen">
        {revendicationOuverte && <p>Die Verwaltung eines Profils wird im Abo angeboten: CHF {TARIFS.mensuel.chf} pro Monat oder CHF {TARIFS.annuel.chf} pro Jahr, ohne Mindestlaufzeit. Das Abo kann jederzeit im Unternehmensbereich gekündigt werden; es bleibt bis zum Ende der bezahlten Periode aktiv.</p>}
        <p>Werbekampagnen werden pauschal verkauft, für eine Dauer von 7 bis 90 Tagen, einmalig bezahlt. Der Preis hängt von den gewählten Kantonen und Branchen ab.</p>
        <p>Zahlungen werden von <strong>Stripe</strong> abgewickelt, einem sicheren Zahlungsdienstleister. Workie speichert keine Bankdaten. Bei Zahlungsproblemen schreiben Sie an {mail}.</p>
        <p>Eine bezahlte Kampagne wird nach Freigabe ausgespielt. Wird sie abgelehnt, wird sie zurückerstattet.</p>
      </Section>

      <Section title="8. Geistiges Eigentum">
        <p>Die Inhalte der Plattform (Design, Code, Marke Workie) sind durch das schweizerische Immaterialgüterrecht geschützt. Namen, Marken, Bilder und Stellenangebote der aufgeführten Unternehmen gehören ihren Inhabern; sie werden nur zu Informationszwecken genannt.</p>
        <p>Von einem Werbekunden gelieferte Bilder bleiben sein Eigentum; er gewährt Workie eine nicht ausschliessliche Nutzungslizenz, beschränkt auf die Ausspielung seiner Kampagne.</p>
      </Section>

      <Section title="9. Haftungsbeschränkung">
        <p>Workie sammelt öffentliche Informationen und hält sie sorgfältig aktuell, ohne zu garantieren, dass sie jederzeit vollständig oder richtig sind. Die Stellenangebote werden von den Arbeitgebern verfasst und verwaltet: Workie ist nicht Partei des Rekrutierungsprozesses und kann für dessen Ablauf nicht haftbar gemacht werden.</p>
      </Section>

      <Section title="10. Sprachen">
        <p>Workie wird in mehreren Sprachen angeboten. Diese Nutzungsbedingungen sind auf Französisch verfasst; bei Abweichungen zwischen den Fassungen ist allein die französische Fassung massgebend.</p>
      </Section>

      <Section title="11. Anwendbares Recht">
        <p>Diese Nutzungsbedingungen unterstehen schweizerischem Recht. Streitigkeiten unterliegen der Zuständigkeit der Gerichte des Kantons Genf, Schweiz.</p>
      </Section>

      <Section title="12. Kontakt">
        <p>Für Fragen zu diesen Nutzungsbedingungen: {mail}</p>
      </Section>
    </>
  );
}
