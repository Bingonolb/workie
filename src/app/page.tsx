import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowRight, Search, BarChart3, PenLine, ShieldCheck, Lock, FileText,
         GraduationCap, Briefcase, Landmark, Home as IconeMaison, Check } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LandingFaq } from "@/components/LandingFaq";

export const revalidate = 300; // ISR — redirect for logged-in users handled in middleware

const getLandingCounts = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const [{ count: companyCount }, { count: reviewCount }] = await Promise.all([
      admin.from("companies").select("*", { count: "exact", head: true }),
      admin.from("reviews").select("*", { count: "exact", head: true }),
    ]);
    return { companies: companyCount ?? 0, reviews: reviewCount ?? 0 };
  },
  ["landing-counts"],
  { revalidate: 300, tags: ["landing-counts"] }
);

export const metadata: Metadata = {
  title: "Workie : avis d'employés et salaires réels en Suisse",
  description: "Découvrez les avis anonymes d'employés, les salaires réels et les offres d'emploi des entreprises suisses. Comparez, choisissez, évoluez.",
  openGraph: {
    title: "Workie : avis d'employés et salaires réels en Suisse",
    description: "Avis anonymes, salaires réels, classement des meilleurs employeurs suisses.",
    url: "https://www.workie.ch",
    siteName: "Workie",
    type: "website",
    locale: "fr_CH",
    images: [{ url: "https://www.workie.ch/og-default.png", width: 1200, height: 630, alt: "Workie : avis et salaires en Suisse" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Workie : avis d'employés et salaires réels en Suisse",
    description: "Avis anonymes, salaires réels, classement des meilleurs employeurs suisses.",
    images: ["https://www.workie.ch/og-default.png"],
  },
  alternates: { canonical: "https://www.workie.ch" },
};

export default async function Home() {
  const counts = await getLandingCounts();
  const nCompanies = counts.companies;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      {/* Pas de WebSite déclaré ici : le layout en publie déjà un, plus
          complet, sur toutes les pages. Deux entités WebSite pour une même
          URL obligent Google à choisir laquelle décrit le site. */}

      {/* ── Navbar ── */}
      <nav className="landing-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 100 }}>
        <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          workie
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeToggle />
          <Link href="/login" className="nav-login-link" style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--border2)", fontWeight: 600, fontSize: 14, color: "var(--text-muted)", textDecoration: "none" }}>
            Connexion
          </Link>
          {/* Accent plein, pas le dégradé : le dégradé est celui du logo et il
              perd sa valeur d'emblème s'il habille aussi les boutons. */}
          <Link href="/signup" style={{ padding: "9px 18px", borderRadius: 8, fontWeight: 650, fontSize: 14, textDecoration: "none", background: "var(--brand)", color: "#fff" }}>
            S&apos;inscrire
          </Link>
        </div>
      </nav>

      {/* ── Hero ──
          Aligné à gauche et non centré : un texte centré sur toute la largeur
          n'a pas de point d'entrée pour l'œil, et c'est la mise en page qu'on
          obtient quand aucune décision n'a été prise. Plus de dégradé sur le
          titre ni sur les boutons, plus de taches colorées en fond : un seul
          accent, employé avec parcimonie. Le logo garde le sien. */}
      <section className="landing-hero-deux-col">
        <div>
          <h1 style={{ fontSize: "clamp(34px, 5.2vw, 58px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.035em", marginBottom: 22, maxWidth: 620 }}>
            Ce que vaut vraiment un employeur suisse.
          </h1>

          <p style={{ fontSize: "clamp(16px, 1.6vw, 19px)", color: "var(--text-sub)", maxWidth: 560, lineHeight: 1.65, marginBottom: 34 }}>
            Notes détaillées, salaires réels et conditions de travail, publiés
            anonymement par celles et ceux qui y travaillent.
          </p>

          <div className="hero-cta-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 34 }}>
            <Link href="/explore" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 26px", borderRadius: 10, background: "var(--brand)", color: "#fff", fontWeight: 650, fontSize: 15.5, textDecoration: "none" }}>
              Consulter les entreprises <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", padding: "14px 24px", borderRadius: 10, border: "1px solid var(--border2)", color: "var(--text)", fontWeight: 600, fontSize: 15.5, textDecoration: "none" }}>
              Créer un compte
            </Link>
          </div>

          {/* Les chiffres qui portent la crédibilité.
              Le nombre d'avis a disparu du bandeau : il est de dix-huit, et
              l'annoncer en grand sur la première page dit surtout que le site
              est vide. « Aucun texte libre » le remplace, et c'est l'argument
              le plus fort de la plateforme : il n'était nulle part. */}
          <div className="landing-chiffres">
            {[
              { valeur: nCompanies.toLocaleString("fr-CH"), libelle: "entreprises référencées" },
              { valeur: "26", libelle: "cantons couverts" },
              { valeur: "8", libelle: "critères notés" },
              { valeur: "0", libelle: "texte libre" },
            ].map(({ valeur, libelle }) => (
              <div key={libelle}>
                <p style={{ fontSize: 25, fontWeight: 750, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{valeur}</p>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.35 }}>{libelle}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Aperçu du produit.
            Construit en balisage plutôt qu'en image : net à toute résolution,
            suit le thème clair comme sombre, et ne se périme pas quand la
            fiche évolue. Rien ne crédibilise autant que de montrer ce qu'on
            vend, et la page n'en montrait rien. */}
        <div className="landing-apercu" aria-hidden="true">
          <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 16, padding: 22, boxShadow: "0 18px 50px rgba(0,0,0,0.13)" }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>
              Synthèse des avis
            </p>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 0.9 }}>4.2</span>
              <span style={{ fontSize: 12.5, color: "var(--text-muted)", paddingBottom: 4 }}>sur 34 avis</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
              {[
                { l: "Management", v: 78 },
                { l: "Vie pro / perso", v: 86 },
                { l: "Rémunération", v: 64 },
                { l: "Évolution", v: 71 },
              ].map(({ l, v }) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ flex: "1 1 0", fontSize: 12.5, color: "var(--text-muted)" }}>{l}</span>
                  <div style={{ flex: "0 0 92px", height: 5, background: "var(--surface3)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${v}%`, height: "100%", background: "var(--brand)", borderRadius: 3 }} />
                  </div>
                  <span style={{ flex: "0 0 26px", textAlign: "right", fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    {(v / 20).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 15, borderTop: "1px solid var(--border)" }}>
              {[
                { g: "82%", p: "recommandent" },
                { g: "CHF 96k", p: "salaire médian" },
              ].map(({ g, p }) => (
                <div key={p} style={{ display: "flex", alignItems: "baseline", gap: 6, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 9, padding: "7px 12px" }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{g}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="landing-section" style={{ padding: "72px 24px", background: "var(--surface2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <p className="landing-eyebrow">Comment ça marche</p>
          <h2 className="landing-h2">Trois étapes, aucune concession.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 22 }}>
            {[
              { n: "01", Icone: Search, titre: "Chercher",
                desc: "Par nom, canton ou secteur. Des PME aux multinationales, dans toute la Suisse." },
              { n: "02", Icone: BarChart3, titre: "Comparer",
                desc: "Management, culture, rémunération, évolution : huit critères notés par des employés en poste et d'anciens collaborateurs." },
              { n: "03", Icone: PenLine, titre: "Contribuer",
                desc: "Vous notez votre expérience anonymement. Chaque contribution rend la suivante plus utile." },
            ].map(({ n, Icone, titre, desc }) => (
              <div key={n} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "26px 24px", position: "relative" }}>
                <span style={{ position: "absolute", top: 22, right: 22, fontSize: 11.5, fontWeight: 700, color: "var(--border2)", letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums" }}>{n}</span>
                <Icone size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />
                <h3 style={{ fontSize: 16.5, fontWeight: 700, color: "var(--text)", margin: "15px 0 9px" }}>{titre}</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.62 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bande photographique ──
          Trois sections de cartes se suivaient, avec le même chapeau centré et
          le même titre : cette monotonie est la signature d'un gabarit. Une
          image pleine largeur donne à la page un moment, et une respiration.

          Un lieu plutôt que des personnes : la photographie de bureau avec des
          collaborateurs souriants est le cliché qui déclasse une page. Zurich
          sur la Limmat situe la plateforme sans rien prétendre. */}
      <section className="landing-bande" aria-hidden="false">
        <div className="landing-bande-voile" />
        <div className="landing-bande-texte">
          <p style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.025em", color: "#fff", maxWidth: 760 }}>
            Un employeur se choisit sur des faits, pas sur une réputation.
          </p>
          <p style={{ fontSize: "clamp(14px, 1.5vw, 16.5px)", color: "rgba(255,255,255,0.72)", lineHeight: 1.65, maxWidth: 620, marginTop: 18 }}>
            {nCompanies.toLocaleString("fr-CH")} entreprises suisses, notées sur huit
            critères par celles et ceux qui y travaillent.
          </p>
        </div>
      </section>

      {/* ── Pour qui ──
          Section absente jusqu'ici. Une page qui parle à tout le monde en
          général ne parle à personne en particulier : nommer les situations
          permet à chacun de se reconnaître, de l'étudiant au cadre confirmé. */}
      <section className="landing-section" style={{ padding: "84px 24px" }}>
        <div className="landing-pourqui">
          <div>
            <p className="landing-eyebrow" style={{ textAlign: "left" }}>Pour qui</p>
            <h2 style={{ fontSize: "clamp(24px, 3.4vw, 36px)", fontWeight: 750, letterSpacing: "-0.032em", lineHeight: 1.18, maxWidth: 380 }}>
              Quatre façons de s&apos;en servir.
            </h2>
          </div>

          {/* Une liste, pas une quatrième grille de cartes. Le filet fin et le
              retrait suffisent à séparer les entrées, et le texte respire. */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { Icone: GraduationCap, titre: "Vous terminez vos études",
                desc: "Savoir ce que paie réellement un premier poste dans votre domaine, et chez qui l'on apprend." },
              { Icone: Briefcase, titre: "Vous envisagez de changer",
                desc: "Comparer votre employeur actuel à ceux qui recrutent, sur des critères précis plutôt que sur une réputation." },
              { Icone: Landmark, titre: "Vous êtes dans le public",
                desc: "Mesurer l'écart réel avec le privé, rémunération, charge et flexibilité comprises." },
              { Icone: IconeMaison, titre: "Vous reprenez une activité",
                desc: "Repérer les employeurs dont les anciens saluent la souplesse d'horaires et l'accueil des retours." },
            ].map(({ Icone, titre, desc }, i) => (
              <div key={titre} style={{
                display: "flex", gap: 18, padding: "22px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--border)",
              }}>
                <Icone size={19} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} />
                <div>
                  <h3 style={{ fontSize: 16.5, fontWeight: 700, color: "var(--text)", marginBottom: 7 }}>{titre}</h3>
                  <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 520 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ce qui rend l'information fiable ──
          Ces garanties n'existaient que dans la foire aux questions, tout en
          bas. Ce sont pourtant elles qui distinguent la plateforme, et la
          première d'entre elles, l'absence de texte libre, est aussi ce qui la
          protège juridiquement. */}
      <section className="landing-section" style={{ padding: "72px 24px", background: "var(--surface2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <p className="landing-eyebrow">Ce qui rend l&apos;information fiable</p>
          <h2 className="landing-h2">Des garanties vérifiables.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 22 }}>
            {[
              { Icone: FileText, titre: "Aucun texte libre",
                desc: "Un avis ne contient que des notes et le contexte du poste. Ni récit inventé, ni règlement de comptes, ni message écrit par l'entreprise elle-même." },
              { Icone: Lock, titre: "Anonymat par construction",
                desc: "Votre nom n'est jamais publié, et aucune page ne relie un compte à un avis. Ce n'est pas un réglage, c'est la façon dont les données sont servies." },
              { Icone: ShieldCheck, titre: "Contrôles à la publication",
                desc: "Adresse confirmée, compte de plus de vingt-quatre heures, un seul avis par entreprise, et une modération alimentée par les signalements." },
            ].map(({ Icone, titre, desc }) => (
              <div key={titre} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "26px 24px" }}>
                <Icone size={20} color="var(--brand)" strokeWidth={1.75} aria-hidden="true" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "15px 0 9px" }}>{titre}</h3>
                <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.62 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Appel à l'action ── */}
      <section className="landing-section" style={{ padding: "76px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px, 3.6vw, 34px)", fontWeight: 750, letterSpacing: "-0.03em", marginBottom: 14 }}>
            Commencez par votre secteur.
          </h2>
          <p style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 32 }}>
            La consultation est libre et ne demande pas de compte.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/explore" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 30px", borderRadius: 10, background: "var(--brand)", color: "#fff", fontWeight: 650, fontSize: 15.5, textDecoration: "none" }}>
              Consulter les entreprises <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/ranking" style={{ display: "inline-flex", alignItems: "center", padding: "14px 26px", borderRadius: 10, border: "1px solid var(--border2)", color: "var(--text)", fontWeight: 600, fontSize: 15.5, textDecoration: "none" }}>
              Voir le classement
            </Link>
          </div>
        </div>
      </section>

      {/* ── Publicité ── */}
      <section style={{ padding: "68px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <div className="landing-ads-grid">
            <div>
              <p className="landing-eyebrow" style={{ textAlign: "left" }}>Annonceurs</p>
              <h2 style={{ fontSize: "clamp(21px, 2.8vw, 28px)", fontWeight: 750, letterSpacing: "-0.03em", marginBottom: 13 }}>
                Touchez des candidats actifs en Suisse.
              </h2>
              <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 22, maxWidth: 520 }}>
                Que vous représentiez une entreprise ou un projet personnel, vous
                diffusez une annonce sans abonnement. Vous fixez votre budget et
                votre ciblage, et vous ne payez que ce que vous consommez.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {[
                  "À partir de CHF 5 par jour",
                  "Paiement unique",
                  "Ciblage par canton et secteur",
                  "Statistiques en temps réel",
                  "Sans abonnement",
                ].map(f => (
                  <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 550, padding: "5px 12px", borderRadius: 50, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text-muted)" }}>
                    <Check size={12} color="var(--brand)" strokeWidth={2.5} aria-hidden="true" /> {f}
                  </span>
                ))}
              </div>
              <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, background: "var(--brand)", color: "#fff", fontWeight: 650, fontSize: 14.5, textDecoration: "none" }}>
                Créer une campagne <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            {/* Même tarif pour les deux formats : rien n'établit qu'une
                impression en plein écran vaille davantage, et deux prix pour
                un service dont on ignore encore le rendement se défendent mal
                auprès d'un annonceur. */}
            <div className="landing-ads-aside" style={{ flexDirection: "column", gap: 10, minWidth: 210 }}>
              {[
                { label: "Format carré", desc: "Dans la grille des entreprises" },
                { label: "Format plein écran", desc: "Dans le swipe, toutes les dix cartes" },
              ].map(({ label, desc }) => (
                <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "15px 18px" }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{label}</p>
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5 }}>{desc}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--brand)", marginTop: 7 }}>dès CHF 4 pour mille affichages</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <LandingFaq />

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "36px 24px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, marginBottom: 32 }}>
            <div>
              <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "block", marginBottom: 8 }}>workie</span>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>La transparence du marché du travail suisse.</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Explorer</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[{ href: "/explore", label: "Entreprises" }, { href: "/ranking", label: "Classement" }, { href: "/salaires", label: "Salaires" }, { href: "/jobs", label: "Offres d'emploi" }, { href: "/profile/ads", label: "Faire de la publicité" }].map(({ href, label }) => (
                  <Link key={href} href={href} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Légal</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[{ href: "/cgu", label: "CGU" }, { href: "/confidentialite", label: "Confidentialité" }].map(({ href, label }) => (
                  <Link key={href} href={href} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>© 2026 Workie</span>
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Plateforme suisse, données hébergées en Europe</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
