
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { getUserCampaignById, getUserCampaignDailyStats, getUserCampaignCantonStats, pauseUserCampaign } from "@/lib/actions/ads";

import { GraphiqueJours } from "@/components/GraphiqueJours";
import { CANTON_NAMES } from "@/lib/types";
import { CancelCampaignButton } from "@/components/CancelCampaignButton";
import Image from "next/image";
import { ArrowLeft, Eye, MousePointer, TrendingUp, ExternalLink, AlertTriangle } from "lucide-react";



import { SilhouetteFormat } from "@/components/ads/SilhouetteFormat";
import { etat, jour } from "../etat";
import { SECTORS } from "@/lib/types";
import { tServeur, langueDeLaPage } from "@/i18n/page";
import { riche } from "@/i18n/riche";
import { nomCanton } from "@/i18n/cantons";
import { nomSecteur } from "@/i18n/secteurs";


/** Les vingt-six cantons : au complet, la liste ne dit rien de plus que le pays. */
const CANTONS_SUISSES = 26;

/**
 * Une liste de cibles, ou le mot qui la resume.
 *
 * Enumerer les vingt-six cantons pour dire « toute la Suisse » demande au
 * lecteur de compter avant de comprendre. Au-dela de cinq entrees, la liste
 * cesse elle aussi d'etre lisible : vingt et un noms de secteurs forment un
 * paragraphe qu'on saute. Le compte, lui, se lit d'un coup.
 *
 * En dessous de cinq, la liste est l'information : ce sont les cantons qu'on a
 * choisis, et il y a une raison de les nommer.
 */
function listeCourte(valeurs: string[], total: number, tout: string, resume: (n: number, total: number) => string): string {
  if (valeurs.length === 0 || valeurs.length >= total) return tout;
  if (valeurs.length > 5) return resume(valeurs.length, total);
  return valeurs.join(", ");
}

/** Le détail d'une campagne, dans le profil ou dans l'espace entreprise. */
export async function DetailCampagne({ id, dansEspace }: { id: string; dansEspace: boolean }) {
  const [user, t, langue] = await Promise.all([getUser(), tServeur(), langueDeLaPage()]);
  if (!user) redirect("/login?next=/profile/ads");
  // Langue de la requête, jamais une variable de module partagée entre
  // requêtes simultanées (une page allemande pouvait sortir en format suisse romand).
  const LOC = langue === "de" ? "de-CH" : "fr-CH";
  const pourcent = (n: number) => `${n.toLocaleString(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} %`;
  const chf = (n: number) => `CHF ${n.toLocaleString(LOC, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  /** Part des vues qui ont mené à un clic. */
  const ctr = (imp: number, clk: number) => (imp ? pourcent((clk / imp) * 100) : "–");
  const cpc = (clk: number, spent: number) => (clk ? chf(spent / clk) : "–");
  const liste = dansEspace ? "/espace-entreprise/publicites" : "/profile/ads";
  const Corps = dansEspace ? "div" : "main";

  const [campaign, stats, cantonStats] = await Promise.all([
    getUserCampaignById(id),
    getUserCampaignDailyStats(id),
    getUserCampaignCantonStats(id),
  ]);
  if (!campaign) notFound();

  const e = etat(campaign, t);
  const totalBudget = Number(campaign.total_budget_chf);
  const spentBudget = Number(campaign.spent_chf);
  const impCount = Number(campaign.impression_count);
  const clkCount = Number(campaign.click_count);
  const budgetPct = totalBudget > 0 ? Math.min(100, Math.round((spentBudget / totalBudget) * 100)) : 0;

  const last7 = stats.slice(-7);
  const last7Imp = last7.reduce((s, d) => s + d.impressions, 0);
  const last7Clk = last7.reduce((s, d) => s + d.clicks, 0);
  // Le dernier jour de la série est aujourd'hui, à l'heure suisse.
  const today = stats[stats.length - 1];

  // Jours de diffusion écoulés : jusqu'à aujourd'hui pour une campagne en
  // cours, pas jusqu'à sa date de fin future, qui faisait chuter la moyenne.
  // eslint-disable-next-line react-hooks/purity
  const maintenant = Date.now();
  const fin = campaign.end_date ? Math.min(new Date(campaign.end_date).getTime(), maintenant) : maintenant;
  const durationDays = campaign.start_date
    ? Math.max(1, Math.ceil((fin - new Date(campaign.start_date).getTime()) / 86400000))
    : 1;
  const avgDailyImp = Math.round(impCount / durationDays);
  const avgDailyClk = Math.round(clkCount / durationDays);

  return (
    <div className={dansEspace ? undefined : "page-root"}>
      <style>{`
        /* Le rendu large est correct et ne change pas : tout ce qui suit est
           borné au mobile.

           Le défaut : la grille des indicateurs restait en deux colonnes quelle
           que soit la largeur. Mesuré sur un écran de 375 px, elle tenait deux
           colonnes de 191 et 139 px, et les sous-grilles tombaient à 150 px de
           large pour y loger jusqu'à trois colonnes. « Dépensé » et son montant
           se touchaient, le CTR était coupé en deux. */
        @media (max-width: 760px) {
          .ads-kpi-grid { grid-template-columns: 1fr !important; }

          /* Cibles tactiles : « Mettre en pause » faisait 35 px de haut et le
             retour 20 px, là où un doigt en demande 44. */
          .ads-retour { min-height: 44px; align-items: center; }
          .ads-action { min-height: 44px !important; padding-left: 18px !important; padding-right: 18px !important; }
          .ads-bascule { min-height: 44px !important; min-width: 64px !important; font-size: 13px !important; }
          .ads-lien { display: inline-flex !important; align-items: center; min-height: 44px; }

          /* Le visuel de 100 px et le titre se disputaient la largeur : le
             titre passait sur quatre lignes. Le visuel s'étale, le titre
             respire. */
          .ads-entete { flex-direction: column !important; gap: 14px !important; }
          .ads-visuel { width: 100% !important; height: 160px !important; }
        }
      `}</style>
      <Corps className={dansEspace ? undefined : "page-main-md"} style={dansEspace ? undefined : { paddingTop: 24, paddingBottom: 48 }}>

        <Link href={liste} className="ads-retour" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 20 }}>
          <ArrowLeft size={14} aria-hidden="true" /> {t("pubs.titre")}
        </Link>

        {/* Header */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden", marginBottom: 20 }}>
          <div className="ads-entete" style={{ display: "flex", gap: 20, padding: "22px 24px", flexWrap: "wrap" }}>
            <div className="ads-visuel" style={{ width: 100, height: 100, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {campaign.image_url
                ? <Image src={campaign.image_url} alt="" width={100} height={100} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                : null
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", margin: 0 }}>{campaign.headline}</h1>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 50, background: e.bg, color: e.color }}>
                  {e.icon} {e.label}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 50, background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                  <SilhouetteFormat format={campaign.format === "square" ? "square" : "swipe"} taille={11} />
                  {campaign.format === "square" ? t("pubs.carre") : t("pubs.pleinEcran")}
                </span>
                {(campaign.status === "active" || campaign.status === "pending") && (
                  <CancelCampaignButton campaignId={campaign.id} onCancel={pauseUserCampaign} redirectAfter="/profile/ads" />
                )}
              </div>
              {campaign.body_text && <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.5 }}>{campaign.body_text}</p>}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
                <span>{campaign.end_date ? t("pubs.periodeAu", { du: jour(campaign.start_date, langue), au: jour(campaign.end_date, langue) }) : jour(campaign.start_date, langue)}</span>
                <span>{listeCourte(campaign.target_cantons.map(k => nomCanton(k, langue, CANTON_NAMES[k] ?? k)), CANTONS_SUISSES, t("pubs.touteSuisse"), (n, total) => t("pubs.nCantons", { n, total }))}</span>
                <span>{listeCourte(campaign.target_sectors.map(s => nomSecteur(s, langue)), SECTORS.length, t("pubs.tousSecteurs"), (n, total) => t("pubs.nSecteurs", { n, total }))}</span>
              </div>
              <a href={campaign.cta_url} target="_blank" rel="noopener noreferrer" className="ads-lien"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10, fontSize: 13, color: "#8b5cf6", textDecoration: "none" }}>
                {campaign.cta_label} <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          </div>
          {campaign.admin_note && campaign.status === "rejected" && (
            <div style={{ margin: "0 24px 16px", padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, fontSize: 13, color: "#ef4444", display: "flex", alignItems: "center", gap: 7 }}>
              <AlertTriangle size={13} strokeWidth={2.2} aria-hidden="true" style={{ flexShrink: 0 }} /> {t("pubs.raisonRejet", { note: campaign.admin_note })}
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="ads-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>{t("pubs.perfTotale")}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: t("pubs.vuesMaj"), value: impCount.toLocaleString(LOC), icon: <Eye size={14} aria-hidden="true" />, color: "#8b5cf6" },
                  { label: t("pubs.clicsMaj"), value: clkCount.toLocaleString(LOC), icon: <MousePointer size={14} aria-hidden="true" />, color: "#f97316" },
                  { label: t("pubs.tauxClic"), value: ctr(impCount, clkCount), icon: <TrendingUp size={14} aria-hidden="true" />, color: "#10b981" },
                  { label: t("pubs.coutClic"), value: cpc(clkCount, spentBudget), icon: <TrendingUp size={14} aria-hidden="true" />, color: "#6b7280" },
                ].map(({ label, value, icon, color }) => (
                  <div key={label}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, color, marginBottom: 3 }}>{icon}<span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span></div>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>{t("pubs.recente")}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { label: t("pubs.aujourdhui"), imp: today?.impressions ?? 0, clk: today?.clicks ?? 0 },
                  { label: t("pubs.sept"), imp: last7Imp, clk: last7Clk },
                  { label: t("pubs.moyJour"), imp: avgDailyImp, clk: avgDailyClk },
                ].map(({ label, imp, clk }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>{label}</p>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>{imp.toLocaleString(LOC)}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("pubs.vues")}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#f97316", marginTop: 4 }}>{clk}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("pubs.clics")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{t("pubs.budget")}</p>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: "var(--text-muted)" }}>{t("pubs.depense")}</span>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>{chf(spentBudget)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 12 }}>
                <span style={{ color: "var(--text-muted)" }}>{t("pubs.totalAlloue")}</span>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>{chf(totalBudget)}</span>
              </div>
              <div style={{ height: 8, borderRadius: 50, background: "var(--surface2)", overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: "100%", width: `${budgetPct}%`, background: budgetPct >= 90 ? "#ef4444" : "var(--brand)", borderRadius: 50 }} />
              </div>
              <p style={{ fontSize: 12, color: budgetPct >= 90 ? "#ef4444" : "var(--text-muted)", textAlign: "right" }}>{t("pubs.utilise", { pct: budgetPct })}</p>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: t("pubs.budgetJour"), value: chf(Number(campaign.daily_budget_chf)) },
                { label: t("pubs.prix1000"), value: chf(Number(campaign.cpm_chf)) },
                { label: t("pubs.restant"), value: chf(Math.max(0, totalBudget - spentBudget)) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {stats.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 20px 4px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>{t("pubs.trente")}</p>
            <div style={{ paddingBottom: 16 }}>
              <GraphiqueJours jours={stats.map(d => ({ jour: d.day, vues: Number(d.impressions), clics: Number(d.clicks) }))} series={[
                { cle: "vues", libelle: t("pubs.vuesMaj"), couleur: "#8b5cf6" },
                { cle: "clics", libelle: t("pubs.clicsMaj"), couleur: "#f97316" },
              ]} />
            </div>
          </div>
        )}

        {cantonStats.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{t("pubs.repartition")}</p>
              <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--surface2)", padding: "3px 10px", borderRadius: 50, border: "1px solid var(--border)" }}>
                {t("pubs.vuesLocalisees", { n: cantonStats.reduce((s, c) => s + c.impressions, 0).toLocaleString(LOC) })}
              </span>
            </div>
            {(() => {
              const maxImp = cantonStats[0]?.impressions ?? 1;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {cantonStats.map(({ canton, impressions, clicks }) => {
                    const pct = Math.round((impressions / maxImp) * 100);
                    const isTargeted = campaign.target_cantons.length === 0 || campaign.target_cantons.includes(canton);
                    return (
                      <div key={canton} style={{ display: "grid", gridTemplateColumns: "minmax(80px, 130px) 1fr auto", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 650, color: isTargeted ? "var(--text)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nomCanton(canton, langue, CANTON_NAMES[canton] ?? canton)}</span>
                        <div style={{ height: 7, borderRadius: 50, background: "var(--surface2)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 50, background: isTargeted ? "var(--brand)" : "rgba(107,114,128,0.3)" }} />
                        </div>
                        <span style={{ fontSize: 12.5, color: "var(--text-muted)", textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                          {riche(t("pubs.ligneCanton", { vues: impressions.toLocaleString(LOC), clics: clicks.toLocaleString(LOC), ctr: ctr(impressions, clicks) }), { b: x => <strong style={{ color: "var(--text)" }}>{x}</strong> })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </Corps>
    </div>
  );
}
