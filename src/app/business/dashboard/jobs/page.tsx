"use client";

import { useEffect, useState, useActionState } from "react";
import { getBusinessJobs, createJobOffer, toggleJobOffer, deleteJobOffer } from "@/lib/actions/business";
import { Plus, Briefcase, MapPin, Trash2, Eye, EyeOff, CheckCircle } from "lucide-react";

const CONTRACT_TYPES = ["CDI", "CDD", "Stage", "Alternance", "Freelance"];

type Job = {
  id: string;
  title: string;
  description: string;
  location: string;
  contract_type: string;
  salary_range: string;
  is_active: boolean;
  created_at: string;
};

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "var(--text)",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6,
};

function CreateJobForm({ onCreated }: { onCreated: () => void }) {
  const [state, action, pending] = useActionState(createJobOffer, undefined);
  const [contractType, setContractType] = useState("CDI");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.success) { setOpen(false); onCreated(); }
  }, [state?.success]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 10, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        <Plus size={18} /> Publier une offre
      </button>
    );
  }

  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px", marginBottom: 28 }}>
      <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 24 }}>Nouvelle offre d'emploi</p>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <input type="hidden" name="contract_type" value={contractType} />

        {state?.error && <p style={{ fontSize: 13, color: "#ef4444" }}>{state.error}</p>}

        <div>
          <label style={lbl}>Intitulé du poste *</label>
          <input name="title" required placeholder="Ex : Développeur Full-Stack, HR Manager..." style={inp} />
        </div>

        <div>
          <label style={lbl}>Type de contrat *</label>
          <div style={{ display: "flex", gap: 8 }}>
            {CONTRACT_TYPES.map(t => (
              <button key={t} type="button" onClick={() => setContractType(t)} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.15s", borderColor: contractType === t ? "#8b5cf6" : "var(--border2)", background: contractType === t ? "rgba(139,92,246,0.12)" : "var(--surface)", color: contractType === t ? "#8b5cf6" : "var(--text-muted)" }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={lbl}>Lieu</label>
            <input name="location" placeholder="Ex : Genève, Zurich, Remote..." style={inp} />
          </div>
          <div>
            <label style={lbl}>Fourchette salariale</label>
            <input name="salary_range" placeholder="Ex : 80-100k CHF/an" style={inp} />
          </div>
        </div>

        <div>
          <label style={lbl}>Description du poste</label>
          <textarea name="description" rows={4} placeholder="Décrivez les missions, le profil recherché..." style={{ ...inp, resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={() => setOpen(false)} style={{ padding: "10px 20px", borderRadius: 9, background: "var(--surface)", border: "1px solid var(--border2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Annuler
          </button>
          <button type="submit" disabled={pending} style={{ padding: "10px 24px", borderRadius: 9, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
            {pending ? "Publication..." : "Publier l'offre"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getBusinessJobs().then(r => { setJobs((r.jobs as Job[]) ?? []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id: string, current: boolean) => {
    await toggleJobOffer(id, !current);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, is_active: !current } : j));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette offre ?")) return;
    await deleteJobOffer(id);
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 6 }}>Offres d'emploi</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Publiez des offres directement sur votre fiche Workie.</p>
        </div>
        <CreateJobForm onCreated={load} />
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2].map(i => <div key={i} style={{ height: 100, background: "var(--surface2)", borderRadius: 16, border: "1px solid var(--border)" }} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
          <Briefcase size={48} style={{ opacity: 0.2, margin: "0 auto 20px" }} />
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Aucune offre publiée</p>
          <p style={{ fontSize: 14 }}>Créez votre première offre pour attirer des candidats qualifiés.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {jobs.map(job => (
            <div key={job.id} style={{ background: "var(--surface2)", border: `1px solid ${job.is_active ? "var(--border)" : "var(--border)"}`, borderRadius: 14, padding: "18px 20px", opacity: job.is_active ? 1 : 0.6 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{job.title}</p>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 50, background: job.is_active ? "rgba(16,185,129,0.1)" : "var(--surface3, var(--border))", color: job.is_active ? "#10b981" : "var(--text-muted)", fontWeight: 700 }}>
                      {job.is_active ? "Active" : "Désactivée"}
                    </span>
                    {job.contract_type && (
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 50, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", fontWeight: 600 }}>{job.contract_type}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {job.location && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
                        <MapPin size={13} /> {job.location}
                      </span>
                    )}
                    {job.salary_range && (
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>💰 {job.salary_range}</span>
                    )}
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      Publiée le {new Date(job.created_at).toLocaleDateString("fr-CH")}
                    </span>
                  </div>
                  {job.description && (
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {job.description}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleToggle(job.id, job.is_active)} title={job.is_active ? "Désactiver" : "Activer"} style={{ padding: "8px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border2)", cursor: "pointer", color: "var(--text-muted)" }}>
                    {job.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => handleDelete(job.id)} title="Supprimer" style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer", color: "#ef4444" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
