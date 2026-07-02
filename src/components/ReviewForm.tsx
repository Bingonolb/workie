"use client";

import { useActionState, useState } from "react";
import { submitReview } from "@/lib/actions/reviews";
import { ChevronRight, ChevronLeft, Briefcase, Star, MessageSquare, CheckCircle } from "lucide-react";

// ─── constants ───────────────────────────────────────────────────────────────

const EMPLOYMENT_TYPES = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "stage", label: "Stage" },
  { value: "alternance", label: "Alternance" },
  { value: "freelance", label: "Freelance / Indépendant" },
];

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

const RATING_LABELS: Record<string, string> = {
  1: "Catastrophique",
  2: "Décevant",
  3: "Correct",
  4: "Bien",
  5: "Excellent",
};

const SUB_RATINGS = [
  { name: "rating_culture", label: "🌍 Ambiance & culture" },
  { name: "rating_management", label: "👔 Management" },
  { name: "rating_worklife", label: "⚖️ Équilibre vie pro/perso" },
  { name: "rating_career", label: "🚀 Évolution de carrière" },
];

// ─── sub-components ───────────────────────────────────────────────────────────

function StarPicker({
  name,
  label,
  required,
  value,
  onChange,
}: {
  name: string;
  label: string;
  required?: boolean;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-sub)" }}>{label}{required && " *"}</span>
        {active > 0 && (
          <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{RATING_LABELS[active]}</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n} type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 2,
              fontSize: 28,
              filter: n <= active ? "none" : "grayscale(1) opacity(0.25)",
              transform: n <= active ? "scale(1.05)" : "scale(1)",
              transition: "all 0.1s",
            }}
          >
            ⭐
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

// ─── step indicators ──────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const steps = [
    { icon: <Briefcase size={14} />, label: "Emploi" },
    { icon: <Star size={14} />, label: "Notes" },
    { icon: <MessageSquare size={14} />, label: "Avis" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
      {steps.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 50,
              background: done ? "rgba(16,185,129,0.15)" : active ? "rgba(139,92,246,0.15)" : "var(--surface3)",
              border: `1px solid ${done ? "rgba(16,185,129,0.3)" : active ? "rgba(139,92,246,0.4)" : "var(--border)"}`,
              color: done ? "#10b981" : active ? "#8b5cf6" : "var(--text-muted)",
              fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}>
              {done ? <CheckCircle size={14} /> : s.icon}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: done ? "rgba(16,185,129,0.3)" : "var(--border)", margin: "0 8px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── main form ────────────────────────────────────────────────────────────────

export function ReviewForm({ companyId }: { companyId: string }) {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(submitReview, undefined);

  // step 1 state
  const [jobTitle, setJobTitle] = useState("");
  const [employmentType, setEmploymentType] = useState("cdi");
  const [isCurrent, setIsCurrent] = useState(true);
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [salary, setSalary] = useState("");

  // step 2 state
  const [ratingOverall, setRatingOverall] = useState(0);
  const [ratingCulture, setRatingCulture] = useState(0);
  const [ratingMgmt, setRatingMgmt] = useState(0);
  const [ratingWl, setRatingWl] = useState(0);
  const [ratingCareer, setRatingCareer] = useState(0);

  // step 3 state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");

  const [step1Err, setStep1Err] = useState("");
  const [step2Err, setStep2Err] = useState("");

  const goNext = () => {
    if (step === 0) {
      if (!jobTitle.trim()) { setStep1Err("Le poste est obligatoire."); return; }
      setStep1Err("");
    }
    if (step === 1) {
      if (ratingOverall === 0) { setStep2Err("La note globale est obligatoire."); return; }
      setStep2Err("");
    }
    setStep(s => s + 1);
  };

  if (state?.success) {
    return (
      <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🙏</div>
        <p style={{ fontSize: 17, fontWeight: 800, color: "#10b981", marginBottom: 6 }}>Avis publié !</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Ton expérience aide des milliers de personnes à faire les bons choix professionnels.</p>
      </div>
    );
  }

  return (
    <div>
      <StepBar step={step} />

      <form action={formAction}>
        {/* Hidden fields — always submitted */}
        <input type="hidden" name="company_id" value={companyId} />
        <input type="hidden" name="job_title" value={jobTitle} />
        <input type="hidden" name="employment_type" value={employmentType} />
        <input type="hidden" name="is_current" value={String(isCurrent)} />
        <input type="hidden" name="start_year" value={startYear} />
        <input type="hidden" name="end_year" value={endYear} />
        <input type="hidden" name="salary_chf" value={salary} />
        <input type="hidden" name="rating_overall" value={ratingOverall} />
        <input type="hidden" name="rating_culture" value={ratingCulture} />
        <input type="hidden" name="rating_management" value={ratingMgmt} />
        <input type="hidden" name="rating_worklife" value={ratingWl} />
        <input type="hidden" name="rating_career" value={ratingCareer} />
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="content" value={content} />
        <input type="hidden" name="pros" value={pros} />
        <input type="hidden" name="cons" value={cons} />

        {/* ── Step 0 : Emploi ───────────────────────────────────── */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={lbl}>Ton poste *</label>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="Ex : Software Engineer, Marketing Manager..."
                style={inp}
              />
            </div>

            <div>
              <label style={lbl}>Type de contrat *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {EMPLOYMENT_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setEmploymentType(t.value)}
                    style={{
                      padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", border: "1px solid",
                      borderColor: employmentType === t.value ? "#8b5cf6" : "var(--border2)",
                      background: employmentType === t.value ? "rgba(139,92,246,0.15)" : "var(--surface2)",
                      color: employmentType === t.value ? "#8b5cf6" : "var(--text-muted)",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Statut actuel</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ v: true, l: "Employé actuel" }, { v: false, l: "Ancien employé" }].map(({ v, l }) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setIsCurrent(v)}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", border: "1px solid",
                      borderColor: isCurrent === v ? "#f97316" : "var(--border2)",
                      background: isCurrent === v ? "rgba(249,115,22,0.15)" : "var(--surface2)",
                      color: isCurrent === v ? "#f97316" : "var(--text-muted)",
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isCurrent ? "1fr" : "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Année de début</label>
                <select value={startYear} onChange={e => setStartYear(e.target.value)} style={{ ...inp, background: "var(--surface2)" }}>
                  <option value="">Choisir...</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {!isCurrent && (
                <div>
                  <label style={lbl}>Année de fin</label>
                  <select value={endYear} onChange={e => setEndYear(e.target.value)} style={{ ...inp, background: "var(--surface2)" }}>
                    <option value="">Choisir...</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label style={lbl}>Salaire annuel brut CHF <span style={{ fontWeight: 400, opacity: 0.5 }}>(optionnel — affiché anonymement)</span></label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text-muted)", pointerEvents: "none" }}>CHF</span>
                <input
                  type="number"
                  value={salary}
                  onChange={e => setSalary(e.target.value)}
                  placeholder="95000"
                  style={{ ...inp, paddingLeft: 46 }}
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>Ces infos aident la communauté à connaître les vrais salaires. Jamais attribué à ton nom.</p>
            </div>

            {step1Err && <p style={{ fontSize: 13, color: "#ef4444" }}>{step1Err}</p>}
          </div>
        )}

        {/* ── Step 1 : Notes ────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "var(--surface2)", borderRadius: 14, padding: "20px 24px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Note globale *</p>
              <StarPicker name="rating_overall" label="Ta note générale" required value={ratingOverall} onChange={setRatingOverall} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Notes par catégorie <span style={{ fontWeight: 400 }}>(optionnel)</span></p>
              <StarPicker name="rating_culture" label="🌍 Ambiance & culture d'entreprise" value={ratingCulture} onChange={setRatingCulture} />
              <div style={{ height: 1, background: "var(--border)" }} />
              <StarPicker name="rating_management" label="👔 Qualité du management" value={ratingMgmt} onChange={setRatingMgmt} />
              <div style={{ height: 1, background: "var(--border)" }} />
              <StarPicker name="rating_worklife" label="⚖️ Équilibre vie pro / perso" value={ratingWl} onChange={setRatingWl} />
              <div style={{ height: 1, background: "var(--border)" }} />
              <StarPicker name="rating_career" label="🚀 Perspectives d'évolution" value={ratingCareer} onChange={setRatingCareer} />
            </div>

            {step2Err && <p style={{ fontSize: 13, color: "#ef4444" }}>{step2Err}</p>}
          </div>
        )}

        {/* ── Step 2 : Avis ─────────────────────────────────────── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Ton avis est <strong style={{ color: "var(--text)" }}>affiché anonymement</strong>. Seul ton poste et ta durée seront visibles. Ton identité reste confidentielle.
              </p>
            </div>

            <div>
              <label style={lbl}>Titre de ton avis <span style={{ fontWeight: 400, opacity: 0.5 }}>(optionnel)</span></label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex : Super boîte mais attention au rythme..."
                style={inp}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>👍 Points positifs</label>
                <textarea
                  value={pros}
                  onChange={e => setPros(e.target.value)}
                  rows={3}
                  placeholder="Ce que j'ai apprécié..."
                  style={{ ...inp, resize: "vertical" }}
                />
              </div>
              <div>
                <label style={lbl}>👎 Points négatifs</label>
                <textarea
                  value={cons}
                  onChange={e => setCons(e.target.value)}
                  rows={3}
                  placeholder="Ce qui m'a déçu..."
                  style={{ ...inp, resize: "vertical" }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={lbl}>Ton avis complet * <span style={{ fontWeight: 400, opacity: 0.5 }}>(min. 50 caractères)</span></label>
                <span style={{ fontSize: 11, color: content.length >= 50 ? "#10b981" : "var(--text-muted)" }}>
                  {content.length}/50 min.
                </span>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={5}
                placeholder="Décris ton expérience honnêtement : culture, projets, management, ambiance, ce que tu referais ou pas..."
                style={{ ...inp, resize: "vertical" }}
              />
            </div>

            {state?.error && (
              <p style={{ fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(239,68,68,0.2)" }}>
                {state.error}
              </p>
            )}
          </div>
        )}

        {/* ── Navigation ────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: "var(--surface2)", border: "1px solid var(--border2)",
                color: "var(--text-muted)", cursor: "pointer",
              }}
            >
              <ChevronLeft size={16} /> Retour
            </button>
          )}

          {step < 2 ? (
            <button
              type="button"
              onClick={goNext}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "13px 0", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: "linear-gradient(135deg, #8b5cf6, #f97316)",
                border: "none", color: "#fff", cursor: "pointer",
              }}
            >
              Continuer <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending || content.length < 50}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: content.length >= 50 ? "linear-gradient(135deg, #8b5cf6, #f97316)" : "var(--surface3)",
                border: "none", color: content.length >= 50 ? "#fff" : "var(--text-muted)",
                cursor: content.length >= 50 ? "pointer" : "not-allowed",
                opacity: pending ? 0.6 : 1,
              }}
            >
              {pending ? "Publication..." : "Publier mon avis"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "var(--text)",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6,
};
