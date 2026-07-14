"use client";

import { useEffect, useState, useActionState, useTransition } from "react";
import { getBusinessJobs, createJobOffer, toggleJobOffer, deleteJobOffer, getJobCantonStats } from "@/lib/actions/business";
import { Plus, Briefcase, MapPin, Trash2, Eye, EyeOff, ExternalLink, ChevronDown, ChevronUp, MousePointer, BarChart2 } from "lucide-react";

const CONTRACT_TYPES = ["CDI", "CDD", "Stage", "Alternance", "Freelance"];
const WORK_MODES = ["Présentiel", "Hybride", "Remote"];
const EXPERIENCE_LEVELS = ["Junior (0-2 ans)", "Confirmé (3-5 ans)", "Senior (6+ ans)", "Lead / Manager", "Toute expérience"];

type Job = {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  location: string | null;
  work_mode: string | null;
  contract_type: string | null;
  experience_level: string | null;
  salary_range: string | null;
  apply_url: string | null;
  is_active: boolean;
  created_at: string;
  apply_click_count: number;
  view_count: number;
};

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "11px 14px", fontSize: 16, color: "var(--text)",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6,
};

function PillGroup({ options, value, onChange, color = "#8b5cf6" }: {
  options: string[]; value: string; onChange: (v: string) => void; color?: string;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o === value ? "" : o)}
          style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.15s",
            borderColor: value === o ? color : "var(--border2)",
            background: value === o ? `${color}18` : "var(--surface2)",
            color: value === o ? color : "var(--text-muted)" }}>
          {o}
        </button>
      ))}
    </div>
  );
}

function CreateJobForm({ onCreated }: { onCreated: () => void }) {
  const [state, action, pending] = useActionState(createJobOffer, undefined);
  const [open, setOpen] = useState(false);
  const [contractType, setContractType] = useState("CDI");
  const [workMode, setWorkMode] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  useEffect(() => {
    if (state?.success) { setOpen(false); onCreated(); setContractType("CDI"); setWorkMode(""); setExperienceLevel(""); }
  }, [state?.success]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 10, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        <Plus size={18} /> Publier une offre
      </button>
    );
  }

  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 20, padding: "32px", marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>Nouvelle offre d&apos;emploi</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Remplissez les informations — plus c&apos;est complet, plus vous attirez les bons profils.</p>
        </div>
        <button type="button" onClick={() => setOpen(false)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 20, lineHeight: 1 }}>✕</button>
      </div>

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Hidden pills */}
        <input type="hidden" name="contract_type" value={contractType} />
        <input type="hidden" name="work_mode" value={workMode} />
        <input type="hidden" name="experience_level" value={experienceLevel} />

        {state?.error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#ef4444" }}>
            {state.error}
          </div>
        )}

        {/* Titre */}
        <div>
          <label style={lbl}>Intitulé du poste *</label>
          <input name="title" required placeholder="Ex : Développeur Full-Stack Senior, HR Business Partner…" style={{ ...inp, fontWeight: 600 }} />
        </div>

        {/* Contrat + mode */}
        <div className="biz-form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={lbl}>Type de contrat *</label>
            <PillGroup options={CONTRACT_TYPES} value={contractType} onChange={setContractType} color="#8b5cf6" />
          </div>
          <div>
            <label style={lbl}>Mode de travail</label>
            <PillGroup options={WORK_MODES} value={workMode} onChange={setWorkMode} color="#10b981" />
          </div>
        </div>

        {/* Lieu + salaire */}
        <div className="biz-form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={lbl}>Localisation</label>
            <input name="location" placeholder="Ex : Genève, Zurich, Remote Suisse…" style={inp} />
          </div>
          <div>
            <label style={lbl}>Fourchette salariale</label>
            <input name="salary_range" placeholder="Ex : 90–110k CHF/an" style={inp} />
          </div>
        </div>

        {/* Expérience */}
        <div>
          <label style={lbl}>Niveau d&apos;expérience</label>
          <PillGroup options={EXPERIENCE_LEVELS} value={experienceLevel} onChange={setExperienceLevel} color="#f97316" />
        </div>

        {/* Description */}
        <div>
          <label style={lbl}>Description du poste</label>
          <textarea name="description" rows={5} placeholder="Décrivez les missions, le contexte de l'équipe, ce que vous offrez…" style={{ ...inp, resize: "vertical", lineHeight: 1.65 }} />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>Décrivez le rôle, l&apos;équipe, l&apos;environnement de travail.</p>
        </div>

        {/* Prérequis */}
        <div>
          <label style={lbl}>Prérequis & compétences</label>
          <textarea name="requirements" rows={4} placeholder="• 3+ ans d'expérience en React&#10;• Maîtrise de TypeScript&#10;• Bon niveau d'anglais…" style={{ ...inp, resize: "vertical", lineHeight: 1.65 }} />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>Listez les compétences et qualifications attendues.</p>
        </div>

        {/* Lien candidature */}
        <div style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "18px 20px" }}>
          <label style={{ ...lbl, color: "#8b5cf6", marginBottom: 8 }}>
            🔗 Lien pour postuler
          </label>
          <input name="apply_url" type="url" placeholder="https://jobs.monentreprise.ch/apply/… ou https://linkedin.com/jobs/…" style={inp} />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6 }}>
            Les candidats seront redirigés vers ce lien. Peut être votre ATS, LinkedIn, Indeed, ou une page de votre site carrière.
            Si vous ne renseignez pas de lien, les candidats verront vos coordonnées sur la fiche entreprise.
          </p>
        </div>

        <div className="biz-submit-row" style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
          <button type="button" onClick={() => setOpen(false)}
            style={{ padding: "11px 24px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Annuler
          </button>
          <button type="submit" disabled={pending}
            style={{ padding: "11px 28px", borderRadius: 10, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
            {pending ? "Publication…" : "Publier l'offre"}
          </button>
        </div>
      </form>
    </div>
  );
}

function JobCard({ job, onToggle, onDelete }: { job: Job; onToggle: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [cantonStats, setCantonStats] = useState<{ canton: string; count: number }[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [, startTransition] = useTransition();

  const handleStatsToggle = () => {
    if (!statsOpen && cantonStats.length === 0) {
      setStatsLoading(true);
      startTransition(async () => {
        const res = await getJobCantonStats(job.id);
        setCantonStats(res);
        setStatsLoading(false);
      });
    }
    setStatsOpen(o => !o);
  };

  const clicks = Number(job.apply_click_count ?? 0);

  return (
    <div style={{ background: "var(--surface2)", border: `1px solid ${job.is_active ? "var(--border)" : "var(--border)"}`, borderRadius: 16, overflow: "hidden", opacity: job.is_active ? 1 : 0.65 }}>
      {/* Header */}
      <div style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{job.title}</p>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 50, fontWeight: 700,
              background: job.is_active ? "rgba(16,185,129,0.1)" : "var(--surface3, var(--border))",
              color: job.is_active ? "#10b981" : "var(--text-muted)" }}>
              {job.is_active ? "Active" : "Désactivée"}
            </span>
            {job.contract_type && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 50, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", fontWeight: 600 }}>{job.contract_type}</span>}
            {job.work_mode && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 50, background: "rgba(16,185,129,0.08)", color: "#10b981", fontWeight: 600 }}>{job.work_mode}</span>}
            {job.experience_level && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 50, background: "rgba(249,115,22,0.08)", color: "#f97316", fontWeight: 600 }}>{job.experience_level}</span>}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            {job.location && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}><MapPin size={13} /> {job.location}</span>}
            {job.salary_range && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>💰 {job.salary_range}</span>}
            {job.apply_url && (
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>
                <ExternalLink size={12} /> Lien candidature
              </a>
            )}
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Publiée le {new Date(job.created_at).toLocaleDateString("fr-CH")}
            </span>
          </div>
        </div>

        {/* Quick stats chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={handleStatsToggle} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: clicks > 0 ? "#8b5cf6" : "var(--text-muted)", background: clicks > 0 ? "rgba(139,92,246,0.08)" : "var(--surface)", border: `1px solid ${clicks > 0 ? "rgba(139,92,246,0.25)" : "var(--border2)"}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>
            <MousePointer size={12} /> {clicks} candidature{clicks !== 1 ? "s" : ""}
            <BarChart2 size={11} style={{ marginLeft: 2, opacity: 0.6 }} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          <button onClick={() => setExpanded(e => !e)} title="Détails"
            className="biz-action-btn"
            style={{ padding: "10px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border2)", cursor: "pointer", color: "var(--text-muted)", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={onToggle} title={job.is_active ? "Désactiver" : "Activer"}
            className="biz-action-btn"
            style={{ padding: "10px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border2)", cursor: "pointer", color: "var(--text-muted)", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {job.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {confirmDelete ? (
            <>
              <button onClick={onDelete} title="Confirmer la suppression"
                style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", cursor: "pointer", color: "#ef4444", fontSize: 12, fontWeight: 700, minHeight: 44 }}>
                Confirmer
              </button>
              <button onClick={() => setConfirmDelete(false)} title="Annuler"
                style={{ padding: "6px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border2)", cursor: "pointer", color: "var(--text-muted)", fontSize: 12, minHeight: 44 }}>
                Annuler
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Supprimer"
              className="biz-action-btn"
              style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer", color: "#ef4444", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Stats panel */}
      {statsOpen && (
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", background: "rgba(139,92,246,0.02)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
            Statistiques de l&apos;offre
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12, marginBottom: cantonStats.length > 0 ? 16 : 0 }}>
            {[
              { label: "Clics Postuler", value: clicks, color: "#8b5cf6" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: "-0.02em" }}>{value}</p>
              </div>
            ))}
          </div>
          {statsLoading ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Chargement des régions…</p>
          ) : cantonStats.length > 0 ? (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Régions des candidats</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {cantonStats.map(({ canton, count }) => {
                  const pct = Math.round((count / clicks) * 100);
                  return (
                    <div key={canton}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: "var(--text)" }}>{canton}</span>
                        <span style={{ color: "var(--text-muted)" }}>{count} clic{count > 1 ? "s" : ""} · {pct}%</span>
                      </div>
                      <div style={{ height: 5, background: "var(--surface2)", borderRadius: 50, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #8b5cf6, #f97316)", borderRadius: 50 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : clicks === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Aucun clic enregistré pour l&apos;instant.</p>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Données de région non disponibles.</p>
          )}
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border)" }}>
          {job.description && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{job.description}</p>
            </div>
          )}
          {job.requirements && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Prérequis</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{job.requirements}</p>
            </div>
          )}
          {job.apply_url && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6", marginBottom: 6 }}>🔗 Lien de candidature</p>
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: "#8b5cf6", wordBreak: "break-all", textDecoration: "none" }}>
                {job.apply_url}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionError, setActionError] = useState("");

  const load = () => {
    getBusinessJobs()
      .then(r => {
        if (r.error) { setActionError(r.error); return; }
        setJobs((r.jobs as Job[]) ?? []);
      })
      .catch(e => setActionError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id: string, current: boolean) => {
    setActionError("");
    try {
      const res = await toggleJobOffer(id, !current);
      if (res.error) { setActionError(res.error); return; }
      setJobs(prev => prev.map(j => j.id === id ? { ...j, is_active: !current } : j));
    } catch (e) { setActionError((e as Error).message); }
  };

  const handleDelete = async (id: string) => {
    setActionError("");
    try {
      const res = await deleteJobOffer(id);
      if (res.error) { setActionError(res.error); return; }
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (e) { setActionError((e as Error).message); }
  };

  const active = jobs.filter(j => j.is_active).length;
  const inactive = jobs.filter(j => !j.is_active).length;

  return (
    <div className="biz-page" style={{ maxWidth: 900 }}>
      {actionError && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#ef4444", marginBottom: 20 }}>
          {actionError}
        </div>
      )}
      <div className="biz-jobs-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 6 }}>Offres d&apos;emploi</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Publiez des offres sur votre fiche Workie. Les candidats voient vos avis avant de postuler — vous attirez des profils vraiment motivés.
          </p>
          {jobs.length > 0 && (
            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>{active} active{active > 1 ? "s" : ""}</span>
              {inactive > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{inactive} désactivée{inactive > 1 ? "s" : ""}</span>}
            </div>
          )}
        </div>
        <CreateJobForm onCreated={load} />
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2].map(i => <div key={i} style={{ height: 100, background: "var(--surface2)", borderRadius: 16, border: "1px solid var(--border)" }} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
          <Briefcase size={48} style={{ opacity: 0.2, margin: "0 auto 20px", display: "block" }} />
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Aucune offre publiée</p>
          <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>
            Créez votre première offre pour l&apos;afficher sur votre fiche publique et sur <strong>/jobs</strong>.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onToggle={() => handleToggle(job.id, job.is_active)}
              onDelete={() => handleDelete(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
