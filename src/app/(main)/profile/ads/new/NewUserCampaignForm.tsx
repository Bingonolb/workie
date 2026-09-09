"use client";

import { useState, useActionState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, ExternalLink, Info, Zap, Target, ImageIcon, DollarSign, Eye, MousePointer, Clock, AlertTriangle, Check, CreditCard } from "lucide-react";
// ExternalLink used for CTA URL field only
import { createUserCampaign } from "@/lib/actions/ads";
import { tarifJournalier, prixForfait, DUREE_MIN, DUREE_MAX, dateDeFin } from "@/lib/ads/pricing";
import { SilhouetteFormat } from "@/components/ads/SilhouetteFormat";

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


/** Un bouton de région : allumé quand la sélection lui correspond exactement. */
function styleRegion(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 12, padding: "7px 14px", borderRadius: 50,
    cursor: "pointer", fontWeight: 700,
    border: active ? "1.5px solid #f97316" : "1px solid var(--border2)",
    background: active ? "rgba(249,115,22,0.12)" : "transparent",
    color: active ? "#f97316" : "var(--text-muted)",
    transition: "all 0.12s",
  };
}

export function NewUserCampaignForm({ prefillHeadline, prefillFormat, prefillCtaLabel, prefillCtaUrl, prefillImage, cantonProfil }: {
  prefillHeadline?: string;
  prefillFormat?: "square" | "swipe";
  prefillCtaLabel?: string;
  prefillCtaUrl?: string;
  prefillImage?: string;
  /** Le canton du profil, pour ouvrir le formulaire sur un ciblage lisible. */
  cantonProfil?: string | null;
}) {
  const [state, action, pending] = useActionState(createUserCampaign, undefined);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    if (!state?.campaignId) return;
    // Le paiement part dès que l'action a créé la campagne : l'indicateur de
    // chargement doit être posé avant l'appel réseau, pas après.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // Un formulaire qui s'ouvre sans aucun canton coché affiche « toute la
  // Suisse » : c'est exact et illisible, rien n'est sélectionné et pourtant
  // tout l'est. Il s'ouvre donc sur le canton du profil. Genève à défaut,
  // plutôt que rien : un ciblage visible se corrige, un ciblage implicite se
  // découvre à la facture.
  const [selectedCantons, setSelectedCantons] = useState<string[]>(
    () => (cantonProfil && CANTONS.some(c => c.code === cantonProfil) ? [cantonProfil] : ["GE"]),
  );
  const [durationDays, setDurationDays] = useState<number>(30);

  // Le curseur n'est pas contrôlé : quand la durée change par un autre chemin,
  // la date de fin, il faut lui reposer sa valeur à la main.
  const curseurRef = useRef<HTMLInputElement>(null);
  const poserDuree = (jours: number) => {
    const borne = Math.min(DUREE_MAX, Math.max(DUREE_MIN, jours));
    setDurationDays(borne);
    if (curseurRef.current) curseurRef.current.value = String(borne);
  };

  // Le prix est reconstruit ici pour être montré, et recalculé par l'action
  // avant l'encaissement : ce qui vient du navigateur ne décide pas d'un
  // montant.
  const tarifJour = tarifJournalier(selectedCantons, []);
  const prix = prixForfait(selectedCantons, [], durationDays);

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const endDate = dateDeFin(startDate, durationDays);

  // La fin se déduit du début et de la durée : elle n'est plus saisissable.
  // Deux champs de date qui se recalculaient l'un l'autre laissaient passer
  // des durées que le tarif ne connaît pas.

  const [imagePreview, setImagePreview] = useState<string>(prefillImage ?? "");
  const [imageUrl, setImageUrl] = useState(prefillImage ?? "");
  const blobRef = useRef<string | null>(null);
  const champImageRef = useRef<HTMLInputElement>(null);
  const [infoImage, setInfoImage] = useState<string | null>(null);
  useEffect(() => { return () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }; }, []);

  const [headline, setHeadline] = useState(prefillHeadline ?? "");
  const [bodyText, setBodyText] = useState("");
  const [ctaLabel, setCtaLabel] = useState(prefillCtaLabel ?? "En savoir plus");



  // Les régions linguistiques. Elles se chevauchent, et c'est voulu.
  //
  // Fribourg et le Valais sont officiellement bilingues : vingt et un pour cent
  // de germanophones dans le premier, vingt-huit dans le second. Les ranger
  // d'un seul côté reviendrait à dire qu'une campagne alémanique n'a rien à y
  // faire, ce qui est faux pour un habitant sur quatre. Ils figurent donc dans
  // les deux.
  //
  // Berne l'est aussi et reste pourtant du seul côté alémanique : ses
  // francophones sont onze pour cent, concentrés dans le Jura bernois.
  // L'ajouter à la romande facturerait un million de germanophones pour en
  // atteindre cent mille. Les Grisons rejoignent en revanche le Tessin, les
  // vallées de Poschiavo et de Bregaglia étant italophones.
  const REGIONS: { nom: string; cantons: string[] }[] = [
    { nom: "Suisse romande", cantons: ["GE", "VD", "VS", "FR", "NE", "JU"] },
    { nom: "Suisse alémanique", cantons: ["ZH", "BE", "LU", "UR", "SZ", "OW", "NW", "GL", "ZG", "SO", "BS", "BL", "SH", "AR", "AI", "SG", "GR", "AG", "TG", "FR", "VS"] },
    { nom: "Suisse italienne", cantons: ["TI", "GR"] },
  ];

  const memeEnsemble = (a: string[], b: string[]) =>
    a.length === b.length && a.every(x => b.includes(x));

  // Cocher les vingt-six revient au même que n'en cocher aucun : la portée est
  // entière dans les deux cas, donc le bouton doit s'allumer pour les deux.
  const couvreToutLePays = selectedCantons.length === 0 || selectedCantons.length === CANTONS.length;

  const toggleCanton = useCallback((code: string) =>
    setSelectedCantons(p => p.includes(code) ? p.filter(c => c !== code) : [...p, code]), []);

  const durationLabel = durationDays >= 30
    ? `${Math.floor(durationDays / 30)} mois ${durationDays % 30 > 0 ? `${durationDays % 30}j` : ""}`
    : `${durationDays} jours`;

  if (state?.campaignId) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: "80px 24px" }}>
        {checkoutError ? (
          <>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}><AlertTriangle size={30} strokeWidth={1.7} color="#ef4444" aria-hidden="true" /></div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 12 }}>Erreur de paiement</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>{checkoutError}</p>
            <Link href="/profile/ads" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
              Retour aux campagnes
            </Link>
          </>
        ) : (
          <>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}><CreditCard size={30} strokeWidth={1.7} color="var(--brand)" aria-hidden="true" /></div>
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
        <ArrowLeft size={14} aria-hidden="true" /> Mes publicités
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(22px, 6vw, 30px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>Nouvelle campagne</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Votre annonce sera visible par les utilisateurs de Workie selon votre ciblage.</p>
      </div>

      <form action={action}>
        {/* Vingt-six cantons cochés valent aucune restriction, et c'est ainsi
            qu'on l'enregistre. La liste complète exclurait un visiteur dont la
            géolocalisation ne rend pas un code cantonal suisse, par exemple
            depuis l'étranger ; une liste vide ne filtre personne. */}
        <input type="hidden" name="target_cantons" value={JSON.stringify(couvreToutLePays ? [] : selectedCantons)} />
        <input type="hidden" name="target_sectors" value="[]" />
        <input type="hidden" name="duree_jours" value={durationDays} />
        <input type="hidden" name="format" value={format} />
        <input type="hidden" name="image_url" value={imageUrl} />

        {/* FORMAT */}
        <div className="biz-form-card">
          <SectionHeader icon={<Zap size={18} aria-hidden="true" />} title="Format d'annonce" subtitle="Choisissez comment votre pub apparaîtra aux utilisateurs" />
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
                <div style={{ marginBottom: 12, color: "var(--text-muted)" }}>
                    <SilhouetteFormat format={f} taille={40} variante="illustration" />
                  </div>
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
          <SectionHeader icon={<ImageIcon size={18} aria-hidden="true" />} title="Visuel & contenu" subtitle="Une image HD capte 3× plus l'attention. Minimum 1200×800px recommandé." />

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
                  <Upload size={18} color={imagePreview ? "#8b5cf6" : "var(--text-muted)"} aria-hidden="true" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: imagePreview ? "#8b5cf6" : "var(--text)", marginBottom: 3 }}>
                    {imagePreview ? "✓ Image chargée, changer" : "Uploader une image HD"}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {infoImage ?? "PNG, JPG, WebP : n'importe quelle taille, l'image est optimisée automatiquement"}
                  </p>
                </div>
                <input ref={champImageRef} type="file" name="image_file" accept="image/*" style={{ display: "none" }}
                  onChange={async e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setInfoImage("Optimisation…");

                    // Réduction dans le navigateur : la requête ne peut pas
                    // dépasser 8 Mo, et une photo d'appareil les dépasse
                    // souvent. Sans cette étape l'envoi échouait sans message.
                    const { preparerImage, formaterPoids } = await import("@/lib/preparerImage");
                    const r = await preparerImage(f);

                    if (r.reduite && champImageRef.current) {
                      // On remplace le fichier choisi par sa version allégée,
                      // pour que le formulaire envoie bien celle-ci.
                      const dt = new DataTransfer();
                      dt.items.add(r.fichier);
                      champImageRef.current.files = dt.files;
                      setInfoImage(`Optimisée : ${formaterPoids(r.avant)} → ${formaterPoids(r.apres)}`);
                    } else {
                      setInfoImage(`${formaterPoids(r.apres)} · prête`);
                    }

                    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
                    const url = URL.createObjectURL(r.fichier);
                    blobRef.current = url;
                    setImageUrl("");
                    setImagePreview(url);
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
                          <ImageIcon size={24} color="var(--text-muted)" aria-hidden="true" style={{ opacity: 0.3 }} />
                        </div>
                      )}
                      <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", borderRadius: 50, padding: "2px 7px", fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Sponsorisé</div>
                    </div>
                    <div style={{ padding: "8px 10px 10px" }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", marginBottom: 5, lineHeight: 1.2 }}>{headline || "Titre de votre annonce"}</p>
                      {bodyText && <p style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 6, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{bodyText}</p>}
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, background: "var(--brand)", fontSize: 9, fontWeight: 800, color: "#fff" }}>
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
                              <ImageIcon size={24} color="rgba(255,255,255,0.15)" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div style={{ padding: "10px 10px 12px" }}>
                          <p style={{ fontSize: 10, fontWeight: 900, color: "#fff", marginBottom: 4, lineHeight: 1.2 }}>{headline || "Titre de votre annonce"}</p>
                          {bodyText && <p style={{ fontSize: 8, color: "rgba(255,255,255,0.65)", marginBottom: 8, lineHeight: 1.4 }}>{bodyText.slice(0, 60)}{bodyText.length > 60 ? "…" : ""}</p>}
                          <div style={{ display: "flex", gap: 5 }}>
                            <div style={{ flex: 1, padding: "5px 8px", borderRadius: 7, background: "var(--brand)", fontSize: 8, fontWeight: 800, color: "#fff", textAlign: "center" }}>
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
              <ExternalLink size={15} aria-hidden="true" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input name="cta_url" required style={{ ...inp, paddingLeft: 42 }} placeholder="https://votre-site.ch" defaultValue={prefillCtaUrl ?? ""} />
            </div>
          </div>
        </div>

        {/* CIBLAGE CANTON */}
        <div className="biz-form-card">
          <SectionHeader icon={<Target size={18} aria-hidden="true" />} title="Ciblage géographique" subtitle="Choisissez les cantons visés, ou tout le pays d'un bouton." />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cantons</span>
            <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              {couvreToutLePays
                ? `${CANTONS.length} cantons`
                : `${selectedCantons.length} sélectionné${selectedCantons.length > 1 ? "s" : ""}`}
            </span>
          </div>
          {/* Les raccourcis de région, au-dessus des cantons.
              Viser la Suisse romande demandait six clics, l'alémanique
              dix-neuf. C'est pourtant le découpage qu'un annonceur suisse a en
              tête avant de penser au canton. */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
            {/* Elle coche les vingt-six, elle ne vide pas.
                Vider revenait au même pour le prix et pour la diffusion, mais
                l'écran montrait alors zéro canton allumé sous un bouton qui
                annonce tout le pays. Ce que l'on voit doit dire ce que l'on a. */}
            <button
              type="button"
              onClick={() => setSelectedCantons(CANTONS.map(c => c.code))}
              aria-pressed={couvreToutLePays}
              style={styleRegion(couvreToutLePays)}
            >
              {couvreToutLePays && <Check size={11} strokeWidth={2.8} aria-hidden="true" />}
              Toute la Suisse
            </button>
            {REGIONS.map(({ nom, cantons }) => {
              const active = !couvreToutLePays && memeEnsemble(selectedCantons, cantons);
              return (
                <button
                  key={nom}
                  type="button"
                  onClick={() => setSelectedCantons(cantons)}
                  aria-pressed={active}
                  style={styleRegion(active)}
                >
                  {active && <Check size={11} strokeWidth={2.8} aria-hidden="true" />}
                  {nom}
                </button>
              );
            })}
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

        {/* DURÉE */}
        <div className="biz-form-card">
          <SectionHeader icon={<Clock size={18} aria-hidden="true" />} title="Durée" subtitle="Choisissez combien de temps votre annonce reste affichée" />

          {/* Un curseur, et non trois durées fermées.
              Le client qui voulait acheter plus n'avait aucun moyen de le
              faire : la borne du panier devenait celle de la commande. */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#8b5cf6", letterSpacing: "-0.02em" }}>
                {durationDays} jours
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                CHF {tarifJour} par jour
              </div>
            </div>
            {/* Curseur non contrôlé, volontairement.
                Contrôlé, sa position est réécrite par React à chaque rendu. Ce
                formulaire est lourd, vingt-six boutons de canton et un prix
                recalculé : si un rendu traîne, le pouce revient en arrière
                pendant qu'on tire, et le glissement paraît ne rien faire. En
                non contrôlé, le navigateur tient le pouce et React ne fait que
                suivre.
                  Deux gestionnaires plutôt qu'un : le premier se déclenche à
                  chaque pixel du glissement, le second seulement au
                  relâchement dans certains navigateurs. */}
            <input
              ref={curseurRef}
              type="range"
              min={DUREE_MIN}
              max={DUREE_MAX}
              step={1}
              defaultValue={durationDays}
              onInput={e => setDurationDays(Number((e.target as HTMLInputElement).value))}
              onChange={e => setDurationDays(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#8b5cf6", height: 28, cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              <span>{DUREE_MIN} jours</span><span>{DUREE_MAX} jours</span>
            </div>
          </div>


          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <div style={{ flex: "1 1 0px", minWidth: 0 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Début</label>
              <div style={{ overflow: "hidden", borderRadius: 12 }}>
                <input name="start_date" type="date" min={today} value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ ...inp, width: "100%", height: 40, fontSize: 13, padding: "0 10px", borderRadius: 12 }} />
              </div>
            </div>
            <div style={{ flex: "1 1 0px", minWidth: 0 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fin</label>
              {/* La fin se choisit aussi. Elle ne pilote pas une grandeur à
                  elle : elle fixe la même durée que le curseur, par l'autre
                  bout. Une date hors des bornes est ramenée dedans plutôt que
                  refusée, sans quoi le champ se bloquerait en cours de saisie. */}
              <div style={{ overflow: "hidden", borderRadius: 12 }}>
                <input
                  type="date"
                  value={endDate}
                  min={dateDeFin(startDate, DUREE_MIN)}
                  max={dateDeFin(startDate, DUREE_MAX)}
                  onChange={e => {
                    const choisie = e.target.value;
                    if (!choisie) return;
                    const jours = Math.round(
                      (new Date(`${choisie}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) / 86400000,
                    );
                    if (Number.isFinite(jours)) poserDuree(jours);
                  }}
                  style={{ ...inp, width: "100%", height: 40, fontSize: 13, padding: "0 10px", borderRadius: 12 }}
                />
              </div>
            </div>
          </div>

          <div style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Prix, payé une fois</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em" }}>CHF {prix}</div>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.55 }}>
              CHF {tarifJour} par jour pendant {durationDays} jours.
              {selectedCantons.length === 0
                ? " Le tarif couvre toute la Suisse ; viser quelques cantons le réduit."
                : ` Le tarif suit le territoire visé : ${selectedCantons.length} canton${selectedCantons.length > 1 ? "s" : ""} sur 26.`}
            </p>
            {/* Aucune estimation de vues. Elle venait d'un réservoir quotidien
                écrit en dur et jamais mesuré, sur un site qui n'a jamais servi
                une impression publicitaire : le premier tableau de bord
                l'aurait démentie. Ce qui est vendu est une durée d'affichage,
                et c'est ce qui est annoncé. */}
          </div>
        </div>


        {state?.error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "14px 18px", color: "#ef4444", fontSize: 14, marginBottom: 16 }}>
            <AlertTriangle size={14} strokeWidth={2.2} aria-hidden="true" style={{ flexShrink: 0 }} /> {state.error}
          </div>
        )}

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button type="submit" disabled={pending} style={{
            flex: 1, padding: "16px", borderRadius: 14,
            background: pending ? "rgba(255,255,255,0.08)" : "var(--brand)",
            color: "#fff", fontWeight: 800, fontSize: "clamp(13px, 3.5vw, 16px)", border: "none",
            cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.7 : 1, transition: "opacity 0.2s",
          }}>
            {pending ? "Envoi en cours…" : `Payer CHF ${prix}`}
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
