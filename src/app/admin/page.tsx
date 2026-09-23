import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/Navbar";
import { AdminCompanyList } from "./AdminCompanyList";
import { Shield, Plus, Users, Inbox } from "lucide-react";
import type { Company } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) redirect("/api/auth/signout?next=/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/explore");

  const adminClient = createAdminClient();
  const [{ count: userCount }, { count: pendingClaims }] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }),
    adminClient.from("company_claims").select("*", { count: "exact", head: true }).or("status.is.null,status.eq.pending"),
  ]);

  // Fetch all companies in batches to bypass PostgREST max-rows limit
  const allCompanies: Company[] = [];
  const BATCH = 1000;
  let from = 0;
  while (true) {
    const { data } = await adminClient
      .from("companies")
      .select("*")
      .order("sector", { ascending: true })
      .order("name", { ascending: true })
      .range(from, from + BATCH - 1);
    if (!data || data.length === 0) break;
    allCompanies.push(...(data as Company[]));
    if (data.length < BATCH) break;
    from += BATCH;
  }

  const list = allCompanies;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main className="admin-page" style={{ maxWidth: 1100 }}>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { icon: <Users size={16} color="var(--brand)" />, value: list.length, label: "Entreprises", color: "#6e56cf" },
            { icon: <Users size={16} color="#10b981" />, value: userCount ?? 0, label: "Utilisateurs", color: "#10b981" },
            { icon: <Inbox size={16} color="#ef4444" />, value: pendingClaims ?? 0, label: "Demandes en attente", color: "#ef4444" },
          ].map(({ icon, value, label, color }) => (
            <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>{value}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(110,86,207,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={20} color="var(--brand)" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em" }}>
                Panel Administrateur
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{list.length} entreprises · accès restreint</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* Le bouton « Demandes » pointait vers /admin/claims, qui n'a
                jamais eu de page : clic = 404. La revendication d'entreprise
                est dormante (plus de formulaire depuis le retrait de l'espace
                entreprise, 0 demande en attente). La logique serveur
                (approveClaim, emails) est conservée pour son retour. */}
            <Link href="/admin/ads" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "var(--surface2)", border: "1px solid rgba(236,72,153,0.3)", color: "#ec4899", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
              Publicités
            </Link>
            <Link href="/admin/company/new" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "var(--brand)", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
              <Plus size={15} aria-hidden="true" /> Ajouter une entreprise
            </Link>
          </div>
        </div>

        {/* Companies list with search */}
        <AdminCompanyList companies={list} />
      </main>
    </div>
  );
}
