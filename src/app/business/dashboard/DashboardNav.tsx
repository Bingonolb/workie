"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Star, BarChart3, Briefcase, Settings, Eye, ArrowLeft } from "lucide-react";

const NAV = [
  { href: "/business/dashboard", label: "Vue d'ensemble", icon: <LayoutDashboard size={17} />, exact: true },
  { href: "/business/dashboard/reviews", label: "Avis & Réponses", icon: <Star size={17} /> },
  { href: "/business/dashboard/analytics", label: "Analytics", icon: <BarChart3 size={17} /> },
  { href: "/business/dashboard/jobs", label: "Offres d'emploi", icon: <Briefcase size={17} /> },
  { href: "/business/dashboard/profile", label: "Ma fiche", icon: <Settings size={17} /> },
];

export function DashboardNav({ companyId }: { companyId: string }) {
  const pathname = usePathname();

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

        <Link
          href={`/company/${companyId}?preview=1`}
          target="_blank"
          className="biz-nav-link"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#8b5cf6", textDecoration: "none" }}
        >
          <Eye size={17} /> Voir comme un employé
        </Link>

        <Link
          href="/"
          className="biz-nav-link"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}
        >
          <ArrowLeft size={17} /> Retour au site
        </Link>
      </nav>
    </>
  );
}
