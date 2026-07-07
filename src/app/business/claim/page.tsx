"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, BadgeCheck, Building2, CheckCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { submitClaim } from "@/lib/actions/business";

const EMPLOYEE_RANGES = ["11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"];
const JOB_LEVELS = ["Directeur / C-Level", "RH / People & Culture", "Responsable communication", "Manager", "Autre"];

function StepDots({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ height: 4, borderRadius: 2, width: i === step ? 32 : 16, background: i <= step ? "linear-gradient(135deg, #8b5cf6, #f97316)" : "var(--border2)", transition: "all 0.3s" }} />
      ))}
      <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8, fontWeight: 600 }}>{step + 1} / 3</span>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "var(--text)",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6,
};

export default function ClaimPage() {
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState(submitClaim, undefined);

  // Step 0
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [employeeRange, setEmployeeRange] = useState("");

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [message, setMessage] = useState("");

  // Step 2
  const [charteOk, setCharteOk] = useState(false);
  const [noInfluenceOk, setNoInfluenceOk] = useState(false);

  const [err, setErr] = useState("");

  const BANNED_DOMAINS = ["@gmail.com", "@hotmail.com", "@yahoo.com", "@outlook.com", "@icloud.com"];

  const canNext0 = companyName.trim().length > 1 && !!employeeRange;
  const canNext1 = firstName.trim() && lastName.trim() && jobTitle.trim() && jobLevel &&
    workEmail.includes("@") && !BANNED_DOMAINS.some(d => workEmail.toLowerCase().endsWith(d));
  const canSubmit = charteOk && noInfluenceOk;

  const goNext = () => {
    setErr("");
    if (step === 0 && !canNext0) { setErr("Remplis les champs obligatoires."); return; }
    if (step === 1) {
      if (!workEmail.includes("@")) { setErr("Email invalide."); return; }
      if (BANNED_DOMAINS.some(d => workEmail.toLowerCase().endsWith(d))) {
        setErr("Utilise ton email professionnel (domaine de l'entreprise)."); return;
      }
      if (!canNext1) { setErr("Remplis tous les champs obligatoires."); return; }
    }
    setStep(s => s + 1);
  };

  if (state?.success) {
    return (
      <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 480 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
            <CheckCircle size={36} color="#10b981" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16 }}>Demande envoyée !</h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 12 }}>
            Nous avons bien reçu votre demande pour <strong style={{ color: "var(--text)" }}>{companyName}</strong>.
          </p>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 40 }}>
            Notre équipe vérifie chaque demande manuellement. Vous recevrez une réponse à <strong style={{ color: "var(--text)" }}>{workEmail}</strong> sous <strong style={{ color: "var(--text)" }}>48h ouvrées</strong>.
          </p>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            Retour à l'accueil <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textDecoration: "none" }}>
          workie
        </Link>
        <ThemeToggle />
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 24px 80px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 50, padding: "5px 14px", marginBottom: 20, fontSize: 12, fontWeight: 700, color: "#8b5cf6" } as React.CSSProperties}>
              <BadgeCheck size={13} /> Revendication de fiche entreprise
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 8 }}>
              {step === 0 && "Votre entreprise"}
              {step === 1 && "Vos coordonnées"}
              {step === 2 && "Votre engagement"}
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {step === 0 && "Dites-nous quelle entreprise vous représentez."}
              {step === 1 && "Nous avons besoin d'un contact professionnel pour vérifier votre identité."}
              {step === 2 && "Dernière étape — prenez connaissance de nos conditions."}
            </p>
          </div>

          <StepDots step={step} />

          {/* Hidden fields for form action (step 2 submit) */}
          <form action={action} id="claim-form" style={{ display: "none" }}>
            <input name="company_name" value={companyName} readOnly />
            <input name="company_website" value={companyWebsite} readOnly />
            <input name="employee_range" value={employeeRange} readOnly />
            <input name="first_name" value={firstName} readOnly />
            <input name="last_name" value={lastName} readOnly />
            <input name="job_title" value={jobTitle} readOnly />
            <input name="job_level" value={jobLevel} readOnly />
            <input name="work_email" value={workEmail} readOnly />
            <input name="message" value={message} readOnly />
          </form>

          {/* ── Step 0 ── */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={lbl}>Nom de l'entreprise *</label>
                <div style={{ position: "relative" }}>
                  <Building2 size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                    placeholder="Ex : Galenica AG, Nestlé, ABB..." style={{ ...inp, paddingLeft: 40 }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Site web <span style={{ fontWeight: 400, opacity: 0.5 }}>(optionnel)</span></label>
                <input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="https://www.entreprise.ch" style={inp} />
              </div>
              <div>
                <label style={lbl}>Taille de l'entreprise *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {EMPLOYEE_RANGES.map(r => (
                    <button key={r} type="button" onClick={() => setEmployeeRange(r)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.15s", borderColor: employeeRange === r ? "#8b5cf6" : "var(--border2)", background: employeeRange === r ? "rgba(139,92,246,0.12)" : "var(--surface2)", color: employeeRange === r ? "#8b5cf6" : "var(--text-muted)" }}>
                      {r} employés
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>Prénom *</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Nom *</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Votre poste *</label>
                <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Ex : HR Manager, DRH, Directeur communication..." style={inp} />
              </div>
              <div>
                <label style={lbl}>Niveau de responsabilité *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {JOB_LEVELS.map(l => (
                    <button key={l} type="button" onClick={() => setJobLevel(l)} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.15s", borderColor: jobLevel === l ? "#8b5cf6" : "var(--border2)", background: jobLevel === l ? "rgba(139,92,246,0.12)" : "var(--surface2)", color: jobLevel === l ? "#8b5cf6" : "var(--text-muted)" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Email professionnel *</label>
                <input type="email" value={workEmail} onChange={e => setWorkEmail(e.target.value)} placeholder="jean.dupont@entreprise.ch" style={inp} />
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>Doit correspondre au domaine de l'entreprise. Gmail, Hotmail et Yahoo non acceptés.</p>
              </div>
              <div>
                <label style={lbl}>Message <span style={{ fontWeight: 400, opacity: 0.5 }}>(optionnel)</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Quelque chose à préciser..." style={{ ...inp, resize: "vertical" }} />
              </div>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 16, padding: "24px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Récapitulatif</p>
                {[
                  { label: "Entreprise", value: `${companyName} · ${employeeRange} employés` },
                  { label: "Contact", value: `${firstName} ${lastName} — ${jobTitle}` },
                  { label: "Email", value: workEmail },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", gap: 12, fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: "var(--text-muted)", width: 80, flexShrink: 0 }}>{label}</span>
                    <span style={{ color: "var(--text)", fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={charteOk} onChange={e => setCharteOk(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#8b5cf6", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
                    Je confirme représenter légitimement <strong>{companyName}</strong> et être habilité à gérer sa présence en ligne. Je fournis des informations exactes.
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={noInfluenceOk} onChange={e => setNoInfluenceOk(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#8b5cf6", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
                    Je comprends qu'aucun abonnement ne permet de supprimer, modifier ou masquer un avis publié. L'indépendance éditoriale de Workie est non négociable.
                  </span>
                </label>
              </div>

              <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Après soumission, notre équipe vérifie votre identité sous <strong style={{ color: "var(--text)" }}>48h ouvrées</strong>. Vous recevrez ensuite un lien pour activer votre abonnement.
                </p>
              </div>

              {state?.error && <p style={{ fontSize: 13, color: "#ef4444" }}>{state.error}</p>}
            </div>
          )}

          {err && <p style={{ fontSize: 13, color: "#ef4444", marginTop: 16 }}>{err}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
            {step > 0 && (
              <button type="button" onClick={() => { setStep(s => s - 1); setErr(""); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 20px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                <ArrowLeft size={16} /> Retour
              </button>
            )}

            {step < 2 ? (
              <button type="button" onClick={goNext} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 15 }}>
                Continuer <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" form="claim-form" disabled={!canSubmit || pending} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 10, border: "none", background: canSubmit ? "linear-gradient(135deg, #8b5cf6, #f97316)" : "var(--surface2)", color: canSubmit ? "#fff" : "var(--text-muted)", fontWeight: 700, fontSize: 15, cursor: canSubmit ? "pointer" : "not-allowed", opacity: pending ? 0.7 : 1 }}>
                {pending ? "Envoi..." : <><CheckCircle size={16} /> Soumettre ma demande</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
