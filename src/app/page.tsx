import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ArrowRight, Star, Shield, Zap, Eye } from "lucide-react";

export default async function Home() {
  const user = await getUser();
  if (user) redirect("/explore");

  return (
    <main style={{ minHeight: "100dvh", background: "#0d0d13", color: "#f0f0f8", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{
          fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          workie
        </span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/login" style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, fontSize: 14, color: "rgba(240,240,248,0.6)", textDecoration: "none" }}>
            Connexion
          </Link>
          <Link href="/signup" style={{
            padding: "9px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none",
            background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff",
          }}>
            S&apos;inscrire
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 48px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Gradient orbs */}
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)",
          borderRadius: 50, padding: "6px 16px", marginBottom: 36, fontSize: 13, fontWeight: 600,
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(249,115,22,0.15))",
          border: "1px solid rgba(139,92,246,0.2)",
        } as React.CSSProperties}>
          <Zap size={13} color="#8b5cf6" fill="#8b5cf6" />
          <span style={{ background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Avis 100% authentiques · Anonymes
          </span>
        </div>

        <h1 style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.04em", marginBottom: 28, maxWidth: 800 }}>
          Les entreprises suisses,{" "}
          <span style={{ background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            sans filtre.
          </span>
        </h1>

        <p style={{ fontSize: 20, color: "rgba(240,240,248,0.55)", maxWidth: 520, lineHeight: 1.65, marginBottom: 52 }}>
          Swipe des entreprises, lis de vrais avis d&apos;employés, et découvre les salaires réels. Fini le bullshit de Glassdoor.
        </p>

        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/signup" style={{
            display: "flex", alignItems: "center", gap: 10, padding: "16px 32px", borderRadius: 14,
            background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff",
            fontWeight: 700, fontSize: 16, textDecoration: "none",
            boxShadow: "0 8px 32px rgba(139,92,246,0.3)",
          }}>
            Commencer gratuitement <ArrowRight size={18} />
          </Link>
          <Link href="/explore" style={{
            display: "flex", alignItems: "center", gap: 8, padding: "16px 32px", borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,240,248,0.7)",
            fontWeight: 600, fontSize: 16, textDecoration: "none",
          }}>
            <Eye size={18} /> Voir sans s&apos;inscrire
          </Link>
        </div>

        {/* Social proof */}
        <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 24, color: "rgba(240,240,248,0.35)", fontSize: 13 }}>
          <span>🇨🇭 Focalisé Suisse</span>
          <span>·</span>
          <span>🔒 Avis anonymes</span>
          <span>·</span>
          <span>⚡ Données temps réel</span>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "64px 48px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {[
            { icon: <Star size={22} color="#f59e0b" fill="#f59e0b" />, title: "Avis authentiques", desc: "De vrais employés, pas des RH. Notes, commentaires, salaires — tout est là." },
            { icon: <Shield size={22} color="#10b981" />, title: "100% anonyme", desc: "Partage ton expérience sans risque. Ton identité est protégée par défaut." },
            { icon: <Zap size={22} color="#8b5cf6" fill="#8b5cf6" />, title: "Pour la Gen Z", desc: "Une interface pensée pour toi — rapide, claire, sans jargon corporate." },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 24px" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                {icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f8", marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 14, color: "rgba(240,240,248,0.45)", lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 48px", textAlign: "center" }}>
        <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16, letterSpacing: "-0.03em" }}>
          Prêt à voir la vérité ?
        </h2>
        <p style={{ fontSize: 16, color: "rgba(240,240,248,0.45)", marginBottom: 36 }}>
          Rejoins les professionnels suisses qui refusent le bullshit.
        </p>
        <Link href="/signup" style={{
          display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 40px", borderRadius: 14,
          background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff",
          fontWeight: 700, fontSize: 16, textDecoration: "none",
        }}>
          Créer mon compte <ArrowRight size={18} />
        </Link>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 48px", textAlign: "center", fontSize: 13, color: "rgba(240,240,248,0.2)" }}>
        © 2026 Workie · Tous droits réservés · 🇨🇭 Made in Switzerland
      </footer>
    </main>
  );
}
