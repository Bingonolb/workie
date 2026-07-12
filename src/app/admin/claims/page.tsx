"use client";

import { useEffect, useState, useTransition } from "react";
import { getClaims, approveClaim, rejectClaim } from "@/lib/actions/admin";
import { CheckCircle, XCircle, Clock, Building2, Mail, User, Briefcase, ArrowLeft, AlertTriangle, ArrowRightLeft, Link2, ExternalLink } from "lucide-react";
import Link from "next/link";

type Claim = {
  id: string;
  company_name: string;
  company_website: string | null;
  employee_range: string | null;
  first_name: string;
  last_name: string;
  job_title: string;
  job_level: string;
  work_email: string;
  zefix_url: string | null;
  message: string | null;
  status: string | null;
  company_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  existing_owner: string | null;
};

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b", label: "En attente" },
  approved: { bg: "rgba(16,185,129,0.1)",  color: "#10b981", label: "Approuvée" },
  rejected: { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", label: "Refusée" },
};

type MsgState = { id: string; text: string; ok: boolean; alreadyOwned?: string } | null;

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [msg, setMsg] = useState<MsgState>(null);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    setLoadError(null);
    getClaims()
      .then(r => {
        if (r.error) { setLoadError(r.error); return; }
        if (r.claims) setClaims(r.claims as Claim[]);
      })
      .catch(e => setLoadError((e as Error).message ?? "Erreur de chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handle = (id: string, action: "approve" | "reject" | "force-approve") => {
    startTransition(async () => {
      if (action === "reject") {
        const res = await rejectClaim(id);
        if (res.error) {
          setMsg({ id, text: res.error, ok: false });
        } else {
          setMsg({ id, text: "Refusée", ok: true });
          load();
        }
      } else {
        const force = action === "force-approve";
        const res = await approveClaim(id, force);
        if (res.alreadyOwned) {
          setMsg({ id, text: res.error ?? "", ok: false, alreadyOwned: res.alreadyOwned });
          // Don't auto-clear — user must confirm or cancel the transfer
          return;
        } else if (res.error) {
          setMsg({ id, text: res.error, ok: false });
        } else {
          setMsg({ id, text: "Approuvée — email envoyé", ok: true });
          load();
        }
      }
      setTimeout(() => setMsg(null), 6000);
    });
  };

  const filtered = filter === "all" ? claims : claims.filter(c => (c.status ?? "pending") === filter);
  const counts = {
    pending:  claims.filter(c => !c.status || c.status === "pending").length,
    approved: claims.filter(c => c.status === "approved").length,
    rejected: claims.filter(c => c.status === "rejected").length,
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", padding: "40px 32px 80px", maxWidth: 900, margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>
          <ArrowLeft size={15} /> Admin
        </Link>
        <div style={{ width: 1, height: 16, background: "var(--border)" }} />
        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em" }}>Demandes de revendication</h1>
        {counts.pending > 0 && (
          <span style={{ fontSize: 12, fontWeight: 800, background: "#ef4444", color: "#fff", borderRadius: 50, padding: "2px 8px" }}>
            {counts.pending} en attente
          </span>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {([
          { v: "pending",  l: `En attente (${counts.pending})` },
          { v: "approved", l: `Approuvées (${counts.approved})` },
          { v: "rejected", l: `Refusées (${counts.rejected})` },
          { v: "all",      l: `Toutes (${claims.length})` },
        ] as const).map(({ v, l }) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: filter === v ? "#8b5cf6" : "var(--border2)", background: filter === v ? "rgba(139,92,246,0.1)" : "var(--surface2)", color: filter === v ? "#8b5cf6" : "var(--text-muted)" }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Chargement...</p>
      ) : loadError ? (
        <div style={{ padding: "20px 24px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#ef4444", fontSize: 14, fontWeight: 600 }}>
          ⚠ Erreur de chargement : {loadError}
          <button onClick={load} style={{ marginLeft: 14, fontSize: 13, color: "#8b5cf6", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Réessayer</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
          <Clock size={40} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, fontWeight: 600 }}>Aucune demande {filter !== "all" ? STATUS_COLORS[filter]?.label?.toLowerCase() : ""}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map(claim => {
            const status = claim.status ?? "pending";
            const sc = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
            const isThisMsg = msg?.id === claim.id;
            const isAlreadyOwned = isThisMsg && !!msg?.alreadyOwned;

            return (
              <div key={claim.id} style={{
                background: "var(--surface)", border: `1px solid ${claim.existing_owner && status === "pending" ? "rgba(245,158,11,0.4)" : "var(--border)"}`,
                borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column", gap: 16,
              }}>

                {/* Already-owned warning banner */}
                {claim.existing_owner && status === "pending" && (
                  <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>
                      ⚠️ Cette entreprise est déjà revendiquée par <strong>{claim.existing_owner}</strong>. Approuver transférera l'accès.
                    </p>
                  </div>
                )}

                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Building2 size={20} color="#8b5cf6" />
                    </div>
                    <div>
                      <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>{claim.company_name}</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {claim.employee_range && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{claim.employee_range} employés</span>}
                        {claim.company_website && <a href={claim.company_website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#8b5cf6" }}>{claim.company_website}</a>}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 50, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                    {sc.label}
                  </span>
                </div>

                {/* Contact info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
                    <User size={14} />
                    <span><strong style={{ color: "var(--text)" }}>{claim.first_name} {claim.last_name}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
                    <Briefcase size={14} />
                    <span>{claim.job_title} · {claim.job_level}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <Mail size={14} color="#8b5cf6" />
                    <a href={`mailto:${claim.work_email}`} style={{ color: "#8b5cf6", textDecoration: "none", fontWeight: 600 }}>{claim.work_email}</a>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Reçue le {new Date(claim.created_at).toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>

                {claim.zefix_url && (
                  <a href={claim.zefix_url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#8b5cf6", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, padding: "6px 12px", textDecoration: "none", width: "fit-content" }}>
                    <Link2 size={13} /> Fiche Zefix <ExternalLink size={11} />
                  </a>
                )}

                {claim.message && (
                  <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, borderLeft: "3px solid var(--border2)" }}>
                    {claim.message}
                  </div>
                )}

                {/* Feedback */}
                {isThisMsg && !isAlreadyOwned && (
                  <p style={{ fontSize: 13, fontWeight: 600, color: msg.ok ? "#10b981" : "#ef4444" }}>
                    {msg.ok ? "✓ " : "✗ "}{msg.text}
                  </p>
                )}

                {/* Already-owned conflict resolution */}
                {isAlreadyOwned && (
                  <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 16px" }}>
                    <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 12 }}>
                      ⚠️ {msg?.text}
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => { setMsg(null); handle(claim.id, "force-approve"); }}
                        disabled={isPending}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        <ArrowRightLeft size={15} /> Confirmer le transfert
                      </button>
                      <button
                        onClick={() => setMsg(null)}
                        style={{ padding: "9px 16px", borderRadius: 9, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {status === "pending" && !isAlreadyOwned && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => handle(claim.id, "approve")}
                      disabled={isPending}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 9, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: isPending ? 0.6 : 1 }}>
                      <CheckCircle size={16} /> Approuver & inviter
                    </button>
                    <button
                      onClick={() => handle(claim.id, "reject")}
                      disabled={isPending}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 9, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: isPending ? 0.6 : 1 }}>
                      <XCircle size={16} /> Refuser
                    </button>
                  </div>
                )}

                {status === "approved" && (
                  <p style={{ fontSize: 12, color: "#10b981" }}>✓ Email d&apos;accès envoyé à {claim.work_email}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
