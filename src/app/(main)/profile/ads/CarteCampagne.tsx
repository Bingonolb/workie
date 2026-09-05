import Link from "next/link";
import Image from "next/image";
import { Copy, RotateCcw, AlertTriangle } from "lucide-react";
import type { AdCampaign } from "@/lib/actions/ads";
import { PayUserCampaignButton } from "./PayUserCampaignButton";
import { DeleteCampaignButton } from "./DeleteCampaignButton";
import { SilhouetteFormat } from "@/components/ads/SilhouetteFormat";
import { budgetPct, estExpiree, joursRestants, jour, etat } from "./etat";

/**
 * Une campagne dans la liste.
 *
 * La suppression arrive en propriete plutot que d'etre importee ici : le
 * composant se rend alors sans session ni base, ce qui permet de regarder
 * chaque etat, expiree impayee, payable, diffusee, sans se connecter.
 */
export function CarteCampagne({
  c,
  onDelete,
}: {
  c: AdCampaign;
  onDelete: (id: string) => Promise<{ error?: string }>;
}) {
    const e = etat(c);
    const depense = Number(c.spent_chf);
    const pct = budgetPct(depense, Number(c.total_budget_chf));
    const expiree = estExpiree(c.end_date);
    const restants = joursRestants(c.end_date);
    const morte = expiree && c.status === "payment_pending";
    const vues = Number(c.impression_count);
    const clics = Number(c.click_count);

    return (
      <div key={c.id} style={{ position: "relative", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {/* La carte entière mène à la campagne.
            Le lien était déjà là, mais posé sous le contenu : tous
            les clics atterrissaient sur le texte, et la carte
            paraissait inerte. Il passe au-dessus, la barre
            d'actions passe au-dessus de lui. */}
        <Link href={`/profile/ads/${c.id}`} style={{ position: "absolute", inset: 0, zIndex: 1 }} aria-label={`Voir la campagne ${c.headline}`} />

        <div style={{ display: "flex" }}>
          <div style={{ width: 96, flexShrink: 0, background: "var(--surface2)", position: "relative", overflow: "hidden" }}>
            <Image src={c.image_url} alt="" fill sizes="96px" style={{ objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: 6, left: 6, display: "flex", background: "rgba(0,0,0,0.7)", color: "#fff", padding: "3px 6px", borderRadius: 5 }}>
              <SilhouetteFormat format={c.format === "square" ? "square" : "swipe"} taille={11} />
            </div>
          </div>

          <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>{c.headline}</h2>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 50, background: e.bg, color: e.color, flexShrink: 0 }}>
                    {e.icon} {e.label}
                  </span>
                </div>
                {/* Une seule ligne de faits, séparés par des points
                    médians, comme les cartes d'entreprise. Le CPM
                    n'y figure plus : c'est un prix unitaire qu'on
                    ne décide pas, il a sa place dans le détail. */}
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  CHF {Number(c.total_budget_chf).toFixed(0)} de budget
                  {" · "}CHF {Number(c.daily_budget_chf).toFixed(0)}/jour
                  {c.start_date && <>{" · "}{jour(c.start_date)}{c.end_date ? ` au ${jour(c.end_date)}` : ""}</>}
                  {restants && <>{" · "}<span style={{ color: restants.urgent ? "#ef4444" : "var(--text-muted)", fontWeight: restants.urgent ? 700 : 400 }}>{restants.label}</span></>}
                </p>
              </div>

              {/* Les compteurs n'apparaissent qu'une fois la
                  campagne diffusée. « 0 vues, 0 clics » sur une
                  campagne jamais payée n'est pas un résultat,
                  c'est une conséquence mécanique. */}
              {vues > 0 && (
                <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{vues.toLocaleString("fr-CH")}</p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>vues</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{clics.toLocaleString("fr-CH")}</p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>clics</p>
                  </div>
                </div>
              )}
            </div>

            {/* La barre de budget racontait trois fois la même
                chose, et un budget intact n'a rien à raconter. */}
            {depense > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 4, borderRadius: 50, background: "var(--surface2)", overflow: "hidden", marginBottom: 5 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? "#ef4444" : "var(--brand)", borderRadius: 50 }} />
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  CHF {depense.toFixed(2)} dépensés sur {Number(c.total_budget_chf).toFixed(0)} ({pct} %)
                </p>
              </div>
            )}

            {c.admin_note && c.status === "rejected" && (
              <p style={{ fontSize: 11, color: "#ef4444", marginTop: 8, background: "rgba(239,68,68,0.06)", padding: "5px 10px", borderRadius: 7, display: "flex", alignItems: "flex-start", gap: 6 }}><AlertTriangle size={12} strokeWidth={2.2} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} /> {c.admin_note}</p>
            )}
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", position: "relative", zIndex: 2 }}>
          {/* Payer une campagne dont les dates sont passées
              n'achèterait rien : le bouton cède la place à ce qui
              reste possible, relancer ou supprimer. */}
          {c.status === "payment_pending" && !expiree && (
            <PayUserCampaignButton campaignId={c.id} total={Number(c.total_budget_chf)} />
          )}
          {c.status !== "payment_pending" && (
            <Link href={`/profile/ads/${c.id}`} style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6", textDecoration: "none", padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(139,92,246,0.25)", background: "rgba(139,92,246,0.06)" }}>
              Voir les stats
            </Link>
          )}
          <Link
            href={`/profile/ads/new?headline=${encodeURIComponent(c.headline)}&format=${c.format}&cta_label=${encodeURIComponent(c.cta_label)}&cta_url=${encodeURIComponent(c.cta_url)}&daily=${c.daily_budget_chf}&image=${encodeURIComponent(c.image_url)}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
              textDecoration: "none", padding: "5px 12px", borderRadius: 8,
              color: morte ? "#8b5cf6" : "var(--text-muted)",
              border: morte ? "1px solid rgba(139,92,246,0.25)" : "1px solid var(--border2)",
              background: morte ? "rgba(139,92,246,0.06)" : "transparent",
            }}
          >
            {morte
              ? <><RotateCcw size={11} aria-hidden="true" /> Relancer</>
              : <><Copy size={11} aria-hidden="true" /> Dupliquer</>}
          </Link>
          {c.status === "payment_pending" && (
            <DeleteCampaignButton campaignId={c.id} onDelete={onDelete} />
          )}
        </div>
      </div>
    );
}
