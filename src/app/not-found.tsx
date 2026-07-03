import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100dvh", background: "var(--bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 24px", textAlign: "center",
    }}>

      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 48 }}>
        <span style={{
          fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          workie
        </span>
      </Link>

      {/* 404 number */}
      <div style={{
        fontSize: 120, fontWeight: 900, lineHeight: 1,
        letterSpacing: "-0.06em", marginBottom: 8,
        background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(249,115,22,0.15))",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        userSelect: "none",
      }}>
        404
      </div>

      <h1 style={{
        fontSize: 24, fontWeight: 900, color: "var(--text)",
        letterSpacing: "-0.03em", marginBottom: 12,
      }}>
        Cette page n&apos;existe pas
      </h1>

      <p style={{
        fontSize: 15, color: "var(--text-muted)", maxWidth: 380,
        lineHeight: 1.6, marginBottom: 40,
      }}>
        L&apos;entreprise ou la page que tu cherches a peut-être été supprimée, ou l&apos;URL est incorrecte.
      </p>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/explore" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "13px 28px", borderRadius: 12,
          background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
        }}>
          Explorer les entreprises
        </Link>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "13px 24px", borderRadius: 12,
          background: "var(--surface)", border: "1px solid var(--border)",
          color: "var(--text-muted)", fontWeight: 600, fontSize: 14, textDecoration: "none",
        }}>
          Accueil
        </Link>
      </div>

    </div>
  );
}
