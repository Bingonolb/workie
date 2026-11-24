import Link from "next/link";
import { Logo } from "@/components/Logo";
import { revendicationOuverte } from "@/lib/ouverture";
import { catalogueEmploi, CANTONS, type Page } from "@/lib/pagesEmploi";
import { tServeur, langueDeLaPage } from "@/i18n/page";
import { nomCanton } from "@/i18n/cantons";
import { LOCALE_INTL } from "@/i18n/config";
import { ChoixLangue } from "@/i18n/ChoixLangue";

/**
 * Pied de page de l'accueil, des pages Annonceurs et Pour les entreprises.
 *
 * Dans l'esprit d'apple.com : sur ordinateur, quelques colonnes sobres ; sur
 * téléphone, chaque rubrique se replie derrière une ligne à chevron, si bien
 * que le pied de page reste court et qu'on n'ouvre que ce qu'on cherche.
 *
 * Les cantons ne s'alignent plus à la suite : un petit bouton « Par canton »
 * les déroule. Ils restent présents dans la page (éléments <details>), donc
 * lus par les moteurs de recherche. Seules les pages cantonales qui existent
 * sont listées : jamais de lien mort.
 */
export async function PiedAccueil() {
  const t = await tServeur();
  const langue = await langueDeLaPage();
  const nom = (code: string) => nomCanton(code, langue, CANTONS[code as keyof typeof CANTONS].nom);
  const cantons = await catalogueEmploi()
    .then(({ pages }) => pages
      .filter((p): p is Extract<Page, { type: "canton" }> => p.type === "canton")
      .sort((a, b) => nom(a.canton).localeCompare(nom(b.canton), LOCALE_INTL[langue])))
    .catch(() => []);

  const rubriques = [
    {
      // La rubrique qui porte la liste des cantons.
      cantons: true,
      titre: t("pied.explorer"),
      liens: [
        { href: "/explore", label: t("pied.entreprises") },
        { href: "/ranking", label: t("pied.classement") },
        { href: "/emploi", label: t("pied.emploiSecteur") },
      ],
    },
    {
      cantons: false,
      titre: t("pied.pourEntreprises"),
      liens: [
        ...(revendicationOuverte ? [{ href: "/pour-les-entreprises", label: t("pied.gererFiche") }] : []),
        { href: "/annonceurs", label: t("pied.publicite") },
      ],
    },
    {
      cantons: false,
      titre: "Workie",
      liens: [
        { href: "/cgu", label: t("pied.cgu") },
        { href: "/confidentialite", label: t("pied.confidentialite") },
        { href: "/mentions-legales", label: t("pied.mentions") },
      ],
    },
  ];

  const ParCanton = cantons.length > 0 && (
    <details className="pied-cantons">
      <summary>{t("pied.parCanton")} <svg aria-hidden="true" className="pied-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg></summary>
      <div className="pied-cantons-grille">
        {cantons.map(p => (
          // Explorer filtré sur le canton : c'est ce qu'on attend en touchant un
          // canton. Les pages /emploi/… restent liées depuis /emploi et le plan du site.
          <Link key={p.slug} href={`/explore?canton=${p.canton}`} title={t("pied.entreprisesCanton", { canton: nom(p.canton) })}>{nom(p.canton)}</Link>
        ))}
      </div>
    </details>
  );

  return (
    <footer className="pied">
      <style>{`
        .pied { border-top: 1px solid var(--border); background: var(--surface); padding: 44px 24px 28px; text-align: left; }
        .pied-in { max-width: 980px; margin: 0 auto; }
        .pied a { color: var(--text-muted); text-decoration: none; transition: color .15s; }
        .pied a:hover { color: var(--text); }
        .pied-haut { display: grid; grid-template-columns: 1.3fr repeat(3, 1fr); gap: 32px; }
        .pied-marque p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-top: 10px; max-width: 240px; }
        .pied-titre { font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 12px; }
        .pied-liste { display: grid; gap: 9px; justify-items: start; }
        .pied-liste a { font-size: 13px; }
        .pied-cantons { margin-top: 9px; }
        .pied-cantons summary { list-style: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--text-muted); }
        .pied-cantons summary::-webkit-details-marker { display: none; }
        .pied-cantons summary:hover { color: var(--text); }
        .pied-chevron { flex-shrink: 0; transition: transform .2s; }
        .pied-cantons[open] > summary .pied-chevron { transform: rotate(180deg); }
        .pied-cantons-grille { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; margin-top: 10px; }
        .pied-cantons-grille a { font-size: 12.5px; line-height: 1.35; overflow-wrap: anywhere; }
        .pied-bas { margin-top: 36px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between;
          flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); }
        .pied-mobile { display: none; }

        @media (max-width: 760px) {
          .pied { padding: 28px 16px calc(20px + env(safe-area-inset-bottom)); }
          .pied-haut { display: block; }
          .pied-colonne { display: none; }
          .pied-mobile { display: block; margin-top: 18px; border-top: 1px solid var(--border); }
          /* Une ligne par rubrique, repliée : le motif d'apple.com. */
          .pied-acc { border-bottom: 1px solid var(--border); }
          .pied-acc > summary { list-style: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between;
            min-height: 48px; font-size: 14px; font-weight: 600; color: var(--text); }
          .pied-acc > summary::-webkit-details-marker { display: none; }
          .pied-acc > summary .pied-chevron { width: 14px; height: 14px; color: var(--text-muted); }
          .pied-acc[open] > summary .pied-chevron { transform: rotate(180deg); }
          .pied-acc .pied-liste { gap: 0; padding-bottom: 10px; }
          .pied-acc .pied-liste a { display: flex; align-items: center; min-height: 40px; font-size: 14px; }
          .pied-acc .pied-cantons { margin: 0 0 12px; }
          .pied-acc .pied-cantons summary { min-height: 40px; font-size: 14px; }
          .pied-acc .pied-cantons-grille a { font-size: 13.5px; padding: 6px 0; }
          .pied-bas { margin-top: 18px; border-top: none; padding-top: 0; flex-direction: column; align-items: flex-start; gap: 4px; }
        }
        @media (prefers-reduced-motion: reduce) { .pied-chevron { transition: none; } }
      `}</style>
      <div className="pied-in">
        <div className="pied-haut">
          <div className="pied-marque">
            <Logo taille={24} className="logo-pied" />
            <p>{t("pied.slogan")}</p>
          </div>

          {/* Ordinateur : colonnes. */}
          {rubriques.map(r => (
            <nav key={r.titre} className="pied-colonne" aria-label={r.titre}>
              <p className="pied-titre">{r.titre}</p>
              <div className="pied-liste">
                {r.liens.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}
              </div>
              {r.cantons && ParCanton}
            </nav>
          ))}

          {/* Téléphone : rubriques repliables. */}
          <div className="pied-mobile">
            {rubriques.map(r => (
              <details key={r.titre} className="pied-acc">
                <summary>{r.titre}<svg aria-hidden="true" className="pied-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg></summary>
                <div className="pied-liste">
                  {r.liens.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}
                </div>
                {r.cantons && ParCanton}
              </details>
            ))}
          </div>
        </div>

        <div className="pied-bas">
          <span>© 2026 Workie</span>
          <ChoixLangue texte />
          <span>{t("pied.hebergement")}</span>
        </div>
      </div>
    </footer>
  );
}
