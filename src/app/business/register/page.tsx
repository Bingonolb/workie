"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Building2, CheckCircle, Plus, Shield, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { submitClaim } from "@/lib/actions/business";

const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const SECTORS = ["Tech", "Finance", "Assurances", "Pharma", "Santé", "Conseil", "Industrie", "Automobile", "Horlogerie", "Commerce", "Alimentation", "Agriculture", "Éducation & Recherche", "Sports & Fashion", "Transport", "Énergie"];
const JOB_LEVELS = ["Directeur / C-Level", "Fondateur / CEO", "RH / People & Culture", "Responsable communication", "Manager", "Autre"];
const CANTONS = ["ZH", "BE", "GE", "VD", "LU", "BS", "ZG", "AG", "SG", "TI", "FR", "VS", "NE", "BL", "SO", "TG", "GR", "SH", "AR", "AI", "UR", "SZ", "OW", "NW", "GL", "JU"];

const TOTAL_STEPS = 4;

function StepDots({ step }: { step: number }) {
  const labels = ["Entreprise", "Contact", "Engagement", "Abonnement"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 40, flexWrap: "wrap" }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: i === step ? 28 : 8, height: 4, borderRadius: 2, background: i <= step ? "linear-gradient(135deg, #8b5cf6, #f97316)" : "var(--border2)", transition: "all 0.3s" }} />
            <span style={{ fontSize: 10, fontWeight: i === step ? 700 : 500, color: i <= step ? "#8b5cf6" : "var(--text-muted)", display: i < 2 ? "none" : undefined }}>
              {i === step ? label : ""}
            </span>
          </div>
          {i < labels.length - 1 && <div style={{ width: 6, height: 1, background: "var(--border2)", marginBottom: 12 }} />}
        </div>
      ))}
      <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6, fontWeight: 600 }}>{step + 1} / {TOTAL_STEPS}</span>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "12px 14px", fontSize: 16, color: "var(--text)",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6,
};

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState(submitClaim, undefined);

  // Step 0 — Entreprise
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [city, setCity] = useState("");
  const [canton, setCanton] = useState("");
  const [sector, setSector] = useState("");
  const [employeeRange, setEmployeeRange] = useState("");

  // Step 1 — Contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [message, setMessage] = useState("");

  // Step 2 — Engagement
  const [charteOk, setCharteOk] = useState(false);
  const [noInfluenceOk, setNoInfluenceOk] = useState(false);

  const [err, setErr] = useState("");
  const BANNED = ["@gmail.com", "@hotmail.com", "@yahoo.com", "@outlook.com", "@icloud.com"];

  const canNext0 = companyName.trim().length > 1 && !!sector && !!employeeRange;
  const canNext1 = !!(firstName.trim() && lastName.trim() && jobTitle.trim() && jobLevel &&
    workEmail.includes("@") && !BANNED.some(d => workEmail.toLowerCase().endsWith(d)));
  const canNext2 = charteOk && noInfluenceOk;

  const goNext = () => {
    setErr("");
    if (step === 0 && !canNext0) { setErr("Nom, secteur et taille sont obligatoires."); return; }
    if (step === 1) {
      if (BANNED.some(d => workEmail.toLowerCase().endsWith(d))) { setErr("Utilise ton email professionnel (domaine de l'entreprise)."); return; }
      if (!canNext1) { setErr("Remplis tous les champs obligatoires."); return; }
    }
    if (step === 2 && !canNext2) { setErr("Accepte les deux engagements pour continuer."); return; }
    setStep(s => s + 1);
  };

  // Success = form submitted, now on step 3 (checkout)
  // We go to step 3 (pricing) first, submission happens at step 2
  const hasStripe = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (state?.success) {
    // After submission, show the checkout step
    return (
      <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid var(--border)" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>workie</span>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.04em", color: "#8b5cf6", marginLeft: 6, textTransform: "uppercase" as const, opacity: 0.9 }}>Business</span>
          </Link>
          <ThemeToggle />
        </nav>

        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 24px 80px" }}>
          <div style={{ width: "100%", maxWidth: 540 }}>

            {/* Success banner */}
            <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, marginBottom: 36 }}>
              <CheckCircle size={28} color="#10b981" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 3 }}>Demande enregistrée !</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Fiche <strong style={{ color: "var(--text)" }}>{companyName}</strong> · Vérification sous 48h ouvrées à <strong style={{ color: "var(--text)" }}>{workEmail}</strong>
                </p>
              </div>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 8 }}>Et maintenant ?</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 32 }}>
              Notre équipe valide votre fiche sous 48h ouvrées et vous envoie un lien pour activer votre abonnement.
            </p>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 20, padding: "28px 24px", marginBottom: 16 }}>
              {[
                { icon: "1", text: "Votre demande est en cours de vérification par notre équipe." },
                { icon: "2", text: `Un email sera envoyé à ${workEmail} dès validation.` },
                { icon: "3", text: "Vous activerez votre abonnement (99 CHF/mois ou 890 CHF/an) via le lien reçu." },
              ].map(({ icon, text }) => (
                <div key={icon} style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
                  <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, marginTop: 4 }}>{text}</p>
                </div>
              ))}
              <a href={`mailto:hello@workie.ch?subject=Demande entreprise — ${encodeURIComponent(companyName)}&body=Bonjour,%0A%0AJe viens de soumettre la demande pour ${encodeURIComponent(companyName)}.%0AEmail professionnel : ${encodeURIComponent(workEmail)}%0A%0AMerci.`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, textDecoration: "none", marginTop: 8 }}>
                Une question ? Contactez-nous
              </a>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>
              <Shield size={13} /> Sans engagement · Annulation à tout moment · Données sécurisées
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 0 }}>
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>workie</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.04em", color: "#8b5cf6", marginLeft: 6, textTransform: "uppercase" as const, opacity: 0.9 }}>Business</span>
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <ThemeToggle />
          <Link href="/business/claim" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontWeight: 500 }}>
            Fiche existante ? <span style={{ color: "#8b5cf6", fontWeight: 700 }}>La revendiquer →</span>
          </Link>
        </div>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 24px 80px" }}>
        <div style={{ width: "100%", maxWidth: 580 }}>

          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 50, padding: "5px 14px", marginBottom: 20, fontSize: 12, fontWeight: 700, color: "#10b981" } as React.CSSProperties}>
              <Plus size={13} /> Nouvelle fiche entreprise
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 8 }}>
              {step === 0 && "Votre entreprise"}
              {step === 1 && "Vos coordonnées"}
              {step === 2 && "Votre engagement"}
              {step === 3 && "Votre abonnement"}
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {step === 0 && "Votre entreprise n'est pas encore sur Workie. Quelques infos pour créer votre fiche."}
              {step === 1 && "Nous vérifions que vous représentez bien cette entreprise."}
              {step === 2 && "Dernière étape avant d'activer votre compte."}
              {step === 3 && "Choisissez votre formule et activez votre compte dès aujourd'hui."}
            </p>
          </div>

          <StepDots step={step} />

          {/* Hidden form for submit */}
          <form action={action} id="register-form" style={{ display: "none" }}>
            <input name="company_name" value={companyName} readOnly />
            <input name="company_website" value={companyWebsite} readOnly />
            <input name="employee_range" value={employeeRange} readOnly />
            <input name="first_name" value={firstName} readOnly />
            <input name="last_name" value={lastName} readOnly />
            <input name="job_title" value={jobTitle} readOnly />
            <input name="job_level" value={jobLevel} readOnly />
            <input name="work_email" value={workEmail} readOnly />
            <input name="message" value={`[NOUVELLE ENTREPRISE] Secteur: ${sector} · Canton: ${canton} · Ville: ${city}${message ? " · " + message : ""}`} readOnly />
          </form>

          {/* ── Step 0 : Entreprise ── */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={lbl}>Nom de l&apos;entreprise *</label>
                <div style={{ position: "relative" }}>
                  <Building2 size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex : Ma Startup Sàrl, Mon Cabinet SA..." style={{ ...inp, paddingLeft: 40 }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>Ville principale</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex : Genève, Zurich..." style={inp} />
                </div>
                <div>
                  <label style={lbl}>Canton</label>
                  <select value={canton} onChange={e => setCanton(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                    <option value="">Sélectionner...</option>
                    {CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl}>Site web <span style={{ fontWeight: 400, opacity: 0.5 }}>(optionnel)</span></label>
                <input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="https://www.entreprise.ch" style={inp} />
              </div>

              <div>
                <label style={lbl}>Secteur d&apos;activité *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SECTORS.map(s => (
                    <button key={s} type="button" onClick={() => setSector(s)} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.15s", borderColor: sector === s ? "#10b981" : "var(--border2)", background: sector === s ? "rgba(16,185,129,0.1)" : "var(--surface2)", color: sector === s ? "#10b981" : "var(--text-muted)" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Taille de l&apos;entreprise *</label>
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

          {/* ── Step 1 : Contact ── */}
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
                <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Ex : Fondateur, DRH, CEO..." style={inp} />
              </div>
              <div>
                <label style={lbl}>Niveau *</label>
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
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>Doit correspondre au domaine de l&apos;entreprise. Gmail, Hotmail, Yahoo non acceptés.</p>
              </div>
              <div>
                <label style={lbl}>Message <span style={{ fontWeight: 400, opacity: 0.5 }}>(optionnel)</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Contexte supplémentaire pour notre équipe..." style={{ ...inp, resize: "vertical" }} />
              </div>
            </div>
          )}

          {/* ── Step 2 : Engagement ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Summary */}
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 16, padding: "20px 24px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Récapitulatif</p>
                {[
                  { label: "Entreprise", value: `${companyName}${canton ? ` · ${canton}` : ""}${sector ? ` · ${sector}` : ""}` },
                  { label: "Taille", value: `${employeeRange} employés` },
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
                    Je confirme représenter légitimement <strong>{companyName}</strong> et être habilité à créer et gérer sa présence sur Workie. Je fournis des informations exactes.
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={noInfluenceOk} onChange={e => setNoInfluenceOk(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#8b5cf6", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
                    Je comprends que les avis publiés par des employés sont indépendants. Aucun abonnement ne permet de les supprimer, modifier ou masquer.
                  </span>
                </label>
              </div>

              <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 10 }}>
                <Zap size={15} color="#8b5cf6" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Après validation, notre équipe crée votre fiche sous <strong style={{ color: "var(--text)" }}>48h ouvrées</strong>. Vous accédez au paiement dès l&apos;étape suivante.
                </p>
              </div>

              {state?.error && <p style={{ fontSize: 13, color: "#ef4444" }}>{state.error}</p>}
            </div>
          )}

          {err && <p style={{ fontSize: 13, color: "#ef4444", marginTop: 16 }}>{err}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
            {step > 0 && (
              <button type="button" onClick={() => { setStep(s => s - 1); setErr(""); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 20px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                <ArrowLeft size={16} /> Retour
              </button>
            )}

            {step < 2 && (
              <button type="button" onClick={goNext}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 15 }}>
                Continuer <ArrowRight size={16} />
              </button>
            )}

            {step === 2 && (
              <button type="submit" form="register-form" disabled={!canNext2 || pending}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 10, border: "none", background: canNext2 ? "linear-gradient(135deg, #8b5cf6, #f97316)" : "var(--surface2)", color: canNext2 ? "#fff" : "var(--text-muted)", fontWeight: 700, fontSize: 15, cursor: canNext2 ? "pointer" : "not-allowed", opacity: pending ? 0.7 : 1 }}>
                {pending ? "Envoi..." : <><Zap size={16} /> Valider et choisir mon abonnement</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
