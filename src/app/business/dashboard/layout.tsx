import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LayoutDashboard, Star, BarChart3, Briefcase, Settings, Eye, ArrowLeft } from "lucide-react";

const NAV = [
  { href: "/business/dashboard", label: "Vue d'ensemble", icon: <LayoutDashboard size={17} />, exact: true },
  { href: "/business/dashboard/reviews", label: "Avis & Réponses", icon: <Star size={17} /> },
  { href: "/business/dashboard/analytics", label: "Analytics", icon: <BarChart3 size={17} /> },
  { href: "/business/dashboard/jobs", label: "Offres d'emploi", icon: <Briefcase size={17} /> },
  { href: "/business/dashboard/profile", label: "Ma fiche", icon: <Settings size={17} /> },
];

export default async function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, claimed_company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.claimed_company_id) redirect("/business");

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, is_verified, is_subscribed, logo_url")
    .eq("id", profile.claimed_company_id)
    .maybeSingle();

  if (!company) redirect("/business");
  // Admins always bypass the subscription check
  const isAdmin = profile.role === "admin";
  if (!company.is_subscribed && !isAdmin) redirect("/business/checkout");

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--bg)" }}>

      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0, borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        background: "var(--surface)",
        position: "sticky", top: 0, height: "100dvh", overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>workie</span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", color: "#8b5cf6", marginLeft: 5, textTransform: "uppercase" as const, opacity: 0.9 }}>Business</span>
          </Link>
        </div>

        {/* Company card */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {company.logo_url
              ? <img src={company.logo_url} alt={company.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
              : <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #8b5cf6, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>{company.name[0]}</div>
            }
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company.name}</p>
                {company.is_verified && (
                  <svg viewBox="0 0 22 22" style={{ width: 14, height: 14, flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
                    <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
                  </svg>
                )}
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Abonnement actif</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 12px" }}>
          {NAV.map(({ href, label, icon }) => (
            <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none", marginBottom: 2, transition: "all 0.15s" }}
              className="biz-nav-link">
              {icon} {label}
            </Link>
          ))}

          <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

          <Link href={`/company/${company.id}?preview=1`} target="_blank"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#8b5cf6", textDecoration: "none" }}>
            <Eye size={17} /> Voir comme un employé
          </Link>

          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
            <ArrowLeft size={17} /> Retour au site
          </Link>
        </nav>

        {/* Bottom */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{user.email?.split("@")[0]}</p>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowX: "hidden", minWidth: 0 }}>
        {children}
      </main>

      <style>{`
        .biz-nav-link:hover { background: var(--surface2); color: var(--text); }
      `}</style>
    </div>
  );
}
