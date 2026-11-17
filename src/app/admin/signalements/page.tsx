import type { Metadata } from "next";
import Link from "next/link";
import { getReports } from "@/lib/actions/reports";
import { ListeSignalements } from "./ListeSignalements";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Signalements", robots: { index: false, follow: false } };

export default async function PageSignalements() {
  const { reports, error } = await getReports();
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Signalements</h1>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--text-muted)" }}>Retour à l&apos;admin</Link>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 20, maxWidth: 680 }}>
        Ce que les visiteurs signalent depuis le menu « ⋯ » des fiches et depuis les publicités. Les demandes en attente sont en haut.
      </p>
      {error ? <p role="alert">{error}</p> : <ListeSignalements signalements={reports ?? []} />}
    </main>
  );
}
