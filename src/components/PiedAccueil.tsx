import Link from "next/link";
import { Logo } from "@/components/Logo";
import { revendicationOuverte } from "@/lib/ouverture";
import { catalogueEmploi, CANTONS, type Page } from "@/lib/pagesEmploi";

/**
 * Le pied de page de l'accueil, repris tel quel sur la page Annonceurs.
 *
 * La colonne « Emploi par canton » sert le référencement : l'accueil est la
 * page la plus forte du site, et les liens qu'elle porte disent à Google
 * quelles pages comptent. Seules les pages cantonales qui existent sont
 * listées, les plus fournies d'abord : jamais de lien mort.
 */
export async function PiedAccueil() {
  const cantons = await catalogueEmploi()
    .then(({ pages }) => pages
      .filter((p): p is Extract<Page, { type: "canton" }> => p.type === "canton")
      .sort((a, b) => b.locales.length - a.locales.length)
      .slice(0, 8))
    .catch(() => []);
  return (
      <footer style={{ borderTop: "1px solid var(--border)", padding: "36px 24px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, marginBottom: 32 }}>
            <div>
              <Logo taille={26} className="logo-pied" />
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>Chercher du travail devient passionnant.</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Explorer</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[{ href: "/explore", label: "Entreprises" }, { href: "/emploi", label: "Emploi par secteur et canton" }, { href: "/ranking", label: "Classement" }, { href: "/annonceurs", label: "Faire de la publicité" }, ...(revendicationOuverte ? [{ href: "/pour-les-entreprises", label: "Pour les entreprises" }] : [])].map(({ href, label }) => (
                  <Link key={href} href={href} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>{label}</Link>
                ))}
              </div>
            </div>
            {cantons.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Emploi par canton</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {cantons.map(p => (
                    <Link key={p.slug} href={`/emploi/${p.slug}`} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>Emploi {CANTONS[p.canton].nom}</Link>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Légal</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[{ href: "/cgu", label: "CGU" }, { href: "/confidentialite", label: "Confidentialité" }].map(({ href, label }) => (
                  <Link key={href} href={href} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>© 2026 Workie</span>
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Plateforme suisse, données hébergées en Europe</span>
          </div>
        </div>
      </footer>
  );
}
