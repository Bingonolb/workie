import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RailVitrine } from "@/components/RailVitrine";
import { LandingFaq } from "@/components/LandingFaq";
import { PiedAccueil } from "@/components/PiedAccueil";
import { StylesLanding, NavLanding } from "@/components/StylesLanding";
import { largeurCouverture } from "@/lib/coverUrl";
import { urlFiche } from "@/lib/urlFiche";
import { revendicationOuverte } from "@/lib/ouverture";
import type { Company } from "@/lib/types";

/**
 * Accueil épuré (essai, derrière NEXT_PUBLIC_ACCUEIL_COMPACT).
 *
 * Une idée par écran, beaucoup d'air, et le produit montré plutôt que décrit :
 *   1. un titre, une phrase, un bouton, et la pile qu'on fait glisser ;
 *   2. une vitrine d'entreprises en grandes photos, qui défile à l'horizontale ;
 *   3. trois phrases, rien d'autre ;
 *   4. les secteurs, en un geste ;
 *   5. la FAQ, puis les entreprises, discrètement, au-dessus du pied de page.
 */
export function AccueilCompact({ entreprises, total, secteurs }: {
  entreprises: Company[]; total: number; secteurs: string[];
}) {
  const vitrine = entreprises.filter(c => c.cover_url).slice(0, 20);
  return (
    <main className="landing-tons ae" style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      <StylesLanding />
      <style>{`
        .ae { overflow-x: clip; }
        .ae-hero { text-align: center; padding: 88px 24px 0; }
        .ae-titre { font-size: clamp(40px, 6.4vw, 84px); font-weight: 800; letter-spacing: -0.045em; line-height: 1.02;
          max-width: 980px; margin: 0 auto; text-wrap: balance; }
        .ae-titre em { font-style: normal; color: var(--brand); }
        .ae-sous { font-size: clamp(17px, 1.7vw, 21px); color: var(--text-sub); line-height: 1.5; max-width: 600px; margin: 22px auto 0; text-wrap: balance; }
        /* Deux boutons de même largeur, centrés comme un seul bloc. */
        .ae-actions { display: grid; grid-template-columns: repeat(2, 240px); gap: 12px; justify-content: center; margin: 36px auto 0; }
        .ae-bouton { width: 100%; justify-content: center; margin: 0; }
        .ae-lien { font-size: 16px; font-weight: 600; color: var(--brand); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
        .ae-lien:hover { text-decoration: underline; text-underline-offset: 4px; }

        .ae-bloc { padding: 120px 0 0; }
        .ae-tete { max-width: 1180px; margin: 0 auto; padding: 0 24px; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        /* Les titres de section restent nettement sous le titre d'accueil :
           une seule voix forte par page, les autres l'accompagnent. */
        .ae-h2 { font-size: clamp(26px, 2.9vw, 40px); font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; max-width: 640px; text-wrap: balance; }
        /* La marge latérale aligne la première carte sur le titre ; scroll-padding
           la fait respecter par l'aimantation, qui sinon colle la carte au bord. */
        .ae-rail { --marge: max(24px, calc((100vw - 1180px) / 2 + 24px));
          display: flex; gap: 18px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;
          padding: 34px var(--marge) 8px; scroll-padding-inline: var(--marge); -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain; }
        .ae-rail::-webkit-scrollbar { display: none; }
        .ae-carte { position: relative; flex: 0 0 auto; width: clamp(240px, 26vw, 330px); aspect-ratio: 3 / 4; border-radius: 22px; overflow: hidden;
          scroll-snap-align: start; background: var(--surface2); text-decoration: none; color: #fff; isolation: isolate; }
        .ae-carte img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s cubic-bezier(.2,.7,.2,1); z-index: -2; }
        .ae-carte::after { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.15) 45%, rgba(0,0,0,0) 70%); }
        .ae-carte:hover img { transform: scale(1.04); }
        .ae-carte-txt { position: absolute; left: 20px; right: 20px; bottom: 20px; }
        .ae-carte-sect { font-size: 12px; font-weight: 600; letter-spacing: .02em; opacity: .8; }
        .ae-carte-nom { font-size: 22px; font-weight: 750; letter-spacing: -0.02em; line-height: 1.15; margin-top: 4px; }
        .ae-carte-lieu { font-size: 13px; opacity: .75; margin-top: 4px; }

        .ae-trois { max-width: 1180px; margin: 0 auto; padding: 0 24px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 48px; }
        .ae-trois h3 { font-size: clamp(19px, 1.8vw, 23px); font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; }
        .ae-trois p { font-size: 16px; color: var(--text-muted); line-height: 1.55; margin-top: 12px; }

        .ae-secteurs { max-width: 1180px; margin: 30px auto 0; padding: 0 24px; display: flex; flex-wrap: wrap; gap: 10px; }
        .ae-secteurs a { display: inline-flex; align-items: center; height: 44px; padding: 0 18px; border-radius: 999px; font-size: 15px; font-weight: 550;
          color: var(--text); text-decoration: none; background: var(--surface); border: 1px solid var(--border); transition: border-color .15s, transform .15s; }
        .ae-secteurs a:hover { border-color: var(--text); transform: translateY(-1px); }

        .ae-pro { margin-top: 120px; border-top: 1px solid var(--border); }
        .ae-pro-in { max-width: 1180px; margin: 0 auto; padding: 36px 24px; display: flex; align-items: center; justify-content: space-between; gap: 14px 32px; flex-wrap: wrap; }

        @media (max-width: 760px) {
          .ae-hero { padding: 48px 20px 0; }
          .ae-actions { grid-template-columns: minmax(0, 340px); }
          .ae-bloc { padding-top: 84px; }
          .ae-tete { padding: 0 20px; }
          .ae-h2 { font-size: 26px; }
          .ae-rail { --marge: 20px; padding: 24px 20px 8px; gap: 12px; }
          .ae-carte { width: 72vw; border-radius: 18px; }
          .ae-trois { grid-template-columns: 1fr; gap: 36px; padding: 0 20px; }
          /* Trois rangées qui défilent à l'horizontale : les 23 secteurs empilés
             occupaient une page et demie sur un petit téléphone. */
          .ae-secteurs { display: grid; grid-auto-flow: column; grid-template-rows: repeat(3, auto); grid-auto-columns: max-content;
            gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 0 20px 4px; margin-top: 24px; overscroll-behavior-x: contain; }
          .ae-secteurs::-webkit-scrollbar { display: none; }
          .ae-secteurs a { height: 42px; font-size: 14.5px; }
          .ae-pro { margin-top: 84px; }
          .ae-pro-in { padding: 28px 20px; }
        }
        @media (prefers-reduced-motion: reduce) { .ae-carte img, .ae-secteurs a { transition: none; } }
      `}</style>
      <NavLanding />

      {/* 1 ── Le titre, et le produit */}
      <section className="ae-hero">
        <h1 className="ae-titre">Chercher du travail devient <em>passionnant.</em></h1>
        <p className="ae-sous">Les employeurs suisses, en un regard. Et le chemin le plus court vers leurs offres.</p>
        {/* Deux portes d'entrée, côte à côte et de même poids visuel : la
            grille ou le swipe. La pile de démonstration a été retirée, elle
            redisait ce que le second bouton propose. */}
        <div className="ae-actions">
          <Link href="/explore" className="btn btn-marque btn-lg ae-bouton">Découvrir les entreprises</Link>
          <Link href="/explore?view=swipe" className="btn btn-clair btn-lg ae-bouton">Essayer le swipe</Link>
        </div>
      </section>

      {/* 2 ── La vitrine */}
      {vitrine.length > 0 && (
        <section className="ae-bloc" aria-labelledby="ae-vitrine">
          <div className="ae-tete">
            <h2 id="ae-vitrine" className="ae-h2">{total.toLocaleString("fr-CH")} employeurs. Rencontrez&#8209;les d&apos;abord.</h2>
            <Link href="/explore" className="ae-lien">Tout voir <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <RailVitrine>
            {vitrine.map((c, i) => (
              <Link key={c.id} href={urlFiche(c)} className="ae-carte" aria-label={`${c.name}, ${c.city}`}>
                {/* Les photos sont en paysage (16:9), la carte en portrait (3:4) :
                    pour la remplir sans flou, l'image doit être environ 2,4 fois
                    plus large que la carte. D'où « sizes » bien au-delà de la
                    largeur affichée. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={largeurCouverture(c.cover_url!, 940)}
                  srcSet={[640, 940, 1280, 1920].map(w => `${largeurCouverture(c.cover_url!, w)} ${w}w`).join(", ")}
                  sizes="(max-width: 760px) 171vw, 790px" alt="" loading={i < 3 ? "eager" : "lazy"} decoding="async" fetchPriority={i === 0 ? "high" : "auto"} />
                <span className="ae-carte-txt">
                  <span className="ae-carte-sect" style={{ display: "block" }}>{c.subsector || c.sector}</span>
                  <span className="ae-carte-nom" style={{ display: "block" }}>{c.name}</span>
                  <span className="ae-carte-lieu" style={{ display: "block" }}>{c.city}</span>
                </span>
              </Link>
            ))}
          </RailVitrine>
        </section>
      )}

      {/* 3 ── Trois phrases */}
      <section className="ae-bloc" aria-label="Ce qui change">
        <div className="ae-trois">
          <div>
            <h3>Des entreprises, pas des annonces.</h3>
            <p>Chacune apparaît une fois : ce qu&apos;elle fait, où, dans quelle langue on y travaille.</p>
          </div>
          <div>
            <h3>Rien entre vous et l&apos;employeur.</h3>
            <p>Vous postulez chez lui, sur son site. Tous ses postes ouverts, à la source.</p>
          </div>
          <div>
            <h3>Des faits, vérifiés.</h3>
            <p>Chaque fiche est relue à la main. Le jugement vous appartient.</p>
          </div>
        </div>
      </section>

      {/* 4 ── Les secteurs */}
      <section className="ae-bloc" aria-labelledby="ae-secteurs">
        <div className="ae-tete"><h2 id="ae-secteurs" className="ae-h2">Commencez par votre métier.</h2></div>
        <nav className="ae-secteurs" aria-label="Secteurs">
          {secteurs.map(s => <Link key={s} href={`/explore?sector=${encodeURIComponent(s)}`}>{s}</Link>)}
        </nav>
      </section>

      <div style={{ height: 120 }} aria-hidden="true" />
      <LandingFaq />

      {/* 5 ── Les entreprises, discrètement */}
      <section className="ae-pro" style={{ marginTop: 0 }} aria-label="Pour les entreprises">
        <div className="ae-pro-in">
          <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text)", fontWeight: 650 }}>Vous recrutez ?</strong> Présentez votre entreprise et suivez qui s&apos;y intéresse.
          </p>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            {revendicationOuverte && <Link href="/pour-les-entreprises" className="ae-lien">Gérer votre fiche <ArrowRight size={15} aria-hidden="true" /></Link>}
            <Link href="/annonceurs" className="ae-lien">Faire de la publicité <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <PiedAccueil />
    </main>
  );
}