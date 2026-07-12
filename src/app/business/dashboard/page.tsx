import { getBusinessAnalytics } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/server";
import { Star, MessageCircle, TrendingUp, Users, ArrowRight, AlertCircle, Share2, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { ShareCopyButton } from "@/components/ShareCopyButton";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";

export default async function BusinessDashboardPage() {
  const data = await getBusinessAnalytics();

  if ("error" in data && data.error) {
    return <div style={{ padding: 40, color: "var(--text-muted)" }}>{data.error}</div>;
  }

  const { count, avgOverall, avgManagement, avgWorklife, avgCulture, avgCareer, recommendRate, avgSalary, trend, dist, company } = data as Awaited<ReturnType<typeof getBusinessAnalytics>> & { company: Record<string, unknown> };

  // New reviews in last 7 days
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: newReviews } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("company_id", String(company?.id ?? ""))
    .gte("created_at", weekAgo);

  // Profile completeness
  const co = company as Record<string, unknown>;
  const fields = [
    { label: "Description", done: !!co.description },
    { label: "Logo", done: !!co.logo_url },
    { label: "Photo de couverture", done: !!co.cover_url },
    { label: "Site web", done: !!co.website_url },
    { label: "LinkedIn", done: !!co.linkedin_url },
  ];
  const completedCount = fields.filter(f => f.done).length;
  const completionPct = Math.round((completedCount / fields.length) * 100);

  const shareUrl = `${SITE_URL}/company/${co.id}`;

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
    <div className="biz-page" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 6 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
          Voici l&apos;état de votre réputation employeur pour <strong style={{ color: "var(--text)" }}>{String(company?.name ?? "")}</strong>.
        </p>
      </div>

      {/* New reviews banner */}
      {(newReviews ?? 0) > 0 && (
        <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Star size={18} color="#8b5cf6" fill="#8b5cf6" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                {newReviews} nouvel{(newReviews ?? 0) > 1 ? "aux" : ""} avis cette semaine
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Répondez rapidement — les candidats lisent vos réponses.</p>
            </div>
          </div>
          <Link href="/business/dashboard/reviews" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
            Répondre <ArrowRight size={14} />
          </Link>
        </div>
      )}

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

      <div className="biz-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
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
          {/* Scrollable on mobile — bars never get crushed below 36px */}
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", margin: "0 -4px" }}>
            <div style={{ minWidth: 460, display: "flex", gap: 5, padding: "0 4px" }}>
              {(() => {
                const MONTHS_SHORT = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];
                const BAR_H = 72;
                return trend.map(({ month, avg: a }, idx) => {
                  const [y, mo] = month.split("-");
                  const isJan = mo === "01";
                  const showYear = idx === 0 || isJan;
                  const label = showYear
                    ? `${MONTHS_SHORT[parseInt(mo) - 1]} '${y.slice(2)}`
                    : MONTHS_SHORT[parseInt(mo) - 1];
                  const h = a != null ? Math.max(4, (a / 5) * BAR_H) : 4;
                  const color = a == null ? "var(--border)" : a >= 4 ? "#10b981" : a >= 3 ? "#f59e0b" : "#ef4444";
                  return (
                    <div key={month} style={{ flex: 1, minWidth: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <span style={{ fontSize: 9, color, fontWeight: 700, lineHeight: "12px", minHeight: 12 }}>{a ?? "–"}</span>
                      <div style={{ width: "100%", height: BAR_H, display: "flex", alignItems: "flex-end" }}>
                        <div style={{ width: "100%", height: h, background: color, borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
                      </div>
                      <span style={{ fontSize: 8, color: showYear ? "var(--text-sub)" : "var(--text-muted)", fontWeight: showYear ? 700 : 400, whiteSpace: "nowrap", marginTop: 2 }}>
                        {label}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Pub CTA banner */}
      <Link href="/business/dashboard/ads" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
        marginBottom: 20, padding: "20px 24px", borderRadius: 18, textDecoration: "none",
        background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(249,115,22,0.1) 100%)",
        border: "1px solid rgba(139,92,246,0.3)",
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📣</div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 3 }}>Boostez votre visibilité avec une pub</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sponsorisez votre marque auprès de milliers de candidats actifs en Suisse.</p>
          </div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 }}>
          Créer une campagne <ArrowRight size={14} />
        </span>
      </Link>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { href: "/business/dashboard/reviews", label: "Répondre aux avis", desc: "Gérez votre réputation", color: "#8b5cf6" },
          { href: "/business/dashboard/jobs", label: "Publier une offre", desc: "Attirez des candidats", color: "#f97316" },
          { href: "/business/dashboard/profile", label: "Compléter la fiche", desc: "Logo, photos, réseaux", color: "#10b981" },
        ].map(({ href, label, desc, color }) => (
          <Link key={href} href={href} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{desc}</p>
            </div>
            <ArrowRight size={18} color={color} />
          </Link>
        ))}
      </div>

      {/* Bottom row: profile completion + share link */}
      <div className="biz-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Profile completeness */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Complétude de la fiche</p>
            <span style={{ fontSize: 18, fontWeight: 900, color: completionPct === 100 ? "#10b981" : "#f59e0b" }}>{completionPct}%</span>
          </div>
          <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ height: "100%", width: `${completionPct}%`, background: completionPct === 100 ? "#10b981" : "linear-gradient(90deg, #8b5cf6, #f97316)", borderRadius: 3, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {fields.map(({ label, done }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {done
                  ? <CheckCircle size={14} color="#10b981" />
                  : <Clock size={14} color="var(--text-muted)" />
                }
                <span style={{ fontSize: 12, color: done ? "var(--text)" : "var(--text-muted)", fontWeight: done ? 600 : 400 }}>{label}</span>
              </div>
            ))}
          </div>
          {completionPct < 100 && (
            <Link href="/business/dashboard/profile" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16, fontSize: 13, fontWeight: 700, color: "#8b5cf6", textDecoration: "none" }}>
              Compléter ma fiche <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Share link */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Share2 size={16} color="#8b5cf6" />
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Partager en interne</p>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>
            Envoyez ce lien à vos équipes pour les inviter à partager leur expérience. Plus d&apos;avis = plus de visibilité.
          </p>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace", wordBreak: "break-all", marginBottom: 14 }}>
            {shareUrl}
          </div>
          <ShareCopyButton url={shareUrl} />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.5 }}>
            💡 Partagez ce lien par email, Slack, Teams — les avis sont 100% anonymes pour vos employés.
          </p>
        </div>
      </div>
    </div>
  );
}
