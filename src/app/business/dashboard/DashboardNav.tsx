"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Star, BarChart3, Briefcase, Settings, Eye, LogOut, Compass, Trophy, Megaphone, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/business/dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} aria-hidden="true" />, exact: true },
  { href: "/business/dashboard/reviews", label: "Avis & Réponses", icon: <Star size={17} aria-hidden="true" /> },
  { href: "/business/dashboard/analytics", label: "Analytics", icon: <BarChart3 size={17} aria-hidden="true" /> },
  { href: "/business/dashboard/jobs", label: "Offres d'emploi", icon: <Briefcase size={17} aria-hidden="true" /> },
  { href: "/business/dashboard/ads", label: "Publicités", icon: <Megaphone size={17} aria-hidden="true" /> },
  { href: "/business/dashboard/profile", label: "Ma fiche", icon: <Settings size={17} aria-hidden="true" /> },
  { href: "/business/dashboard/subscription", label: "Abonnement", icon: <CreditCard size={17} aria-hidden="true" /> },
];

const EXPLORE_NAV = [
  { href: "/explore", label: "Explorer", icon: <Compass size={17} aria-hidden="true" /> },
  { href: "/ranking", label: "Classement", icon: <Trophy size={17} aria-hidden="true" /> },
];

export function DashboardNav({ companyId }: { companyId: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <>
      <style>{`
        .biz-nav-link { transition: background 0.15s, color 0.15s; }
        .biz-nav-link:hover { background: var(--surface2) !important; color: var(--text) !important; }
      `}</style>
      <nav style={{ flex: 1, padding: "12px 12px" }}>
        {NAV.map(({ href, label, icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="biz-nav-link"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                fontSize: 13, fontWeight: active ? 700 : 600,
                color: active ? "var(--text)" : "var(--text-muted)",
                background: active ? "var(--surface2)" : "transparent",
                textDecoration: "none", marginBottom: 2,
                borderLeft: active ? "2px solid #8b5cf6" : "2px solid transparent",
              }}
            >
              <span style={{ color: active ? "#8b5cf6" : "inherit", display: "flex" }}>{icon}</span>
              {label}
            </Link>
          );
        })}

        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

        {EXPLORE_NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "?");
          return (
            <Link key={href} href={href} className="biz-nav-link" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10,
              fontSize: 13, fontWeight: active ? 700 : 600,
              color: active ? "var(--text)" : "var(--text-muted)",
              background: active ? "var(--surface2)" : "transparent",
              textDecoration: "none", marginBottom: 2,
              borderLeft: active ? "2px solid #f97316" : "2px solid transparent",
            }}>
              <span style={{ color: active ? "#f97316" : "inherit", display: "flex" }}>{icon}</span>
              {label}
            </Link>
          );
        })}

        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

        <Link
          href={`/company/${companyId}?preview=1`}
          target="_blank"
          className="biz-nav-link"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#8b5cf6", textDecoration: "none" }}
        >
          <Eye size={17} aria-hidden="true" /> Voir comme un employé
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="biz-nav-link"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#ef4444", background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
        >
          <LogOut size={17} aria-hidden="true" /> Se déconnecter
        </button>
      </nav>
    </>
  );
}
