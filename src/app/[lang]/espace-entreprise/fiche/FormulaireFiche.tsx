"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ImageIcon, Lock } from "lucide-react";
import { modifierFiche, type FicheGeree } from "@/lib/actions/espaceEntreprise";
import { EMPLOYEE_RANGES, LANGUES_SAISIE } from "@/lib/types";
import { abregeLangue } from "@/lib/langues";
import { lireCadrage, CADRAGE_NEUTRE, type Cadrage } from "@/lib/coverUrl";
import { RecadrageBanniere } from "@/app/[lang]/admin/company/RecadrageBanniere";
import { ChampLogo } from "@/app/[lang]/admin/company/ChampLogo";

const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 };
const inp: React.CSSProperties = { width: "100%", padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 15 };
const bloc: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 22px", display: "grid", gap: 18 };

export function FormulaireFiche({ c }: { c: FicheGeree }) {
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
    setInfoImage("Optimisation…");
    const { preparerImage, formaterPoids } = await import("@/lib/preparerImage");
    const r = await preparerImage(f);
    if (r.reduite && fileRef.current) {
      const dt = new DataTransfer(); dt.items.add(r.fichier); fileRef.current.files = dt.files;
    }
    setInfoImage(`${formaterPoids(r.apres)} · prête, enregistrée avec la fiche`);
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
      else setMessage({ ok: true, texte: r.avertissement ?? "Modifications enregistrées. Elles sont visibles sur la fiche." });
    });
  };

  const banniere = apercu ?? (coverUrl || null);

  return (
    <form action={enregistrer} style={{ display: "grid", gap: 16, maxWidth: 760 }}>
      <section style={bloc}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--text-muted)" }}>
          <Lock size={14} aria-hidden="true" />
          Nom : <strong style={{ color: "var(--text)" }}>{c.name}</strong> · {c.sector} · {c.city}
          <span style={{ marginLeft: "auto" }}>Pour les modifier : contact@workie.ch</span>
        </div>

        <div>
          <label style={lbl} htmlFor="description">Présentation de l&apos;entreprise</label>
          <textarea id="description" name="description" rows={6} maxLength={3000} defaultValue={c.description ?? ""}
            placeholder="Ce que fait l'entreprise, ses métiers, ce qui la distingue comme employeur."
            style={{ ...inp, resize: "vertical", lineHeight: 1.55 }} />
        </div>

        <div>
          <label style={lbl} htmlFor="website_url">Lien vers vos offres d&apos;emploi</label>
          <input id="website_url" name="website_url" type="url" defaultValue={c.website_url ?? ""} placeholder="https://www.entreprise.ch/carriere" style={inp} />
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>La page carrière de votre site officiel : c&apos;est là que mène le bouton « Offres d&apos;emploi ».</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <div>
            <span style={lbl}>Langues de travail</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LANGUES_SAISIE.map(({ code, nom }) => {
                const on = langues.includes(code);
                return (
                  <button key={code} type="button" aria-pressed={on} className={on ? "btn btn-encre btn-sm" : "btn btn-clair btn-sm"}
                    onClick={() => setLangues(l => (l.includes(code) ? l.filter(x => x !== code) : [...l, code]))}>
                    {abregeLangue(code)} <span style={{ fontWeight: 500, opacity: 0.75 }}>{nom}</span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="langues" value={langues.join(",")} />
          </div>
          <div>
            <label style={lbl} htmlFor="employee_range">Taille</label>
            <select id="employee_range" name="employee_range" defaultValue={c.employee_range ?? ""} style={{ ...inp, cursor: "pointer" }}>
              <option value="">Non précisée</option>
              {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r} employés</option>)}
            </select>
          </div>
        </div>
      </section>

      <section style={bloc}>
        <div>
          <span style={lbl}>Bannière</span>
          <input type="hidden" name="cover_url" value={coverUrl} />
          <input type="hidden" name="cover_cadrage" value={`${Math.round(cadrage.x)},${Math.round(cadrage.y)},${cadrage.zoom.toFixed(2)}`} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <label className="btn btn-clair btn-sm" style={{ cursor: "pointer" }}>
              <ImageIcon size={14} aria-hidden="true" /> Choisir une image
              <input ref={fileRef} name="cover_file" type="file" accept="image/jpeg,image/png,image/webp" onChange={choisirImage} style={{ display: "none" }} />
            </label>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{infoImage ?? "Format paysage, toute taille : l'image est optimisée automatiquement."}</span>
          </div>
          {banniere
            ? <RecadrageBanniere src={banniere} cadrage={cadrage} onChange={setCadrage} />
            : <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Aucune bannière pour l&apos;instant.</p>}
          {banniere && (
            <button type="button" onClick={() => { setApercu(null); setCoverUrl(""); setCadrage(CADRAGE_NEUTRE); if (fileRef.current) fileRef.current.value = ""; }}
              style={{ marginTop: 8, fontSize: 12.5, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Retirer la bannière
            </button>
          )}
        </div>
        <ChampLogo actuel={c.logo_url ?? ""} nom={c.name} />
      </section>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button type="submit" className="btn btn-encre" disabled={enCours}>{enCours ? "Enregistrement…" : "Enregistrer"}</button>
        {message && <p role="status" style={{ fontSize: 13.5, color: message.ok ? "#10b981" : "#ef4444" }}>{message.texte}</p>}
      </div>
    </form>
  );
}
