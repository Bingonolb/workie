import type { Metadata } from "next";
import Link from "next/link";
import { listerRevendications } from "@/lib/actions/revendicationsAdmin";
import { ListeRevendications } from "./ListeRevendications";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Revendications", robots: { index: false, follow: false } };

export default async function PageRevendications() {
  const { demandes, error } = await listerRevendications();
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Revendications</h1>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--text-muted)" }}>Retour à l&apos;admin</Link>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 20, maxWidth: 680 }}>
        Les demandes avec une adresse du domaine officiel se vérifient seules par code. Celles-ci attendent votre décision :
        une fois acceptée, la personne reçoit un e-mail pour activer l&apos;abonnement.
      </p>
      {error ? <p role="alert">{error}</p> : <ListeRevendications demandes={demandes ?? []} />}
    </main>
  );
}
