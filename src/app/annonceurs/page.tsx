import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Target, CreditCard, ShieldCheck, BarChart3, Building2, MapPin, ExternalLink, Check } from "lucide-react";
import { NavbarClient } from "@/components/NavbarClient";
import { Footer } from "@/components/Footer";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { BASE_CPM_CHF, CANTON_WEIGHTS, SECTOR_WEIGHTS } from "@/lib/ads/pricing";

export const revalidate = 300;

// Le catalogue dit l'etendue du terrain, pas la frequentation. Les deux se
// confondent vite, et un annonceur qui croit lire une audience decouvre
// l'ecart sur son tableau de bord.
const compterEmployeurs = unstable_cache(
  async () => {
    const { count } = await createAdminClient()
      .from("companies")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  },
  ["annonceurs-employeurs"],
  { revalidate: 300, tags: ["landing-counts"] }
);

export const metadata: Metadata = {
  title: "Annoncer sur Workie",
  description: "Diffusez vos annonces auprès de candidats suisses, ciblées par canton et par secteur. CHF 4 les mille affichages, budget fixe et payé une fois, sans abonnement.",
  alternates: { canonical: "https://www.workie.ch/annonceurs" },
  openGraph: {
    title: "Annoncer sur Workie",
    description: "Ciblage par canton et par secteur, budget fixe, sans abonnement.",
    url: "https://www.workie.ch/annonceurs",
    siteName: "Workie",
    type: "website",
    locale: "fr_CH",
  },
};

/*
 * La page des annonceurs.
 *
 * Tous les chiffres viennent du module de tarification, jamais recopiés : un
 * prix affiché en dur diverge de celui qui est facturé le jour où le module
 * change, et c'est le genre d'écart qu'un annonceur découvre sur sa facture.
 *
 * Le parcours décrit est celui du code, relecture comprise. Une campagne payée
 * passe en attente et n'est diffusée qu'après validation : le taire ferait
 * croire à une mise en ligne immédiate.
 */
export default async function AnnonceursPage() {
  const employeurs = await compterEmployeurs();
  const chiffres = [
    { valeur: employeurs.toLocaleString("fr-CH"), libelle: "employeurs référencés" },
    { valeur: String(Object.keys(CANTON_WEIGHTS).length), libelle: "cantons ciblables" },
    { valeur: String(Object.keys(SECTOR_WEIGHTS).length), libelle: "secteurs ciblables" },
  ];

  return (
    <div className="page-root">
      {/* Les styles voyagent avec la page, comme sur l'accueil : le paquet CSS
          reste parfois figé d'un déploiement à l'autre alors que le HTML se met
          à jour, et la page arrive alors sans ses règles. */}
      <style>{`
        .ann-section { padding: 84px 24px; }
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
          grid-template-columns: 300px 1fr;
          gap: 40px;
          align-items: start;
        }
        @media (max-width: 780px) {
          .ann-exemple { grid-template-columns: 1fr; gap: 28px; }
        }
        .ann-grille { display: grid; gap: 20px; align-items: stretch; }
        .ann-deux { grid-template-columns: repeat(2, 1fr); }
        .ann-quatre { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 860px) {
          .ann-deux, .ann-quatre { grid-template-columns: 1fr; }
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
            Deux colonnes : le texte tenait seul la gauche et laissait la
            droite vide sur toute la hauteur. Une page qui vend de l'espace
            d'affichage ne peut pas s'ouvrir sur du vide. */}
        <section className="ann-section">
          <div className="ann-large ann-ouverture">
            <div>
            <p className="ann-eyebrow">Annonceurs</p>
            <h1 style={{ fontSize: "clamp(30px, 4.4vw, 46px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.035em", marginBottom: 18, maxWidth: 580 }}>
              Là où les candidats choisissent leur employeur.
            </h1>
            <p style={{ fontSize: 16.5, color: "var(--text-sub)", lineHeight: 1.6, maxWidth: 500, marginBottom: 30 }}>
              Votre annonce s&apos;affiche pendant qu&apos;ils comparent.
            </p>
            <Link href="/profile/ads/new" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "13px 26px", borderRadius: 10, background: "var(--brand)", color: "#fff", fontWeight: 650, fontSize: 15.5, textDecoration: "none" }}>
              Créer une campagne <ArrowRight size={17} aria-hidden="true" />
            </Link>
            </div>

            <div style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
              <Image
                src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1000"
                alt=""
                fill
                sizes="(max-width: 860px) 100vw, 420px"
                style={{ objectFit: "cover" }}
                priority
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
            <p className="ann-eyebrow">L&apos;audience</p>
            <h2 className="ann-h2">Des gens en train de décider.</h2>
            <p className="ann-chapo">
              {/* Aucun chiffre d'audience : le site est jeune, et un annonceur
                  qui decouvre l'ecart sur son tableau de bord ne revient pas.
                  L'intention se decrit, elle n'a pas besoin d'etre chiffree. */}
              On ne vient pas sur Workie passer le temps. On y compare des
              employeurs et on y lit des salaires, c&apos;est-à-dire qu&apos;on prépare
              un changement.
            </p>
            {/* Le terrain, en valeur absolue. Les cantons et les secteurs sont
                comptes dans le module de tarification, donc ces nombres sont
                exactement ceux que le formulaire de ciblage propose. */}
            <div className="ann-chiffres">
              {chiffres.map(({ valeur, libelle }, i) => (
                <div key={libelle} style={{ paddingLeft: i === 0 ? 0 : 28, borderLeft: i === 0 ? "none" : "1px solid var(--border)" }}>
                  <p style={{ fontSize: "clamp(26px, 3.6vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{valeur}</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 9, lineHeight: 1.4 }}>{libelle}</p>
                </div>
              ))}
            </div>

            <div className="ann-grille ann-quatre" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {[
                {
                  Icone: Target,
                  titre: "Une intention, pas une audience",
                  desc: "Ils sont venus choisir un employeur. Vous leur parlez pendant qu\u2019ils choisissent, pas six mois plus tôt.",
                },
                {
                  Icone: Building2,
                  titre: "Au milieu de vos concurrents",
                  desc: "Votre annonce paraît dans la grille des entreprises, à côté de celles qui visent les mêmes candidats que vous.",
                },
                {
                  Icone: MapPin,
                  titre: "Le marché suisse, découpé comme vous le pensez",
                  desc: "Par canton et par secteur. Vous ne payez pas pour une audience que vous n\u2019embaucherez jamais.",
                },
              ].map(({ Icone, titre, desc }) => (
                <div key={titre} className="ann-carte">
                  <Icone size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 8px", lineHeight: 1.3 }}>{titre}</h3>
                  <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Les deux emplacements ── */}
        <section className="ann-section">
          <div className="ann-large">
            <p className="ann-eyebrow">Emplacements</p>
            <h2 className="ann-h2">Deux formats, un seul tarif.</h2>
            <p className="ann-chapo">
              {/* La phrase racontait pourquoi nous avions aligne les deux
                  tarifs. C'est notre histoire interne, pas celle de
                  l'annonceur, qui veut savoir ce qu'il choisit. */}
              Prenez l&apos;un, l&apos;autre, ou les deux. Le prix ne change pas.
            </p>
            <div className="ann-grille ann-deux">
              {[
                { label: "Carré", ou: "Dans la grille des entreprises, entre les fiches.", forme: "carre" },
                { label: "Plein écran", ou: "Dans le swipe, toutes les dix cartes.", forme: "plein" },
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
        <section className="ann-section">
          <div className="ann-large">
            <p className="ann-eyebrow">Un exemple</p>
            <h2 className="ann-h2">À quoi ressemble une annonce.</h2>
            <p className="ann-chapo">
              Une école de langues qui vise des candidats en train de préparer
              un changement de poste.
            </p>

            <div className="ann-exemple">
              {/* Le format carre, tel qu'il est servi dans la grille. */}
              <div style={{
                background: "var(--surface)",
                border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: 20, overflow: "hidden", position: "relative",
                display: "flex", flexDirection: "column", maxWidth: 300,
              }}>
                <div style={{
                  position: "absolute", top: 12, left: 12, zIndex: 2,
                  background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)", borderRadius: 50,
                  padding: "3px 10px", fontSize: 10, fontWeight: 700,
                  color: "rgba(255,255,255,0.75)", letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>
                  Sponsorisé
                </div>
                <div style={{ position: "relative", paddingTop: "60%", overflow: "hidden", flexShrink: 0 }}>
                  <Image
                    src="https://images.pexels.com/photos/4778611/pexels-photo-4778611.jpeg?auto=compress&cs=tinysrgb&w=600"
                    alt=""
                    fill
                    sizes="300px"
                    style={{ objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7))" }} />
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginBottom: 7 }}>
                    L&apos;allemand qui vous manque pour ce poste
                  </p>
                  <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 14 }}>
                    Cours du soir à Genève et Lausanne. Niveau B2 en six mois.
                  </p>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 10, background: "var(--brand)",
                    color: "#fff", fontWeight: 650, fontSize: 13.5,
                  }}>
                    Voir les cours <ExternalLink size={12} aria-hidden="true" />
                  </span>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 10 }}>
                  Pourquoi celle-ci fonctionne
                </h3>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    "Elle parle du poste visé, pas de l\u2019école. Le lecteur est en train de comparer des employeurs, pas de chercher un cours.",
                    "Elle est datée et située : six mois, Genève et Lausanne. Une promesse vague ne se vérifie pas.",
                    "Elle vise les cantons de Genève et de Vaud, et les secteurs où l\u2019allemand décide d\u2019une embauche.",
                  ].map((t) => (
                    <li key={t} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                      <Check size={15} color="var(--brand)" strokeWidth={2.4} aria-hidden="true" style={{ flexShrink: 0, marginTop: 4 }} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 20, opacity: 0.75 }}>
                  Exemple fictif. Aucune école n&apos;est représentée.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Le tarif ── */}
        <section className="ann-section ann-ton">
          <div className="ann-large">
            <p className="ann-eyebrow">Tarif</p>
            <h2 className="ann-h2">Ce que vous payez, et quand.</h2>

            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ fontSize: "clamp(36px, 6vw, 54px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>
                CHF {BASE_CPM_CHF.toFixed(0)}
              </span>
              <span style={{ fontSize: 16, color: "var(--text-muted)", fontWeight: 550 }}>
                les mille affichages
              </span>
            </div>
            <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 560, marginBottom: 34 }}>
              {/* La majoration est reelle et calculee a la creation : la taire
                  reviendrait a annoncer un prix que personne ne paie des qu'il
                  cible quelque chose. */}
              Un ciblage étroit majore ce tarif, jusqu&apos;à 40 % pour un segment
              très resserré. Une audience précise coûte plus cher parce
              qu&apos;elle est plus rare, et le prix vous est montré avant de payer.
            </p>

            <div className="ann-grille ann-deux">
              <div className="ann-carte">
                <CreditCard size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 8px" }}>Un paiement, pas un abonnement</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.62 }}>
                  Vous fixez un budget total, vous le réglez une fois par carte,
                  et la campagne s&apos;arrête quand il est épuisé. Rien ne se
                  reconduit.
                </p>
              </div>
              <div className="ann-carte">
                <Target size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 8px" }}>Budget minimum : CHF 5 par jour</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.62 }}>
                  Le budget journalier plafonne la dépense quotidienne. Le budget
                  total ne peut pas lui être inférieur.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Le parcours ── */}
        <section className="ann-section">
          <div className="ann-large">
            <p className="ann-eyebrow">Déroulement</p>
            <h2 className="ann-h2">En quatre étapes.</h2>
            <p className="ann-chapo">
              La relecture n&apos;est pas une formalité : une annonce payée reste en
              attente tant qu&apos;elle n&apos;a pas été validée.
            </p>
            <div className="ann-grille ann-quatre">
              {[
                { n: "01", Icone: BarChart3, titre: "Vous composez", desc: "Visuel, titre, texte et lien de destination." },
                { n: "02", Icone: Target, titre: "Vous ciblez", desc: "Cantons et secteurs. Le prix et la portée estimée s'affichent devant vous." },
                { n: "03", Icone: CreditCard, titre: "Vous réglez", desc: "Paiement unique par carte, du budget total que vous avez fixé." },
                { n: "04", Icone: ShieldCheck, titre: "Nous relisons", desc: "Puis la campagne part, et le compte des affichages et des clics commence." },
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
              Essayez avec CHF 5.
            </h2>
            <p style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 28 }}>
              C&apos;est le budget minimum d&apos;une journée, et il suffit à voir ce que
              votre annonce donne.
            </p>
            <Link href="/profile/ads/new" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 28px", borderRadius: 10, background: "var(--brand)", color: "#fff", fontWeight: 650, fontSize: 15.5, textDecoration: "none" }}>
              Créer une campagne <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
