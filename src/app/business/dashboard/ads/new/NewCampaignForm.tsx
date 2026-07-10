"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, ExternalLink, Info } from "lucide-react";
import { createCampaign } from "@/lib/actions/ads";
import { calculateCPM, estimateDailyImpressions, estimateDailyReach } from "@/lib/ads/pricing";

const CANTONS = [
  { code: "GE", name: "Genève" }, { code: "VD", name: "Vaud" }, { code: "ZH", name: "Zürich" },
  { code: "BE", name: "Bern" }, { code: "BS", name: "Bâle" }, { code: "TI", name: "Tessin" },
  { code: "LU", name: "Lucerne" }, { code: "AG", name: "Argovie" }, { code: "SG", name: "St-Gallen" },
  { code: "VS", name: "Valais" }, { code: "NE", name: "Neuchâtel" }, { code: "FR", name: "Fribourg" },
  { code: "ZG", name: "Zug" }, { code: "GR", name: "Grisons" }, { code: "TG", name: "Thurgovie" },
  { code: "SO", name: "Soleure" }, { code: "BL", name: "Bâle-Camp." }, { code: "SH", name: "Schaffhouse" },
  { code: "AR", name: "Appenzell" }, { code: "SZ", name: "Schwyz" }, { code: "GL", name: "Glaris" },
  { code: "JU", name: "Jura" }, { code: "OW", name: "Obwald" }, { code: "NW", name: "Nidwald" },
  { code: "UR", name: "Uri" }, { code: "AI", name: "App. I.Rh." },
];

const SECTORS = [
  "Tech", "Finance", "Assurances", "Pharma", "Santé", "Conseil", "Industrie",
  "Automobile", "Horlogerie", "Commerce", "Alimentation", "Agriculture",
  "Éducation & Recherche", "Sports & Fashion", "Transport", "Énergie",
];

const inp: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "0 14px", height: 44, fontSize: 16,
  color: "var(--text)", outline: "none", boxSizing: "border-box",
};

const section = (title: string) => (
  <div className="form-section"><p className="form-section-title">{title}</p></div>
);

export function NewCampaignForm() {
  const [state, action, pending] = useActionState(createCampaign, undefined);

  const [format, setFormat] = useState<"square" | "swipe">("square");
  const [selectedCantons, setSelectedCantons] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [dailyBudget, setDailyBudget] = useState(20);
  const [totalBudget, setTotalBudget] = useState(200);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");

  const cpm = calculateCPM(format, selectedCantons, selectedSectors);
  const dailyImpressions = estimateDailyImpressions(dailyBudget, cpm);
  const dailyReach = estimateDailyReach(dailyBudget, cpm);
  const effectiveTotal = Math.max(totalBudget, dailyBudget);
  const durationDays = dailyBudget > 0 ? Math.floor(effectiveTotal / dailyBudget) : 0;
  const durationLabel = durationDays >= 30 ? `${Math.round(durationDays / 30)}mois` : `${durationDays}j`;

  const toggleCanton = (code: string) =>
    setSelectedCantons(p => p.includes(code) ? p.filter(c => c !== code) : [...p, code]);
  const toggleSector = (s: string) =>
    setSelectedSectors(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  if (state?.success) {
    return (
      <div className="biz-page" style={{ maxWidth: 600, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", marginBottom: 12 }}>Campagne soumise !</h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 420, margin: "0 auto 32px" }}>
          Notre équipe va examiner votre annonce sous <strong>24h ouvrées</strong>. Vous recevrez les coordonnées bancaires par email pour finaliser le paiement.
        </p>
        <Link href="/business/dashboard/ads" style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12,
          background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
        }}>
          Voir mes campagnes
        </Link>
      </div>
    );
  }

  return (
    <div className="biz-page" style={{ maxWidth: 780 }}>
      <Link href="/business/dashboard/ads" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={14} /> Mes publicités
      </Link>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>Nouvelle campagne</h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>Votre annonce sera visible par les utilisateurs de Workie selon votre ciblage.</p>

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <input type="hidden" name="target_cantons" value={JSON.stringify(selectedCantons)} />
        <input type="hidden" name="target_sectors" value={JSON.stringify(selectedSectors)} />
        <input type="hidden" name="daily_budget_chf" value={dailyBudget} />
        <input type="hidden" name="total_budget_chf" value={totalBudget} />
        <input type="hidden" name="format" value={format} />
        <input type="hidden" name="image_url" value={imageUrl} />

        {section("Format")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          {(["square", "swipe"] as const).map(f => (
            <button key={f} type="button" onClick={() => setFormat(f)} style={{
              padding: "18px 16px", borderRadius: 14, cursor: "pointer", textAlign: "left",
              border: format === f ? "2px solid #8b5cf6" : "1px solid var(--border2)",
              background: format === f ? "rgba(139,92,246,0.08)" : "var(--surface2)", transition: "all 0.15s",
            }}>
              <p style={{ fontSize: 20, marginBottom: 4 }}>{f === "square" ? "⬛" : "📱"}</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{f === "square" ? "Carré" : "Swipe"}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {f === "square" ? "Apparaît dans la grille d'exploration entre les entreprises." : "S'affiche comme une carte plein écran tous les 10 swipes. Format premium."}
              </p>
              {f === "swipe" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 50, background: "rgba(249,115,22,0.15)", color: "#f97316", marginTop: 6, display: "inline-block" }}>×1.5 CPM</span>}
            </button>
          ))}
        </div>

        {section("Visuel publicitaire")}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            Image {format === "square" ? "(ratio 3:2 recommandé)" : "(ratio 4:3 recommandé)"}
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, border: "1.5px dashed var(--border2)", cursor: "pointer", background: "var(--surface2)", marginBottom: 10 }}>
            <Upload size={16} color="var(--text-muted)" />
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{imagePreview ? "Changer d'image" : "Uploader une image"}</span>
            <input type="file" name="image_file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setImageUrl(""); setImagePreview(URL.createObjectURL(f)); } }} />
          </label>
          <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginBottom: 8 }}>ou</p>
          <input style={inp} placeholder="https://exemple.com/image.jpg" value={imageUrl}
            onChange={e => { setImageUrl(e.target.value); setImagePreview(e.target.value); }} />
          {imagePreview && (
            <div style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", maxHeight: 200, background: "var(--surface2)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="preview" style={{ width: "100%", objectFit: "cover", maxHeight: 200 }} />
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Titre *</label>
            <input name="headline" required style={inp} placeholder="Rejoignez notre équipe !" maxLength={60} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Label du bouton</label>
            <input name="cta_label" style={inp} placeholder="En savoir plus" defaultValue="En savoir plus" maxLength={30} />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Description <span className="badge-optional">OPTIONNEL</span></label>
          <input name="body_text" style={inp} placeholder="Une courte description de votre annonce…" maxLength={120} />
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>URL de destination *</label>
          <div className="inp-icon-wrap">
            <ExternalLink size={15} className="inp-icon" />
            <input name="cta_url" required style={{ ...inp, paddingLeft: 38 }} placeholder="https://votre-site.ch/offre" />
          </div>
        </div>

        {section("Ciblage")}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>Cantons <span className="badge-optional">Tous si vide</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CANTONS.map(c => (
              <button key={c.code} type="button" onClick={() => toggleCanton(c.code)} style={{
                padding: "5px 12px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: selectedCantons.includes(c.code) ? "1.5px solid #f97316" : "1px solid var(--border2)",
                background: selectedCantons.includes(c.code) ? "rgba(249,115,22,0.12)" : "transparent",
                color: selectedCantons.includes(c.code) ? "#f97316" : "var(--text-muted)", transition: "all 0.1s",
              }}>{c.code}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>Secteurs d&apos;audience <span className="badge-optional">Tous si vide</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SECTORS.map(s => (
              <button key={s} type="button" onClick={() => toggleSector(s)} style={{
                padding: "5px 12px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: selectedSectors.includes(s) ? "1.5px solid #8b5cf6" : "1px solid var(--border2)",
                background: selectedSectors.includes(s) ? "rgba(139,92,246,0.12)" : "transparent",
                color: selectedSectors.includes(s) ? "#8b5cf6" : "var(--text-muted)", transition: "all 0.1s",
              }}>{s}</button>
            ))}
          </div>
        </div>

        {section("Budget")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Budget journalier (CHF)</label>
            <input type="range" min={5} max={500} step={5} value={dailyBudget}
              onChange={e => setDailyBudget(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#8b5cf6" }} />
            <p style={{ fontSize: 18, fontWeight: 900, color: "#8b5cf6", marginTop: 4 }}>CHF {dailyBudget}/j</p>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Budget total (CHF) <span style={{ fontSize: 11, color: totalBudget < dailyBudget ? "#ef4444" : "var(--text-muted)" }}>
                {totalBudget < dailyBudget ? "⚠ doit être ≥ journalier" : ""}
              </span>
            </label>
            <input type="range" min={5} max={5000} step={10} value={totalBudget}
              onChange={e => setTotalBudget(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#f97316" }} />
            <p style={{ fontSize: 18, fontWeight: 900, color: "#f97316", marginTop: 4 }}>CHF {totalBudget}</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Date de début</label>
            <input name="start_date" type="date" style={inp} defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Date de fin <span className="badge-optional">OPTIONNEL</span></label>
            <input name="end_date" type="date" style={inp} />
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.07), rgba(249,115,22,0.05))", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Info size={14} color="#8b5cf6" /> Estimation de performance
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { label: "CPM", value: `CHF ${cpm.toFixed(2)}`, sub: "coût / 1 000 vues" },
              { label: "Vues/jour", value: dailyImpressions.toLocaleString("fr-CH"), sub: "impressions estimées" },
              { label: "Reach/jour", value: dailyReach.toLocaleString("fr-CH"), sub: "personnes uniques" },
              { label: "Durée", value: durationLabel, sub: `≈ ${durationDays} jours` },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 2 }}>{value}</p>
                <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {state?.error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 20 }}>
            ⚠ {state.error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button type="submit" disabled={pending} style={{
            flex: 1, padding: "14px", borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            color: "#fff", fontWeight: 800, fontSize: 15, border: "none",
            cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.7 : 1,
          }}>
            {pending ? "Envoi en cours…" : `Soumettre la campagne (CHF ${totalBudget})`}
          </button>
          <Link href="/business/dashboard/ads" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>Annuler</Link>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12, textAlign: "center" }}>
          Paiement par virement bancaire · Les coordonnées vous seront envoyées par email après validation
        </p>
      </form>
    </div>
  );
}
