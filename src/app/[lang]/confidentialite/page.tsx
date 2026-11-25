import { NavbarClient } from "@/components/NavbarClient";
import { Footer } from "@/components/Footer";
import { meta } from "@/i18n/meta";
import { langueDeLaPage } from "@/i18n/page";
import { Section, VersionFaitFoi, PiedJuridique, styleTitre, styleDate } from "@/components/juridique/Juridique";

export const generateMetadata = () => meta({ titre: "juridique.confidentialiteTitre", description: "juridique.confidentialiteDescription", chemin: "/confidentialite" });

/**
 * Politique de confidentialité.
 *
 * Elle décrit ce que le site fait réellement, vérifié dans le code : chaque
 * donnée, chaque prestataire, chaque stockage dans le navigateur. Toute
 * nouvelle collecte, tout nouveau prestataire s'ajoute ici, dans les deux
 * langues. Le texte français fait foi.
 */
export default async function ConfidentialitePage() {
  const langue = await langueDeLaPage();
  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <NavbarClient />
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 100px" }}>
        {langue === "de" ? <ConfidentialiteDe /> : <ConfidentialiteFr />}
        <PiedJuridique autre="/cgu" />
      </main>
      <Footer />
    </div>
  );
}

const mail = <a href="mailto:contact@workie.ch" style={{ color: "var(--brand)" }}>contact@workie.ch</a>;
const lienPfpdt = (texte: string) => <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)" }}>{texte}</a>;

function ConfidentialiteFr() {
  return (
    <>
      <h1 style={styleTitre}>Politique de confidentialité</h1>
      <p style={styleDate}>Dernière mise à jour : 25 novembre 2026, conforme à la LPD (loi fédérale sur la protection des données) et au RGPD</p>

      <Section title="1. Responsable du traitement">
        <p>Workie, Suisse. {mail}</p>
      </Section>

      <Section title="2. Données collectées">
        <p><strong>Données de compte</strong> : adresse email, prénom et nom, canton, année de naissance, date de création du compte. Avec la connexion Google, Google nous transmet votre nom et votre adresse email.</p>
        <p><strong>Données de profil</strong> : nom complet et canton, modifiables depuis votre profil.</p>
        <p><strong>Données d&apos;usage</strong> : entreprises mises en favori, offres d&apos;emploi enregistrées, fiches consultées, clics vers les offres d&apos;emploi. Elles servent votre propre compte et ne sont jamais affichées à d&apos;autres visiteurs.</p>
        <p><strong>Données techniques</strong> : adresse IP, utilisée pour la prévention des abus et une localisation approximative (canton, ville) ; type de navigateur. Les statistiques de visite reposent sur une empreinte anonyme qui change chaque jour, sans conserver l&apos;adresse IP.</p>
        <p><strong>Données de paiement</strong> : traitées exclusivement par Stripe. Workie ne stocke aucun numéro de carte bancaire.</p>
      </Section>

      <Section title="3. Sans compte">
        <p>Sans compte, les entreprises et les offres que vous gardez, vos recherches récentes, le thème et la langue choisis sont enregistrés uniquement dans votre navigateur. Workie n&apos;en reçoit pas de copie. Vous les effacez en effaçant les données du site dans votre navigateur.</p>
      </Section>

      <Section title="4. Finalités du traitement">
        <ul>
          <li>Fourniture et amélioration des services Workie</li>
          <li>Authentification et sécurité des comptes</li>
          <li>Prévention de la fraude et des créations de comptes automatisées</li>
          <li>Envoi des e-mails liés à votre compte (confirmation d&apos;adresse, mot de passe, bienvenue, gestion d&apos;une fiche d&apos;entreprise)</li>
          <li>Traitement des paiements</li>
          <li>Détection et correction des erreurs techniques</li>
          <li>Respect de nos obligations légales</li>
        </ul>
      </Section>

      <Section title="5. Ce qui reste privé">
        <p>Workie ne publie aucun avis et aucune note : rien de ce que vous faites sur le site n&apos;est visible par les autres visiteurs.</p>
        <p>Vos favoris, vos offres enregistrées et les fiches que vous consultez ne sont lisibles que par vous, depuis votre compte. Les statistiques de consultation remises aux entreprises sont agrégées et ne permettent pas de vous identifier.</p>
      </Section>

      <Section title="6. Partage des données">
        <p>Workie ne vend jamais vos données personnelles. Les données peuvent être traitées par les prestataires suivants, uniquement pour le service qu&apos;ils rendent :</p>
        <ul>
          <li><strong>Supabase</strong> : base de données et authentification, serveurs en Irlande (UE)</li>
          <li><strong>Vercel</strong> : hébergement du site, fonctions exécutées en Irlande (UE)</li>
          <li><strong>Stripe</strong> : paiements, certifié PCI DSS</li>
          <li><strong>Resend</strong> : envoi des e-mails du site</li>
          <li><strong>Sentry</strong> : rapports d&apos;erreurs techniques, sans enregistrement de vos sessions</li>
          <li><strong>Google</strong> : seulement si vous choisissez de vous connecter avec Google</li>
          <li><strong>Infomaniak</strong> : messagerie de contact@workie.ch, en Suisse</li>
        </ul>
        <p>Certains de ces prestataires sont établis hors de Suisse et de l&apos;UE. Ils sont contractuellement tenus de protéger vos données conformément à la LPD et au RGPD.</p>
      </Section>

      <Section title="7. Cookies et stockage dans le navigateur">
        <p>Workie utilise uniquement des cookies <strong>essentiels au fonctionnement</strong> de la plateforme :</p>
        <ul>
          <li>Cookie de session d&apos;authentification (Supabase Auth), si vous êtes connecté</li>
          <li>Cookie de langue (<code>workie_langue</code>), qui garde la langue choisie pendant un an</li>
        </ul>
        <p>Le thème, les recherches récentes et, sans compte, vos favoris et offres enregistrées sont gardés dans le stockage local du navigateur.</p>
        <p>Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.</p>
      </Section>

      <Section title="8. Conservation des données">
        <ul>
          <li><strong>Compte actif</strong> : données conservées tant que le compte existe</li>
          <li><strong>Compte supprimé</strong> : favoris, offres enregistrées, historique de consultation et adresse IP conservée contre les abus supprimés, au plus tard sous 30 jours, sauf obligation légale</li>
          <li><strong>Données du navigateur</strong> : conservées sur votre appareil jusqu&apos;à ce que vous les effaciez</li>
        </ul>
      </Section>

      <Section title="9. Vos droits">
        <p>Conformément à la LPD et au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Accès</strong> : obtenir une copie de vos données</li>
          <li><strong>Rectification</strong> : corriger des données inexactes</li>
          <li><strong>Suppression</strong> : supprimer votre compte et vos données</li>
          <li><strong>Portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Opposition</strong> : vous opposer à certains traitements</li>
        </ul>
        <p>Depuis les réglages de votre profil, vous pouvez télécharger l&apos;ensemble de vos données ou supprimer votre compte vous-même. Pour toute autre demande : {mail}, réponse sous 30 jours.</p>
      </Section>

      <Section title="10. Sécurité">
        <p>Vos données sont chiffrées en transit (HTTPS/TLS) et au repos. L&apos;accès à la base de données est contrôlé par des politiques de sécurité strictes (Row Level Security). Les mots de passe sont hachés et jamais stockés en clair.</p>
      </Section>

      <Section title="11. Langues">
        <p>Cette politique est rédigée en français ; en cas de divergence entre les versions, seule la version française fait foi.</p>
      </Section>

      <Section title="12. Contact et réclamations">
        <p>Pour toute question sur vos données : {mail}</p>
        <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès du {lienPfpdt("Préposé fédéral à la protection des données et à la transparence (PFPDT)")}.</p>
      </Section>
    </>
  );
}

function ConfidentialiteDe() {
  return (
    <>
      <h1 style={styleTitre}>Datenschutzerklärung</h1>
      <p style={styleDate}>Letzte Aktualisierung: 25. November 2026, gemäss DSG (Bundesgesetz über den Datenschutz) und DSGVO</p>
      <VersionFaitFoi />

      <Section title="1. Verantwortliche Stelle">
        <p>Workie, Schweiz. {mail}</p>
      </Section>

      <Section title="2. Erhobene Daten">
        <p><strong>Kontodaten</strong>: E-Mail-Adresse, Vor- und Nachname, Kanton, Geburtsjahr, Erstellungsdatum des Kontos. Bei der Anmeldung mit Google übermittelt uns Google Ihren Namen und Ihre E-Mail-Adresse.</p>
        <p><strong>Profildaten</strong>: vollständiger Name und Kanton, in Ihrem Profil änderbar.</p>
        <p><strong>Nutzungsdaten</strong>: als Favoriten gespeicherte Unternehmen, gespeicherte Stellenangebote, besuchte Profile, Klicks zu den Stellenangeboten. Sie dienen Ihrem eigenen Konto und werden nie anderen Besucherinnen und Besuchern angezeigt.</p>
        <p><strong>Technische Daten</strong>: IP-Adresse, verwendet zur Missbrauchsverhinderung und für eine ungefähre Lokalisierung (Kanton, Ort); Browsertyp. Die Besuchsstatistiken beruhen auf einem anonymen Fingerabdruck, der sich täglich ändert, ohne die IP-Adresse zu speichern.</p>
        <p><strong>Zahlungsdaten</strong>: ausschliesslich von Stripe verarbeitet. Workie speichert keine Kreditkartennummern.</p>
      </Section>

      <Section title="3. Ohne Konto">
        <p>Ohne Konto werden die Unternehmen und Stellen, die Sie speichern, Ihre letzten Suchen sowie das gewählte Design und die gewählte Sprache nur in Ihrem Browser gespeichert. Workie erhält davon keine Kopie. Sie löschen sie, indem Sie die Websitedaten in Ihrem Browser löschen.</p>
      </Section>

      <Section title="4. Zwecke der Bearbeitung">
        <ul>
          <li>Bereitstellung und Verbesserung der Dienste von Workie</li>
          <li>Authentifizierung und Sicherheit der Konten</li>
          <li>Verhinderung von Betrug und automatisierten Kontoerstellungen</li>
          <li>Versand der E-Mails zu Ihrem Konto (Adressbestätigung, Passwort, Willkommen, Verwaltung eines Unternehmensprofils)</li>
          <li>Abwicklung der Zahlungen</li>
          <li>Erkennung und Behebung technischer Fehler</li>
          <li>Erfüllung unserer gesetzlichen Pflichten</li>
        </ul>
      </Section>

      <Section title="5. Was privat bleibt">
        <p>Workie veröffentlicht keine Bewertungen und keine Noten: Nichts, was Sie auf der Website tun, ist für andere Besucherinnen und Besucher sichtbar.</p>
        <p>Ihre Favoriten, Ihre gespeicherten Stellen und die Profile, die Sie besuchen, sind nur für Sie in Ihrem Konto lesbar. Die Besuchsstatistiken, die Unternehmen erhalten, sind zusammengefasst und lassen keine Rückschlüsse auf Ihre Person zu.</p>
      </Section>

      <Section title="6. Weitergabe der Daten">
        <p>Workie verkauft Ihre Personendaten nie. Die Daten können von folgenden Dienstleistern bearbeitet werden, ausschliesslich für die Leistung, die sie erbringen:</p>
        <ul>
          <li><strong>Supabase</strong>: Datenbank und Authentifizierung, Server in Irland (EU)</li>
          <li><strong>Vercel</strong>: Hosting der Website, Funktionen in Irland (EU) ausgeführt</li>
          <li><strong>Stripe</strong>: Zahlungen, PCI-DSS-zertifiziert</li>
          <li><strong>Resend</strong>: Versand der E-Mails der Website</li>
          <li><strong>Sentry</strong>: Berichte über technische Fehler, ohne Aufzeichnung Ihrer Sitzungen</li>
          <li><strong>Google</strong>: nur wenn Sie sich mit Google anmelden</li>
          <li><strong>Infomaniak</strong>: E-Mail-Postfach contact@workie.ch, in der Schweiz</li>
        </ul>
        <p>Einige dieser Dienstleister haben ihren Sitz ausserhalb der Schweiz und der EU. Sie sind vertraglich verpflichtet, Ihre Daten gemäss DSG und DSGVO zu schützen.</p>
      </Section>

      <Section title="7. Cookies und Speicherung im Browser">
        <p>Workie verwendet ausschliesslich <strong>für den Betrieb notwendige</strong> Cookies:</p>
        <ul>
          <li>Sitzungscookie der Authentifizierung (Supabase Auth), wenn Sie angemeldet sind</li>
          <li>Sprachcookie (<code>workie_langue</code>), das die gewählte Sprache ein Jahr lang speichert</li>
        </ul>
        <p>Das Design, die letzten Suchen und, ohne Konto, Ihre Favoriten und gespeicherten Stellen werden im lokalen Speicher des Browsers abgelegt.</p>
        <p>Es werden keine Werbe- oder Tracking-Cookies von Dritten verwendet.</p>
      </Section>

      <Section title="8. Aufbewahrung der Daten">
        <ul>
          <li><strong>Aktives Konto</strong>: Daten werden aufbewahrt, solange das Konto besteht</li>
          <li><strong>Gelöschtes Konto</strong>: Favoriten, gespeicherte Stellen, Besuchsverlauf und die zum Schutz vor Missbrauch gespeicherte IP-Adresse werden spätestens innert 30 Tagen gelöscht, vorbehaltlich gesetzlicher Pflichten</li>
          <li><strong>Daten im Browser</strong>: bleiben auf Ihrem Gerät, bis Sie sie löschen</li>
        </ul>
      </Section>

      <Section title="9. Ihre Rechte">
        <p>Gemäss DSG und DSGVO haben Sie folgende Rechte:</p>
        <ul>
          <li><strong>Auskunft</strong>: eine Kopie Ihrer Daten erhalten</li>
          <li><strong>Berichtigung</strong>: unrichtige Daten korrigieren</li>
          <li><strong>Löschung</strong>: Ihr Konto und Ihre Daten löschen</li>
          <li><strong>Datenübertragbarkeit</strong>: Ihre Daten in einem strukturierten Format erhalten</li>
          <li><strong>Widerspruch</strong>: bestimmten Bearbeitungen widersprechen</li>
        </ul>
        <p>In den Einstellungen Ihres Profils können Sie alle Ihre Daten herunterladen oder Ihr Konto selbst löschen. Für alle anderen Anliegen: {mail}, Antwort innert 30 Tagen.</p>
      </Section>

      <Section title="10. Sicherheit">
        <p>Ihre Daten werden bei der Übertragung (HTTPS/TLS) und im Ruhezustand verschlüsselt. Der Zugriff auf die Datenbank wird durch strenge Sicherheitsrichtlinien (Row Level Security) kontrolliert. Passwörter werden gehasht und nie im Klartext gespeichert.</p>
      </Section>

      <Section title="11. Sprachen">
        <p>Diese Datenschutzerklärung ist auf Französisch verfasst; bei Abweichungen zwischen den Fassungen ist allein die französische Fassung massgebend.</p>
      </Section>

      <Section title="12. Kontakt und Beschwerden">
        <p>Für Fragen zu Ihren Daten: {mail}</p>
        <p>Wenn Sie der Ansicht sind, dass Ihre Rechte nicht gewahrt werden, können Sie beim {lienPfpdt("Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB)")} Beschwerde einreichen.</p>
      </Section>
    </>
  );
}
