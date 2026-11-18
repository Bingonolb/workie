import Link from "next/link";
import { ArrowRight, Gauge, ShieldCheck, Lock } from "lucide-react";
import { CompanyCard } from "@/components/CompanyCard";
import { LandingFaq } from "@/components/LandingFaq";
import { PiedAccueil } from "@/components/PiedAccueil";
import { StylesLanding, NavLanding } from "@/components/StylesLanding";
import { revendicationOuverte } from "@/lib/ouverture";
import type { Company } from "@/lib/types";

/**
 * Accueil compact (essai, derrière NEXT_PUBLIC_ACCUEIL_COMPACT).
 *
 * Retour reçu : l'accueil était trop chargé, une douzaine de blocs avant
 * d'atteindre une seule entreprise. Ici, on arrive directement sur les
 * entreprises ; le reste tient en une section, puis la FAQ ; l'offre aux
 * entreprises descend dans une bande sobre juste au-dessus du pied de page.
 */
export function AccueilCompact({ entreprises, total, secteurs }: { entreprises: Company[]; total: number; secteurs: number }) {
  return (
    <main className="landing-tons" style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      <StylesLanding />
      <style>{`
        .ac-tete { max-width: 1180px; margin: 0 auto; padding: 40px 24px 8px; width: 100%; }
        .ac-grille { max-width: 1180px; margin: 0 auto; padding: 18px 24px 8px; width: 100%;
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
        .ac-suite { max-width: 1180px; margin: 0 auto; padding: 8px 24px 56px; width: 100%; display: flex; justify-content: center; }
        .ac-chiffres { display: flex; gap: 8px 18px; flex-wrap: wrap; font-size: 13.5px; color: var(--text-muted); }
        .ac-chiffres strong { color: var(--text); font-variant-numeric: tabular-nums; }
        .ac-etapes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 28px; }
        .ac-promesses { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; margin-top: 44px; padding-top: 36px; border-top: 1px solid var(--border); }
        .ac-pro { border-top: 1px solid var(--border); background: var(--surface2); }
        .ac-pro-in { max-width: 1180px; margin: 0 auto; padding: 28px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px 28px; flex-wrap: wrap; }
        .ac-pro-liens { display: flex; gap: 10px; flex-wrap: wrap; }
        @media (max-width: 960px) {
          .ac-grille { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ac-etapes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .ac-tete { padding: 24px 16px 4px; }
          .ac-grille { grid-template-columns: 1fr; padding: 14px 16px 4px; gap: 14px; }
          /* Six cartes sur téléphone : assez pour comprendre, sans un défilement sans fin. */
          .ac-grille > :nth-child(n+7) { display: none; }
          .ac-suite { padding: 8px 16px 40px; }
          .ac-etapes, .ac-promesses { grid-template-columns: 1fr; gap: 20px; }
          .ac-pro-in { padding: 22px 16px; }
        }
      `}</style>
      <NavLanding />

      {/* ── Directement les entreprises ── */}
      <section className="ac-tete">
        <h1 style={{ fontSize: "clamp(26px, 3.4vw, 38px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: 10 }}>
          Chercher du travail devient passionnant.
        </h1>
        <p style={{ fontSize: "clamp(15px, 1.3vw, 16.5px)", color: "var(--text-sub)", lineHeight: 1.6, maxWidth: 640, marginBottom: 14 }}>
          Découvrez des entreprises suisses, trouvez celles qui vous correspondent et accédez directement à leurs offres d&apos;emploi.
        </p>
        <p className="ac-chiffres">
          <span><strong>{total.toLocaleString("fr-CH")}</strong> entreprises</span>
          <span><strong>26</strong> cantons</span>
          <span><strong>{secteurs}</strong> secteurs</span>
          <span>Gratuit, sans inscription</span>
        </p>
      </section>

      <section aria-label="Entreprises" className="ac-grille">
        {entreprises.slice(0, 9).map((c, i) => (
          <CompanyCard key={c.id} company={c} isFav={false} isLoggedIn={false} priority={i < 3} loading={i < 3 ? "eager" : "lazy"} />
        ))}
      </section>
      <div className="ac-suite">
        <Link href="/explore" className="btn btn-marque btn-lg">
          Voir toutes les entreprises <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>

      {/* ── Chercher un emploi : l'essentiel, en une section ── */}
      <section className="landing-section landing-ton" style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <p className="landing-eyebrow">Postuler</p>
          <h2 className="landing-h2 avec-chapo">Plus qu&apos;une annonce.</h2>
          <p className="landing-chapo">Chaque offre a une entreprise derrière elle. Rencontrez-la d&apos;abord.</p>
          <div className="ac-etapes">
            {[
              { etape: "Trouvez", titre: "Les entreprises autour de vous", desc: "Par canton, par ville, par secteur. Y compris celles qui recrutent seulement sur leur propre site." },
              { etape: "Découvrez", titre: "L'essentiel sur chacune", desc: "Ce qu'elle fait, où elle se trouve, dans quelle langue on y travaille." },
              { etape: "Sauvegardez", titre: "Vos favoris, au même endroit", desc: "Une flamme, et l'entreprise rejoint vos favoris." },
              { etape: "Postulez", titre: "Directement chez elle", desc: "Tous ses postes ouverts, sur son site." },
            ].map(({ etape, titre, desc }) => (
              <div key={etape}>
                <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 10 }}>{etape}</p>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.02em" }}>{titre}</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div className="ac-promesses">
            {[
              { Icone: Gauge, titre: "Des informations vérifiées", desc: "Le nom, le secteur, le lieu et le lien officiel sont contrôlés avant publication." },
              { Icone: ShieldCheck, titre: "Rien entre vous et l'employeur", desc: "Vous postulez chez lui, directement." },
              { Icone: Lock, titre: "Des faits", desc: "Le métier, le lieu, la langue. Le jugement vous appartient." },
            ].map(({ Icone, titre, desc }) => (
              <div key={titre} style={{ display: "flex", gap: 14 }}>
                <Icone size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 5 }}>{titre}</h3>
                  <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFaq />

      {/* ── Entreprises : une bande sobre, juste avant le pied de page ── */}
      <section className="ac-pro" aria-label="Pour les entreprises">
        <div className="ac-pro-in">
          <div>
            <p style={{ fontSize: 15.5, fontWeight: 750, letterSpacing: "-0.015em" }}>Vous êtes une entreprise ?</p>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 3 }}>Gérez votre fiche ou faites connaître votre marque auprès des candidats.</p>
          </div>
          <div className="ac-pro-liens">
            {revendicationOuverte && <Link href="/pour-les-entreprises" className="btn btn-clair">Gérer votre fiche</Link>}
            <Link href="/annonceurs" className="btn btn-clair">Faire de la publicité</Link>
          </div>
        </div>
      </section>

      <PiedAccueil />
    </main>
  );
}
