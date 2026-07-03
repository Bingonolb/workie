import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Shield, Plus, Pencil, ExternalLink, Star, MessageSquare, Users } from "lucide-react";
import type { Company } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/explore");

  const [{ data: companies }, { count: reviewCount }, { count: userCount }] = await Promise.all([
    supabase.from("companies").select("*").order("sector", { ascending: true }).order("name", { ascending: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  const list = (companies ?? []) as Company[];

  const bySector = list.reduce<Record<string, Company[]>>((acc, c) => {
    (acc[c.sector] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px 100px" }}>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { icon: <Users size={16} color="#8b5cf6" />, value: list.length, label: "Entreprises", color: "#8b5cf6" },
            { icon: <MessageSquare size={16} color="#f97316" />, value: reviewCount ?? 0, label: "Avis publiés", color: "#f97316" },
            { icon: <Star size={16} color="#10b981" />, value: userCount ?? 0, label: "Utilisateurs", color: "#10b981" },
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
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={20} color="#8b5cf6" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em" }}>
                Panel Administrateur
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{list.length} entreprises · accès restreint</p>
            </div>
          </div>
          <Link href="/admin/company/new" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none",
          }}>
            <Plus size={15} /> Ajouter une entreprise
          </Link>
        </div>

        {/* Companies by sector */}
        {Object.entries(bySector).map(([sector, companies]) => (
          <div key={sector} style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              {sector} · {companies.length}
            </p>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              {companies.map((c, i) => (
                <div key={c.id} style={{
                  display: "grid", gridTemplateColumns: "48px 1fr auto auto auto",
                  alignItems: "center", gap: 16, padding: "12px 20px",
                  borderBottom: i < companies.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  {/* Cover thumbnail */}
                  <div style={{
                    width: 48, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                    background: "var(--surface2)",
                  }}>
                    {c.cover_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>

                  {/* Name + city */}
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{c.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.city}{c.canton ? `, ${c.canton}` : ""} · {c.employee_range} emp.</p>
                  </div>

                  {/* Rating */}
                  <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    ★ {Number(c.avg_rating).toFixed(1)}
                  </span>

                  {/* Verified badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                    background: c.is_verified ? "rgba(16,185,129,0.12)" : "var(--surface2)",
                    color: c.is_verified ? "#10b981" : "var(--text-muted)",
                    border: c.is_verified ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--border)",
                    whiteSpace: "nowrap",
                  }}>
                    {c.is_verified ? "✓ Vérifié" : "Non vérifié"}
                  </span>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/admin/company/${c.id}`} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)",
                      color: "#8b5cf6", textDecoration: "none",
                    }}>
                      <Pencil size={12} /> Modifier
                    </Link>
                    <Link href={`/company/${c.id}`} target="_blank" style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: 8,
                      background: "var(--surface2)", border: "1px solid var(--border)",
                      color: "var(--text-muted)", textDecoration: "none",
                    }}>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
