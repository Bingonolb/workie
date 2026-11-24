import Link from "next/link";
import { revendicationOuverte } from "@/lib/ouverture";
import { tServeur } from "@/i18n/page";
import { riche, sansBalises } from "@/i18n/riche";
import type { CleMessage, Traduire } from "@/i18n/traduire";

/**
 * Foire aux questions de la page d'accueil.
 *
 * Les réponses répondent. Elles ne se justifient pas, elles n'anticipent pas
 * un reproche, et elles ne se défendent pas d'être ce qu'elles sont : la
 * version précédente expliquait pourquoi Workie n'est pas ceci ni cela, ce qui
 * est la manière la plus sûre de faire croire qu'il y a un problème.
 *
 * Deux limites tiennent toujours. On n'affirme rien d'invérifiable, et on ne
 * donne pas de conseil juridique : on décrit ce que le site fait, ce qui se
 * vérifie dans le code et en base.
 *
 * Rendu en <details>/<summary> natifs : pas de JavaScript, donc le contenu est
 * présent dans le HTML dès le premier octet, lisible par un lecteur d'écran et
 * par un moteur de recherche.
 */

export type Entree = { q: string; r: React.ReactNode; texte: string };

const lien = { color: "var(--brand)" } as const;
const BALISES = {
  b: (c: React.ReactNode) => <strong>{c}</strong>,
  email: (c: React.ReactNode) => <a href="mailto:contact@workie.ch" style={lien}>{c}</a>,
  mentions: (c: React.ReactNode) => <Link href="/mentions-legales" style={lien}>{c}</Link>,
  confidentialite: (c: React.ReactNode) => <Link href="/confidentialite" style={lien}>{c}</Link>,
  pro: (c: React.ReactNode) => <Link href="/pour-les-entreprises" style={{ ...lien, fontWeight: 600 }}>{c}</Link>,
};

/** Les questions et réponses, dans la langue de la page. */
function entrees(t: Traduire): Entree[] {
  const e = (q: CleMessage, r: CleMessage): Entree => ({ q: t(q), r: riche(t(r), BALISES), texte: sansBalises(t(r)) });
  const base = [
    e("faq.workieQ", "faq.workieR"),
    e("faq.doublonQ", "faq.doublonR"),
    e("faq.sourcesQ", "faq.sourcesR"),
    e("faq.classementQ", "faq.classementR"),
    e("faq.corrigerQ", "faq.corrigerR"),
    e("faq.donneesQ", "faq.donneesR"),
    e("faq.payantQ", revendicationOuverte ? "faq.payantRAbonnement" : "faq.payantR"),
    e("faq.mesDonneesQ", "faq.mesDonneesR"),
  ];
  // Les questions des employeurs, ajoutées quand l'offre entreprise est ouverte.
  return revendicationOuverte ? [...base, e("faq.gererQ", "faq.gererR"), e("faq.payerQ", "faq.payerR")] : base;
}

export async function LandingFaq({ items: itemsRecus, titre, sousTitre }: { items?: Entree[]; titre?: string; sousTitre?: string } = {}) {
  const t = await tServeur();
  const items = itemsRecus ?? entrees(t);
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
            mainEntity: items.map(({ q, texte }) => ({
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
          {titre ?? t("faq.titre")}
        </h2>
        <p style={{ textAlign: "center", fontSize: 15, color: "var(--text-muted)", marginBottom: 40 }}>
          {sousTitre ?? t("faq.sousTitre")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map(({ q, r }) => (
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
