"use client";

import { useState, useActionState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, ExternalLink, Info, Zap, Target, ImageIcon, DollarSign, Eye, MousePointer, Clock } from "lucide-react";
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

// Steps for the stepper
const STEPS = [
  { id: "format",   label: "Format",   icon: <Zap size={14} /> },
  { id: "creative", label: "Visuel",   icon: <ImageIcon size={14} /> },
  { id: "target",   label: "Ciblage",  icon: <Target size={14} /> },
  { id: "budget",   label: "Budget",   icon: <DollarSign size={14} /> },
];

const inp: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, padding: "0 16px", height: 48, fontSize: 15,
  color: "var(--text)", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
};

const card: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 20, padding: "28px 28px", marginBottom: 20,
};

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b5cf6", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>{title}</p>
        {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export function NewCampaignForm() {
  const [state, action, pending] = useActionState(createCampaign, undefined);

  const [format, setFormat] = useState<"square" | "swipe">("square");
  const [selectedCantons, setSelectedCantons] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  // Smart budget: dailyBudget × durationDays = totalBudget
  const [dailyBudget, setDailyBudget] = useState(20);
  const [durationDays, setDurationDays] = useState(14);
  const totalBudget = dailyBudget * durationDays;

  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [ctaLabel, setCtaLabel] = useState("En savoir plus");

  const cpm = calculateCPM(format, selectedCantons, selectedSectors);
  const dailyImpressions = estimateDailyImpressions(dailyBudget, cpm);
  const dailyReach = estimateDailyReach(dailyBudget, cpm);
  const totalImpressions = dailyImpressions * durationDays;

  const toggleCanton = useCallback((code: string) =>
    setSelectedCantons(p => p.includes(code) ? p.filter(c => c !== code) : [...p, code]), []);
  const toggleSector = useCallback((s: string) =>
    setSelectedSectors(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]), []);

  if (state?.success) {
    return (
      <div className="biz-page" style={{ maxWidth: 560, textAlign: "center", padding: "80px 24px" }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg, #8b5cf6, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 28px" }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 14 }}>Campagne soumise !</h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.75, maxWidth: 400, margin: "0 auto 36px" }}>
          Notre équipe va examiner votre annonce sous <strong style={{ color: "var(--text)" }}>24h ouvrées</strong>. Vous recevrez les coordonnées bancaires par email pour finaliser le paiement.
        </p>
        <Link href="/business/dashboard/ads" style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 14,
          background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none",
        }}>
          Voir mes campagnes
        </Link>
      </div>
    );
  }

  const durationLabel = durationDays >= 30
    ? `${Math.floor(durationDays / 30)} mois ${durationDays % 30 > 0 ? `${durationDays % 30}j` : ""}`
    : `${durationDays} jours`;

  return (
    <div className="biz-page" style={{ maxWidth: 820 }}>
      {/* Back */}
      <Link href="/business/dashboard/ads" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 24 }}>
        <ArrowLeft size={14} /> Mes publicités
      </Link>

      {/* Page title */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>Nouvelle campagne</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Votre annonce sera visible par les utilisateurs de Workie selon votre ciblage.</p>
      </div>

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <input type="hidden" name="target_cantons" value={JSON.stringify(selectedCantons)} />
        <input type="hidden" name="target_sectors" value={JSON.stringify(selectedSectors)} />
        <input type="hidden" name="daily_budget_chf" value={dailyBudget} />
        <input type="hidden" name="total_budget_chf" value={totalBudget} />
        <input type="hidden" name="format" value={format} />
        <input type="hidden" name="image_url" value={imageUrl} />

        {/* ── FORMAT ─────────────────────────────────────────────────── */}
        <div style={card}>
          <SectionHeader icon={<Zap size={18} />} title="Format d'annonce" subtitle="Choisissez comment votre pub apparaîtra aux utilisateurs" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {(["square", "swipe"] as const).map(f => (
              <button key={f} type="button" onClick={() => setFormat(f)} style={{
                padding: "22px 20px", borderRadius: 16, cursor: "pointer", textAlign: "left",
                border: format === f ? "2px solid #8b5cf6" : "1.5px solid rgba(255,255,255,0.07)",
                background: format === f ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s", position: "relative",
              }}>
                {format === f && (
                  <div style={{ position: "absolute", top: 14, right: 14, width: 20, height: 20, borderRadius: 50, background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f === "square" ? "⬛" : "📱"}</div>
                <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{f === "square" ? "Carré" : "Swipe"}</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {f === "square"
                    ? "S'intègre dans la grille d'exploration entre les fiches entreprise. Format natif et discret."
                    : "Carte plein écran qui s'affiche tous les 10 swipes. Impact maximal, format premium."}
                </p>
                {f === "swipe" && (
                  <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 50, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#f97316", letterSpacing: "0.04em" }}>PREMIUM · ×1.5 CPM</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── CREATIVE ───────────────────────────────────────────────── */}
        <div style={card}>
          <SectionHeader icon={<ImageIcon size={18} />} title="Visuel & contenu" subtitle="Une image HD capte 3× plus l'attention. Minimum 1200×800px recommandé." />

          {/* Image upload zone */}
          <div style={{ display: "grid", gridTemplateColumns: imagePreview ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "32px 20px", borderRadius: 16,
                border: imagePreview ? "1.5px solid rgba(139,92,246,0.3)" : "2px dashed rgba(255,255,255,0.12)",
                cursor: "pointer", background: imagePreview ? "rgba(139,92,246,0.04)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s", minHeight: 160,
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Upload size={20} color="var(--text-muted)" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                    {imagePreview ? "Changer d'image" : "Uploader une image HD"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>PNG, JPG, WebP · Max 10 MB</p>
                </div>
                <input type="file" name="image_file" accept="image/*" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setImageUrl(""); setImagePreview(URL.createObjectURL(f)); } }} />
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>OU URL</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>

              <div style={{ position: "relative" }}>
                <ExternalLink size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input style={{ ...inp, paddingLeft: 40 }} placeholder="https://votre-cdn.com/image-hd.jpg" value={imageUrl}
                  onChange={e => { setImageUrl(e.target.value); if (e.target.value) setImagePreview(e.target.value); else setImagePreview(""); }} />
              </div>
            </div>

            {/* Preview panel */}
            {imagePreview && (
              <div style={{ borderRadius: 16, overflow: "hidden", position: "relative", background: "var(--surface2)", minHeight: 200 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={() => setImagePreview("")}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.75))" }} />
                {headline && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px" }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{headline}</p>
                    {bodyText && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>{bodyText}</p>}
                    <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 8, background: "linear-gradient(135deg, #8b5cf6, #f97316)", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                      {ctaLabel}
                    </div>
                  </div>
                )}
                <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", borderRadius: 50, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Sponsorisé
                </div>
                <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.4)", borderRadius: 50, padding: "2px 8px", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                  Aperçu
                </div>
              </div>
            )}
          </div>

          {/* Text fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Titre *</label>
              <input name="headline" required style={inp} placeholder="Rejoignez notre équipe !" maxLength={60}
                value={headline} onChange={e => setHeadline(e.target.value)} />
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textAlign: "right" }}>{headline.length}/60</p>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Texte du bouton</label>
              <input name="cta_label" style={inp} placeholder="En savoir plus" maxLength={30}
                value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Description <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· optionnel</span>
            </label>
            <input name="body_text" style={inp} placeholder="Une courte accroche pour votre annonce…" maxLength={120}
              value={bodyText} onChange={e => setBodyText(e.target.value)} />
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textAlign: "right" }}>{bodyText.length}/120</p>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>URL de destination *</label>
            <div style={{ position: "relative" }}>
              <ExternalLink size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input name="cta_url" required style={{ ...inp, paddingLeft: 42 }} placeholder="https://votre-site.ch" />
            </div>
          </div>
        </div>

        {/* ── TARGETING ──────────────────────────────────────────────── */}
        <div style={card}>
          <SectionHeader icon={<Target size={18} />} title="Ciblage" subtitle="Plus vous ciblez précisément, plus le CPM augmente — mais meilleure est la qualité de l'audience." />

          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cantons</label>
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", padding: "2px 9px", borderRadius: 50, color: "var(--text-muted)" }}>
                {selectedCantons.length === 0 ? "Toute la Suisse" : `${selectedCantons.length} sélectionné${selectedCantons.length > 1 ? "s" : ""}`}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {CANTONS.map(c => {
                const sel = selectedCantons.includes(c.code);
                return (
                  <button key={c.code} type="button" onClick={() => toggleCanton(c.code)} title={c.name} style={{
                    padding: "6px 13px", borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    border: sel ? "1.5px solid #f97316" : "1px solid rgba(255,255,255,0.1)",
                    background: sel ? "rgba(249,115,22,0.14)" : "transparent",
                    color: sel ? "#f97316" : "var(--text-muted)", transition: "all 0.12s",
                  }}>{c.code}</button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Secteurs</label>
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", padding: "2px 9px", borderRadius: 50, color: "var(--text-muted)" }}>
                {selectedSectors.length === 0 ? "Tous les secteurs" : `${selectedSectors.length} sélectionné${selectedSectors.length > 1 ? "s" : ""}`}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {SECTORS.map(s => {
                const sel = selectedSectors.includes(s);
                return (
                  <button key={s} type="button" onClick={() => toggleSector(s)} style={{
                    padding: "6px 14px", borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    border: sel ? "1.5px solid #8b5cf6" : "1px solid rgba(255,255,255,0.1)",
                    background: sel ? "rgba(139,92,246,0.14)" : "transparent",
                    color: sel ? "#8b5cf6" : "var(--text-muted)", transition: "all 0.12s",
                  }}>{s}</button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── BUDGET ─────────────────────────────────────────────────── */}
        <div style={card}>
          <SectionHeader icon={<DollarSign size={18} />} title="Budget" subtitle="Ajustez le budget journalier et la durée — le total se calcule automatiquement." />

          {/* Smart sliders */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 28 }}>
            {/* Daily */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Par jour</label>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#8b5cf6", letterSpacing: "-0.02em" }}>CHF {dailyBudget}</span>
              </div>
              <input type="range" min={5} max={500} step={5} value={dailyBudget}
                onChange={e => setDailyBudget(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#8b5cf6", height: 4 }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                <span>CHF 5</span><span>CHF 500</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Durée</label>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#f97316", letterSpacing: "-0.02em" }}>{durationLabel}</span>
              </div>
              <input type="range" min={1} max={90} step={1} value={durationDays}
                onChange={e => setDurationDays(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#f97316", height: 4 }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                <span>1 jour</span><span>3 mois</span>
              </div>
            </div>
          </div>

          {/* Total badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 24 }}>
            <span style={{ fontSize: 14, color: "var(--text-muted)" }}>Budget total</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>CHF {totalBudget.toLocaleString("fr-CH")}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>= CHF {dailyBudget} × {durationDays}j</span>
          </div>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date de début</label>
              <input name="start_date" type="date" style={inp} defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Date de fin <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-muted)", fontSize: 11 }}>· optionnel</span>
              </label>
              <input name="end_date" type="date" style={inp} />
            </div>
          </div>
        </div>

        {/* ── PERFORMANCE ESTIMATE ────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(249,115,22,0.05) 100%)",
          border: "1px solid rgba(139,92,246,0.25)", borderRadius: 20, padding: "24px 28px", marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Info size={16} color="#8b5cf6" />
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Estimation de performance</p>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>Basée sur les données de la plateforme</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            {[
              { label: "CPM", value: `CHF ${cpm.toFixed(2)}`, sub: "coût / 1 000 vues", icon: <DollarSign size={14} />, color: "#8b5cf6" },
              { label: "Vues / jour", value: dailyImpressions.toLocaleString("fr-CH"), sub: "impressions estimées", icon: <Eye size={14} />, color: "#6366f1" },
              { label: "Personnes / jour", value: dailyReach.toLocaleString("fr-CH"), sub: "portée unique estimée", icon: <MousePointer size={14} />, color: "#f97316" },
              { label: "Total vues", value: totalImpressions.toLocaleString("fr-CH"), sub: `sur ${durationLabel}`, icon: <Clock size={14} />, color: "#10b981" },
            ].map(({ label, value, sub, icon, color }, i) => (
              <div key={label} style={{
                textAlign: "center", padding: "16px 12px",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, color }}>{icon}</div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                <p style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>{value}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {state?.error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "14px 18px", color: "#ef4444", fontSize: 14, marginBottom: 20 }}>
            ⚠ {state.error}
          </div>
        )}

        {/* Submit */}
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button type="submit" disabled={pending} style={{
            flex: 1, padding: "16px", borderRadius: 14,
            background: pending ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #8b5cf6, #f97316)",
            color: "#fff", fontWeight: 800, fontSize: 16, border: "none",
            cursor: pending ? "not-allowed" : "pointer",
            transition: "opacity 0.2s",
            opacity: pending ? 0.7 : 1,
          }}>
            {pending ? "Envoi en cours…" : `Soumettre · CHF ${totalBudget.toLocaleString("fr-CH")}`}
          </button>
          <Link href="/business/dashboard/ads" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", whiteSpace: "nowrap" }}>
            Annuler
          </Link>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 14, textAlign: "center", lineHeight: 1.6 }}>
          Paiement par virement bancaire · Les coordonnées vous seront envoyées par email après validation admin
        </p>
      </form>
    </div>
  );
}
