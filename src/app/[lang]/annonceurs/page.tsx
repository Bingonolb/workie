import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Target, CreditCard, ShieldCheck, BarChart3 } from "lucide-react";
import { NavbarClient } from "@/components/NavbarClient";
import { PiedAccueil } from "@/components/PiedAccueil";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApercuSwipe } from "@/components/ApercuSwipe";
import { getApercuEntreprises, localiserApercu } from "@/lib/apercuAccueil";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";
import { melangerAvecAnnonces } from "@/lib/annoncesExemple";
import { CANTON_WEIGHTS, SECTOR_WEIGHTS, DUREE_MIN, DUREE_MAX } from "@/lib/ads/pricing";
import { meta } from "@/i18n/meta";
import { tServeur, langueDeLaPage } from "@/i18n/page";
import { LOCALE_INTL } from "@/i18n/config";

export const revalidate = 300;

// Le catalogue dit l'etendue du terrain, pas la frequentation. Les deux se
// confondent vite, et un annonceur qui croit lire une audience decouvre
// l'ecart sur son tableau de bord.
const compterEmployeurs = unstable_cache(
  async () => {
    const { count } = await createAdminClient()
      .from("companies")
      .select("*", { count: "exact", head: true })
      .in("sector", await getSecteursEnLigne());
    return count ?? 0;
  },
  ["annonceurs-employeurs-v2"],
  { revalidate: 300, tags: ["landing-counts"] }
);


export async function generateMetadata(): Promise<Metadata> {
  return meta({ titre: "annonceurs.metaTitre", description: "annonceurs.metaDescription", chemin: "/annonceurs", vars: { min: DUREE_MIN, max: DUREE_MAX } });
}

/*
 * La page des annonceurs.
 *
 * Tous les chiffres viennent du module de tarification, jamais recopiés : un
 * prix affiché en dur diverge de celui qui est facturé le jour où le module
 * change, et c'est le genre d'écart qu'un annonceur découvre sur sa facture.
 *
 * Le parcours décrit est celui du code : une campagne payée part aussitôt
 * (le paiement Stripe la passe en « active »), après le filtre automatique
 * appliqué à la création.
 */
export default async function AnnonceursPage() {
  const [employeurs, demo, t, langue] = await Promise.all([compterEmployeurs(), getApercuEntreprises(), tServeur(), langueDeLaPage()]);
  const chiffres = [
    { valeur: employeurs.toLocaleString(LOCALE_INTL[langue]), libelle: t("annonceurs.employeurs") },
    { valeur: String(Object.keys(CANTON_WEIGHTS).length), libelle: t("annonceurs.cantons") },
    { valeur: String(Object.keys(SECTOR_WEIGHTS).length), libelle: t("annonceurs.secteurs") },
  ];

  return (
    <div className="page-root">
      {/* Les styles voyagent avec la page, comme sur l'accueil : le paquet CSS
          reste parfois figé d'un déploiement à l'autre alors que le HTML se met
          à jour, et la page arrive alors sans ses règles. */}
      <style>{`
        .ann-section { padding: 64px 24px; }
        .ann-large { max-width: 940px; margin: 0 auto; }
        .ann-eyebrow {
          font-size: 11.5px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--text-muted); margin-bottom: 14px;
        }
        .ann-h2 {
          font-size: clamp(23px, 3.4vw, 32px); font-weight: 750;
          letter-spacing: -0.032em; margin-bottom: 14px;
        }
        .ann-chapo {
          font-size: 15.5px; color: var(--text-muted);
          line-height: 1.65; max-width: 560px; margin-bottom: 40px;
        }
        .ann-tons {
          --ton: #1e2129; --ton-carte: #2a2e3a;
          --ton-accent: #1a1338; --ton-accent-bord: rgba(139,92,246,0.22);
        }
        html.light .ann-tons {
          --ton: #e5e9f0; --ton-carte: #ffffff;
          --ton-accent: #ebe6fb; --ton-accent-bord: rgba(91,63,214,0.16);
        }
        .ann-ton {
          background: var(--ton);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .ann-ton .ann-carte { background: var(--ton-carte); }
        .ann-accent {
          background: var(--ton-accent);
          border-top: 1px solid var(--ton-accent-bord);
          border-bottom: 1px solid var(--ton-accent-bord);
        }
        .ann-carte {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 26px 24px;
        }
        /* Les chiffres courent sur toute la largeur du contenu, cales sur les
           cartes qui les suivent. Le filet precedent s'arretait a 520 px, au
           tiers de la page, et pendait dans le vide. */
        .ann-chiffres {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0;
          padding: 30px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          margin-bottom: 48px;
        }
        @media (max-width: 620px) {
          /* Sur telephone, trois colonnes rendraient les libelles illisibles :
             « employeurs references » tiendrait sur quatre lignes. */
          .ann-chiffres { grid-template-columns: 1fr; gap: 22px; }
          .ann-chiffres > * { padding-left: 0 !important; border-left: none !important; }
        }

        .ann-ouverture {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 56px;
          align-items: center;
        }
        @media (max-width: 860px) {
          /* L'image passe sous le bouton : sur une colonne, la poser avant le
             titre repousserait la promesse sous la ligne de flottaison. */
          .ann-ouverture { grid-template-columns: 1fr; gap: 32px; }
        }

        .ann-exemple {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 40px;
          align-items: start;
        }
        @media (max-width: 780px) {
          .ann-exemple { grid-template-columns: 1fr; gap: 28px; }
        }
        .ann-grille { display: grid; gap: 20px; align-items: stretch; }
        .ann-deux { grid-template-columns: repeat(2, 1fr); }
        .ann-quatre { grid-template-columns: repeat(4, 1fr); }
        /* Trois cartes, et non quatre : la section d'audience en compte trois.
           Elle imposait ses colonnes en style en ligne, ce qu'aucune règle de
           média ne peut dépasser. Mesuré à 375 px : trois colonnes de 130 px
           qui débordaient de soixante-six pixels à droite. */
        .ann-trois { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 860px) {
          .ann-deux, .ann-trois, .ann-quatre { grid-template-columns: 1fr; }
          .ann-section { padding: 56px 24px; }
        }
        /* Silhouettes des deux emplacements : un trait plein marque l'annonce,
           les traits creux le contenu autour. Une forme se comprend d'un coup
           d'œil là où une description demande à être lue. */
        .ann-apercu {
          flex-shrink: 0; width: 52px; display: grid; gap: 3px; padding: 5px;
          border: 1px solid var(--border2); border-radius: 7px; background: var(--surface2);
        }
        .ann-apercu span { border-radius: 2px; background: var(--surface3); display: block; }
        .ann-carre { grid-template-columns: 1fr 1fr; grid-template-rows: 17px 17px; }
        .ann-carre span:nth-child(1) { background: var(--brand); }
        .ann-plein { grid-template-rows: 9px 23px 6px; }
        .ann-plein span:nth-child(2) { background: var(--brand); }
      `}</style>

      <NavbarClient />

      <main className="ann-tons" style={{ background: "var(--bg)", color: "var(--text)" }}>

        {/* ── Ouverture ──
            La page s'ouvrait sur une photographie de réunion : de quoi
            remplir la colonne de droite, rien qui montre ce qu'on achète. La
            pile est à sa place ici, parce qu'un annonceur veut d'abord voir à
            quoi ressemble son annonce une fois posée. */}
        <section className="ann-section">
          <div className="ann-large ann-ouverture">
            <div>
              <p className="ann-eyebrow">{t("annonceurs.eyebrow")}</p>
              <h1 style={{ fontSize: "clamp(30px, 4.4vw, 46px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.035em", marginBottom: 18, maxWidth: 580 }}>
                {t("annonceurs.titre")}
              </h1>
              <p style={{ fontSize: 16.5, color: "var(--text-sub)", lineHeight: 1.6, maxWidth: 480, marginBottom: 26 }}>
                {t("annonceurs.intro")}
              </p>
              <Link href="/profile/ads/new" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "13px 26px", borderRadius: 10, background: "var(--brand)", color: "#fff", fontWeight: 650, fontSize: 15.5, textDecoration: "none" }}>
                {t("annonceurs.creer")} <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>

            <div style={{ maxWidth: 380, width: "100%", justifySelf: "end" }}>
              <ApercuSwipe
                entreprises={melangerAvecAnnonces(await localiserApercu(demo, langue), langue)}
                fin={{ titre: t("annonceurs.finPile"), libelle: t("annonceurs.creer"), href: "/profile/ads/new" }}
              />
            </div>
          </div>
        </section>

        {/* ── Ce que vaut cette audience ──
            La page commencait par les formats et le tarif : de quoi acheter,
            rien pour donner envie. C'est la nature du site qui fait l'argument,
            et elle passe donc avant le mecanisme. */}
        <section className="ann-section ann-ton">
          <div className="ann-large">
            <p className="ann-eyebrow">{t("annonceurs.terrainEyebrow")}</p>
            <h2 className="ann-h2">{t("annonceurs.terrainTitre")}</h2>

            {/* Les cantons et les secteurs sont comptes dans le module de
                tarification : ces nombres sont exactement ceux que le
                formulaire de ciblage propose.

                Les trois cartes qui suivaient ont ete retirees : elles
                redisaient l'ouverture avec d'autres mots, et une page qui
                repete une idee trois fois donne l'impression de n'en avoir
                qu'une. */}
            <div className="ann-chiffres" style={{ marginBottom: 0 }}>
              {chiffres.map(({ valeur, libelle }, i) => (
                <div key={libelle} style={{ paddingLeft: i === 0 ? 0 : 28, borderLeft: i === 0 ? "none" : "1px solid var(--border)" }}>
                  <p style={{ fontSize: "clamp(26px, 3.6vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{valeur}</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 9, lineHeight: 1.4 }}>{libelle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Les deux emplacements ── */}
        <section className="ann-section">
          <div className="ann-large">
            <p className="ann-eyebrow">{t("annonceurs.emplEyebrow")}</p>
            <h2 className="ann-h2">{t("annonceurs.emplTitre")}</h2>
            <p className="ann-chapo">
              {/* La phrase racontait pourquoi nous avions aligne les deux
                  tarifs. C'est notre histoire interne, pas celle de
                  l'annonceur, qui veut savoir ce qu'il choisit. */}
              {t("annonceurs.emplChapo")}
            </p>
            <div className="ann-grille ann-deux">
              {[
                { label: t("annonceurs.carre"), ou: t("annonceurs.carreOu"), forme: "carre" },
                { label: t("annonceurs.plein"), ou: t("annonceurs.pleinOu"), forme: "plein" },
              ].map(({ label, ou, forme }) => (
                <div key={label} className="ann-carte" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div className={`ann-apercu ann-${forme}`} aria-hidden="true">
                    <span /><span /><span />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 6 }}>{label}</h3>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{ou}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Un exemple ──
            Les silhouettes disent ou l'annonce se pose, pas de quoi elle a
            l'air. Le rendu ci-dessous reprend exactement le format servi dans
            la grille : meme rayon, meme bordure, meme pastille, meme
            proportion d'image.

            Aucune ecole n'est nommee. Une marque inventee finit toujours par
            ressembler a une vraie, et une vraie ne nous a rien demande. */}
        {/* Une section « Ce qui fonctionne ici » disait aux annonceurs comment
            rediger leur annonce. Ce n'est pas notre place : ils connaissent
            leur metier, et la pile du haut montre deja le resultat. */}
        <section className="ann-section" style={{ paddingTop: 0 }}>
          <div className="ann-large">
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", opacity: 0.75 }}>
              {t("annonceurs.fictives")}
            </p>
          </div>
        </section>

        {/* ── Le tarif ── */}
        <section className="ann-section ann-ton">
          <div className="ann-large">
            <p className="ann-eyebrow">{t("annonceurs.tarifEyebrow")}</p>
            <h2 className="ann-h2">{t("annonceurs.tarifTitre")}</h2>

            {/* Aucun montant sur cette page.
                Un prix posé ici ancre le lecteur sur le plus petit chiffre
                possible, sept jours sur le plus petit canton, qui n'est pas ce
                qu'il achètera. Il invite à l'objection avant qu'on ait expliqué
                ce qu'on vend, et il se périme à chaque changement de tarif : le
                précédent annonçait vingt et un francs pour un minimum réel de
                septante-sept. Le prix a un seul bon endroit, le formulaire, où
                il découle des choix faits. */}
            <p style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 580, marginBottom: 34 }}>
              {t("annonceurs.tarifChapo", { min: DUREE_MIN, max: DUREE_MAX })}
            </p>

            <div className="ann-grille ann-deux">
              <div className="ann-carte">
                <CreditCard size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 8px" }}>{t("annonceurs.paiementTitre")}</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.62 }}>
                  {t("annonceurs.paiementTexte")}
                </p>
              </div>
              <div className="ann-carte">
                <Target size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 8px" }}>{t("annonceurs.chiffresTitre")}</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.62 }}>
                  {t("annonceurs.chiffresTexte")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Le parcours ── */}
        <section className="ann-section">
          <div className="ann-large">
            <p className="ann-eyebrow">{t("annonceurs.deroulEyebrow")}</p>
            <h2 className="ann-h2">{t("annonceurs.deroulTitre")}</h2>
            <p className="ann-chapo">
              {t("annonceurs.deroulChapo")}
            </p>
            <div className="ann-grille ann-quatre">
              {[
                { n: "01", Icone: BarChart3, titre: t("annonceurs.s1t"), desc: t("annonceurs.s1d") },
                { n: "02", Icone: Target, titre: t("annonceurs.s2t"), desc: t("annonceurs.s2d") },
                { n: "03", Icone: CreditCard, titre: t("annonceurs.s3t"), desc: t("annonceurs.s3d") },
                { n: "04", Icone: ShieldCheck, titre: t("annonceurs.s4t"), desc: t("annonceurs.s4d") },
              ].map(({ n, Icone, titre, desc }) => (
                <div key={n} className="ann-carte" style={{ position: "relative" }}>
                  <span style={{ position: "absolute", top: 22, right: 22, fontSize: 11.5, fontWeight: 700, color: "var(--border2)", letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums" }}>{n}</span>
                  <Icone size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 8px" }}>{titre}</h3>
                  <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Appel à l'action ── */}
        <section className="ann-section ann-accent" style={{ textAlign: "center" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(24px, 3.6vw, 32px)", fontWeight: 750, letterSpacing: "-0.03em", marginBottom: 12 }}>
              {t("annonceurs.ctaTitre")}
            </h2>
            <p style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 28 }}>
              {t("annonceurs.ctaTexte")}
            </p>
            <Link href="/profile/ads/new" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 28px", borderRadius: 10, background: "var(--brand)", color: "#fff", fontWeight: 650, fontSize: 15.5, textDecoration: "none" }}>
              {t("annonceurs.creer")} <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <PiedAccueil />
    </div>
  );
}
