import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { AdminNewCompanyForm } from "./AdminNewCompanyForm";
import { ArrowLeft, Shield } from "lucide-react";

export default async function AdminNewCompanyPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) redirect("/api/auth/signout?next=/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/explore");

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 28px 100px" }}>
        <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 24 }}>
          <ArrowLeft size={14} /> Retour au panel
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={16} color="#8b5cf6" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em" }}>
              Ajouter une entreprise
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Créer une nouvelle fiche entreprise</p>
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 28 }}>
          <AdminNewCompanyForm />
        </div>
      </main>
    </div>
  );
}
