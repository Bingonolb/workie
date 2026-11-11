import Link from "next/link";
import { Logo } from "@/components/Logo";

/** Le pied de page de l accueil, repris tel quel sur la page Annonceurs. */
export function PiedAccueil() {
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
                {[{ href: "/explore", label: "Entreprises" }, { href: "/ranking", label: "Classement" }, { href: "/annonceurs", label: "Faire de la publicité" }].map(({ href, label }) => (
                  <Link key={href} href={href} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>{label}</Link>
                ))}
              </div>
            </div>
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
