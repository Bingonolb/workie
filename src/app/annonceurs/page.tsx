import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Target, CreditCard, ShieldCheck, BarChart3, MapPin, Check, CalendarClock } from "lucide-react";
import { NavbarClient } from "@/components/NavbarClient";
import { Footer } from "@/components/Footer";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApercuSwipe, type EntrepriseApercu } from "@/components/ApercuSwipe";
import { melangerAvecAnnonces } from "@/lib/annoncesExemple";
import { CANTON_WEIGHTS, SECTOR_WEIGHTS, DUREE_MIN, DUREE_MAX } from "@/lib/ads/pricing";

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

// Cinq fiches pour la démonstration, prises dans les secteurs repris à la main.
const fichesDemo = unstable_cache(
  async (): Promise<EntrepriseApercu[]> => {
    const { data } = await createAdminClient()
      .from("companies")
      .select("id, name, sector, subsector, city, canton, description, cover_url")
      .in("sector", ["Alimentation", "Assurances", "Automobile", "Aéronautique & Spatial", "Agriculture"])
      .not("cover_url", "is", null)
      .not("description", "is", null)
      .order("score", { ascending: false })
      .limit(40);
    const vus = new Set<string>();
    const retenues = (data ?? []).filter(c => !vus.has(c.sector) && vus.add(c.sector)).slice(0, 5);
    return retenues.map(c => ({
      id: c.id, name: c.name, sector: c.sector, subsector: c.subsector,
      lieu: c.canton ? c.city + ", " + c.canton : c.city,
      langues: "", description: c.description, cover_url: c.cover_url,
    }));
  },
  ["annonceurs-demo"],
  { revalidate: 300, tags: ["companies"] }
);

export const metadata: Metadata = {
  title: "Annoncer sur Workie",
  description: "Diffusez vos annonces auprès de candidats suisses, ciblées par canton et par secteur. Un forfait de 7, 14 ou 30 jours, payé une fois, sans abonnement.",
  alternates: { canonical: "https://www.workie.ch/annonceurs" },
  openGraph: {
    title: "Annoncer sur Workie",
    description: "Ciblage par canton et par secteur, budget fixe, sans abonnement.",
    url: "https://www.workie.ch/annonceurs",
    siteName: "Workie",
    type: "website",
    locale: "fr_CH",
    images: [{ url: "https://www.workie.ch/opengraph-image.png", width: 1200, height: 630, alt: "Annoncer sur Workie" }],
  },
};

/*
 * La page des annonceurs.
 *
 * Tous les chiffres viennent du module de tarification, jamais recopiés : un
 * prix affiché en dur diverge de celui qui est facturé le jour où le module
 * change, et c'est le genre d'écart qu'un annonceur découvre sur sa facture.
 *
 * Le parcours décrit est celui du code. Une campagne payée
 * passe en attente et n'est diffusée qu'après validation : le taire ferait
 * croire à une mise en ligne immédiate.
 */
export default async function AnnonceursPage() {
  const [employeurs, demo] = await Promise.all([compterEmployeurs(), fichesDemo()]);
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
              <p className="ann-eyebrow">Annonceurs</p>
              <h1 style={{ fontSize: "clamp(30px, 4.4vw, 46px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.035em", marginBottom: 18, maxWidth: 580 }}>
                Votre annonce, entre les entreprises.
              </h1>
              <p style={{ fontSize: 16.5, color: "var(--text-sub)", lineHeight: 1.6, maxWidth: 480, marginBottom: 26 }}>
                Elle a la forme d&apos;une fiche et paraît au milieu d&apos;elles, pendant
                qu&apos;on choisit son prochain employeur. Faites glisser les cartes.
              </p>
              <Link href="/profile/ads/new" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "13px 26px", borderRadius: 10, background: "var(--brand)", color: "#fff", fontWeight: 650, fontSize: 15.5, textDecoration: "none" }}>
                Créer une campagne <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>

            <div style={{ maxWidth: 380, width: "100%", justifySelf: "end" }}>
              <ApercuSwipe
                entreprises={melangerAvecAnnonces(demo)}
                fin={{ titre: "La prochaine carte pourrait être la vôtre.", libelle: "Créer une campagne", href: "/profile/ads/new" }}
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
            <h2 className="ann-h2">Des gens qui regardent loin.</h2>
            <p className="ann-chapo">
              {/* Aucun chiffre d'audience : le site est jeune, et un annonceur
                  qui decouvre l'ecart sur son tableau de bord ne revient pas.
                  L'intention se decrit, elle n'a pas besoin d'etre chiffree. */}
              Ils comparent des employeurs : ils décident de plusieurs années
              de leur vie. Et une décision pareille en
              entraîne d&apos;autres, qui engagent tout autant : reprendre une
              formation, changer de trajet, s&apos;assurer, emprunter.



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

            <div className="ann-grille ann-trois">
              {[
                {
                  Icone: Target,
                  titre: "Un moment de projection",
                  desc: "Personne ne compare des employeurs pour passer le temps. Vos lecteurs pensent ici en années.",
                },
                {
                  Icone: CalendarClock,
                  titre: "Tout ce qui suit un nouveau poste",
                  desc: "Un changement de poste entraîne une formation, un trajet, une assurance, parfois un crédit. Tout ce qui se décide sur la durée a sa place ici.",
                },
                {
                  Icone: MapPin,
                  titre: "Par canton et par secteur",
                  desc: "Vous choisissez où et à qui votre annonce paraît, et vous ne payez que pour ce périmètre.",
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
            <p className="ann-eyebrow">Écrire son annonce</p>
            <h2 className="ann-h2">Ce qui fonctionne ici.</h2>
            <p className="ann-chapo">
              Les gens lisent des fiches d&apos;entreprise. Votre annonce est lue dans
              ce mouvement, et les trois règles ci-dessous en découlent.
            </p>

            <ul style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
              {[
                "Elle parle du poste que le lecteur vise : il est en train de choisir un employeur.",
                "Elle est datée et située : 6 mois, Genève et Lausanne. Une promesse précise se vérifie.",
                "Elle vise les cantons et les secteurs où elle a un sens.",
              ].map((t) => (
                <li key={t} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  <Check size={15} color="var(--brand)" strokeWidth={2.4} aria-hidden="true" style={{ flexShrink: 0, marginTop: 4 }} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 22, opacity: 0.75 }}>
              Les annonces montrées plus haut sont fictives. Aucun annonceur n&apos;est représenté.
            </p>
          </div>
        </section>

        {/* ── Le tarif ── */}
        <section className="ann-section ann-ton">
          <div className="ann-large">
            <p className="ann-eyebrow">Tarif</p>
            <h2 className="ann-h2">Ce que vous payez, et quand.</h2>

            {/* Aucun montant sur cette page.
                Un prix posé ici ancre le lecteur sur le plus petit chiffre
                possible, sept jours sur le plus petit canton, qui n'est pas ce
                qu'il achètera. Il invite à l'objection avant qu'on ait expliqué
                ce qu'on vend, et il se périme à chaque changement de tarif : le
                précédent annonçait vingt et un francs pour un minimum réel de
                septante-sept. Le prix a un seul bon endroit, le formulaire, où
                il découle des choix faits. */}
            <p style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 580, marginBottom: 34 }}>
              Deux choses déterminent le prix : la durée, de {DUREE_MIN} à {DUREE_MAX} jours,
              et le nombre de cantons visés. Vous les réglez tous les deux au
              moment de composer votre annonce, et le montant s&apos;affiche avant
              que vous ne payiez quoi que ce soit.
            </p>

            <div className="ann-grille ann-deux">
              <div className="ann-carte">
                <CreditCard size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 8px" }}>Un paiement, pas un abonnement</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.62 }}>
                  Vous réglez le forfait une fois par carte. Rien ne se
                  reconduit : à la fin, on vous propose de relancer, ou pas.
                </p>
              </div>
              <div className="ann-carte">
                <Target size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 8px" }}>Les chiffres réels, jour par jour</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.62 }}>
                  Vues, clics et répartition par canton pendant toute la
                  diffusion. Vous mesurez ce qui s&apos;est passé, pas une
                  estimation faite d&apos;avance.
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
              Aucune attente entre le paiement et la diffusion. Un filtre
              automatique refuse à la création ce qui n&apos;a rien à faire ici, et
              deux signalements suffisent ensuite à retirer une annonce.
            </p>
            <div className="ann-grille ann-quatre">
              {[
                { n: "01", Icone: BarChart3, titre: "Vous composez", desc: "Visuel, titre, texte et lien de destination." },
                { n: "02", Icone: Target, titre: "Vous ciblez", desc: "Cantons et secteurs. Le prix et la portée estimée s'affichent devant vous." },
                { n: "03", Icone: CreditCard, titre: "Vous réglez", desc: "Paiement unique par carte, du budget total que vous avez fixé." },
                { n: "04", Icone: ShieldCheck, titre: "Elle part aussitôt", desc: "Le compte des affichages et des clics commence, et vous recevez le bilan à la fin." },
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
              Lancez votre première annonce.
            </h2>
            <p style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 28 }}>
              Une semaine sur un seul canton suffit à voir ce que ça donne, et
              le montant s&apos;affiche avant le paiement.
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
