"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ImageIcon, Lock } from "lucide-react";
import { modifierFiche, type FicheGeree } from "@/lib/actions/espaceEntreprise";
import { EMPLOYEE_RANGES, LANGUES_SAISIE } from "@/lib/types";
import { abregeLangue, nomLangue } from "@/lib/langues";
import { lireCadrage, CADRAGE_NEUTRE, type Cadrage } from "@/lib/coverUrl";
import { RecadrageBanniere } from "@/app/[lang]/admin/company/RecadrageBanniere";
import { ChampLogo } from "@/app/[lang]/admin/company/ChampLogo";
import { useT, useLangue } from "@/i18n/FournisseurLangue";
import { nomSecteur } from "@/i18n/secteurs";
import { nomVille } from "@/i18n/lieux";

const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 };
const inp: React.CSSProperties = { width: "100%", padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 15 };
const bloc: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 22px", display: "grid", gap: 18 };

export function FormulaireFiche({ c }: { c: FicheGeree }) {
  const t = useT();
  const langue = useLangue();
  const [langues, setLangues] = useState<string[]>(c.langues ?? []);
  const [coverUrl, setCoverUrl] = useState(() => lireCadrage(c.cover_url ?? "").src);
  const [cadrage, setCadrage] = useState<Cadrage>(() => lireCadrage(c.cover_url ?? "").cadrage);
  const [apercu, setApercu] = useState<string | null>(null);
  const [infoImage, setInfoImage] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, demarrer] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef<string | null>(null);

  useEffect(() => () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }, []);

  const choisirImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setInfoImage(t("ficheForm.optimisation"));
    const { preparerImage, formaterPoids } = await import("@/lib/preparerImage");
    const r = await preparerImage(f);
    if (r.reduite && fileRef.current) {
      const dt = new DataTransfer(); dt.items.add(r.fichier); fileRef.current.files = dt.files;
    }
    setInfoImage(t("ficheForm.imagePrete", { poids: formaterPoids(r.apres) }));
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    blobRef.current = URL.createObjectURL(r.fichier);
    setApercu(blobRef.current);
    setCadrage(CADRAGE_NEUTRE);
  };

  const enregistrer = (formData: FormData) => {
    setMessage(null);
    demarrer(async () => {
      const r = await modifierFiche(formData);
      if (r.error) setMessage({ ok: false, texte: r.error });
      else setMessage({ ok: true, texte: r.avertissement ?? t("ficheForm.enregistre") });
    });
  };

  const banniere = apercu ?? (coverUrl || null);

  return (
    <form action={enregistrer} style={{ display: "grid", gap: 16, maxWidth: 760 }}>
      <section style={bloc}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--text-muted)" }}>
          <Lock size={14} aria-hidden="true" />
          {t("ficheForm.nom")} <strong style={{ color: "var(--text)" }}>{c.name}</strong> · {nomSecteur(c.sector, langue)} · {nomVille(c.city, langue)}
          <span style={{ marginLeft: "auto" }}>{t("ficheForm.pourModifier")}</span>
        </div>

        <div>
          <label style={lbl} htmlFor="description">{t("ficheForm.presentation")}</label>
          <textarea id="description" name="description" rows={6} maxLength={3000} defaultValue={c.description ?? ""}
            placeholder={t("ficheForm.presentationEx")}
            style={{ ...inp, resize: "vertical", lineHeight: 1.55 }} />
        </div>

        <div>
          <label style={lbl} htmlFor="website_url">{t("ficheForm.lienOffres")}</label>
          <input id="website_url" name="website_url" type="url" defaultValue={c.website_url ?? ""} placeholder="https://www.entreprise.ch/carriere" style={inp} />
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{t("ficheForm.lienOffresAide")}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <div>
            <span style={lbl}>{t("ficheForm.langues")}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LANGUES_SAISIE.map(({ code, nom }) => {
                const on = langues.includes(code);
                return (
                  <button key={code} type="button" aria-pressed={on} className={on ? "btn btn-encre btn-sm" : "btn btn-clair btn-sm"}
                    onClick={() => setLangues(l => (l.includes(code) ? l.filter(x => x !== code) : [...l, code]))}>
                    {abregeLangue(code, langue)} <span style={{ fontWeight: 500, opacity: 0.75 }}>{langue === "fr" ? nom : nomLangue(code, langue)}</span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="langues" value={langues.join(",")} />
          </div>
          <div>
            <label style={lbl} htmlFor="employee_range">{t("ficheForm.taille")}</label>
            <select id="employee_range" name="employee_range" defaultValue={c.employee_range ?? ""} style={{ ...inp, cursor: "pointer" }}>
              <option value="">{t("ficheForm.nonPrecisee")}</option>
              {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{t("ficheForm.employes", { n: r })}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section style={bloc}>
        <div>
          <span style={lbl}>{t("ficheForm.banniere")}</span>
          <input type="hidden" name="cover_url" value={coverUrl} />
          <input type="hidden" name="cover_cadrage" value={`${Math.round(cadrage.x)},${Math.round(cadrage.y)},${cadrage.zoom.toFixed(2)}`} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <label className="btn btn-clair btn-sm" style={{ cursor: "pointer" }}>
              <ImageIcon size={14} aria-hidden="true" /> {t("ficheForm.choisirImage")}
              <input ref={fileRef} name="cover_file" type="file" accept="image/jpeg,image/png,image/webp" onChange={choisirImage} style={{ display: "none" }} />
            </label>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{infoImage ?? t("ficheForm.formatPaysage")}</span>
          </div>
          {banniere
            ? <RecadrageBanniere src={banniere} cadrage={cadrage} onChange={setCadrage} />
            : <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("ficheForm.aucuneBanniere")}</p>}
          {banniere && (
            <button type="button" onClick={() => { setApercu(null); setCoverUrl(""); setCadrage(CADRAGE_NEUTRE); if (fileRef.current) fileRef.current.value = ""; }}
              style={{ marginTop: 8, fontSize: 12.5, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              {t("ficheForm.retirerBanniere")}
            </button>
          )}
        </div>
        <ChampLogo actuel={c.logo_url ?? ""} nom={c.name} />
      </section>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button type="submit" className="btn btn-encre" disabled={enCours}>{enCours ? t("ficheForm.enregistrement") : t("ficheForm.enregistrer")}</button>
        {message && <p role="status" style={{ fontSize: 13.5, color: message.ok ? "#10b981" : "#ef4444" }}>{message.texte}</p>}
      </div>
    </form>
  );
}
