import type { Metadata } from "next";
import Link from "next/link";
import { listerUtilisateurs } from "@/lib/actions/utilisateurs";
import { ListeUtilisateurs } from "./ListeUtilisateurs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Utilisateurs", robots: { index: false, follow: false } };

export default async function PageUtilisateurs() {
  const { utilisateurs, error } = await listerUtilisateurs();
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Utilisateurs</h1>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--text-muted)" }}>Retour à l&apos;admin</Link>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 20, maxWidth: 640 }}>
        Les comptes inscrits, sans leur activité. Un compte bloqué ne peut plus se connecter. Chaque blocage est inscrit au journal avec son motif.
      </p>
      {error ? <p role="alert">{error}</p> : <ListeUtilisateurs utilisateurs={utilisateurs ?? []} />}
    </main>
  );
}
