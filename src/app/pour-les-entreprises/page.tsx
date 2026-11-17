import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Search, MailCheck, LayoutDashboard, BadgeCheck, PenLine, BarChart3, Megaphone } from "lucide-react";
import { StylesLanding } from "@/components/StylesLanding";
import { NavbarClient } from "@/components/NavbarClient";
import { PiedAccueil } from "@/components/PiedAccueil";
import { LandingFaq } from "@/components/LandingFaq";
import { revendicationOuverte } from "@/lib/ouverture";
import { RechercheRevendication } from "./RechercheRevendication";

export const metadata: Metadata = {
  title: "Pour les entreprises : gérez votre fiche employeur",
  description: "Votre entreprise est déjà sur Workie. Prenez la main sur sa fiche, présentez-la avec vos mots et voyez qui s'y intéresse. 129 CHF par mois, sans engagement.",
  alternates: { canonical: "https://www.workie.ch/pour-les-entreprises" },
};

const PHOTO = (id: number, w = 1880) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const ETAPES = [
  { I: Search, t: "Trouvez votre fiche", d: "Tapez le nom de votre entreprise. Elle est sans doute déjà là." },
  { I: MailCheck, t: "Confirmez que c'est vous", d: "Avec votre adresse e-mail professionnelle, c'est immédiat. Sinon, notre équipe s'en charge en un jour ouvré." },
  { I: LayoutDashboard, t: "Prenez la main", d: "Votre espace s'ouvre dès l'abonnement activé. Vous pouvez tout modifier tout de suite." },
];

const AVANTAGES = [
  { I: PenLine, t: "Une fiche qui vous ressemble", d: "Votre texte, votre bannière, votre logo, vos langues de travail et un lien direct vers votre page carrière." },
  { I: BarChart3, t: "Voir qui s'intéresse à vous", d: "Visites jour après jour, favoris, clics vers vos offres et cantons d'où viennent les candidats." },
  { I: BadgeCheck, t: "Le badge Entreprise vérifiée", d: "Les candidats savent que la fiche est tenue par vous, et pas par un tiers." },
  { I: Megaphone, t: "Vos campagnes au même endroit", d: "Une publicité ciblée par canton, quand vous recrutez, avec ses résultats." },
];

const FAQ = [
  { q: "Ma fiche existe déjà : pourquoi m'abonner ?", texte: "La fiche reste visible gratuitement. L'abonnement vous la confie : vous la tenez à jour, vous l'enrichissez et vous voyez qui la consulte.", r: <>La fiche reste visible gratuitement. L&apos;abonnement vous la confie : vous la tenez à jour, vous l&apos;enrichissez et vous voyez qui la consulte.</> },
  { q: "Comment savez-vous que je représente l'entreprise ?", texte: "Avec une adresse e-mail de l'entreprise, nous vous envoyons un code et c'est réglé. Sinon, notre équipe vérifie votre demande à la main, en général dans la journée.", r: <>Avec une adresse e-mail de l&apos;entreprise, nous vous envoyons un code et c&apos;est réglé. Sinon, notre équipe vérifie votre demande à la main, en général dans la journée.</> },
  { q: "Puis-je arrêter quand je veux ?", texte: "Oui, en deux clics depuis votre espace. Vous gardez l'accès jusqu'à la fin de la période déjà payée.", r: <>Oui, en deux clics depuis votre espace. Vous gardez l&apos;accès jusqu&apos;à la fin de la période déjà payée.</> },
  { q: "Puis-je changer le nom ou le secteur ?", texte: "Ces deux informations sont vérifiées par notre équipe, pour que l'annuaire reste fiable. Écrivez-nous à contact@workie.ch.", r: <>Ces deux informations sont vérifiées par notre équipe, pour que l&apos;annuaire reste fiable. Écrivez-nous à contact@workie.ch.</> },
  { q: "Y a-t-il des avis ou des salaires sur ma fiche ?", texte: "Non. Workie présente les employeurs et renvoie vers leurs offres officielles. Rien d'autre.", r: <>Non. Workie présente les employeurs et renvoie vers leurs offres officielles. Rien d&apos;autre.</> },
];

export default function PourLesEntreprises() {
  if (!revendicationOuverte) notFound();
  return (
    <main className="landing-tons" style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      <StylesLanding />
      <style>{`
        .pe-photo { position: relative; border-radius: 22px; overflow: hidden; aspect-ratio: 4 / 3.4; box-shadow: 0 24px 60px rgba(0,0,0,0.16); }
        .pe-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pe-carte-flottante {
          position: absolute; left: 18px; right: 18px; bottom: 18px;
          background: var(--surface); border: 1px solid var(--border2); border-radius: 16px;
          padding: 14px 16px; display: flex; align-items: center; gap: 12px;
          box-shadow: 0 12px 34px rgba(0,0,0,0.18);
        }
        .pe-trois { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        @media (max-width: 860px) { .pe-trois { grid-template-columns: 1fr; } }
        .landing-bande-pe-1 { background-image: url("${PHOTO(3184465)}"); background-position: center 40%; }
        .landing-bande-pe-2 { background-image: url("${PHOTO(1181406)}"); background-position: center 50%; min-height: 340px; }
      `}</style>
      {/* La barre du site : elle sait si la personne est connectée. */}
      <NavbarClient />

      {/* ── En-tête : le message, la recherche, une vraie photo ── */}
      <section className="landing-hero-deux-col">
        <div>
          <p className="landing-eyebrow" style={{ textAlign: "left" }}>Pour les entreprises</p>
          <h1 style={{ fontSize: "clamp(32px, 4.8vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 18, textWrap: "balance" }}>
            Votre entreprise est déjà sur Workie.
          </h1>
          <p style={{ fontSize: "clamp(16px, 1.6vw, 18px)", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 28, maxWidth: 520 }}>
            Des candidats ouvrent votre fiche avant de postuler chez vous. Prenez la main dessus : racontez qui vous êtes, envoyez-les vers vos offres et voyez qui s&apos;intéresse à vous.
          </p>
          <RechercheRevendication />
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>129 CHF par mois · sans engagement</p>
        </div>
        <div className="pe-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PHOTO(3184291, 1100)} alt="Une équipe autour d'une table de réunion" />
          <div className="pe-carte-flottante" aria-hidden="true">
            <BadgeCheck size={26} color="#1D9BF0" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 800 }}>Entreprise vérifiée</p>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>La fiche est tenue par l&apos;entreprise elle-même.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="landing-section landing-ton" style={{ padding: "88px 24px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <p className="landing-eyebrow">Comment ça marche</p>
          <h2 className="landing-h2">Trois étapes, quelques minutes.</h2>
          <ol className="pe-trois" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {ETAPES.map(({ I, t, d }, i) => (
              <li key={t} className="landing-parcours-etape">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--encre)", color: "var(--encre-texte)", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800 }}>{i + 1}</span>
                  <I size={19} color="var(--brand)" aria-hidden="true" />
                </div>
                <p style={{ fontWeight: 750, fontSize: 17, marginBottom: 6 }}>{t}</p>
                <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Bande photographique ── */}
      <section className="landing-bande landing-bande-pe-1">
        <div className="landing-bande-voile" />
        <div className="landing-bande-texte">
          <p style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.025em", color: "#fff", maxWidth: 720, textWrap: "balance" }}>
            Avant de postuler, on se renseigne.
          </p>
          <p style={{ fontSize: "clamp(14px, 1.5vw, 16.5px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, maxWidth: 640, marginTop: 16 }}>
            Ce que vous écrivez sur votre fiche est souvent la première chose qu&apos;un candidat lit de vous. Autant que ce soit vous qui l&apos;écriviez.
          </p>
        </div>
      </section>

      {/* ── Ce que vous obtenez ── */}
      <section className="landing-section" style={{ padding: "88px 24px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <p className="landing-eyebrow">Ce que vous obtenez</p>
          <h2 className="landing-h2">Votre fiche, entre vos mains.</h2>
          <div className="landing-quatre">
            {AVANTAGES.map(({ I, t, d }) => (
              <div key={t} className="landing-parcours-etape" style={{ padding: "24px 22px" }}>
                <I size={22} color="var(--brand)" aria-hidden="true" />
                <p style={{ fontWeight: 750, fontSize: 16, margin: "14px 0 6px" }}>{t}</p>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Le prix ── */}
      <section className="landing-section landing-accent" style={{ padding: "88px 24px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <p className="landing-eyebrow">Un seul abonnement</p>
          <p style={{ fontSize: "clamp(40px, 6vw, 56px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
            129 CHF <span style={{ fontSize: 18, fontWeight: 500, color: "var(--text-muted)", letterSpacing: 0 }}>par mois</span>
          </p>
          <p style={{ fontSize: 15.5, color: "var(--text-muted)", marginTop: 10 }}>ou 1 290 CHF par an, soit 2 mois offerts</p>
          <ul style={{ listStyle: "none", padding: 0, margin: "28px auto", display: "grid", gap: 10, textAlign: "left", maxWidth: 360 }}>
            {["Votre fiche, modifiable à tout moment", "Le tableau de bord de vos visites", "Le badge Entreprise vérifiée", "Factures et résiliation en libre-service"].map(f => (
              <li key={f} style={{ display: "flex", gap: 10, fontSize: 15 }}><Check size={18} color="var(--brand)" aria-hidden="true" style={{ flexShrink: 0 }} /> {f}</li>
            ))}
          </ul>
          {/* Plutôt qu'un bouton qui renvoie en haut de page : la recherche ici même. */}
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Commencez par retrouver votre entreprise</p>
          <div style={{ display: "flex", justifyContent: "center", textAlign: "left" }}><RechercheRevendication id="trouver-prix" /></div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>Paiement sécurisé par Stripe. Sans engagement.</p>
        </div>
      </section>

      {/* ── Seconde bande ── */}
      <section className="landing-bande landing-bande-pe-2">
        <div className="landing-bande-voile" />
        <div className="landing-bande-texte">
          <p style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.025em", color: "#fff", maxWidth: 700, textWrap: "balance" }}>
            Des grands groupes aux équipes de 3 personnes.
          </p>
          <p style={{ fontSize: "clamp(14px, 1.5vw, 16.5px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, maxWidth: 640, marginTop: 16 }}>
            Le même outil, le même prix. Ce qui compte, c&apos;est ce que vous avez à raconter.
          </p>
        </div>
      </section>

      {/* ── Questions ── */}
      <LandingFaq items={FAQ} titre="Vos questions" sousTitre="Ce qu'on nous demande le plus souvent avant de s'abonner." />

      <PiedAccueil />
    </main>
  );
}
