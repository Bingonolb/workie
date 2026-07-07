import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { signIn, signInWithGoogle } from "@/lib/actions/auth";
import { AuthFormWorkie } from "@/components/AuthFormWorkie";
import { BadgeCheck, ArrowLeft } from "lucide-react";

export default async function BusinessLoginPage() {
  // Already logged in → check role and redirect
  const user = await getUser();
  if (user) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("claimed_company_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.claimed_company_id) redirect("/business/dashboard");
    redirect("/business");
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo + back */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 0 }}>
            <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>workie</span>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.04em", color: "#8b5cf6", marginLeft: 6, textTransform: "uppercase", opacity: 0.9 }}>Business</span>
          </Link>
          <Link href="/business" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontWeight: 500 }}>
            <ArrowLeft size={14} /> Espace entreprise
          </Link>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
            Connexion entreprise
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.6 }}>
            Accédez à votre portail RH — réponses aux avis, analytics, gestion de fiche.
          </p>

          <AuthFormWorkie
            mode="login"
            action={signIn}
            googleAction={signInWithGoogle}
            next="/business/dashboard"
          />

          <div style={{ height: 1, background: "var(--border)", margin: "24px 0" }} />

          <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
            Pas encore de compte entreprise ?{" "}
            <Link href="/business/claim" style={{ color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>
              Revendiquer ma fiche
            </Link>
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>
            Entreprise non référencée ?{" "}
            <Link href="/business/register" style={{ color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>
              L'ajouter sur Workie
            </Link>
          </p>
        </div>

        <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 20 }}>
          Vous êtes un employé ?{" "}
          <Link href="/login" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>Connexion employé</Link>
        </p>
      </div>
    </main>
  );
}
