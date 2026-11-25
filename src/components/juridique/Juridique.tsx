import Link from "next/link";
import { tServeur } from "@/i18n/page";

/** Ce qui est commun aux pages juridiques (CGU, confidentialité, mentions légales). */

export const styleTitre: React.CSSProperties = { fontSize: 32, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 8 };
export const styleDate: React.CSSProperties = { fontSize: 13, color: "var(--text-muted)", marginBottom: 32 };

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 14, letterSpacing: "-0.01em" }}>{title}</h2>
      <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

/** En tête d'une traduction : le texte français est le seul qui engage. */
export async function VersionFaitFoi() {
  const t = await tServeur();
  return (
    <p role="note" style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text)", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "10px 14px", marginBottom: 40 }}>
      {t("juridique.faitFoi")}
    </p>
  );
}

/** Liens de bas de page : l'autre texte juridique, et le retour. */
export async function PiedJuridique({ autre }: { autre: "/cgu" | "/confidentialite" }) {
  const t = await tServeur();
  return (
    <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", gap: 16, flexWrap: "wrap" }}>
      <Link href={autre} style={{ fontSize: 13, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
        {autre === "/cgu" ? t("juridique.cguTitre") : t("juridique.confidentialiteTitre")} →
      </Link>
      <Link href="/explore" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>{t("juridique.retour")}</Link>
    </div>
  );
}
