import { getBusinessAnalytics } from "@/lib/actions/business";
import { Star, MessageCircle, TrendingUp, Users, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function BusinessDashboardPage() {
  const data = await getBusinessAnalytics();

  if ("error" in data && data.error) {
    return <div style={{ padding: 40, color: "var(--text-muted)" }}>{data.error}</div>;
  }

  const { count, avgOverall, avgManagement, avgWorklife, avgCulture, avgCareer, recommendRate, avgSalary, trend, dist, company } = data as Awaited<ReturnType<typeof getBusinessAnalytics>> & { company: Record<string, unknown> };

  const kpis = [
    { label: "Note globale", value: avgOverall ?? "–", suffix: "/5", color: "#f59e0b", icon: <Star size={20} color="#f59e0b" fill="#f59e0b" /> },
    { label: "Total avis", value: count, suffix: "", color: "#8b5cf6", icon: <MessageCircle size={20} color="#8b5cf6" /> },
    { label: "Recommandent", value: recommendRate !== null ? `${recommendRate}%` : "–", suffix: "", color: "#10b981", icon: <TrendingUp size={20} color="#10b981" /> },
    { label: "Salaire moyen", value: avgSalary ? `${(avgSalary / 1000).toFixed(0)}k` : "–", suffix: " CHF", color: "#f97316", icon: <Users size={20} color="#f97316" /> },
  ];

  const categoryRatings = [
    { label: "Management", value: avgManagement },
    { label: "Vie pro/perso", value: avgWorklife },
    { label: "Culture", value: avgCulture },
    { label: "Évolution", value: avgCareer },
  ];

  const maxDist = Math.max(...(dist?.map((d: { count: number }) => d.count) ?? [1]), 1);

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 6 }}>
          Bonjour 👋
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
          Voici l&apos;état de votre réputation employeur pour <strong style={{ color: "var(--text)" }}>{String(company?.name ?? "")}</strong>.
        </p>
      </div>

      {/* No reviews banner */}
      {count === 0 && (
        <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: "20px 24px", marginBottom: 32, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <AlertCircle size={20} color="#8b5cf6" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Aucun avis pour le moment</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Les données analytics apparaîtront dès que des employés auront partagé leur expérience. Partagez votre lien Workie en interne pour accélérer.
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {kpis.map(({ label, value, suffix, color, icon }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              {icon}
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{label}</span>
            </div>
            <p style={{ fontSize: 30, fontWeight: 900, color, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {value}<span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>{suffix}</span>
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        {/* Catégories */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Notes par catégorie</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {categoryRatings.map(({ label, value }) => {
              const num = parseFloat(String(value));
              const pct = isNaN(num) ? 0 : (num / 5) * 100;
              const color = num >= 4 ? "#10b981" : num >= 3 ? "#f59e0b" : "#ef4444";
              return (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{isNaN(num) ? "–" : num.toFixed(1)}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--surface3, var(--border))", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution étoiles */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Distribution des notes</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[5, 4, 3, 2, 1].map(star => {
              const item = dist?.find((d: { star: number }) => d.star === star);
              const cnt = item?.count ?? 0;
              const pct = maxDist > 0 ? (cnt / maxDist) * 100 : 0;
              return (
                <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", width: 14, textAlign: "right", flexShrink: 0 }}>{star}</span>
                  <span style={{ fontSize: 12 }}>⭐</span>
                  <div style={{ flex: 1, height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#f59e0b", borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", width: 20, textAlign: "right", flexShrink: 0 }}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trend */}
      {trend && trend.length > 0 && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px", marginBottom: 32 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Évolution de la note (12 derniers mois)</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
            {trend.map(({ month, avg: a }) => {
              const h = Math.max(8, (a / 5) * 80);
              const color = a >= 4 ? "#10b981" : a >= 3 ? "#f59e0b" : "#ef4444";
              return (
                <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{a}</span>
                  <div style={{ width: "100%", height: h, background: color, borderRadius: 4, opacity: 0.8 }} />
                  <span style={{ fontSize: 9, color: "var(--text-muted)", transform: "rotate(-30deg)", transformOrigin: "center" }}>{month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { href: "/business/dashboard/reviews", label: "Répondre aux avis", desc: "Gérez votre réputation", color: "#8b5cf6" },
          { href: "/business/dashboard/jobs", label: "Publier une offre", desc: "Attirez des candidats", color: "#f97316" },
          { href: "/business/dashboard/profile", label: "Compléter la fiche", desc: "Logo, photos, réseaux", color: "#10b981" },
        ].map(({ href, label, desc, color }) => (
          <Link key={href} href={href} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, transition: "border-color 0.15s" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{desc}</p>
            </div>
            <ArrowRight size={18} color={color} />
          </Link>
        ))}
      </div>
    </div>
  );
}
