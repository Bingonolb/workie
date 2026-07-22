import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, getBusinessCompanyData } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardNav } from "./DashboardNav";
import { BottomNav } from "@/components/BottomNav";
import { MobileTopActions } from "@/components/MobileTopActions";

export default async function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, company] = await Promise.all([getUser(), getBusinessCompanyData()]);
  if (!user) redirect("/api/auth/signout?next=/login");
  if (!company) redirect("/business");

  return (
    <>
    <div className="biz-layout" style={{ display: "flex", minHeight: "100dvh", background: "var(--bg)" }}>

      {/* Sidebar */}
      <aside className="biz-sidebar">
        {/* Logo */}
        <div className="biz-sidebar-header" style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>workie</span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", color: "#8b5cf6", marginLeft: 5, textTransform: "uppercase" as const, opacity: 0.9 }}>Business</span>
          </Link>
        </div>

        {/* Company card */}
        <div className="biz-sidebar-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {company.logo_url
              ? <img src={company.logo_url} alt={company.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
              : <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #8b5cf6, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>{(company.name || "?")[0]}</div>
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
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{company.is_subscribed ? "Abonnement actif" : "Sans abonnement"}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <DashboardNav companyId={company.id} />

        {/* Bottom — hidden on mobile (in nav row instead) */}
        <div className="biz-sidebar-header" style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{user.email?.split("@")[0]}</p>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowX: "clip", minWidth: 0 }}>
        {/* Mobile-only header — logo + quick actions + theme toggle */}
        <div className="biz-mobile-header">
          <Link href="/business/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>workie</span>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.04em", color: "#8b5cf6", marginLeft: 5, textTransform: "uppercase" as const }}>Business</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MobileTopActions profileUrl="/business/dashboard/profile" signOutUrl="/api/auth/signout?next=/login" />
            <ThemeToggle />
          </div>
        </div>
        {children}
      </main>

    </div>
    {/* Bottom tab bar — mobile only */}
    <BottomNav isBusiness={true} />
    </>
  );
}
