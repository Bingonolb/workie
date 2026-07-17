"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

async function markOnboardingSeen() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ has_seen_onboarding: true }).eq("id", user.id);
  }
}

/* ─── Step 1: Explorer ─── */
function ExplorePreview() {
  const cards = [
    { name: "Google Zürich", sector: "Tech", city: "Zurich", rating: 4.6, reviews: 142, gradient: "linear-gradient(135deg,#1a73e8 0%,#34a853 100%)", verified: true },
    { name: "Nestlé", sector: "Alimentation", city: "Vevey", rating: 4.2, reviews: 89, gradient: "linear-gradient(135deg,#e74c3c 0%,#f39c12 100%)", verified: true },
    { name: "Novartis", sector: "Pharma", city: "Basel", rating: 4.8, reviews: 203, gradient: "linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%)", verified: false },
    { name: "UBS", sector: "Finance", city: "Zürich", rating: 3.9, reviews: 317, gradient: "linear-gradient(135deg,#dc2626 0%,#7f1d1d 100%)", verified: true },
    { name: "EPFL", sector: "Éducation", city: "Lausanne", rating: 4.5, reviews: 76, gradient: "linear-gradient(135deg,#d97706 0%,#b45309 100%)", verified: false },
    { name: "Swisscom", sector: "Télécoms", city: "Berne", rating: 4.1, reviews: 234, gradient: "linear-gradient(135deg,#7c3aed 0%,#4c1d95 100%)", verified: true },
  ];
  return (
    <div style={{ padding: "0 20px 20px", flex: 1, overflow: "hidden" }}>
      {/* Search bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Chercher une entreprise...</span>
        </div>
        <div style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#a78bfa" }}>Filtres</div>
      </div>
      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, overflow: "hidden" }}>
        {["Tous", "Tech", "Finance", "Pharma", "Alimentation"].map((f, i) => (
          <div key={f} style={{ padding: "5px 14px", borderRadius: 20, background: i === 0 ? "linear-gradient(135deg,#8b5cf6,#f97316)" : "rgba(255,255,255,0.05)", border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: i === 0 ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: i === 0 ? 700 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>{f}</div>
        ))}
      </div>
      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {cards.map(c => (
          <div key={c.name} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ height: 70, background: c.gradient, position: "relative" }}>
              {c.verified && <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.4)", borderRadius: 6, padding: "2px 6px", fontSize: 10, color: "#34d399", fontWeight: 700 }}>✓ Vérifié</div>}
              <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "rgba(255,255,255,0.8)" }}>{c.sector}</div>
            </div>
            <div style={{ padding: "10px 12px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>📍 {c.city}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: "#f59e0b" }}>{"★".repeat(Math.floor(c.rating))}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{c.rating} · {c.reviews} avis</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 2: Swipe ─── */
function SwipePreview() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px 24px", position: "relative" }}>
      {/* Back card */}
      <div style={{ position: "absolute", width: 280, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, height: 340, transform: "rotate(4deg) translateY(8px)", zIndex: 1 }} />
      {/* Main card */}
      <div style={{ position: "relative", zIndex: 2, width: 280, background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ height: 200, background: "linear-gradient(135deg,#7c3aed 0%,#2563eb 100%)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 48 }}>🏢</div>
          <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.35)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#a78bfa", fontWeight: 600 }}>Tech · Télécoms</div>
          <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(52,211,153,0.2)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#34d399", fontWeight: 700 }}>✓ Vérifié</div>
        </div>
        <div style={{ padding: "18px 20px 20px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 2 }}>Swisscom</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>📍 Berne · 234 avis</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
            <span style={{ color: "#f59e0b", fontSize: 15 }}>★★★★</span><span style={{ color: "rgba(255,255,255,0.3)", fontSize: 15 }}>★</span>
            <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>4.1</span>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <button style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(139,92,246,0.15)", border: "2px solid rgba(139,92,246,0.4)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>★</button>
            <button style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>❤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Salaires ─── */
function SalairesPreview() {
  const rows = [
    { title: "Software Engineer", company: "Google Zürich", amount: 185000, range: "160k – 220k", pct: 88 },
    { title: "Product Manager", company: "Nestlé", amount: 145000, range: "120k – 170k", pct: 72 },
    { title: "Data Scientist", company: "Novartis", amount: 125000, range: "100k – 150k", pct: 63 },
    { title: "UX Designer", company: "Swisscom", amount: 108000, range: "90k – 130k", pct: 55 },
    { title: "Finance Analyst", company: "UBS", amount: 118000, range: "95k – 145k", pct: 60 },
  ];
  return (
    <div style={{ padding: "0 20px 20px", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12 }}>
        <span style={{ fontSize: 18 }}>🔒</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Données <span style={{ color: "#34d399", fontWeight: 600 }}>100% anonymes</span> · partagées par des employés</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(r => (
          <div key={r.title} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{r.company}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#10b981" }}>CHF {(r.amount / 1000).toFixed(0)}k</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{r.range}</div>
              </div>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
              <div style={{ height: "100%", width: `${r.pct}%`, background: "linear-gradient(90deg,#10b981,#34d399)", borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 4: Favoris ─── */
function FavorisPreview() {
  const favs = [
    { name: "Google Zürich", sector: "Tech", rating: 4.6, gradient: "linear-gradient(135deg,#1a73e8,#34a853)", hot: true },
    { name: "Novartis", sector: "Pharma", rating: 4.8, gradient: "linear-gradient(135deg,#0ea5e9,#6366f1)", hot: false },
    { name: "EPFL", sector: "Éducation", rating: 4.5, gradient: "linear-gradient(135deg,#d97706,#b45309)", hot: true },
    { name: "Nestlé", sector: "Alimentation", rating: 4.2, gradient: "linear-gradient(135deg,#e74c3c,#f39c12)", hot: false },
  ];
  return (
    <div style={{ padding: "0 20px 20px", flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Mes favoris</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>4 entreprises sauvegardées</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#f87171" }}>❤️ Favoris</div>
          <div style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>🔥 Hot</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {favs.map(f => (
          <div key={f.name} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ height: 90, background: f.gradient, position: "relative" }}>
              <div style={{ position: "absolute", top: 8, right: 8, fontSize: 18 }}>{f.hot ? "🔥" : "❤️"}</div>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{f.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>{f.sector}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: "#f59e0b" }}>{"★".repeat(Math.floor(f.rating))}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{f.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 5: Avis ─── */
function AvisPreview() {
  const criteria = [
    { label: "Ambiance", val: 5, color: "#8b5cf6" },
    { label: "Management", val: 4, color: "#3b82f6" },
    { label: "Salaire", val: 4, color: "#10b981" },
    { label: "Équilibre vie pro/perso", val: 3, color: "#f59e0b" },
  ];
  return (
    <div style={{ padding: "0 20px 20px", flex: 1 }}>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 20 }}>
        {/* Company header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 14px", background: "rgba(139,92,246,0.08)", borderRadius: 12, border: "1px solid rgba(139,92,246,0.15)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#1a73e8,#34a853)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔍</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Google Zürich</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Tech · Zurich</div>
          </div>
          <div style={{ marginLeft: "auto", background: "rgba(52,211,153,0.15)", borderRadius: 8, padding: "3px 8px", fontSize: 11, color: "#34d399" }}>✓ Vérifié</div>
        </div>
        {/* Global rating */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Note globale</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3,4,5].map(s => (
              <div key={s} style={{ fontSize: 26, color: s <= 4 ? "#f59e0b" : "rgba(255,255,255,0.12)", lineHeight: 1 }}>★</div>
            ))}
          </div>
        </div>
        {/* Criteria */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {criteria.map(c => (
            <div key={c.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{c.label}</span>
                <span style={{ fontSize: 12, color: c.color, fontWeight: 700 }}>{c.val}/5</span>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                <div style={{ height: "100%", width: `${(c.val / 5) * 100}%`, background: c.color, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
        {/* Text preview */}
        <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic", lineHeight: 1.5 }}>
          "Super ambiance de travail, équipe internationale passionnante. Les opportunités d'évolution sont réelles..."
        </div>
      </div>
    </div>
  );
}

/* ─── Steps config ─── */
const STEPS = [
  { id: "explorer", shortLabel: "EXPLORER", title: "1 733 entreprises suisses", sub: "Des avis 100% anonymes, des salaires réels. Filtre par secteur, canton, note.", accent: "#8b5cf6", Preview: ExplorePreview },
  { id: "swipe",    shortLabel: "SWIPE",    title: "Découvre en swipant", sub: "Passe en mode Swipe pour explorer les entreprises une par une — like ou skip.", accent: "#f97316", Preview: SwipePreview },
  { id: "salaires", shortLabel: "SALAIRES", title: "Les vrais salaires", sub: "Consultez les salaires réels partagés anonymement. Comparez avant de négocier.", accent: "#10b981", Preview: SalairesPreview },
  { id: "favoris",  shortLabel: "FAVORIS",  title: "Sauvegarde tes favoris", sub: "Ajoute des entreprises à tes favoris ❤️ et donne une flamme 🔥 aux meilleures.", accent: "#ef4444", Preview: FavorisPreview },
  { id: "avis",     shortLabel: "TON AVIS", title: "Partage ton expérience", sub: "Ton avis aide des milliers de personnes. Anonyme, toujours. Sans filtre.", accent: "#f59e0b", Preview: AvisPreview },
];

/* ─── Main Page ─── */
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const current = STEPS[step];
  const { Preview } = current;

  async function finish() {
    await markOnboardingSeen();
    router.push("/explore");
  }

  async function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await finish();
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0a12", display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, sans-serif", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px 12px", flexShrink: 0 }}>
        <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", color: current.accent }}>workie</span>
        <button onClick={finish} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer", padding: "6px 0" }}>
          Passer
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6, padding: "0 24px 20px", flexShrink: 0 }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= step ? current.accent : "rgba(255,255,255,0.1)", transition: "background 0.3s" }} />
        ))}
      </div>

      {/* Preview area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        <Preview />
      </div>

      {/* Bottom panel */}
      <div style={{ padding: "16px 24px 28px", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Step labels */}
        <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
          {STEPS.map((s, i) => (
            <span key={s.id} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: i === step ? current.accent : "rgba(255,255,255,0.2)", transition: "color 0.3s" }}>{s.shortLabel}</span>
          ))}
        </div>
        <div style={{ marginBottom: 6 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.15 }}>{current.title}</h2>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{current.sub}</p>
        </div>
        <button onClick={next} style={{ marginTop: 16, width: "100%", background: `linear-gradient(135deg, ${current.accent}, #f97316)`, color: "#fff", fontWeight: 800, fontSize: 16, border: "none", borderRadius: 14, padding: "15px 0", cursor: "pointer", letterSpacing: "-0.01em" }}>
          {step === STEPS.length - 1 ? "C'est parti →" : "Suivant →"}
        </button>
      </div>
    </div>
  );
}
