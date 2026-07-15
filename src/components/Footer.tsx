import Link from "next/link";

export function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      padding: "32px 24px",
      marginTop: 40,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 900, fontSize: 16, color: "var(--text)" }}>workie</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· Les entreprises suisses, sans filtre.</span>
        </div>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", alignItems: "center" }}>
          <Link href="/cgu" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>CGU</Link>
          <Link href="/confidentialite" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Confidentialité</Link>
          <a href="mailto:contact@workie.ch" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Contact</a>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>© {new Date().getFullYear()} Workie</span>
        </nav>
      </div>
    </footer>
  );
}
