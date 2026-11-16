import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { urlFiche } from "@/lib/urlFiche";
import { NavbarClient } from "@/components/NavbarClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Espace entreprise", robots: { index: false, follow: false } };

/**
 * Point d'arrivée après le paiement. Le tableau de bord complet (fréquentation,
 * modification de la fiche, abonnement) arrive à l'étape 2.
 *
 * Le webhook Stripe peut arriver quelques secondes après le retour du
 * paiement : tant que l'abonnement n'est pas actif, la page le dit.
 */
export default async function EspaceEntreprise({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/espace-entreprise");
  const { bienvenue } = await searchParams;

  const admin = createAdminClient();
  const { data: profil } = await admin.from("profiles").select("claimed_company_id").eq("id", user.id).maybeSingle();
  const { data: c } = profil?.claimed_company_id
    ? await admin.from("companies").select("id, slug, name, is_subscribed").eq("id", profil.claimed_company_id).maybeSingle()
    : { data: null };
  const actif = !!c?.is_subscribed;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <NavbarClient />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 16px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 26, display: "grid", gap: 14 }}>
          {actif && c ? (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
                {bienvenue ? `Bienvenue, ${c.name} est à vous.` : c.name}
              </h1>
              <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Votre abonnement est actif et le badge vérifié est visible sur la fiche. Le tableau de bord de fréquentation et la modification de la fiche arrivent très bientôt dans cet espace.
              </p>
              <Link href={urlFiche(c)} className="btn btn-encre">Voir la fiche</Link>
            </>
          ) : bienvenue ? (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Paiement reçu</h1>
              <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Nous activons votre abonnement. Cela prend quelques secondes : rechargez la page dans un instant.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Aucune entreprise liée à ce compte</h1>
              <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Pour gérer une fiche, ouvrez-la sur Workie et choisissez « Gérer cette fiche ».
              </p>
              <Link href="/explore" className="btn btn-clair">Explorer les entreprises</Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
