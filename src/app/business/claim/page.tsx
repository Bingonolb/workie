"use client";

import { useState, useActionState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, BadgeCheck, Building2, CheckCircle, Search, Mail, User, Briefcase, Link2, ExternalLink, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { submitClaim } from "@/lib/actions/business";

const JOB_LEVELS = ["Directeur / C-Level", "RH / People & Culture", "Responsable communication", "Manager", "Autre"];

function StepDots({ step }: { step: number }) {
  const labels = ["Entreprise", "Coordonnées", "Engagement"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: i < step ? "#10b981" : i === step ? "linear-gradient(135deg, #8b5cf6, #f97316)" : "var(--surface3)",
              border: i === step ? "none" : `2px solid ${i < step ? "#10b981" : "var(--border2)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: i <= step ? "#fff" : "var(--text-muted)",
              flexShrink: 0, transition: "all 0.3s",
            }}>
              {i < step ? <CheckCircle size={14} aria-hidden="true" /> : i + 1}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: i === step ? "#8b5cf6" : "var(--text-muted)", whiteSpace: "nowrap", letterSpacing: "0.03em" }}>{labels[i]}</span>
          </div>
          {i < 2 && <div style={{ flex: 1, height: 2, background: i < step ? "#10b981" : "var(--border2)", margin: "0 8px", marginBottom: 22, transition: "background 0.3s" }} />}
        </div>
      ))}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "12px 14px", fontSize: 16, color: "var(--text)",
  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
};
const lbl: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 4,
  fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 7, letterSpacing: "0.02em",
};

type CompanyResult = { id: string; name: string; city: string; sector: string };

function CompanySearch({ onSelect }: { onSelect: (c: CompanyResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 1) { setResults([]); setOpen(false); setActiveIdx(-1); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.companies ?? []);
        setOpen(true);
        setActiveIdx(-1);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 120);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = (c: CompanyResult) => {
    onSelect(c);
    setQuery(c.name);
    setOpen(false);
    setActiveIdx(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); handleSelect(results[activeIdx]); }
    else if (e.key === "Escape") { setOpen(false); setActiveIdx(-1); }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div className="inp-icon-wrap">
        <span className="inp-icon"><Search size={16} aria-hidden="true" /></span>
        {loading && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-muted)" }}>…</span>}
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Rechercher votre entreprise sur Workie..."
          style={{ ...inp, fontSize: 16 }}
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.2)", zIndex: 100, overflow: "hidden" }}>
          {results.map((c, i) => (
            <button key={c.id} type="button"
              onPointerDown={e => { e.preventDefault(); handleSelect(c); }}
              onPointerEnter={() => setActiveIdx(i)}
              onPointerLeave={() => setActiveIdx(-1)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: i === activeIdx ? "var(--surface2)" : "none", border: "none", cursor: "pointer", textAlign: "left", borderBottom: i < results.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #8b5cf6, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {c.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.city} · {c.sector}</p>
              </div>
              <Building2 size={13} aria-hidden="true" style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && !loading && query.length >= 1 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, padding: "18px", zIndex: 100, textAlign: "center" }}>
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
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState(submitClaim, undefined);

  useEffect(() => {
    if (state?.success) router.push("/business/checkout");
  }, [state?.success]);

  // Step 0 — company
  const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(null);

  // Step 1 — contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [zefixUrl, setZefixUrl] = useState("");
  const [message, setMessage] = useState("");

  // Step 2 — engagement
  const [charteOk, setCharteOk] = useState(false);
  const [noInfluenceOk, setNoInfluenceOk] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const [err, setErr] = useState("");
  const BANNED = ["@gmail.com", "@hotmail.com", "@yahoo.com", "@outlook.com", "@icloud.com"];

  const emailValid = workEmail.includes("@") && !BANNED.some(d => workEmail.toLowerCase().endsWith(d));
  const canNext0 = !!selectedCompany;
  const canNext1 = firstName.trim() && lastName.trim() && jobTitle.trim() && jobLevel && emailValid;
  const canSubmit = charteOk && noInfluenceOk && password.length >= 8 && password === confirmPwd;

  const goNext = () => {
    setErr("");
    if (step === 0 && !canNext0) { setErr("Sélectionnez votre entreprise dans la liste."); return; }
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) { setErr("Prénom et nom obligatoires."); return; }
      if (!jobTitle.trim()) { setErr("Votre poste est obligatoire."); return; }
      if (!jobLevel) { setErr("Sélectionnez votre niveau."); return; }
      if (BANNED.some(d => workEmail.toLowerCase().endsWith(d))) { setErr("Utilise ton email professionnel (domaine de l'entreprise)."); return; }
      if (!emailValid) { setErr("Email invalide."); return; }
    }
    setStep(s => s + 1);
  };

  if (state?.success) {
    return (
      <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <CheckCircle size={48} color="#10b981" aria-hidden="true" style={{ margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Compte créé !</p>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>Redirection vers le paiement…</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/business" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 0 }}>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #8b5cf6, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>workie</span>
          <span className="biz-form-nav-label">Business</span>
        </Link>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeToggle />
          <Link href="/business/login" className="biz-form-nav-link">Déjà un compte</Link>
        </div>
      </nav>
      <style>{`
        .biz-form-nav-label { font-size: 11px; font-weight: 800; letter-spacing: 0.05em; color: #8b5cf6; margin-left: 5px; text-transform: uppercase; opacity: 0.9; }
        .biz-form-nav-link { font-size: 12px; color: var(--text-muted); text-decoration: none; font-weight: 600; padding: 6px 10px; border-radius: 7px; border: 1px solid var(--border2); white-space: nowrap; }
        @media (max-width: 400px) { .biz-form-nav-label { display: none; } .biz-form-nav-link { display: none; } }
      `}</style>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 24px 80px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 50, padding: "5px 14px", marginBottom: 20, fontSize: 12, fontWeight: 700, color: "#8b5cf6" } as React.CSSProperties}>
              <BadgeCheck size={13} aria-hidden="true" /> Revendication de fiche entreprise
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

          {/* Hidden form submitted on step 2 */}
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
            <input name="zefix_url" value={zefixUrl} readOnly />
            <input name="message" value={message} readOnly />
            <input name="password" type="password" value={password} readOnly />
          </form>

          {/* ── Step 0 : Recherche entreprise ── */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={lbl}><Search size={12} aria-hidden="true" /> Rechercher votre entreprise *</label>
                <CompanySearch onSelect={c => setSelectedCompany(c)} />
              </div>

              {selectedCompany && (
                <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: "linear-gradient(135deg, #8b5cf6, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {selectedCompany.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>{selectedCompany.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedCompany.city} · {selectedCompany.sector}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <CheckCircle size={18} color="#10b981" aria-hidden="true" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>Sélectionnée</span>
                  </div>
                </div>
              )}

              <div style={{ padding: "14px 0", borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Votre entreprise n'est pas encore sur Workie ?{" "}
                  <Link href="/business/register" style={{ color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>L'ajouter →</Link>
                </p>
              </div>
            </div>
          )}

          {/* ── Step 1 : Contact ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Section — Identité */}
              <div className="form-section">
                <span className="form-section-title"><User size={11} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />Identité</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>Prénom *</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean" style={inp} autoComplete="given-name" />
                </div>
                <div>
                  <label style={lbl}>Nom *</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" style={inp} autoComplete="family-name" />
                </div>
              </div>
              <div>
                <label style={lbl}>Votre poste *</label>
                <div className="inp-icon-wrap">
                  <span className="inp-icon"><Briefcase size={15} aria-hidden="true" /></span>
                  <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Ex : HR Manager, DRH, Directeur RH..." style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Niveau *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {JOB_LEVELS.map(l => (
                    <button key={l} type="button" onClick={() => setJobLevel(l)}
                      className={`pill-btn${jobLevel === l ? " active" : ""}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section — Contact */}
              <div className="form-section" style={{ marginTop: 8 }}>
                <span className="form-section-title"><Mail size={11} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />Contact professionnel</span>
              </div>
              <div>
                <label style={lbl}>Email professionnel *</label>
                <div className="inp-icon-wrap">
                  <span className="inp-icon"><Mail size={15} aria-hidden="true" /></span>
                  <input type="email" value={workEmail} onChange={e => setWorkEmail(e.target.value)} placeholder="jean.dupont@entreprise.ch" style={inp} autoComplete="work email" />
                </div>
                {workEmail && BANNED.some(d => workEmail.toLowerCase().endsWith(d)) && (
                  <p style={{ fontSize: 11, color: "#ef4444", marginTop: 5 }}>⚠ Adresse personnelle non acceptée — utilise ton email d'entreprise.</p>
                )}
                {!workEmail && <p className="inp-hint">Gmail, Hotmail, Yahoo et autres adresses personnelles non acceptés.</p>}
              </div>

              {/* Section — Vérification */}
              <div className="form-section" style={{ marginTop: 8 }}>
                <span className="form-section-title"><Link2 size={11} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />Vérification légale</span>
              </div>
              <div>
                <label style={lbl}>
                  Lien Zefix (registre du commerce CH)
                  <span className="badge-optional">Optionnel</span>
                </label>
                <div className="inp-icon-wrap">
                  <span className="inp-icon"><Link2 size={15} aria-hidden="true" /></span>
                  <input
                    type="url"
                    value={zefixUrl}
                    onChange={e => setZefixUrl(e.target.value)}
                    placeholder="https://www.zefix.ch/fr/search/entity/list/firm/..."
                    style={inp}
                    autoComplete="off"
                  />
                </div>
                <p className="inp-hint">
                  Trouvez votre entreprise sur{" "}
                  <a href="https://www.zefix.ch" target="_blank" rel="noopener noreferrer"
                    style={{ color: "#8b5cf6", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 2 }}>
                    zefix.ch <ExternalLink size={10} aria-hidden="true" />
                  </a>{" "}
                  et copiez l'URL. Cela accélère la validation de votre demande.
                </p>
              </div>

              {/* Section — Message */}
              <div>
                <label style={lbl}>
                  <MessageSquare size={12} aria-hidden="true" /> Message
                  <span className="badge-optional">Optionnel</span>
                </label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                  placeholder="Des précisions à apporter à notre équipe ? Rôle particulier, contexte spécial..."
                  style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
              </div>
            </div>
          )}

          {/* ── Step 2 : Engagement ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Récapitulatif */}
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 16, padding: "20px 24px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>Récapitulatif</p>
                {[
                  { label: "Entreprise", value: `${selectedCompany?.name} · ${selectedCompany?.city}` },
                  { label: "Contact", value: `${firstName} ${lastName} — ${jobTitle}` },
                  { label: "Email", value: workEmail },
                  ...(zefixUrl ? [{ label: "Zefix", value: zefixUrl.replace("https://www.zefix.ch/fr/search/entity/list/firm/", "…/") }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", gap: 12, fontSize: 13, marginBottom: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--text-muted)", width: 80, flexShrink: 0, fontWeight: 600 }}>{label}</span>
                    <span style={{ color: "var(--text)", fontWeight: 500, wordBreak: "break-all" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Engagements */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  {
                    checked: charteOk, set: setCharteOk,
                    text: <>Je confirme représenter légitimement <strong>{selectedCompany?.name}</strong> et être habilité à gérer sa présence en ligne.</>
                  },
                  {
                    checked: noInfluenceOk, set: setNoInfluenceOk,
                    text: <>Je comprends qu'aucun abonnement ne permet de supprimer ou modifier un avis. L'indépendance éditoriale de Workie est non négociable.</>
                  },
                ].map(({ checked, set, text }, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", background: checked ? "rgba(139,92,246,0.05)" : "var(--surface2)", border: `1px solid ${checked ? "rgba(139,92,246,0.25)" : "var(--border2)"}`, borderRadius: 12, padding: "14px 16px", transition: "all 0.2s" }}>
                    <input type="checkbox" checked={checked} onChange={e => set(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: "#8b5cf6", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{text}</span>
                  </label>
                ))}
              </div>

              {/* Account creation */}
              <div style={{ borderTop: "1px solid var(--border2)", paddingTop: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Créez votre accès Workie Business</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={lbl}>Email</label>
                    <input value={workEmail} readOnly style={{ ...inp, opacity: 0.6 }} />
                  </div>
                  <div>
                    <label style={lbl}>Mot de passe * <span style={{ fontWeight: 400, opacity: 0.6 }}>(min. 8 caractères)</span></label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inp} autoComplete="new-password" />
                  </div>
                  <div>
                    <label style={lbl}>Confirmer le mot de passe *</label>
                    <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" style={{ ...inp, borderColor: confirmPwd && confirmPwd !== password ? "#ef4444" : undefined }} autoComplete="new-password" />
                    {confirmPwd && confirmPwd !== password && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>Les mots de passe ne correspondent pas.</p>}
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <BadgeCheck size={16} color="#8b5cf6" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Votre compte est créé immédiatement. Vous serez redirigé vers le paiement sécurisé, puis accéderez à votre dashboard. Le badge bleu est accordé sous 48h ouvrées.
                </p>
              </div>

              {state?.error && (
                <div role="alert" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#ef4444" }}>
                  {state.error}
                </div>
              )}
            </div>
          )}

          {err && (
            <div role="alert" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#ef4444", marginTop: 16 }}>
              {err}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
            {step > 0 && (
              <button type="button" onClick={() => { setStep(s => s - 1); setErr(""); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 20px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                <ArrowLeft size={16} aria-hidden="true" /> Retour
              </button>
            )}
            {step < 2 ? (
              <button type="button" onClick={goNext}
                disabled={step === 0 && !selectedCompany}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 10, border: "none", cursor: (step === 0 && !selectedCompany) ? "not-allowed" : "pointer", background: (step === 0 && !selectedCompany) ? "var(--surface2)" : "linear-gradient(135deg, #8b5cf6, #f97316)", color: (step === 0 && !selectedCompany) ? "var(--text-muted)" : "#fff", fontWeight: 700, fontSize: 15, transition: "opacity 0.15s" }}>
                Continuer <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button type="submit" form="claim-form" disabled={!canSubmit || pending}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 10, border: "none", background: canSubmit ? "linear-gradient(135deg, #8b5cf6, #f97316)" : "var(--surface2)", color: canSubmit ? "#fff" : "var(--text-muted)", fontWeight: 700, fontSize: 15, cursor: canSubmit ? "pointer" : "not-allowed", opacity: pending ? 0.7 : 1, transition: "opacity 0.15s" }}>
                {pending ? "Envoi en cours..." : <><CheckCircle size={16} aria-hidden="true" /> Soumettre ma demande</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
