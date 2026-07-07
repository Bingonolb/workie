import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, MessageCircle, TrendingUp, Users, Star, Shield, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Espace Entreprise · Workie",
  description: "Revendiquez votre fiche Workie. Répondez aux avis, gérez votre image employeur et accédez aux insights de vos équipes. À partir de 99 CHF/mois.",
};

const FEATURES = [
  { icon: <MessageCircle size={22} color="#8b5cf6" />, bg: "rgba(139,92,246,0.1)", title: "Répondre aux avis", desc: "Donnez votre version des faits. Montrez que vous écoutez. Les candidats lisent vos réponses." },
  { icon: <BarChart3 size={22} color="#f97316" />, bg: "rgba(249,115,22,0.1)", title: "Analytics & insights", desc: "Évolution de votre réputation, points forts/faibles remontés, tendances salariales internes." },
  { icon: <TrendingUp size={22} color="#10b981" />, bg: "rgba(16,185,129,0.1)", title: "Suivi de réputation", desc: "Tableau de bord temps réel. Soyez alerté dès qu'un avis important est publié." },
  { icon: <Users size={22} color="#06b6d4" />, bg: "rgba(6,182,212,0.1)", title: "Offres d'emploi", desc: "Publiez vos offres directement sur votre fiche. Touchez des candidats déjà intéressés par vous." },
  { icon: <Star size={22} color="#f59e0b" fill="#f59e0b" />, bg: "rgba(245,158,11,0.1)", title: "Gestion de la fiche", desc: "Photos, description, logo, réseaux sociaux — contrôlez ce que les candidats voient en premier." },
  { icon: <BadgeCheck size={22} color="#8b5cf6" />, bg: "rgba(139,92,246,0.1)", title: "Badge vérifié", desc: "Un signal fort pour les candidats : vous assumez votre réputation et jouez la transparence." },
];

const RULES = [
  { ok: true, text: "Répondre aux avis" },
  { ok: true, text: "Ajouter logo, photos, description" },
  { ok: true, text: "Publier des offres d'emploi" },
  { ok: true, text: "Consulter les analytics" },
  { ok: true, text: "Badge « Entreprise vérifiée »" },
  { ok: false, text: "Supprimer un avis" },
  { ok: false, text: "Modifier une note" },
  { ok: false, text: "Cacher un commentaire" },
];

export default function BusinessPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 100 }}>
        <Link href="/" style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textDecoration: "none" }}>
          workie
        </Link>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeToggle />
          <Link href="/login" style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--border2)", fontWeight: 600, fontSize: 14, color: "var(--text-muted)", textDecoration: "none" }}>Connexion</Link>
          <Link href="/business/claim" style={{ padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none", background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff" }}>
            Revendiquer ma fiche
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "80px 24px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 50, padding: "6px 16px", marginBottom: 36, fontSize: 13, fontWeight: 700, color: "#8b5cf6" } as React.CSSProperties}>
          <BadgeCheck size={14} /> Espace Entreprise · Offre Fondateurs
        </div>

        <h1 style={{ fontSize: "clamp(32px, 7vw, 60px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", marginBottom: 24, maxWidth: 700, margin: "0 auto 24px" }}>
          Votre réputation employeur,{" "}
          <span style={{ background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            sous contrôle.
          </span>
        </h1>

        <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "var(--text-muted)", maxWidth: 540, lineHeight: 1.7, margin: "0 auto 20px" }}>
          Répondez aux avis, analysez votre attractivité, publiez vos offres. Tout ce dont vous avez besoin pour attirer les meilleurs profils — en toute transparence.
        </p>

        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 48, opacity: 0.7 }}>
          Les 50 premières entreprises bénéficient du tarif fondateur · 99 CHF/mois à vie
        </p>

        {/* Two-path choice */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, maxWidth: 680, margin: "0 auto", textAlign: "left" }}>
          {/* Path A — existing company */}
          <Link href="/business/claim" style={{ display: "flex", flexDirection: "column", gap: 0, padding: "28px 28px 24px", borderRadius: 20, background: "var(--surface)", border: "2px solid rgba(139,92,246,0.3)", textDecoration: "none", transition: "all 0.2s", boxShadow: "0 4px 24px rgba(139,92,246,0.1)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <BadgeCheck size={22} color="#8b5cf6" />
            </div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8b5cf6", marginBottom: 8 }}>Fiche existante</p>
            <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.02em" }}>Revendiquer ma fiche</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
              Mon entreprise est déjà présente sur Workie, des employés ont déjà laissé des avis. Je veux reprendre la main sur ma fiche.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "#8b5cf6" }}>
              Commencer <ArrowRight size={15} />
            </div>
          </Link>

          {/* Path B — new company */}
          <Link href="/business/register" style={{ display: "flex", flexDirection: "column", gap: 0, padding: "28px 28px 24px", borderRadius: 20, background: "var(--surface)", border: "2px solid rgba(16,185,129,0.3)", textDecoration: "none", transition: "all 0.2s", boxShadow: "0 4px 24px rgba(16,185,129,0.08)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Users size={22} color="#10b981" />
            </div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#10b981", marginBottom: 8 }}>Nouvelle fiche</p>
            <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.02em" }}>Créer ma page entreprise</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
              Mon entreprise n&apos;est pas encore sur Workie. Je veux créer ma fiche, la personnaliser et publier mes offres dès aujourd&apos;hui.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "#10b981" }}>
              Créer ma fiche <ArrowRight size={15} />
            </div>
          </Link>
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: "var(--text-muted)", opacity: 0.7 }}>
          Déjà un compte ? <Link href="/business/login" style={{ color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>Se connecter →</Link>
        </p>
      </section>

      {/* Features */}
      <section style={{ padding: "72px 24px", background: "var(--surface2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>Ce que vous obtenez</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 52 }}>
            Des outils pour les RH qui assument.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {FEATURES.map(({ icon, bg, title, desc }) => (
              <div key={title} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "28px 24px" }}>
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

      {/* Ce qu'on ne change pas */}
      <section style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>Transparence totale</p>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Ce qu&apos;un abonnement ne change pas.
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 48 }}>
            La crédibilité de Workie repose sur son indépendance. Aucune entreprise, quelle que soit son abonnement, ne peut influencer les avis publiés.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "left" }}>
            {RULES.map(({ ok, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: ok ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.05)", border: `1px solid ${ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.15)"}`, borderRadius: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{ok ? "✅" : "❌"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: ok ? "var(--text)" : "var(--text-muted)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "72px 24px", background: "var(--surface2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>Tarif</p>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 48 }}>Simple. Sans surprise.</h2>

          <div style={{ background: "var(--surface)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 24, padding: "40px 36px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 16, right: 16, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 50, letterSpacing: "0.05em" }}>
              OFFRE FONDATEURS
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>Compte Entreprise Vérifié</p>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 56, fontWeight: 900, letterSpacing: "-0.04em", color: "var(--text)" }}>99</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-muted)" }}>CHF/mois</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 36 }}>
              ou <strong style={{ color: "var(--text)" }}>890 CHF/an</strong> — 2 mois offerts · Prix garanti à vie pour les fondateurs
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36, textAlign: "left" }}>
              {["Accès complet aux analytics", "Réponses aux avis illimitées", "Publication d'offres d'emploi", "Badge « Entreprise vérifiée »", "Gestion complète de la fiche", "Support prioritaire"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text)" }}>
                  <span style={{ color: "#10b981", fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/business/register" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "15px 0", borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 8px 24px rgba(139,92,246,0.3)" }}>
                Créer ma fiche entreprise <ArrowRight size={16} />
              </Link>
              <Link href="/business/claim" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, background: "var(--surface2)", color: "var(--text-muted)", border: "1px solid var(--border2)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                Ma fiche existe déjà — la revendiquer
              </Link>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 14 }}>Sans engagement · Annulation possible à tout moment</p>
          </div>
        </div>
      </section>

      {/* FAQ rapide */}
      <section style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 48 }}>Questions fréquentes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { q: "Comment prouver que je représente l'entreprise ?", a: "Lors de la demande, vous fournissez votre poste, votre email professionnel (domaine de l'entreprise) et signez notre charte. Notre équipe vérifie chaque demande manuellement sous 48h." },
              { q: "Que se passe-t-il si je résilie ?", a: "Votre fiche publique reste visible, vos réponses aux avis restent affichées. Le badge vérifié et l'accès aux outils sont désactivés. Aucun avis n'est supprimé." },
              { q: "Puis-je supprimer un avis qui me semble injuste ?", a: "Non. C'est notre engagement fondamental envers les employés. Vous pouvez en revanche y répondre publiquement, ce qui est souvent bien plus efficace." },
              { q: "Le prix est-il vraiment garanti ?", a: "Oui. Les 50 premières entreprises qui s'abonnent gardent le tarif 99 CHF/mois à vie, même quand nous augmentons les prix pour les nouveaux clients." },
            ].map(({ q, a }) => (
              <div key={q} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 28px" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>{q}</p>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{ padding: "64px 24px", textAlign: "center", background: "var(--surface2)", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 50, padding: "6px 16px", marginBottom: 28, fontSize: 13, fontWeight: 700, color: "#8b5cf6" } as React.CSSProperties}>
          <Zap size={13} fill="#8b5cf6" /> Il reste des places fondateurs
        </div>
        <h2 style={{ fontSize: "clamp(24px, 5vw, 40px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16 }}>
          Votre réputation vous attend.
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 40 }}>Chaque jour sans réponse, c&apos;est un candidat qui part chez un concurrent.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/business/register" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 32px", borderRadius: 14, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 8px 32px rgba(139,92,246,0.25)" }}>
            Créer ma fiche <ArrowRight size={17} />
          </Link>
          <Link href="/business/claim" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 28px", borderRadius: 14, border: "1px solid var(--border2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            Revendiquer une fiche existante
          </Link>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 16 }}>
          <Shield size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
          Vérification manuelle · Données sécurisées · Sans engagement
        </p>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>© 2026 Workie · 🇨🇭 Made in Switzerland</span>
        <Link href="/" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>← Retour accueil</Link>
      </footer>
    </main>
  );
}
