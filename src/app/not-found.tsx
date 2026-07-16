import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div style={{
        minHeight: "80vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px", textAlign: "center",
      }}>
        <p style={{ fontSize: 72, fontWeight: 900, color: "var(--text-muted)", lineHeight: 1, marginBottom: 8 }}>404</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>
          Page introuvable
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28, maxWidth: 360, lineHeight: 1.6 }}>
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <Link href="/explore" style={{
          padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14,
          background: "#8b5cf6", color: "#fff", textDecoration: "none",
        }}>
          Explorer les entreprises
        </Link>
      </div>
    </>
  );
}
