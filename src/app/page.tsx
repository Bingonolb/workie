import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { ArrowRight, Star, Shield, Zap, Eye, TrendingUp, MessageCircle, BarChart3, BadgeCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getUser();
  if (user) redirect("/explore");

  const supabase = await createClient();
  const [{ count: companyCount }, { count: reviewCount }] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
  ]);
  const nCompanies = companyCount ?? 0;
  const nReviews = reviewCount ?? 0;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>

      {/* ── Navbar ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 100, backdropFilter: "blur(12px)" }}>
        <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          workie
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeToggle />
          <Link href="/login" className="nav-login-link" style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--border2)", fontWeight: 600, fontSize: 14, color: "var(--text-muted)", textDecoration: "none" }}>
            Connexion
          </Link>
          <Link href="/signup" style={{ padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none", background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff" }}>
            S&apos;inscrire
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 24px 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "5%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "8%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(249,115,22,0.12))", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 50, padding: "6px 16px", marginBottom: 40, fontSize: 13, fontWeight: 600 } as React.CSSProperties}>
          <Zap size={13} color="#8b5cf6" fill="#8b5cf6" />
          <span style={{ background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Avis 100% anonymes · Salaires réels · 🇨🇭
          </span>
        </div>

        <h1 style={{ fontSize: "clamp(38px, 8vw, 72px)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.04em", marginBottom: 28, maxWidth: 820 }}>
          Les entreprises suisses,{" "}
          <span style={{ background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            sans filtre.
          </span>
        </h1>

        <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "var(--text-muted)", maxWidth: 520, lineHeight: 1.7, marginBottom: 52 }}>
          Avis d&apos;employés, salaires réels, ambiance de travail — tout ce que les offres d&apos;emploi ne disent jamais.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 56 }}>
          <Link href="/signup" style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 32px", borderRadius: 14, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: "0 8px 32px rgba(139,92,246,0.3)" }}>
            Commencer gratuitement <ArrowRight size={18} />
          </Link>
          <Link href="/explore" style={{ display: "flex", alignItems: "center", gap: 8, padding: "15px 28px", borderRadius: 14, border: "1px solid var(--border2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 15, textDecoration: "none" }}>
            <Eye size={18} /> Voir sans compte
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 18, overflow: "hidden", width: "100%", maxWidth: 520 }}>
          {[
            { value: nCompanies.toLocaleString("fr-CH"), label: "entreprises", color: "#8b5cf6" },
            { value: nReviews > 0 ? nReviews.toLocaleString("fr-CH") : "bientôt", label: "avis", color: "#f97316" },
            { value: "100%", label: "anonyme", color: "#10b981" },
          ].map(({ value, label, color }, i) => (
            <div key={label} style={{ flex: 1, padding: "18px 12px", textAlign: "center", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
              <p style={{ fontSize: "clamp(18px, 4vw, 26px)", fontWeight: 900, color, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section style={{ padding: "72px 24px", background: "var(--surface2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>Comment ça marche</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(24px, 5vw, 40px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 52 }}>
            Trois étapes, zéro compromis.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {[
              { n: "01", icon: "🔍", title: "Recherche", desc: "Par nom, canton ou secteur. Plus de 1 500 entreprises suisses référencées, des PME aux multinationales." },
              { n: "02", icon: "📖", title: "Explore", desc: "Management, culture, salaires, évolution de carrière — des retours d'employés actuels et anciens." },
              { n: "03", icon: "✍️", title: "Contribue", desc: "Partage ton expérience anonymement. Chaque avis renforce la valeur de la plateforme pour tous." },
            ].map(({ n, icon, title, desc }) => (
              <div key={n} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "32px 28px", position: "relative", overflow: "hidden" }}>
                <span style={{ position: "absolute", top: 20, right: 20, fontSize: 12, fontWeight: 800, color: "var(--border2)", letterSpacing: "0.05em" }}>{n}</span>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>Pourquoi Workie</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(24px, 5vw, 40px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 52 }}>
            L&apos;information que tu mérites.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {[
              { icon: <Star size={22} color="#f59e0b" fill="#f59e0b" />, bg: "rgba(245,158,11,0.1)", title: "Avis authentiques", desc: "Chaque avis est soumis à une charte de bonne foi. Aucun contenu sponsorisé, aucune intervention des entreprises." },
              { icon: <Shield size={22} color="#10b981" />, bg: "rgba(16,185,129,0.1)", title: "Anonymat garanti", desc: "Ton identité n'est jamais exposée. Tu partages librement, sans conséquences professionnelles." },
              { icon: <TrendingUp size={22} color="#8b5cf6" />, bg: "rgba(139,92,246,0.1)", title: "Salaires réels", desc: "Des chiffres concrets, partagés anonymement par des employés en poste. Sache exactement ce que vaut ton profil." },
              { icon: <MessageCircle size={22} color="#f97316" />, bg: "rgba(249,115,22,0.1)", title: "Simple et direct", desc: "Une expérience pensée pour aller à l'essentiel — chercher, comparer, décider." },
            ].map(({ icon, bg, title, desc }) => (
              <div key={title} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 20, padding: "28px 24px" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA employés ── */}
      <section style={{ padding: "72px 24px", background: "var(--surface2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>✦</div>
          <h2 style={{ fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Commence à explorer.
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 40 }}>
            Gratuit, anonyme, et entièrement dédié au marché du travail suisse.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 36px", borderRadius: 14, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: "0 8px 32px rgba(139,92,246,0.25)" }}>
              Créer mon compte gratuit <ArrowRight size={18} />
            </Link>
            <Link href="/ranking" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 28px", borderRadius: 14, border: "1px solid var(--border2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 15, textDecoration: "none" }}>
              Voir le classement
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section Entreprises (discrète, en bas) ── */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div className="landing-biz-grid" style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(249,115,22,0.04))",
            border: "1px solid rgba(139,92,246,0.15)",
            borderRadius: 24, padding: "48px 40px",
          }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 50, padding: "4px 12px", marginBottom: 20, fontSize: 12, fontWeight: 700, color: "#8b5cf6" }}>
                <BadgeCheck size={13} /> Pour les entreprises
              </div>
              <h2 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>
                Votre entreprise est sur Workie.
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24, maxWidth: 480 }}>
                Revendiquez votre fiche pour répondre aux avis, gérer votre image employeur et accéder aux insights de vos employés. Badge vérifié inclus.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                {["Répondre aux avis", "Stats & insights", "Offres d'emploi", "Badge vérifié"].map(f => (
                  <span key={f} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 50, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text-muted)" }}>
                    ✓ {f}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <Link href="/business" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "#8b5cf6", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                  Revendiquer ma fiche <ArrowRight size={16} />
                </Link>
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
                  À partir de <strong style={{ color: "var(--text)" }}>99 CHF/mois</strong>
                </span>
              </div>
            </div>
            <div className="landing-biz-grid-aside" style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: <BarChart3 size={20} color="#8b5cf6" />, label: "Analytics avancés" },
                  { icon: <MessageCircle size={20} color="#f97316" />, label: "Répondre aux avis" },
                  { icon: <svg viewBox="0 0 22 22" style={{ width: 20, height: 20 }}><circle cx="11" cy="11" r="11" fill="#1D9BF0" /><path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" /></svg>, label: "Badge vérifié" },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, minWidth: 180 }}>
                    {icon}
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>© 2026 Workie · 🇨🇭 Made in Switzerland</span>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { href: "/explore", label: "Explorer" },
            { href: "/ranking", label: "Classement" },
            { href: "/jobs", label: "Offres d'emploi" },
            { href: "/salaires", label: "Salaires" },
            { href: "/business", label: "Entreprises" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontWeight: 500 }}>{label}</Link>
          ))}
        </div>
      </footer>

    </main>
  );
}
