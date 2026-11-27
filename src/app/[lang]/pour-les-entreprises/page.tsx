import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Search, MailCheck, LayoutDashboard, BadgeCheck, PenLine, BarChart3, Megaphone } from "lucide-react";
import { StylesLanding } from "@/components/StylesLanding";
import { NavbarClient } from "@/components/NavbarClient";
import { PiedAccueil } from "@/components/PiedAccueil";
import { LandingFaq } from "@/components/LandingFaq";
import { revendicationOuverte, creationOuverte } from "@/lib/ouverture";
import { RechercheRevendication } from "./RechercheRevendication";
import { meta } from "@/i18n/meta";
import { tServeur } from "@/i18n/page";
import type { Traduire } from "@/i18n/traduire";

export const generateMetadata = (): Promise<Metadata> => meta({ titre: "pro.metaTitre", description: "pro.metaDescription", chemin: "/pour-les-entreprises" });

const PHOTO = (id: number, w = 1880) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const ETAPES = (t: Traduire) => [
  { I: Search, t: t("pro.e1t"), d: t("pro.e1d") },
  { I: MailCheck, t: t("pro.e2t"), d: t("pro.e2d") },
  { I: LayoutDashboard, t: t("pro.e3t"), d: t("pro.e3d") },
];

const AVANTAGES = (t: Traduire) => [
  { I: PenLine, t: t("pro.a1t"), d: t("pro.a1d") },
  { I: BarChart3, t: t("pro.a2t"), d: t("pro.a2d") },
  { I: BadgeCheck, t: t("pro.a3t"), d: t("pro.a3d") },
  { I: Megaphone, t: t("pro.a4t"), d: t("pro.a4d") },
];

const FAQ = (t: Traduire) => ([1, 2, 3, 4, 5] as const).map(i => {
  const texte = t(`pro.r${i}`);
  return { q: t(`pro.q${i}`), texte, r: <>{texte}</> };
});

export default async function PourLesEntreprises() {
  if (!revendicationOuverte) notFound();
  const t = await tServeur();
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
        .pe-garanties { list-style: none; padding: 0; margin: 14px 0 0; display: flex; flex-wrap: wrap; gap: 6px 18px; }
        .pe-garanties li { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; color: var(--text-muted); }
        .pe-garanties svg { color: #10b981; flex-shrink: 0; }
        @media (max-width: 860px) { .pe-garanties { margin-bottom: 12px; } }
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
          <p className="landing-eyebrow" style={{ textAlign: "left" }}>{t("pro.eyebrow")}</p>
          <h1 style={{ fontSize: "clamp(32px, 4.8vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 18, textWrap: "balance" }}>
            {t("pro.titre")}
          </h1>
          <p style={{ fontSize: "clamp(16px, 1.6vw, 18px)", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 28, maxWidth: 520 }}>
            {t("pro.intro")}
          </p>
          <RechercheRevendication creation={creationOuverte} />
          {/* Ce qui rassure avant de chercher : le prix et l'absence d'engagement,
              en garanties lisibles plutôt qu'en ligne grise orpheline. */}
          <ul className="pe-garanties" aria-label={t("pro.conditions")}>
            {[t("pro.g1"), t("pro.g2"), t("pro.g3")].map(g => (
              <li key={g}><Check size={14} strokeWidth={2.6} aria-hidden="true" /> {g}</li>
            ))}
          </ul>
        </div>
        <div className="pe-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PHOTO(3184291, 1100)} alt={t("pro.photoAlt")} />
          <div className="pe-carte-flottante" aria-hidden="true">
            {/* Le même rond bleu que sur les fiches, pas la rosette festonnée de l'icône. */}
            <svg viewBox="0 0 22 22" width={26} height={26} style={{ flexShrink: 0 }} aria-hidden="true">
              <circle cx="11" cy="11" r="10.5" fill="#1D9BF0" />
              <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
            </svg>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 800 }}>{t("pro.verifiee")}</p>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{t("pro.verifieeAide")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="landing-section landing-ton" style={{ padding: "88px 24px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <p className="landing-eyebrow">{t("pro.commentEyebrow")}</p>
          <h2 className="landing-h2">{t("pro.commentTitre")}</h2>
          <ol className="pe-trois" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {ETAPES(t).map(({ I, t: titreEtape, d }, i) => (
              <li key={titreEtape} className="landing-parcours-etape">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--encre)", color: "var(--encre-texte)", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800 }}>{i + 1}</span>
                  <I size={19} color="var(--brand)" aria-hidden="true" />
                </div>
                <p style={{ fontWeight: 750, fontSize: 17, marginBottom: 6 }}>{titreEtape}</p>
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
            {t("pro.bande1")}
          </p>
          <p style={{ fontSize: "clamp(14px, 1.5vw, 16.5px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, maxWidth: 640, marginTop: 16 }}>
            {t("pro.bande1Aide")}
          </p>
        </div>
      </section>

      {/* ── Ce que vous obtenez ── */}
      <section className="landing-section" style={{ padding: "88px 24px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <p className="landing-eyebrow">{t("pro.obtenezEyebrow")}</p>
          <h2 className="landing-h2">{t("pro.obtenezTitre")}</h2>
          <div className="landing-quatre">
            {AVANTAGES(t).map(({ I, t: titreAvantage, d }) => (
              <div key={titreAvantage} className="landing-parcours-etape" style={{ padding: "24px 22px" }}>
                <I size={22} color="var(--brand)" aria-hidden="true" />
                <p style={{ fontWeight: 750, fontSize: 16, margin: "14px 0 6px" }}>{titreAvantage}</p>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Le prix ── */}
      <section className="landing-section landing-accent" style={{ padding: "88px 24px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <p className="landing-eyebrow">{t("pro.prixEyebrow")}</p>
          <p style={{ fontSize: "clamp(40px, 6vw, 56px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
            129 CHF <span style={{ fontSize: 18, fontWeight: 500, color: "var(--text-muted)", letterSpacing: 0 }}>{t("pro.parMois")}</span>
          </p>
          <p style={{ fontSize: 15.5, color: "var(--text-muted)", marginTop: 10 }}>{t("pro.ouAn")}</p>
          <ul style={{ listStyle: "none", padding: 0, margin: "28px auto", display: "grid", gap: 10, textAlign: "left", maxWidth: 360 }}>
            {[t("pro.f1"), t("pro.f2"), t("pro.f3"), t("pro.f4")].map(f => (
              <li key={f} style={{ display: "flex", gap: 10, fontSize: 15 }}><Check size={18} color="var(--brand)" aria-hidden="true" style={{ flexShrink: 0 }} /> {f}</li>
            ))}
          </ul>
          {/* Plutôt qu'un bouton qui renvoie en haut de page : la recherche ici même. */}
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{t("pro.commencez")}</p>
          <div style={{ display: "flex", justifyContent: "center", textAlign: "left" }}><RechercheRevendication id="trouver-prix" creation={creationOuverte} /></div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>{t("pro.stripe")}</p>
        </div>
      </section>

      {/* ── Seconde bande ── */}
      <section className="landing-bande landing-bande-pe-2">
        <div className="landing-bande-voile" />
        <div className="landing-bande-texte">
          <p style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.025em", color: "#fff", maxWidth: 700, textWrap: "balance" }}>
            {t("pro.bande2")}
          </p>
          <p style={{ fontSize: "clamp(14px, 1.5vw, 16.5px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, maxWidth: 640, marginTop: 16 }}>
            {t("pro.bande2Aide")}
          </p>
        </div>
      </section>

      {/* ── Questions ── */}
      <LandingFaq items={FAQ(t)} titre={t("pro.faqTitre")} sousTitre={t("pro.faqSousTitre")} />

      <PiedAccueil />
    </main>
  );
}
