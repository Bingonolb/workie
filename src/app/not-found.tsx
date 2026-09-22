import Link from "next/link";
import { NavbarClient } from "@/components/NavbarClient";

/**
 * Page introuvable.
 *
 * Le bouton était violet en dur : il ne suivait ni le thème ni la règle des
 * boutons. Il passe à l'encre, comme toute action qui ne demande rien.
 */
export default function NotFound() {
  return (
    <>
      <NavbarClient />
      <div style={{
        minHeight: "80vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px", textAlign: "center",
      }}>
        <p style={{ fontSize: 64, fontWeight: 900, color: "var(--text-muted)", lineHeight: 1, marginBottom: 12, letterSpacing: "-0.04em" }}>404</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>
          Cette page n&apos;existe pas
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--text-muted)", marginBottom: 28, maxWidth: 340, lineHeight: 1.6 }}>
          Les 1000 entreprises, elles, sont toujours là.
        </p>
        <Link href="/explore" className="btn btn-encre">Explorer les entreprises</Link>
      </div>
    </>
  );
}
