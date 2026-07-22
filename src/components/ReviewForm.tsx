"use client";

import { useActionState, useState } from "react";
import { submitReview } from "@/lib/actions/reviews";
import { ChevronRight, ChevronLeft, Briefcase, Star, MessageSquare, CheckCircle } from "lucide-react";

const EMPLOYMENT_TYPES = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "stage", label: "Stage" },
  { value: "alternance", label: "Alternance" },
  { value: "freelance", label: "Freelance" },
];

const DURATION_RANGES = [
  { value: "moins_6mois", label: "< 6 mois" },
  { value: "6mois_2ans", label: "6 mois – 2 ans" },
  { value: "plus_2ans", label: "+ 2 ans" },
];

const WORK_MODES = [
  { value: "présentiel", label: "🏢 Présentiel" },
  { value: "hybride", label: "🔀 Hybride" },
  { value: "remote", label: "🏠 Remote" },
];

const RECOMMEND = [
  { value: "oui", label: "👍 Oui" },
  { value: "non", label: "👎 Non" },
  { value: "ca_depend", label: "🤔 Ça dépend" },
];

const RATING_LABELS: Record<number, string> = {
  1: "Catastrophique", 2: "Décevant", 3: "Correct", 4: "Bien", 5: "Excellent",
};

function StarPicker({ name, label, required, value, onChange }: {
  name: string; label: string; required?: boolean; value: number; onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-sub)" }}>{label}{required && " *"}</span>
        {active > 0 && <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{RATING_LABELS[active]}</span>}
      </div>
      <div role="radiogroup" aria-label={label} style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}${RATING_LABELS[n] ? ` — ${RATING_LABELS[n]}` : ""}`}
            onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, fontSize: 28,
              filter: n <= active ? "none" : "grayscale(1) opacity(0.25)",
              transform: n <= active ? "scale(1.05)" : "scale(1)", transition: "all 0.1s" }}>
            ⭐
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

function PillPicker({ options, value, onChange }: {
  options: { value: string; label: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`pill-btn${value === o.value ? " active" : ""}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StepBar({ step }: { step: number }) {
  const steps = [
    { icon: <Briefcase size={14} aria-hidden="true" />, label: "Emploi" },
    { icon: <Star size={14} aria-hidden="true" />, label: "Notes" },
    { icon: <MessageSquare size={14} aria-hidden="true" />, label: "Avis" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
      {steps.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={s.label} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 50,
              background: done ? "rgba(16,185,129,0.15)" : active ? "rgba(139,92,246,0.15)" : "var(--surface3)",
              border: `1px solid ${done ? "rgba(16,185,129,0.3)" : active ? "rgba(139,92,246,0.4)" : "var(--border)"}`,
              color: done ? "#10b981" : active ? "#8b5cf6" : "var(--text-muted)",
              fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}>
              {done ? <CheckCircle size={14} aria-hidden="true" /> : s.icon}
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

export function ReviewForm({ companyId }: { companyId: string }) {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(submitReview, undefined);

  // Step 0 — Emploi
  const [jobTitle, setJobTitle] = useState("");
  const [employmentType, setEmploymentType] = useState("cdi");
  const [isCurrent, setIsCurrent] = useState(true);
  const [durationRange, setDurationRange] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [salary, setSalary] = useState("");

  // Step 1 — Notes
  const [ratingMgmt, setRatingMgmt] = useState(0);
  const [ratingWl, setRatingWl] = useState(0);
  const [ratingCulture, setRatingCulture] = useState(0);
  const [ratingCareer, setRatingCareer] = useState(0);

  // Auto-calculate overall from sub-ratings (only non-zero ones)
  const subRatings = [ratingMgmt, ratingWl, ratingCulture, ratingCareer].filter(r => r > 0);
  const ratingOverall = subRatings.length > 0
    ? Math.round(subRatings.reduce((a, b) => a + b, 0) / subRatings.length)
    : 0;
  const [wouldRecommend, setWouldRecommend] = useState("");

  // Step 2 — Avis
  const [title, setTitle] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [content, setContent] = useState("");
  const [knewBefore, setKnewBefore] = useState("");

  const [step1Err, setStep1Err] = useState("");
  const [step2Err, setStep2Err] = useState("");
  const [charteAccepted, setCharteAccepted] = useState(false);

  const canSubmit = content.length >= 50 && pros.trim().length >= 10 && cons.trim().length >= 10
    && ratingOverall > 0 && !!wouldRecommend && charteAccepted;

  const goNext = () => {
    setStep1Err("");
    setStep2Err("");
    if (step === 0) {
      if (!jobTitle.trim()) { setStep1Err("Le poste est obligatoire."); return; }
      if (!durationRange) { setStep1Err("La durée est obligatoire."); return; }
    }
    if (step === 1) {
      if (ratingOverall === 0) { setStep2Err("La note globale est obligatoire."); return; }
      if (!wouldRecommend) { setStep2Err("Indiquer si tu recommanderais est obligatoire."); return; }
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
        {/* Hidden fields */}
        <input type="hidden" name="company_id" value={companyId} />
        <input type="hidden" name="job_title" value={jobTitle} />
        <input type="hidden" name="employment_type" value={employmentType} />
        <input type="hidden" name="is_current" value={String(isCurrent)} />
        <input type="hidden" name="duration_range" value={durationRange} />
        <input type="hidden" name="work_mode" value={workMode} />
        <input type="hidden" name="salary_chf" value={salary} />
        <input type="hidden" name="rating_overall" value={ratingOverall} />
        <input type="hidden" name="rating_culture" value={ratingCulture} />
        <input type="hidden" name="rating_management" value={ratingMgmt} />
        <input type="hidden" name="rating_worklife" value={ratingWl} />
        <input type="hidden" name="rating_career" value={ratingCareer} />
        <input type="hidden" name="would_recommend" value={wouldRecommend} />
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="pros" value={pros} />
        <input type="hidden" name="cons" value={cons} />
        <input type="hidden" name="content" value={content} />
        <input type="hidden" name="knew_before" value={knewBefore} />

        {/* ── Step 0 : Emploi ── */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label htmlFor="review-job-title" style={lbl}>Ton poste *</label>
              <input id="review-job-title" value={jobTitle} onChange={e => { setJobTitle(e.target.value); setStep1Err(""); }}
                placeholder="Ex : Software Engineer, Stage Marketing, CDI Finance..."
                style={inp} />
            </div>

            <div>
              <label style={lbl}>Type de contrat *</label>
              <PillPicker options={EMPLOYMENT_TYPES} value={employmentType} onChange={setEmploymentType} />
            </div>

            <div>
              <label style={lbl}>Statut *</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ v: true, l: "Employé actuel" }, { v: false, l: "Ancien employé" }].map(({ v, l }) => (
                  <button key={String(v)} type="button" onClick={() => setIsCurrent(v)}
                    className={`pill-btn${isCurrent === v ? " active" : ""}`}
                    style={{ flex: 1, justifyContent: "center" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Durée dans cette entreprise *</label>
              <PillPicker options={DURATION_RANGES} value={durationRange} onChange={v => { setDurationRange(v); setStep1Err(""); }} />
            </div>

            <div>
              <label style={lbl}>Mode de travail <span className="badge-optional">Optionnel</span></label>
              <PillPicker options={WORK_MODES} value={workMode} onChange={v => setWorkMode(v === workMode ? "" : v)} />
            </div>

            <div>
              <label htmlFor="review-salary" style={lbl}>Salaire annuel brut CHF <span className="badge-optional">Optionnel · Anonyme</span></label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text-muted)", pointerEvents: "none" }}>CHF</span>
                <input id="review-salary" type="number" value={salary} onChange={e => setSalary(e.target.value)}
                  placeholder="95000" min={10000} max={500000} style={{ ...inp, paddingLeft: 46 }} />
              </div>
              <p className="inp-hint">Jamais attribué à ton nom — aide la communauté à connaître les vrais salaires.</p>
            </div>

            {step1Err && <p role="alert" style={{ fontSize: 13, color: "#ef4444" }}>{step1Err}</p>}
          </div>
        )}

        {/* ── Step 1 : Notes ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 0 }}>Notes par catégorie *</p>
              <StarPicker name="rating_management" label="👔 Management direct" value={ratingMgmt} onChange={v => { setRatingMgmt(v); setStep2Err(""); }} />
              <div style={{ height: 1, background: "var(--border)" }} />
              <StarPicker name="rating_worklife" label="⚖️ Équilibre vie pro / perso" value={ratingWl} onChange={v => { setRatingWl(v); setStep2Err(""); }} />
              <div style={{ height: 1, background: "var(--border)" }} />
              <StarPicker name="rating_culture" label="🌍 Ambiance & culture" value={ratingCulture} onChange={v => { setRatingCulture(v); setStep2Err(""); }} />
              <div style={{ height: 1, background: "var(--border)" }} />
              <StarPicker name="rating_career" label="🚀 Perspectives d'évolution" value={ratingCareer} onChange={v => { setRatingCareer(v); setStep2Err(""); }} />
            </div>

            {/* Auto-computed overall */}
            {ratingOverall > 0 && (
              <div style={{ background: "var(--surface2)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Note globale calculée</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ fontSize: 20, color: n <= ratingOverall ? "#f59e0b" : "var(--border2)" }}>★</span>
                  ))}
                  <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginLeft: 4 }}>{ratingOverall}/5</span>
                </div>
              </div>
            )}

            <div>
              <label style={lbl}>Recommanderais-tu cette entreprise ? *</label>
              <div style={{ display: "flex", gap: 10 }}>
                {RECOMMEND.map(r => (
                  <button key={r.value} type="button" onClick={() => { setWouldRecommend(r.value); setStep2Err(""); }}
                    className={`pill-btn${wouldRecommend === r.value ? " active" : ""}`}
                    style={{ flex: 1, justifyContent: "center", fontSize: 14, padding: "12px 0" }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {step2Err && <p style={{ fontSize: 13, color: "#ef4444" }}>{step2Err}</p>}
          </div>
        )}

        {/* ── Step 2 : Avis ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Ton avis est <strong style={{ color: "var(--text)" }}>affiché anonymement</strong>. Seul ton poste et ta durée seront visibles.
              </p>
            </div>

            <div>
              <label htmlFor="review-title" style={lbl}>Titre <span className="badge-optional">Optionnel</span></label>
              <input id="review-title" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Ex : Bonne boîte mais attention au rythme..." style={inp} />
            </div>

            <style>{`@media (max-width: 500px) { .review-pros-cons { grid-template-columns: 1fr !important; } }`}</style>
            <div className="review-pros-cons" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label htmlFor="review-pros" style={lbl}>👍 Points positifs *</label>
                <textarea id="review-pros" value={pros} onChange={e => setPros(e.target.value)} rows={3}
                  placeholder="Ce que j'ai vraiment apprécié..." style={{ ...inp, resize: "vertical" }} />
              </div>
              <div>
                <label htmlFor="review-cons" style={lbl}>👎 Points négatifs *</label>
                <textarea id="review-cons" value={cons} onChange={e => setCons(e.target.value)} rows={3}
                  placeholder="Ce qui m'a déçu ou frustré..." style={{ ...inp, resize: "vertical" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label htmlFor="review-content" style={lbl}>Ton avis complet * <span style={{ fontWeight: 400, opacity: 0.5 }}>(min. 50 caractères)</span></label>
                <span style={{ fontSize: 11, color: content.length >= 50 ? "#10b981" : "#f97316" }}>
                  {content.length < 50 ? `encore ${50 - content.length} caractères min.` : "✓ Bon à publier"}
                </span>
              </div>
              <textarea id="review-content" value={content} onChange={e => setContent(e.target.value)} rows={5}
                placeholder="Décris ton expérience honnêtement : projets, ambiance, management, ce que tu referais ou pas..."
                style={{ ...inp, resize: "vertical" }} />
            </div>

            <div>
              <label htmlFor="review-knew-before" style={lbl}>💡 Ce que j'aurais voulu savoir avant <span className="badge-optional">Optionnel</span></label>
              <textarea id="review-knew-before" value={knewBefore} onChange={e => setKnewBefore(e.target.value)} rows={2}
                placeholder="Un conseil à quelqu'un qui rejoint cette boîte..."
                style={{ ...inp, resize: "vertical" }} />
            </div>

            {/* Charte d'engagement */}
            <div style={{
              background: "var(--surface2)", border: `1px solid ${charteAccepted ? "rgba(16,185,129,0.35)" : "var(--border2)"}`,
              borderRadius: 14, padding: "16px 18px", transition: "border-color 0.2s",
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 12, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                Charte de bonne foi
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  "J'ai eu une expérience personnelle avec cette entreprise",
                  "J'écris de bonne foi et sans intention malveillante",
                  "Je n'invente pas de faits et ne diffame pas de personnes",
                  "Je ne divulgue pas d'informations confidentielles",
                  "Je n'utilise pas de langage insultant ou discriminatoire",
                ].map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    <span style={{ color: "#10b981", flexShrink: 0, marginTop: 1 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={charteAccepted}
                  onChange={e => setCharteAccepted(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "#8b5cf6", cursor: "pointer", flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  Je confirme respecter cette charte et j'engage ma responsabilité en cas de fausse déclaration.
                </span>
              </label>
            </div>

            {state?.error && (
              <p style={{ fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(239,68,68,0.2)" }}>
                {state.error}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: "var(--surface2)", border: "1px solid var(--border2)",
                color: "var(--text-muted)", cursor: "pointer",
              }}>
              <ChevronLeft size={16} aria-hidden="true" /> Retour
            </button>
          )}

          {step < 2 ? (
            <button type="button" onClick={goNext}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "13px 0", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: "linear-gradient(135deg, #8b5cf6, #f97316)",
                border: "none", color: "#fff", cursor: "pointer",
              }}>
              Continuer <ChevronRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button type="submit"
              disabled={pending || !canSubmit}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: canSubmit ? "linear-gradient(135deg, #8b5cf6, #f97316)" : "var(--surface3)",
                border: "none",
                color: canSubmit ? "#fff" : "var(--text-muted)",
                cursor: canSubmit ? "pointer" : "not-allowed",
                opacity: pending ? 0.6 : 1,
              }}>
              {pending ? "Publication..." : "Publier mon avis 🚀"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "11px 14px", fontSize: 16, color: "var(--text)",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6,
};
