import Link from "next/link";
import { Logo } from "@/components/Logo";
import { revendicationOuverte } from "@/lib/ouverture";
import { catalogueEmploi, CANTONS, type Page } from "@/lib/pagesEmploi";

/**
 * Le pied de page de l'accueil, repris tel quel sur la page Annonceurs.
 *
 * La rangée « Emploi par canton » sert le référencement : l'accueil est la
 * page la plus forte du site, et les liens qu'elle porte disent à Google
 * quelles pages comptent. Seules les pages cantonales qui existent sont
 * listées, les plus fournies d'abord : jamais de lien mort.
 *
 * Sur téléphone, les colonnes s'empilaient en une seule file de dix-sept
 * lignes. Les liens tiennent maintenant sur deux colonnes, et les cantons sur
 * une rangée qui s'enroule : le pied de page garde la hauteur d'un pied de
 * page.
 */
export async function PiedAccueil() {
  const cantons = await catalogueEmploi()
    .then(({ pages }) => pages
      .filter((p): p is Extract<Page, { type: "canton" }> => p.type === "canton")
      .sort((a, b) => b.locales.length - a.locales.length)
      .slice(0, 8))
    .catch(() => []);

  const explorer = [
    { href: "/explore", label: "Entreprises" },
    { href: "/emploi", label: "Emploi par secteur" },
    { href: "/ranking", label: "Classement" },
    { href: "/annonceurs", label: "Faire de la publicité" },
    ...(revendicationOuverte ? [{ href: "/pour-les-entreprises", label: "Pour les entreprises" }] : []),
  ];
  const legal = [{ href: "/cgu", label: "CGU" }, { href: "/confidentialite", label: "Confidentialité" }, { href: "/mentions-legales", label: "Mentions légales" }];

  return (
    <footer className="pied" style={{ borderTop: "1px solid var(--border)" }}>
      <style>{`
        .pied { padding: 40px 24px 24px; text-align: left; background: var(--surface); }
        .pied * { text-align: left; }
        .pied-grille { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 32px; margin-bottom: 28px; }
        .pied-titre { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
        .pied-liens { display: flex; flex-direction: column; gap: 8px; }
        .pied a { font-size: 13px; color: var(--text-muted); text-decoration: none; }
        .pied a:hover { color: var(--text); }
        .pied-cantons { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
        .pied-cantons a { display: inline-flex; align-items: center; height: 34px; padding: 0 12px; border-radius: 999px;
          border: 1px solid var(--border); background: var(--bg); font-size: 12.5px; transition: border-color .15s, color .15s; }
        .pied-cantons a:hover { border-color: var(--brand); color: var(--text); }
        @media (max-width: 640px) {
          .pied { padding: 28px 16px calc(20px + env(safe-area-inset-bottom)); }
          /* Logo sur toute la largeur, puis les deux groupes de liens côte à côte. */
          .pied-grille { grid-template-columns: 1fr 1fr; gap: 20px 16px; margin-bottom: 20px; }
          .pied-marque { grid-column: 1 / -1; }
          .pied-liens { gap: 0; }
          /* Cibles au doigt : 40 px de haut, sans allonger la page plus que nécessaire. */
          .pied-liens a { display: flex; align-items: center; justify-content: flex-start; min-height: 40px; font-size: 14px; }
          .pied-cantons { gap: 8px; margin-bottom: 20px; }
          .pied-cantons a { height: 38px; font-size: 13px; }
        }
      `}</style>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div className="pied-grille">
          <div className="pied-marque">
            <Logo taille={26} className="logo-pied" />
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>Chercher du travail devient passionnant.</p>
          </div>
          <nav aria-label="Explorer">
            <p className="pied-titre">Explorer</p>
            <div className="pied-liens">{explorer.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}</div>
          </nav>
          <nav aria-label="Informations légales">
            <p className="pied-titre">Légal</p>
            <div className="pied-liens">{legal.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}</div>
          </nav>
        </div>
        {cantons.length > 0 && (
          <nav aria-label="Emploi par canton">
            <p className="pied-titre">Emploi par canton</p>
            <div className="pied-cantons">
              {cantons.map(p => <Link key={p.slug} href={`/emploi/${p.slug}`} title={`Emploi ${CANTONS[p.canton].dans}`}>{CANTONS[p.canton].nom}</Link>)}
            </div>
          </nav>
        )}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>© 2026 Workie</span>
          <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Plateforme suisse, données hébergées en Europe</span>
        </div>
      </div>
    </footer>
  );
}
