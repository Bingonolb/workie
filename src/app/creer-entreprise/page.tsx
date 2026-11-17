import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";
import { etatCreation } from "@/lib/actions/creationEntreprise";
import { creationOuverte } from "@/lib/ouverture";
import { NavbarClient } from "@/components/NavbarClient";
import { CANTON_NAMES } from "@/lib/types";
import { ParcoursCreation } from "./ParcoursCreation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Créer la fiche de votre entreprise", robots: { index: false, follow: false } };

export default async function PageCreerEntreprise() {
  if (!creationOuverte) notFound();
  const [user, secteurs, etat] = await Promise.all([getUser(), getSecteursEnLigne(), etatCreation()]);
  const cantons = Object.entries(CANTON_NAMES)
    .filter(([code]) => code !== "CH")
    .map(([code, nom]) => ({ code, nom }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <NavbarClient />
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "28px 16px 64px" }}>
        <Link href="/pour-les-entreprises" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
          ← Pour les entreprises
        </Link>
        <p style={{ marginTop: 18, fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--brand)" }}>Workie Business</p>
        <ParcoursCreation connecte={!!user} etatInitial={etat} secteurs={[...secteurs].sort((a, b) => a.localeCompare(b, "fr"))} cantons={cantons} />
      </main>
    </div>
  );
}
