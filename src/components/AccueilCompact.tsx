import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ApercuSwipe, type EntrepriseApercu } from "@/components/ApercuSwipe";
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
export function AccueilCompact({ apercu, entreprises, total, secteurs }: {
  apercu: EntrepriseApercu[]; entreprises: Company[]; total: number; secteurs: string[];
}) {
  const vitrine = entreprises.filter(c => c.cover_url).slice(0, 12);
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
        .ae-actions { display: flex; gap: 14px; justify-content: center; align-items: center; flex-wrap: wrap; margin-top: 34px; }
        .ae-lien { font-size: 16px; font-weight: 600; color: var(--brand); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
        .ae-lien:hover { text-decoration: underline; text-underline-offset: 4px; }
        .ae-produit { display: flex; justify-content: center; padding: 56px 24px 0; }
        .ae-produit > * { width: 100%; max-width: 420px; }

        .ae-bloc { padding: 120px 0 0; }
        .ae-tete { max-width: 1180px; margin: 0 auto; padding: 0 24px; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .ae-h2 { font-size: clamp(30px, 4vw, 52px); font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; max-width: 700px; text-wrap: balance; }
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
        .ae-trois h3 { font-size: clamp(22px, 2.2vw, 28px); font-weight: 750; letter-spacing: -0.03em; line-height: 1.15; }
        .ae-trois p { font-size: 16px; color: var(--text-muted); line-height: 1.55; margin-top: 12px; }

        .ae-secteurs { max-width: 1180px; margin: 30px auto 0; padding: 0 24px; display: flex; flex-wrap: wrap; gap: 10px; }
        .ae-secteurs a { display: inline-flex; align-items: center; height: 44px; padding: 0 18px; border-radius: 999px; font-size: 15px; font-weight: 550;
          color: var(--text); text-decoration: none; background: var(--surface); border: 1px solid var(--border); transition: border-color .15s, transform .15s; }
        .ae-secteurs a:hover { border-color: var(--text); transform: translateY(-1px); }

        .ae-pro { margin-top: 120px; border-top: 1px solid var(--border); }
        .ae-pro-in { max-width: 1180px; margin: 0 auto; padding: 36px 24px; display: flex; align-items: center; justify-content: space-between; gap: 14px 32px; flex-wrap: wrap; }

        @media (max-width: 760px) {
          .ae-hero { padding: 48px 20px 0; }
          .ae-produit { padding: 40px 16px 0; }
          .ae-bloc { padding-top: 84px; }
          .ae-tete { padding: 0 20px; }
          .ae-rail { --marge: 20px; padding: 24px 20px 8px; gap: 12px; }
          .ae-carte { width: 72vw; border-radius: 18px; }
          .ae-trois { grid-template-columns: 1fr; gap: 36px; padding: 0 20px; }
          .ae-secteurs { padding: 0 20px; gap: 8px; }
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
        <div className="ae-actions">
          <Link href="/explore" className="btn btn-marque btn-lg">Découvrir les entreprises</Link>
          <Link href="/explore?view=swipe" className="ae-lien">Essayer le swipe <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>
      <div className="ae-produit">
        <ApercuSwipe entreprises={apercu} total={total} />
      </div>

      {/* 2 ── La vitrine */}
      {vitrine.length > 0 && (
        <section className="ae-bloc" aria-labelledby="ae-vitrine">
          <div className="ae-tete">
            <h2 id="ae-vitrine" className="ae-h2">{total.toLocaleString("fr-CH")} employeurs. Rencontrez-les d&apos;abord.</h2>
            <Link href="/explore" className="ae-lien">Tout voir <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className="ae-rail">
            {vitrine.map((c, i) => (
              <Link key={c.id} href={urlFiche(c)} className="ae-carte" aria-label={`${c.name}, ${c.city}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={largeurCouverture(c.cover_url!, 480)} srcSet={`${largeurCouverture(c.cover_url!, 480)} 480w, ${largeurCouverture(c.cover_url!, 940)} 940w`}
                  sizes="(max-width: 760px) 72vw, 330px" alt="" loading={i < 4 ? "eager" : "lazy"} decoding="async" />
                <span className="ae-carte-txt">
                  <span className="ae-carte-sect" style={{ display: "block" }}>{c.subsector || c.sector}</span>
                  <span className="ae-carte-nom" style={{ display: "block" }}>{c.name}</span>
                  <span className="ae-carte-lieu" style={{ display: "block" }}>{c.city}</span>
                </span>
              </Link>
            ))}
          </div>
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
