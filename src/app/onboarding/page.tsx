"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Flame, Star, Heart, ChevronRight, ArrowRight } from "lucide-react";

const STEPS = [
  {
    icon: "🔍",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
    title: "Explorer les entreprises",
    desc: "1 700+ entreprises suisses avec des avis 100% anonymes. Filtre par secteur, canton, ou note.",
    visual: <ExploreVisual />,
  },
  {
    icon: "👆",
    color: "#f97316",
    bg: "rgba(249,115,22,0.1)",
    title: "Swipe pour découvrir",
    desc: "Passe en mode Swipe pour découvrir les entreprises une par une — comme Tinder, mais pour ton prochain emploi.",
    visual: <SwipeVisual />,
  },
  {
    icon: "💰",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    title: "Les vrais salaires",
    desc: "Salaires réels partagés anonymement. Compare par poste, secteur et expérience avant de négocier.",
    visual: <SalairesVisual />,
  },
  {
    icon: "❤️",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    title: "Sauvegarde tes favoris",
    desc: "Ajoute des entreprises à tes favoris pour les retrouver facilement. Et donne une flamme 🔥 aux meilleures.",
    visual: <FavVisual />,
  },
  {
    icon: "⭐",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    title: "Partage ton expérience",
    desc: "Ton avis aide des milliers de personnes à choisir leur employeur. Anonyme, toujours.",
    visual: <ReviewVisual />,
  },
];

function ExploreVisual() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {["Google Zürich", "Nestlé Vevey", "Novartis Basel"].map((name, i) => (
        <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{name}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Tech · {["4.6", "4.2", "4.8"][i]} ⭐</p>
          </div>
          <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#8b5cf6" }}>Voir</div>
        </div>
      ))}
    </div>
  );
}

function SwipeVisual() {
  return (
    <div style={{ position: "relative", height: 120 }}>
      <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%) rotate(-4deg)", width: "80%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, opacity: 0.4 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Logitech Lausanne</p>
      </div>
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "85%", background: "var(--surface)", border: "2px solid #8b5cf6", borderRadius: 16, padding: 16 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Swisscom Bern</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Télécoms · 4.1 ⭐ · 234 avis</p>
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
          <div style={{ padding: "6px 20px", borderRadius: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 18 }}>✗</div>
          <div style={{ padding: "6px 20px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", fontSize: 18 }}>♥</div>
        </div>
      </div>
    </div>
  );
}

function SalairesVisual() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[["Software Engineer", "120 000 CHF"], ["Product Manager", "145 000 CHF"], ["Data Scientist", "135 000 CHF"]].map(([role, sal], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text)" }}>{role}</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#10b981" }}>{sal}</p>
        </div>
      ))}
    </div>
  );
}

function FavVisual() {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
      {[["Google", "❤️"], ["Nestlé", "🔥"], ["EPFL", "❤️"]].map(([name, icon], i) => (
        <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 18px", textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 22 }}>{icon}</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{name}</p>
        </div>
      ))}
    </div>
  );
}

function ReviewVisual() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 18, color: "#f59e0b" }}>★</span>)}
      </div>
      <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Super ambiance, bon équilibre vie pro/perso</p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>Employé anonyme · Software Engineer</p>
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>

      {/* Logo */}
      <a href="/" style={{ textDecoration: "none", marginBottom: 32 }}>
        <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          workie
        </span>
      </a>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 8, borderRadius: 4,
            background: i === step ? current.color : i < step ? "rgba(139,92,246,0.3)" : "var(--border)",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: "32px 28px", boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}>

        {/* Icon */}
        <div style={{ width: 64, height: 64, borderRadius: 18, background: current.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 20 }}>
          {current.icon}
        </div>

        {/* Text */}
        <h1 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>
          {current.title}
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
          {current.desc}
        </p>

        {/* Visual */}
        <div style={{ marginBottom: 32 }}>
          {current.visual}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => isLast ? router.push("/explore") : setStep(s => s + 1)}
            style={{
              width: "100%", background: `linear-gradient(135deg, ${current.color}, #f97316)`,
              color: "#fff", fontWeight: 700, fontSize: 16, border: "none",
              borderRadius: 12, padding: "14px 0", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {isLast ? "Explorer maintenant" : "Suivant"}
            <ArrowRight size={16} />
          </button>

          {!isLast && (
            <button
              onClick={() => router.push("/explore")}
              style={{ width: "100%", background: "transparent", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, border: "none", padding: "8px 0", cursor: "pointer" }}
            >
              Passer l'intro
            </button>
          )}
        </div>
      </div>

      {/* Step counter */}
      <p style={{ marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
        {step + 1} / {STEPS.length}
      </p>
    </main>
  );
}
