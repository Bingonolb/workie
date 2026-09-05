import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { getUserCampaigns, deleteUserCampaign } from "@/lib/actions/ads";

import Image from "next/image";
import { Plus, Eye, MousePointer, TrendingUp, CheckCircle, XCircle, ArrowLeft, Megaphone } from "lucide-react";
import type { AdCampaign } from "@/lib/actions/ads";
import { CarteCampagne } from "./CarteCampagne";
import { STATUS_CONFIG } from "./etat";


function ctr(imp: number, clk: number) {
  return imp ? `${((clk / imp) * 100).toFixed(1)}%` : "–";
}

export default async function UserAdsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [user, sp] = await Promise.all([getUser(), searchParams]);
  if (!user) redirect("/login?next=/profile/ads");

  const { campaigns = [], error } = await getUserCampaigns();
  const activeTab = sp.tab ?? "all";
  const paymentSuccess = sp.payment === "success";
  const paymentCanceled = sp.payment === "canceled";

  const counts = {
    all: campaigns.length,
    payment_pending: campaigns.filter(c => c.status === "payment_pending").length,
    active: campaigns.filter(c => c.status === "active").length,
    pending: campaigns.filter(c => c.status === "pending").length,
    paused: campaigns.filter(c => c.status === "paused").length,
    completed: campaigns.filter(c => c.status === "completed").length,
    rejected: campaigns.filter(c => c.status === "rejected").length,
  };

  const totalImpressions = campaigns.reduce((s, c) => s + Number(c.impression_count), 0);
  const totalClicks = campaigns.reduce((s, c) => s + Number(c.click_count), 0);
  const totalSpent = campaigns.reduce((s, c) => s + Number(c.spent_chf ?? 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active");

  // Les filtres ne servent qu'à séparer. Tant que toutes les campagnes portent
  // le même état, « Toutes 2 » et « À payer 2 » désignent la même liste : deux
  // boutons pour un seul résultat.
  const etatsDistincts = new Set(campaigns.map(c => c.status)).size;
  const filtresUtiles = etatsDistincts > 1;

  // Le filtre de l'adresse est ignoré quand les boutons ne sont pas affichés,
  // sans quoi un ancien lien en « ?tab=active » viderait la liste sans laisser
  // de quoi revenir en arrière.
  const filtreApplique = filtresUtiles ? activeTab : "all";
  const filtered = campaigns.filter(c => filtreApplique === "all" || c.status === filtreApplique);

  // Les compteurs n'apprennent rien avant la première diffusion : trois tuiles
  // pour annoncer zéro, zéro et un tiret.
  const chiffresUtiles = totalImpressions > 0;

  return (
    <div className="page-root">
      <main className="page-main-md" style={{ paddingTop: 24, paddingBottom: 48 }}>

        <Link href="/profile" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 20 }}>
          <ArrowLeft size={14} aria-hidden="true" /> Mon profil
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>Mes publicités</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              {campaigns.length === 0
                ? "Aucune campagne pour l'instant"
                : `${campaigns.length} campagne${campaigns.length > 1 ? "s" : ""}${activeCampaigns.length > 0 ? `, ${activeCampaigns.length} active${activeCampaigns.length > 1 ? "s" : ""}` : ""}`}
            </p>
          </div>
          <Link href="/profile/ads/new" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "11px 22px", borderRadius: 12,
            background: "var(--brand)",
            color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}>
            <Plus size={16} aria-hidden="true" /> Nouvelle pub
          </Link>
        </div>

        {paymentSuccess && (
          <div role="status" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "14px 18px", color: "#10b981", fontSize: 14, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={16} aria-hidden="true" /> Paiement reçu. Votre campagne est en cours de vérification (24 h ouvrées).
          </div>
        )}
        {paymentCanceled && (
          <div role="alert" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 18px", color: "#ef4444", fontSize: 14, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <XCircle size={16} aria-hidden="true" /> Paiement annulé. Vous pouvez le reprendre depuis la liste ci-dessous.
          </div>
        )}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {campaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px 60px" }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <Megaphone size={30} color="var(--brand)" strokeWidth={1.7} aria-hidden="true" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Aucune campagne pour l&apos;instant</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.7 }}>
              Touchez des milliers de candidats actifs en Suisse. Pas d&apos;abonnement : vous payez votre budget, rien d&apos;autre.
            </p>
            <Link href="/profile/ads/new" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 26px", borderRadius: 12,
              background: "var(--brand)",
              color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
            }}>
              <Plus size={16} aria-hidden="true" /> Créer ma première pub
            </Link>
          </div>
        ) : (
          <>
            {chiffresUtiles && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
                {[
                  { label: "Vues totales", value: totalImpressions.toLocaleString("fr-CH"), icon: <Eye size={14} aria-hidden="true" />, color: "#8b5cf6" },
                  { label: "Clics totaux", value: totalClicks.toLocaleString("fr-CH"), icon: <MousePointer size={14} aria-hidden="true" />, color: "#f97316" },
                  { label: "CTR moyen", value: ctr(totalImpressions, totalClicks), icon: <TrendingUp size={14} aria-hidden="true" />, color: "#10b981" },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>{icon}</div>
                    <div>
                      <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{value}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalSpent > 0 && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                Budget total dépensé : <strong style={{ color: "var(--text)" }}>CHF {totalSpent.toFixed(2)}</strong>
              </p>
            )}

            {filtresUtiles && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {([
                  ["all", "Toutes", counts.all],
                  ["payment_pending", "À payer", counts.payment_pending],
                  ["pending", "En révision", counts.pending],
                  ["active", "Actives", counts.active],
                  ["paused", "Pausées", counts.paused],
                  ["completed", "Terminées", counts.completed],
                  ["rejected", "Rejetées", counts.rejected],
                ] as [string, string, number][]).filter(([s, , n]) => s === "all" || n > 0).map(([status, label, n]) => {
                  const isActive = filtreApplique === status;
                  return (
                    <a key={status} href={`?tab=${status}`} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "6px 14px", borderRadius: 50, fontSize: 13, fontWeight: 600,
                      textDecoration: "none",
                      border: isActive ? "1px solid #8b5cf6" : "1px solid var(--border2)",
                      background: isActive ? "rgba(139,92,246,0.12)" : "transparent",
                      color: isActive ? "#8b5cf6" : "var(--text-muted)",
                    }}>
                      {status !== "all" && (
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.dot ?? "#6b7280", display: "inline-block" }} />
                      )}
                      {label}
                      {n > 0 && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{n}</span>}
                    </a>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((c: AdCampaign) => (
                <CarteCampagne key={c.id} c={c} onDelete={deleteUserCampaign} />
              ))}
            </div>

            <Link href="/profile/ads/new" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginTop: 16, padding: "16px", borderRadius: 16,
              border: "1.5px dashed rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.03)",
              color: "#8b5cf6", fontWeight: 700, fontSize: 14, textDecoration: "none",
            }}>
              <Plus size={18} aria-hidden="true" /> Lancer une nouvelle campagne
            </Link>
          </>
        )}

        <div style={{ marginTop: 28, background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Megaphone size={14} color="#8b5cf6" aria-hidden="true" />
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Comment ça fonctionne</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { step: "1", text: "Créez votre campagne : visuel, canton et budget" },
              { step: "2", text: "Payez le budget total par Stripe" },
              { step: "3", text: "Notre équipe valide sous 24 h ouvrées" },
              { step: "4", text: "Votre pub tourne jusqu'à épuisement du budget" },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#8b5cf6", flexShrink: 0 }}>{step}</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
