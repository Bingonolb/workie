import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Search, MailCheck, LayoutDashboard, BadgeCheck, PenLine, BarChart3, Megaphone } from "lucide-react";
import { NavbarClient } from "@/components/NavbarClient";
import { PiedAccueil } from "@/components/PiedAccueil";
import { ABONNEMENT } from "@/lib/tarifs";
import { RechercheRevendication } from "./RechercheRevendication";

export const metadata: Metadata = {
  title: "Pour les entreprises : gérez votre fiche employeur",
  description: "Votre entreprise est déjà sur Workie. Revendiquez sa fiche, présentez-la avec vos mots et suivez sa fréquentation. 129 CHF par mois, sans engagement.",
  alternates: { canonical: "https://www.workie.ch/pour-les-entreprises" },
};

const ETAPES = [
  { I: Search, t: "Trouvez votre fiche", d: "Tapez le nom de votre entreprise ci-dessus." },
  { I: MailCheck, t: "Vérifiez votre lien", d: "Un code envoyé à votre adresse professionnelle, ou une vérification par notre équipe." },
  { I: LayoutDashboard, t: "Gérez-la", d: "Votre espace entreprise s'ouvre dès l'abonnement activé." },
];

const AVANTAGES = [
  { I: PenLine, t: "Une fiche à votre image", d: "Présentation, bannière, logo, langues de travail et lien direct vers votre page carrière." },
  { I: BarChart3, t: "Votre fréquentation, jour par jour", d: "Visites, favoris, clics vers vos offres, cantons d'origine et rang dans votre secteur." },
  { I: BadgeCheck, t: "Le badge « Entreprise vérifiée »", d: "Les candidats savent que la fiche est tenue par vous." },
  { I: Megaphone, t: "Vos campagnes au même endroit", d: "Publicités ciblées par canton, avec leurs statistiques." },
];

const FAQ = [
  { q: "Ma fiche existe déjà : pourquoi payer ?", r: "La fiche reste visible gratuitement. L'abonnement vous donne la main dessus : la mettre à jour, l'enrichir et voir qui s'y intéresse." },
  { q: "Comment vérifiez-vous que je représente l'entreprise ?", r: "Avec une adresse e-mail du domaine officiel de l'entreprise, un code vous est envoyé et la vérification est immédiate. Sinon, notre équipe vérifie la demande à la main, généralement sous 1 jour ouvré." },
  { q: "Puis-je résilier ?", r: "Oui, à tout moment depuis votre espace entreprise. L'accès reste ouvert jusqu'à la fin de la période payée." },
  { q: "Puis-je modifier le nom ou le secteur ?", r: "Ils sont vérifiés par notre équipe pour garder un annuaire fiable. Écrivez-nous à contact@workie.ch." },
  { q: "Les avis ou les salaires sont-ils affichés ?", r: "Non. Workie présente les employeurs et mène vers leurs offres officielles." },
];

const carte: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "22px 22px" };

/** Aperçu dessiné du tableau de bord : une silhouette, pas de faux chiffres. */
function ApercuTableau() {
  const barres = [3, 5, 4, 7, 6, 9, 8, 11, 10, 13, 12, 15];
  return (
    <div aria-hidden="true" style={{ ...carte, padding: 18, boxShadow: "0 24px 60px rgba(0,0,0,0.10)" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["Tableau de bord", "Ma fiche", "Abonnement"].map((o, i) => (
          <span key={o} style={{ fontSize: 11.5, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? "var(--text)" : "var(--text-muted)", paddingBottom: 6, borderBottom: i === 0 ? "2px solid var(--text)" : "2px solid transparent" }}>{o}</span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
        {["Visites", "Favoris", "Clics offres"].map(l => (
          <div key={l} style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px" }}>
            <p style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{l}</p>
            <div style={{ height: 14, width: "60%", background: "var(--border2)", borderRadius: 4, marginTop: 6 }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 90, padding: "0 4px" }}>
        {barres.map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${(h / 15) * 100}%`, borderRadius: 3, background: i === barres.length - 1 ? "var(--brand)" : "color-mix(in srgb, var(--brand) 40%, transparent)" }} />
        ))}
      </div>
    </div>
  );
}

export default function PourLesEntreprises() {
  if (process.env.NEXT_PUBLIC_REVENDICATION_OUVERTE !== "1") notFound();
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <NavbarClient />
      <main>
        <section style={{ padding: "64px 16px 56px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 48, alignItems: "center" }}>
            <div>
              <p className="landing-eyebrow" style={{ textAlign: "left" }}>Pour les entreprises</p>
              <h1 style={{ fontSize: "clamp(30px, 4.6vw, 48px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.08, marginBottom: 16, textWrap: "balance" }}>
                Votre entreprise est déjà sur Workie. Prenez-en les commandes.
              </h1>
              <p style={{ fontSize: 16.5, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 26, maxWidth: 520 }}>
                Des candidats découvrent votre fiche chaque jour. Présentez l&apos;entreprise avec vos mots, menez-les vers votre page carrière et voyez qui s&apos;intéresse à vous.
              </p>
              <RechercheRevendication />
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
                {ABONNEMENT.mensuel.libelle} · résiliable à tout moment
              </p>
            </div>
            <ApercuTableau />
          </div>
        </section>

        <section className="landing-ton" style={{ padding: "64px 16px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 750, letterSpacing: "-0.03em", marginBottom: 24 }}>Trois étapes, quelques minutes</h2>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {ETAPES.map(({ I, t, d }, i) => (
                <li key={t} style={carte}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--encre)", color: "var(--encre-texte)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800 }}>{i + 1}</span>
                    <I size={18} color="var(--brand)" aria-hidden="true" />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{t}</p>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55 }}>{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section style={{ padding: "64px 16px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "start" }}>
            <div>
              <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 750, letterSpacing: "-0.03em", marginBottom: 20 }}>Ce que vous obtenez</h2>
              <div style={{ display: "grid", gap: 12 }}>
                {AVANTAGES.map(({ I, t, d }) => (
                  <div key={t} style={{ ...carte, display: "flex", gap: 14, padding: "16px 18px" }}>
                    <I size={20} color="var(--brand)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15 }}>{t}</p>
                      <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55, marginTop: 3 }}>{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...carte, padding: "28px 26px", position: "sticky", top: 90 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Workie Entreprise</p>
              <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.035em", marginTop: 6 }}>129 CHF <span style={{ fontSize: 16, fontWeight: 500, color: "var(--text-muted)" }}>par mois</span></p>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>ou 1 290 CHF par an, 2 mois offerts</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "20px 0", display: "grid", gap: 10 }}>
                {["Gestion complète de la fiche", "Tableau de bord de fréquentation", "Badge « Entreprise vérifiée »", "Factures et résiliation en libre-service"].map(f => (
                  <li key={f} style={{ display: "flex", gap: 9, fontSize: 14.5 }}><Check size={17} color="var(--brand)" aria-hidden="true" style={{ flexShrink: 0 }} /> {f}</li>
                ))}
              </ul>
              <a href="#trouver" className="btn btn-marque btn-bloc">Trouver ma fiche</a>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 10, textAlign: "center" }}>Paiement sécurisé par Stripe. Sans engagement.</p>
            </div>
          </div>
        </section>

        <section className="landing-ton" style={{ padding: "64px 16px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 750, letterSpacing: "-0.03em", marginBottom: 20 }}>Questions fréquentes</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {FAQ.map(({ q, r }) => (
                <details key={q} style={{ ...carte, padding: "16px 18px" }}>
                  <summary style={{ fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{q}</summary>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginTop: 10 }}>{r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PiedAccueil />
    </div>
  );
}
