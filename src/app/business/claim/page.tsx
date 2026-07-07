"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, BadgeCheck, Building2, CheckCircle, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { submitClaim } from "@/lib/actions/business";

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

type CompanyResult = { id: string; name: string; city: string; sector: string };

function CompanySearch({ onSelect }: { onSelect: (c: CompanyResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.companies ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        {loading && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-muted)" }}>...</span>}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher votre entreprise sur Workie..."
          style={{ ...inp, paddingLeft: 40 }}
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 100, overflow: "hidden" }}>
          {results.map(c => (
            <button key={c.id} type="button" onClick={() => { onSelect(c); setQuery(c.name); setOpen(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #8b5cf6, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {c.name[0]}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 1 }}>{c.name}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.city} · {c.sector}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, padding: "16px", zIndex: 100, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>Aucun résultat pour « {query} »</p>
          <Link href="/business/register" style={{ fontSize: 13, color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>
            Ajouter mon entreprise sur Workie →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ClaimPage() {
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState(submitClaim, undefined);

  // Step 0 — company
  const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(null);

  // Step 1 — contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [message, setMessage] = useState("");

  // Step 2 — engagement
  const [charteOk, setCharteOk] = useState(false);
  const [noInfluenceOk, setNoInfluenceOk] = useState(false);

  const [err, setErr] = useState("");
  const BANNED = ["@gmail.com", "@hotmail.com", "@yahoo.com", "@outlook.com", "@icloud.com"];

  const canNext0 = !!selectedCompany;
  const canNext1 = firstName.trim() && lastName.trim() && jobTitle.trim() && jobLevel &&
    workEmail.includes("@") && !BANNED.some(d => workEmail.toLowerCase().endsWith(d));
  const canSubmit = charteOk && noInfluenceOk;

  const goNext = () => {
    setErr("");
    if (step === 0 && !canNext0) { setErr("Sélectionnez votre entreprise dans la liste."); return; }
    if (step === 1) {
      if (BANNED.some(d => workEmail.toLowerCase().endsWith(d))) { setErr("Utilise ton email professionnel (domaine de l'entreprise)."); return; }
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
            Nous avons bien reçu votre demande pour <strong style={{ color: "var(--text)" }}>{selectedCompany?.name}</strong>.
          </p>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 40 }}>
            Notre équipe vérifie chaque demande manuellement. Vous recevrez un accès à <strong style={{ color: "var(--text)" }}>{workEmail}</strong> sous <strong style={{ color: "var(--text)" }}>48h ouvrées</strong>.
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
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 0 }}>
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>workie</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.04em", color: "#8b5cf6", marginLeft: 6, textTransform: "uppercase" as const, opacity: 0.9 }}>Business</span>
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <ThemeToggle />
          <Link href="/business/login" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontWeight: 500 }}>Déjà un compte</Link>
        </div>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 24px 80px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 50, padding: "5px 14px", marginBottom: 20, fontSize: 12, fontWeight: 700, color: "#8b5cf6" } as React.CSSProperties}>
              <BadgeCheck size={13} /> Revendication de fiche entreprise
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 8 }}>
              {step === 0 && "Trouvez votre entreprise"}
              {step === 1 && "Vos coordonnées"}
              {step === 2 && "Votre engagement"}
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {step === 0 && "Cherchez votre entreprise parmi les fiches déjà présentes sur Workie."}
              {step === 1 && "Nous avons besoin d'un contact professionnel pour vérifier votre identité."}
              {step === 2 && "Dernière étape avant la validation de votre demande."}
            </p>
          </div>

          <StepDots step={step} />

          <form action={action} id="claim-form" style={{ display: "none" }}>
            <input name="company_name" value={selectedCompany?.name ?? ""} readOnly />
            <input name="company_id" value={selectedCompany?.id ?? ""} readOnly />
            <input name="company_website" value="" readOnly />
            <input name="employee_range" value="" readOnly />
            <input name="first_name" value={firstName} readOnly />
            <input name="last_name" value={lastName} readOnly />
            <input name="job_title" value={jobTitle} readOnly />
            <input name="job_level" value={jobLevel} readOnly />
            <input name="work_email" value={workEmail} readOnly />
            <input name="message" value={message} readOnly />
          </form>

          {/* ── Step 0 : Recherche entreprise ── */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={lbl}>Rechercher votre entreprise *</label>
                <CompanySearch onSelect={c => setSelectedCompany(c)} />
              </div>

              {selectedCompany && (
                <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg, #8b5cf6, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {selectedCompany.name[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>{selectedCompany.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedCompany.city} · {selectedCompany.sector}</p>
                  </div>
                  <CheckCircle size={20} color="#10b981" style={{ marginLeft: "auto", flexShrink: 0 }} />
                </div>
              )}

              <div style={{ padding: "14px 0", borderTop: "1px solid var(--border2)" }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Votre entreprise n'est pas encore sur Workie ?{" "}
                  <Link href="/business/register" style={{ color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>L'ajouter →</Link>
                </p>
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
                <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Ex : HR Manager, DRH..." style={inp} />
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
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>Gmail, Hotmail, Yahoo non acceptés.</p>
              </div>
              <div>
                <label style={lbl}>Message <span style={{ fontWeight: 400, opacity: 0.5 }}>(optionnel)</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Quelque chose à préciser..." style={{ ...inp, resize: "vertical" }} />
              </div>
            </div>
          )}

          {/* ── Step 2 : Engagement ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 16, padding: "20px 24px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Récapitulatif</p>
                {[
                  { label: "Entreprise", value: `${selectedCompany?.name} · ${selectedCompany?.city}` },
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
                    Je confirme représenter légitimement <strong>{selectedCompany?.name}</strong> et être habilité à gérer sa présence en ligne.
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={noInfluenceOk} onChange={e => setNoInfluenceOk(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#8b5cf6", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
                    Je comprends qu'aucun abonnement ne permet de supprimer ou modifier un avis. L'indépendance éditoriale de Workie est non négociable.
                  </span>
                </label>
              </div>

              <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Notre équipe vérifie votre identité sous <strong style={{ color: "var(--text)" }}>48h ouvrées</strong>. Vous recevrez ensuite un lien pour accéder à votre espace entreprise.
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
