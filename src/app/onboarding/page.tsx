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

/* ─── Step data ─── */
const STEPS = [
  {
    id: "explorer",
    label: "Explorer",
    title: "1 733 entreprises suisses",
    sub: "Des avis 100% anonymes, des salaires réels. Filtre par secteur, canton, note.",
    accent: "#8b5cf6",
    preview: <ExplorePreview />,
  },
  {
    id: "swipe",
    label: "Swipe",
    title: "Découvre en swipant",
    sub: "Passe en mode Swipe pour explorer les entreprises une par une — like ou skip.",
    accent: "#f97316",
    preview: <SwipePreview />,
  },
  {
    id: "salaires",
    label: "Salaires",
    title: "Les vrais salaires",
    sub: "Consultez les salaires réels partagés anonymement. Comparez avant de négocier.",
    accent: "#10b981",
    preview: <SalairesPreview />,
  },
  {
    id: "favoris",
    label: "Favoris",
    title: "Sauvegarde tes favoris",
    sub: "Ajoute des entreprises à tes favoris ❤️ et donne une flamme 🔥 aux meilleures.",
    accent: "#ef4444",
    preview: <FavorisPreview />,
  },
  {
    id: "avis",
    label: "Ton avis",
    title: "Partage ton expérience",
    sub: "Ton avis aide des milliers de personnes. Anonyme, toujours. Sans filtre.",
    accent: "#f59e0b",
    preview: <AvisPreview />,
  },
];

/* ─── Fake Navbar ─── */
function FakeNav({ accent }: { accent: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", height: 56, background: "rgba(10,10,18,0.95)",
      borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 2,
    }}>
      <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", background: `linear-gradient(135deg, ${accent}, #f97316)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>workie</span>
      <div style={{ display: "flex", gap: 6 }}>
        {["Explorer", "Classement", "Salaires", "Favoris", "Profil"].map(t => (
          <div key={t} style={{ padding: "6px 12px", borderRadius: 20, background: t === "Explorer" ? `${accent}22` : "transparent", fontSize: 13, color: t === "Explorer" ? accent : "rgba(255,255,255,0.4)", fontWeight: t === "Explorer" ? 700 : 400 }}>{t}</div>
        ))}
      </div>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>L</div>
    </div>
  );
}

/* ─── STEP 1: Explorer ─── */
function ExplorePreview() {
  const companies = [
    { name: "Google Zürich", sector: "Tech", city: "Zurich", rating: 4.6, reviews: 142, cover: "linear-gradient(135deg,#4285F4,#34A853)", verified: true },
    { name: "Nestlé", sector: "Alimentation", city: "Vevey", rating: 4.2, reviews: 89, cover: "linear-gradient(135deg,#e11d48,#fb923c)", verified: true },
    { name: "Novartis", sector: "Pharma", city: "Basel", rating: 4.8, reviews: 203, cover: "linear-gradient(135deg,#0ea5e9,#6366f1)", verified: false },
    { name: "UBS", sector: "Finance", city: "Zurich", rating: 3.9, reviews: 317, cover: "linear-gradient(135deg,#dc2626,#991b1b)", verified: true },
    { name: "EPFL", sector: "Éducation", city: "Lausanne", rating: 4.5, reviews: 76, cover: "linear-gradient(135deg,#d97706,#b45309)", verified: false },
    { name: "Swisscom", sector: "Tech", city: "Bern", rating: 4.1, reviews: 234, cover: "linear-gradient(135deg,#7c3aed,#4c1d95)", verified: true },
  ];
  return (
    <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#fff" }}>Explorer les entreprises</h2>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>1 733 entreprises · avis 100% authentiques</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {companies.map((c, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ height: 80, background: c.cover, position: "relative" }}>
              <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#fff" }}>{c.sector}</span>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.name}</span>
                {c.verified && <span style={{ color: "#3b82f6", fontSize: 12 }}>✓</span>}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>📍 {c.city}</div>
              {c.rating > 0 && <div style={{ fontSize: 12, color: "#f59e0b" }}>{"★".repeat(Math.floor(c.rating))} <span style={{ color: "rgba(255,255,255,0.5)" }}>{c.rating} · {c.reviews} avis</span></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── STEP 2: Swipe ─── */
function SwipePreview() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      {/* Background card */}
      <div style={{ position: "absolute", width: 280, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, height: 340, transform: "rotate(-5deg) translateY(16px)", top: "50%", left: "50%", marginLeft: -140, marginTop: -170 }} />
      <div style={{ position: "absolute", width: 280, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, height: 340, transform: "rotate(-2deg) translateY(8px)", top: "50%", left: "50%", marginLeft: -140, marginTop: -170 }} />
      {/* Main card */}
      <div style={{ position: "relative", width: 280, background: "rgba(20,20,35,0.95)", border: "2px solid rgba(249,115,22,0.3)", borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ height: 160, background: "linear-gradient(135deg,#7c3aed,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 48 }}>🏢</span>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Swisscom</span>
            <span style={{ color: "#3b82f6", fontSize: 14 }}>✓</span>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Tech · Télécoms</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>📍 Bern · 234 avis</div>
          <div style={{ fontSize: 16, color: "#f59e0b", marginBottom: 16 }}>★★★★☆ <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>4.1</span></div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✕</div>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(139,92,246,0.15)", border: "2px solid rgba(139,92,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>★</div>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>♥</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── STEP 3: Salaires ─── */
function SalairesPreview() {
  const rows = [
    { role: "Software Engineer", company: "Google", min: 110000, max: 160000, avg: 135000 },
    { role: "Product Manager", company: "Nestlé", min: 120000, max: 170000, avg: 145000 },
    { role: "Data Scientist", company: "Novartis", min: 100000, max: 150000, avg: 125000 },
    { role: "UX Designer", company: "Swisscom", min: 90000, max: 130000, avg: 108000 },
    { role: "Finance Analyst", company: "UBS", min: 95000, max: 145000, avg: 118000 },
  ];
  return (
    <div style={{ padding: "16px 24px", flex: 1, overflowY: "auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#fff" }}>Salaires en Suisse</h2>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Données anonymes · 4 200 entrées</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{r.role}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{r.company}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>CHF {(r.avg / 1000).toFixed(0)}k</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{(r.min / 1000).toFixed(0)}k – {(r.max / 1000).toFixed(0)}k</div>
              </div>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((r.avg - r.min) / (r.max - r.min)) * 100}%`, background: "linear-gradient(90deg,#10b981,#059669)", borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── STEP 4: Favoris ─── */
function FavorisPreview() {
  const favs = [
    { name: "Google Zürich", sector: "Tech", rating: 4.6, icon: "🔍", color: "#4285F4", flame: true },
    { name: "Novartis", sector: "Pharma", rating: 4.8, icon: "💊", color: "#10b981", flame: false },
    { name: "EPFL", sector: "Éducation", rating: 4.5, icon: "🎓", color: "#f59e0b", flame: true },
    { name: "Nestlé", sector: "Alimentation", rating: 4.2, icon: "🍫", color: "#e11d48", flame: false },
  ];
  return (
    <div style={{ padding: "16px 24px", flex: 1 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#fff" }}>Mes favoris</h2>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>4 entreprises sauvegardées</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {favs.map((f, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, position: "relative" }}>
            <div style={{ position: "absolute", top: 12, right: 12, fontSize: 18 }}>{f.flame ? "🔥" : "❤️"}</div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}22`, border: `1px solid ${f.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{f.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{f.sector}</div>
            <div style={{ fontSize: 13, color: "#f59e0b" }}>{"★".repeat(Math.floor(f.rating))} <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{f.rating}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── STEP 5: Avis ─── */
function AvisPreview() {
  return (
    <div style={{ padding: "16px 24px", flex: 1 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#fff" }}>Partager un avis</h2>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>100% anonyme · Aide la communauté</p>
      </div>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: 12, background: "rgba(139,92,246,0.08)", borderRadius: 12, border: "1px solid rgba(139,92,246,0.2)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏢</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Google Zürich</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Tech · Zurich</div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Note globale</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1,2,3,4,5].map(s => <div key={s} style={{ fontSize: 28, color: s <= 4 ? "#f59e0b" : "rgba(255,255,255,0.15)", cursor: "pointer" }}>★</div>)}
          </div>
        </div>
        {[["Ambiance", 5], ["Management", 4], ["Salaire", 4], ["Équilibre", 3]].map(([label, val]) => (
          <div key={label as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{label}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {[1,2,3,4,5].map(s => <div key={s} style={{ width: 18, height: 18, borderRadius: 4, background: s <= (val as number) ? "#f59e0b" : "rgba(255,255,255,0.08)" }} />)}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
          "Super ambiance de travail, bonnes opportunités d'évolution..."
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function finish() {
    await markOnboardingSeen();
    router.push("/explore");
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0a12", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Fake browser chrome */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", margin: "16px 20px 0", borderRadius: "16px 16px 0 0", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 80px rgba(139,92,246,0.15)" }}>

        {/* Fake nav */}
        <FakeNav accent={current.accent} />

        {/* App content */}
        <div style={{ flex: 1, background: "#0d0d1a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {current.preview}
        </div>

        {/* Highlight overlay gradient at bottom */}
        <div style={{ position: "absolute", bottom: 160, left: 20, right: 20, height: 120, background: "linear-gradient(to bottom, transparent, #0a0a12)", pointerEvents: "none", zIndex: 1, borderRadius: "0 0 0 0" }} />
      </div>

      {/* Bottom panel */}
      <div style={{ padding: "20px 24px 32px", background: "#0a0a12", position: "relative", zIndex: 2 }}>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? current.accent : "rgba(255,255,255,0.1)", transition: "background 0.3s ease" }} />
          ))}
        </div>

        {/* Step label */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {STEPS.map((s, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: i === step ? current.accent : "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em", transition: "color 0.3s" }}>
              {s.label}
            </span>
          ))}
        </div>

        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>{current.title}</h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{current.sub}</p>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => isLast ? finish() : setStep(s => s + 1)}
            style={{
              flex: 1, padding: "14px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, color: "#fff",
              background: `linear-gradient(135deg, ${current.accent}, #f97316)`,
              transition: "opacity 0.2s",
            }}
          >
            {isLast ? "C'est parti →" : "Suivant →"}
          </button>
          {!isLast && (
            <button
              onClick={() => finish()}
              style={{ padding: "14px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 14, cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
            >
              Passer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
