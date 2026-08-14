import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { AdminCompanyForm } from "./AdminCompanyForm";
import { ArrowLeft, Shield } from "lucide-react";
import { SECTOR_COLORS } from "@/lib/types";
import type { Company } from "@/lib/types";

export default async function AdminEditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) redirect("/api/auth/signout?next=/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/explore");

  const [{ data }, { data: sectorRows }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).maybeSingle(),
    supabase.from("companies").select("sector").not("sector", "is", null),
  ]);
  if (!data) notFound();
  const company = data as Company;

  const dbSectors = sectorRows?.map(r => r.sector as string).filter(Boolean) ?? [];
  const allSectors = [...new Set([...Object.keys(SECTOR_COLORS), ...dbSectors])].sort();

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main className="admin-page" style={{ maxWidth: 800 }}>

        <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 24 }}>
          <ArrowLeft size={14} aria-hidden="true" /> Retour au panel
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={16} color="#8b5cf6" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em" }}>
              {company.name}
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Modifier les informations</p>
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 28 }}>
          <AdminCompanyForm company={company} sectors={allSectors} />
        </div>

      </main>
    </div>
  );
}
