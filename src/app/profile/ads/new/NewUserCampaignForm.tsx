"use client";

import { useState, useActionState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, ExternalLink, Info, Zap, Target, ImageIcon, DollarSign, Eye, MousePointer, Clock } from "lucide-react";
// ExternalLink used for CTA URL field only
import { createUserCampaign } from "@/lib/actions/ads";
import { audienceReach, calculateCPM, estimateDailyImpressions, estimateDailyReach, isBudgetCapped } from "@/lib/ads/pricing";

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
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, padding: "0 16px", height: 48, fontSize: 16,
  color: "var(--text)", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
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


export function NewUserCampaignForm({ prefillHeadline, prefillFormat, prefillCtaLabel, prefillCtaUrl, prefillDaily, prefillImage }: {
  prefillHeadline?: string;
  prefillFormat?: "square" | "swipe";
  prefillCtaLabel?: string;
  prefillCtaUrl?: string;
  prefillDaily?: number;
  prefillImage?: string;
}) {
  const [state, action, pending] = useActionState(createUserCampaign, undefined);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    if (!state?.campaignId) return;
    setCheckoutLoading(true);
    fetch("/api/user/ads/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: state.campaignId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.url) { window.location.href = data.url; }
        else { setCheckoutError(data.error ?? "Erreur Stripe"); setCheckoutLoading(false); }
      })
      .catch(() => { setCheckoutError("Erreur réseau"); setCheckoutLoading(false); });
  }, [state?.campaignId]);

  const [format, setFormat] = useState<"square" | "swipe">(prefillFormat ?? "square");
  const [selectedCantons, setSelectedCantons] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [dailyBudget, setDailyBudget] = useState(prefillDaily ?? 20);
  const [durationDays, setDurationDays] = useState(14);
  const totalBudget = dailyBudget * durationDays;

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  const handleDurationChange = (days: number) => {
    setDurationDays(days);
    const d = new Date(startDate); d.setDate(d.getDate() + days);
    setEndDate(d.toISOString().slice(0, 10));
  };
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    const d = new Date(val); d.setDate(d.getDate() + durationDays);
    setEndDate(d.toISOString().slice(0, 10));
  };
  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    const diff = Math.round((new Date(val).getTime() - new Date(startDate).getTime()) / 86400000);
    if (diff > 0 && diff <= 90) setDurationDays(diff);
  };

  const [imagePreview, setImagePreview] = useState<string>(prefillImage ?? "");
  const [imageUrl, setImageUrl] = useState(prefillImage ?? "");
  const blobRef = useRef<string | null>(null);
  useEffect(() => { return () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }; }, []);

  const [headline, setHeadline] = useState(prefillHeadline ?? "");
  const [bodyText, setBodyText] = useState("");
  const [ctaLabel, setCtaLabel] = useState(prefillCtaLabel ?? "En savoir plus");

  const reach = audienceReach(selectedCantons, selectedSectors);
  const cpm = calculateCPM(format, selectedCantons, selectedSectors);
  const dailyImpressions = estimateDailyImpressions(dailyBudget, cpm, reach);
  const dailyReach = estimateDailyReach(dailyBudget, cpm, reach);
  const totalImpressions = dailyImpressions * durationDays;
  const budgetCapped = isBudgetCapped(dailyBudget, cpm, reach);

  const toggleCanton = useCallback((code: string) =>
    setSelectedCantons(p => p.includes(code) ? p.filter(c => c !== code) : [...p, code]), []);
  const toggleSector = useCallback((s: string) =>
    setSelectedSectors(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]), []);

  const durationLabel = durationDays >= 30
    ? `${Math.floor(durationDays / 30)} mois ${durationDays % 30 > 0 ? `${durationDays % 30}j` : ""}`
    : `${durationDays} jours`;

  if (state?.campaignId) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: "80px 24px" }}>
        {checkoutError ? (
          <>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 24px" }}>⚠️</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 12 }}>Erreur de paiement</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>{checkoutError}</p>
            <Link href="/profile/ads" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
              Retour aux campagnes
            </Link>
          </>
        ) : (
          <>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(249,115,22,0.15))", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 28px" }}>💳</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 12 }}>Campagne créée !</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 8 }}>
              {checkoutLoading ? "Redirection vers le paiement sécurisé…" : "Traitement en cours…"}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Propulsé par Stripe · Aucune donnée bancaire stockée sur Workie</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <Link href="/profile/ads" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 24 }}>
        <ArrowLeft size={14} /> Mes publicités
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(22px, 6vw, 30px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>Nouvelle campagne</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Votre annonce sera visible par les utilisateurs de Workie selon votre ciblage.</p>
      </div>

      <form action={action}>
        <input type="hidden" name="target_cantons" value={JSON.stringify(selectedCantons)} />
        <input type="hidden" name="target_sectors" value={JSON.stringify(selectedSectors)} />
        <input type="hidden" name="daily_budget_chf" value={dailyBudget} />
        <input type="hidden" name="total_budget_chf" value={totalBudget} />
        <input type="hidden" name="format" value={format} />
        <input type="hidden" name="image_url" value={imageUrl} />

        {/* FORMAT */}
        <div className="biz-form-card">
          <SectionHeader icon={<Zap size={18} />} title="Format d'annonce" subtitle="Choisissez comment votre pub apparaîtra aux utilisateurs" />
          <div className="biz-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {(["square", "swipe"] as const).map(f => (
              <button key={f} type="button" onClick={() => setFormat(f)} style={{
                padding: "22px 20px", borderRadius: 16, cursor: "pointer", textAlign: "left",
                border: format === f ? "2px solid #8b5cf6" : "1.5px solid rgba(255,255,255,0.07)",
                background: format === f ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s",
                position: "relative",
              }}>
                {format === f && (
                  <div style={{ position: "absolute", top: 14, right: 14, width: 20, height: 20, borderRadius: "50%", background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f === "square" ? "⬛" : "📱"}</div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{f === "square" ? "Carré" : "Swipe"}</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {f === "square"
                    ? "S'intègre dans la grille d'exploration entre les fiches entreprise."
                    : "Carte plein écran qui s'affiche tous les 10 swipes. Impact maximal."}
                </p>
                {f === "swipe" && (
                  <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 50, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#f97316" }}>PREMIUM · ×1.5 CPM</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* CREATIVE — avec aperçu en temps réel */}
        <div className="biz-form-card">
          <SectionHeader icon={<ImageIcon size={18} />} title="Visuel & contenu" subtitle="Une image HD capte 3× plus l'attention. Minimum 1200×800px recommandé." />

          <div className="biz-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Gauche : upload + URL */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "28px 20px", borderRadius: 16, flex: 1,
                border: imagePreview ? "1.5px solid rgba(139,92,246,0.4)" : "2px dashed rgba(255,255,255,0.12)",
                cursor: "pointer", background: imagePreview ? "rgba(139,92,246,0.05)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s",
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Upload size={18} color={imagePreview ? "#8b5cf6" : "var(--text-muted)"} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: imagePreview ? "#8b5cf6" : "var(--text)", marginBottom: 3 }}>
                    {imagePreview ? "✓ Image chargée — changer" : "Uploader une image HD"}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>PNG, JPG, WebP · Max 10 MB</p>
                </div>
                <input type="file" name="image_file" accept="image/*" style={{ display: "none" }}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
                      const url = URL.createObjectURL(f);
                      blobRef.current = url;
                      setImageUrl("");
                      setImagePreview(url);
                    }
                  }} />
              </label>
            </div>

            {/* Droite : aperçu en temps réel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Aperçu · Format {format === "square" ? "carré" : "swipe"}
              </p>

              {format === "square" ? (
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                    {["LVMH", "Nestlé"].map(n => (
                      <div key={n} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 10px", height: 52, display: "flex", alignItems: "flex-end" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>{n}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid rgba(139,92,246,0.35)", background: "var(--surface)", marginBottom: 6 }}>
                    <div style={{ position: "relative", paddingTop: "52%", overflow: "hidden", background: "rgba(255,255,255,0.05)" }}>
                      {imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imagePreview} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImagePreview("")} />
                      ) : (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ImageIcon size={24} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                        </div>
                      )}
                      <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", borderRadius: 50, padding: "2px 7px", fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Sponsorisé</div>
                    </div>
                    <div style={{ padding: "8px 10px 10px" }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", marginBottom: 5, lineHeight: 1.2 }}>{headline || "Titre de votre annonce"}</p>
                      {bodyText && <p style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 6, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{bodyText}</p>}
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, background: "linear-gradient(135deg, #8b5cf6, #f97316)", fontSize: 9, fontWeight: 800, color: "#fff" }}>
                        {ctaLabel || "En savoir plus"} →
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {["UBS", "Rolex"].map(n => (
                      <div key={n} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 10px", height: 52, display: "flex", alignItems: "flex-end" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>{n}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 9, color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>Votre annonce dans la grille d&apos;exploration</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 180, background: "#0a0a0a", borderRadius: 28, padding: "8px 6px",
                    border: "2px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04)",
                    position: "relative",
                  }}>
                    <div style={{ width: 50, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.15)", margin: "0 auto 6px" }} />
                    <div style={{ borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.05)", position: "relative" }}>
                      <div style={{ height: 280, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "flex-end", padding: 10 }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)" }}>Entreprise suivante…</p>
                      </div>
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: 7, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Sponsorisé</span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1 }}>✕</span>
                        </div>
                        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                          {imagePreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImagePreview("")} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <ImageIcon size={24} color="rgba(255,255,255,0.15)" />
                            </div>
                          )}
                        </div>
                        <div style={{ padding: "10px 10px 12px" }}>
                          <p style={{ fontSize: 10, fontWeight: 900, color: "#fff", marginBottom: 4, lineHeight: 1.2 }}>{headline || "Titre de votre annonce"}</p>
                          {bodyText && <p style={{ fontSize: 8, color: "rgba(255,255,255,0.65)", marginBottom: 8, lineHeight: 1.4 }}>{bodyText.slice(0, 60)}{bodyText.length > 60 ? "…" : ""}</p>}
                          <div style={{ display: "flex", gap: 5 }}>
                            <div style={{ flex: 1, padding: "5px 8px", borderRadius: 7, background: "linear-gradient(135deg, #8b5cf6, #f97316)", fontSize: 8, fontWeight: 800, color: "#fff", textAlign: "center" }}>
                              {ctaLabel || "En savoir plus"}
                            </div>
                            <div style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.2)", fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Ignorer</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ width: 44, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "6px auto 0" }} />
                  </div>
                  <p style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 10, textAlign: "center" }}>S&apos;affiche tous les 10 swipes</p>
                </div>
              )}
            </div>
          </div>

          {/* Champs texte */}
          <div className="biz-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
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
            <textarea name="body_text" rows={2} style={{ ...inp, height: "auto", padding: "12px 16px", resize: "none", lineHeight: 1.5 }}
              placeholder="Une courte accroche pour votre annonce… (max 120 car.)" maxLength={120}
              value={bodyText} onChange={e => setBodyText(e.target.value)} />
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textAlign: "right" }}>{bodyText.length}/120</p>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>URL de destination *</label>
            <div style={{ position: "relative" }}>
              <ExternalLink size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input name="cta_url" required style={{ ...inp, paddingLeft: 42 }} placeholder="https://votre-site.ch" defaultValue={prefillCtaUrl ?? ""} />
            </div>
          </div>
        </div>

        {/* CIBLAGE */}
        <div className="biz-form-card">
          <SectionHeader icon={<Target size={18} />} title="Ciblage" subtitle="Choisissez votre audience — plus elle est ciblée, plus les profils qui voient votre annonce sont pertinents." />
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cantons</label>
              <button type="button" onClick={() => setSelectedCantons(c => c.length === CANTONS.length ? [] : CANTONS.map(x => x.code))} style={{
                fontSize: 11, padding: "2px 9px", borderRadius: 50, cursor: "pointer", fontWeight: 700,
                border: selectedCantons.length === 0 || selectedCantons.length === CANTONS.length ? "1px solid rgba(249,115,22,0.4)" : "1px solid rgba(255,255,255,0.1)",
                background: selectedCantons.length === 0 || selectedCantons.length === CANTONS.length ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.06)",
                color: selectedCantons.length === 0 || selectedCantons.length === CANTONS.length ? "#f97316" : "var(--text-muted)",
              }}>
                {selectedCantons.length === 0 || selectedCantons.length === CANTONS.length
                  ? "✓ Toute la Suisse"
                  : `${selectedCantons.length} sélectionné${selectedCantons.length > 1 ? "s" : ""}`}
              </button>
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
              <button type="button" onClick={() => setSelectedSectors(s => s.length === SECTORS.length ? [] : [...SECTORS])} style={{
                fontSize: 11, padding: "2px 9px", borderRadius: 50, cursor: "pointer", fontWeight: 700,
                border: selectedSectors.length === 0 || selectedSectors.length === SECTORS.length ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.1)",
                background: selectedSectors.length === 0 || selectedSectors.length === SECTORS.length ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.06)",
                color: selectedSectors.length === 0 || selectedSectors.length === SECTORS.length ? "#8b5cf6" : "var(--text-muted)",
              }}>
                {selectedSectors.length === 0 || selectedSectors.length === SECTORS.length
                  ? "✓ Tous les secteurs"
                  : `${selectedSectors.length} sélectionné${selectedSectors.length > 1 ? "s" : ""}`}
              </button>
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

        {/* BUDGET */}
        <div className="biz-form-card">
          <SectionHeader icon={<DollarSign size={18} />} title="Budget" subtitle="Ajustez le budget journalier et la durée — le total se calcule automatiquement." />

          <div className="biz-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Par jour</label>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#8b5cf6", letterSpacing: "-0.02em", marginBottom: 10 }}>CHF {dailyBudget}</div>
              <input type="range" min={5} max={500} step={5} value={dailyBudget}
                onChange={e => setDailyBudget(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#8b5cf6" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                <span>CHF 5</span><span>CHF 500</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Durée</label>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#f97316", letterSpacing: "-0.02em", marginBottom: 10 }}>{durationLabel}</div>
              <input type="range" min={1} max={90} step={1} value={durationDays}
                onChange={e => handleDurationChange(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#f97316" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                <span>1 jour</span><span>3 mois</span>
              </div>
            </div>
          </div>

          <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 24, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Budget total</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>CHF {totalBudget.toLocaleString("fr-CH")}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>CHF {dailyBudget} × {durationDays} jours</div>
          </div>

          {/* Dates — overflow:hidden évite le débordement iOS */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: "1 1 0px", minWidth: 0 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Début</label>
              <div style={{ overflow: "hidden", borderRadius: 12 }}>
                <input name="start_date" type="date" min={today} style={{ ...inp, width: "100%", height: 40, fontSize: 13, padding: "0 10px", borderRadius: 12 }} value={startDate}
                  onChange={e => handleStartDateChange(e.target.value)} />
              </div>
            </div>
            <div style={{ flex: "1 1 0px", minWidth: 0 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Fin <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 10 }}>· auto</span>
              </label>
              <div style={{ overflow: "hidden", borderRadius: 12 }}>
                <input name="end_date" type="date" style={{ ...inp, width: "100%", height: 40, fontSize: 13, padding: "0 10px", borderRadius: 12 }} value={endDate}
                  onChange={e => handleEndDateChange(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ESTIMATION */}
        <div className="biz-form-card" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(249,115,22,0.05) 100%)", border: "1px solid rgba(139,92,246,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Info size={16} color="#8b5cf6" />
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Estimation de performance</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 50, background: reach < 0.15 ? "rgba(249,115,22,0.12)" : "rgba(16,185,129,0.10)", border: `1px solid ${reach < 0.15 ? "rgba(249,115,22,0.3)" : "rgba(16,185,129,0.25)"}` }}>
              <Target size={11} color={reach < 0.15 ? "#f97316" : "#10b981"} />
              <span style={{ fontSize: 11, fontWeight: 800, color: reach < 0.15 ? "#f97316" : "#10b981" }}>
                {(reach * 100).toFixed(1)}% de l&apos;audience Workie ciblée
              </span>
            </div>
          </div>

          {budgetCapped && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 16 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>✅</span>
              <p style={{ fontSize: 12, color: "#10b981", lineHeight: 1.5 }}>
                <strong>Couverture maximale</strong> — votre budget atteint l&apos;intégralité de l&apos;audience ciblée chaque jour.
              </p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 1 }}>
            {[
              { label: "CPM", value: `CHF ${cpm.toFixed(2)}`, sub: "/ 1 000 vues", icon: <DollarSign size={14} />, color: "#8b5cf6" },
              { label: "Vues / jour", value: dailyImpressions.toLocaleString("fr-CH"), sub: "impressions", icon: <Eye size={14} />, color: "#6366f1" },
              { label: "Portée / jour", value: dailyReach.toLocaleString("fr-CH"), sub: "personnes", icon: <MousePointer size={14} />, color: "#f97316" },
              { label: "Total vues", value: totalImpressions.toLocaleString("fr-CH"), sub: `sur ${durationLabel}`, icon: <Clock size={14} />, color: "#10b981" },
            ].map(({ label, value, sub, icon, color }) => (
              <div key={label} style={{ textAlign: "center", padding: "14px 8px", borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, color }}>{icon}</div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 3 }}>{value}</p>
                <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{sub}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 14, lineHeight: 1.5, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
            Estimations indicatives. Les résultats réels peuvent varier selon l&apos;activité de la plateforme.
          </p>
        </div>

        {state?.error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "14px 18px", color: "#ef4444", fontSize: 14, marginBottom: 16 }}>
            ⚠ {state.error}
          </div>
        )}

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button type="submit" disabled={pending} style={{
            flex: 1, padding: "16px", borderRadius: 14,
            background: pending ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #8b5cf6, #f97316)",
            color: "#fff", fontWeight: 800, fontSize: "clamp(13px, 3.5vw, 16px)", border: "none",
            cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.7 : 1, transition: "opacity 0.2s",
          }}>
            {pending ? "Envoi en cours…" : `Soumettre · CHF ${totalBudget.toLocaleString("fr-CH")}`}
          </button>
          <Link href="/profile/ads" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
            Annuler
          </Link>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12, textAlign: "center", lineHeight: 1.6 }}>
          Paiement sécurisé par Stripe · Vous serez redirigé vers le paiement après soumission
        </p>
      </form>
    </div>
  );
}
