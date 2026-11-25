"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { enregistrerOffre, retirerOffre, type Offre } from "@/lib/actions/espaceEntreprise";
import { CONTRATS, MODES, NIVEAUX, TAUX, libelleTaux } from "@/lib/offres";
import { LANGUES_SAISIE } from "@/lib/types";
import { useT, useLangue } from "@/i18n/FournisseurLangue";
import { libelleValeurOffre } from "@/i18n/contrat";
import { nomLangue } from "@/lib/langues";

const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 };
const inp: React.CSSProperties = { width: "100%", padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 15 };
const carte: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" };


function Choix({ nom, liste, valeur, libelle }: { nom: string; liste: readonly string[]; valeur: string | null; libelle: string }) {
  const t = useT();
  return (
    <label><span style={lbl}>{libelle}</span>
      <select name={nom} defaultValue={valeur ?? ""} style={{ ...inp, cursor: "pointer" }}>
        <option value="">{t("offresForm.nonPrecise")}</option>
        {liste.map(v => <option key={v} value={v}>{libelleValeurOffre(t, v)}</option>)}
      </select>
    </label>
    );
}

/**
 * Une rubrique de l'offre. Les mêmes rubriques, dans le même ordre, se
 * retrouvent sur la fiche : le candidat lit toutes les offres de la même façon.
 */
function Rubrique({ nom, titre, aide, exemple, valeur, requis, lignes = 5, max = 4000 }: {
  nom: string; titre: string; aide: string; exemple: string; valeur: string | null | undefined; requis?: boolean; lignes?: number; max?: number;
}) {
  const zone = useRef<HTMLTextAreaElement>(null);
  const tr = useT();
  // Entoure la sélection de la marque (** pour le gras, * pour l'italique),
  // ou la retire si elle y est déjà. Sans sélection, place la marque et le curseur au milieu.
  const marquer = (marque: string) => {
    const t = zone.current;
    if (!t) return;
    const { selectionStart: d, selectionEnd: f, value } = t;
    const choisi = value.slice(d, f);
    const dejaLa = value.slice(d - marque.length, d) === marque && value.slice(f, f + marque.length) === marque;
    const avant = dejaLa ? value.slice(0, d - marque.length) : value.slice(0, d);
    const apres = dejaLa ? value.slice(f + marque.length) : value.slice(f);
    const milieu = dejaLa ? choisi : `${marque}${choisi}${marque}`;
    t.value = avant + milieu + apres;
    const debut = avant.length + (dejaLa ? 0 : marque.length);
    t.focus();
    t.setSelectionRange(debut, debut + choisi.length);
  };
  const bouton: React.CSSProperties = { width: 36, height: 32, borderRadius: 8, border: "1px solid var(--border2)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", fontSize: 14 };
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <label htmlFor={`rub-${nom}`} style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text)" }}>{titre}{!requis && <span style={{ fontWeight: 500, color: "var(--text-muted)", fontSize: 12.5 }}>{tr("offresForm.facultatif")}</span>}</label>
      <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 4 }}>{aide}</span>
      <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
        {/* onMouseDown + preventDefault : la sélection du texte n'est pas perdue au clic. */}
        <button type="button" style={{ ...bouton, fontWeight: 800 }} aria-label={tr("offresForm.gras")} title={tr("offresForm.gras")} onMouseDown={e => e.preventDefault()} onClick={() => marquer("**")}>{tr("offresForm.grasLettre")}</button>
        <button type="button" style={{ ...bouton, fontStyle: "italic", fontFamily: "Georgia, serif" }} aria-label={tr("offresForm.italique")} title={tr("offresForm.italique")} onMouseDown={e => e.preventDefault()} onClick={() => marquer("*")}>I</button>
      </div>
      <textarea id={`rub-${nom}`} ref={zone} name={nom} rows={lignes} maxLength={max} required={requis} defaultValue={valeur ?? ""} placeholder={exemple} style={{ ...inp, resize: "vertical", lineHeight: 1.55 }} />
    </div>
  );
}

function Formulaire({ offre, onFini }: { offre: Offre | null; onFini: () => void }) {
  const router = useRouter();
  const t = useT();
  const langue = useLangue();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const v: Partial<Offre> = offre ?? {};
  const [langues, setLangues] = useState<string[]>(offre?.langues ?? []);
  const envoyer = (fd: FormData) => {
    setErreur(null);
    demarrer(async () => {
      const r = await enregistrerOffre(fd);
      if (r.error) { setErreur(r.error); return; }
      onFini(); router.refresh();
    });
  };
  return (
    <form action={envoyer} style={{ ...carte, display: "grid", gap: 14 }}>
      <p style={{ fontWeight: 800, fontSize: 16 }}>{offre ? t("offresForm.modifier") : t("offresForm.nouvelle")}</p>
      {offre && <input type="hidden" name="id" value={offre.id} />}
      <div style={{ display: "grid", gap: 14 }}>
        <label><span style={lbl}>{t("offresForm.intitule")}</span><input name="title" required maxLength={120} defaultValue={v.title ?? ""} placeholder={t("offresForm.intituleEx")} style={inp} /></label>
        <label>
          <span style={lbl}>{t("offresForm.lien")}</span>
          <input name="apply_url" type="url" required defaultValue={v.apply_url ?? ""} placeholder="https://www.entreprise.ch/carriere/poste-123" style={inp} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, display: "block" }}>{t("offresForm.lienAide")}</span>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          <label><span style={lbl}>{t("offresForm.tauxDe")}</span>
            <select name="taux_min" defaultValue={String(v.taux_min ?? 100)} style={{ ...inp, cursor: "pointer" }}>
              {TAUX.map(x => <option key={x} value={x}>{x} %</option>)}
            </select>
          </label>
          <label><span style={lbl}>{t("offresForm.tauxA")}</span>
            <select name="taux_max" defaultValue={String(v.taux_max ?? 100)} style={{ ...inp, cursor: "pointer" }}>
              {TAUX.map(x => <option key={x} value={x}>{x} %</option>)}
            </select>
          </label>
          <label><span style={lbl}>{t("offresForm.entree")}</span>
            <input name="entree" list="entrees" maxLength={40} defaultValue={v.entree ?? ""} placeholder={t("offresForm.desQuePossible")} style={inp} />
            <datalist id="entrees"><option value={t("offresForm.desQuePossible")} /><option value={t("offresForm.aConvenir")} /></datalist>
          </label>
        </div>
        <div>
          <span style={lbl}>{t("offresForm.langues")}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {LANGUES_SAISIE.map(({ code, nom }) => {
              const on = langues.includes(code);
              return (
                <button key={code} type="button" aria-pressed={on} className={on ? "btn btn-encre btn-sm" : "btn btn-clair btn-sm"}
                  onClick={() => setLangues(l => (l.includes(code) ? l.filter(x => x !== code) : [...l, code]))}>
                  {langue === "fr" ? nom : nomLangue(code, langue)}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="langues" value={langues.join(",")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          <label><span style={lbl}>{t("offresForm.lieu")}</span><input name="location" maxLength={80} defaultValue={v.location ?? ""} placeholder={t("offresForm.lieuEx")} style={inp} /></label>
          <Choix nom="contract_type" liste={CONTRATS} valeur={v.contract_type ?? null} libelle={t("offresForm.contrat")} />
          <Choix nom="work_mode" liste={MODES} valeur={v.work_mode ?? null} libelle={t("offresForm.organisation")} />
          <Choix nom="experience_level" liste={NIVEAUX} valeur={v.experience_level ?? null} libelle={t("offresForm.experience")} />
        </div>
      </div>
      <div style={{ display: "grid", gap: 18, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <Rubrique nom="description" titre={t("offresForm.r1")} lignes={3} max={1000} valeur={v.description}
          aide={t("offresForm.r1Aide")}
          exemple={t("offresForm.r1Ex")} />
        <Rubrique nom="missions" titre={t("offresForm.r2")} requis valeur={v.missions}
          aide={t("offresForm.r2Aide")}
          exemple={t("offresForm.r2Ex")} />
        <Rubrique nom="requirements" titre={t("offresForm.r3")} requis valeur={v.requirements}
          aide={t("offresForm.r3Aide")}
          exemple={t("offresForm.r3Ex")} />
        <Rubrique nom="avantages" titre={t("offresForm.r4")} requis valeur={v.avantages}
          aide={t("offresForm.r4Aide")}
          exemple={t("offresForm.r4Ex")} />
      </div>
      <label><span style={lbl}>{t("offresForm.enLigne")}</span>
        <select name="duree" defaultValue="60" style={{ ...inp, cursor: "pointer", maxWidth: 220 }}>
          {[30, 60, 90].map(n => <option key={n} value={n}>{t("offresForm.jours", { n })}</option>)}
        </select>
      </label>
      {erreur && <p role="alert" style={{ fontSize: 13.5, color: "#ef4444" }}>{erreur}</p>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-fantome" onClick={onFini} disabled={enCours}>{t("offresForm.annuler")}</button>
        <button type="submit" className="btn btn-encre" disabled={enCours}>{enCours ? t("offresForm.enregistrement") : offre ? t("offresForm.enregistrer") : t("offresForm.publier")}</button>
      </div>
    </form>
  );
}
export function GestionOffres({ offres, maintenant }: { offres: Offre[]; maintenant: number }) {
  const router = useRouter();
  const t = useT();
  const langue = useLangue();
  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(langue === "de" ? "de-CH" : "fr-CH", { timeZone: "Europe/Zurich" }) : "");
  const [edition, setEdition] = useState<Offre | "nouvelle" | null>(null);
  const [enCours, demarrer] = useTransition();

  const supprimer = (o: Offre) => {
    if (!window.confirm(t("offresForm.confirmerRetrait", { titre: o.title }))) return;
    demarrer(async () => { await retirerOffre(o.id); router.refresh(); });
  };

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 820 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <p style={{ fontSize: 14.5, color: "var(--text-muted)", maxWidth: 520, lineHeight: 1.55 }}>
          {t("offresForm.intro")}
        </p>
        {edition === null && (
          <button type="button" className="btn btn-encre" onClick={() => setEdition("nouvelle")}><Plus size={16} aria-hidden="true" /> {t("offresForm.ajouter")}</button>
        )}
      </div>

      {edition !== null && <Formulaire offre={edition === "nouvelle" ? null : edition} onFini={() => setEdition(null)} />}

      {offres.length === 0 && edition === null && (
        <div style={{ ...carte, textAlign: "center", padding: "36px 20px" }}>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>{t("offresForm.aucune")}</p>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{t("offresForm.aucuneAide")}</p>
        </div>
      )}

      {offres.map(o => {
        const expiree = o.expires_at ? new Date(o.expires_at).getTime() < maintenant : false;
        return (
          <div key={o.id} style={{ ...carte, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <p style={{ fontWeight: 750, fontSize: 15.5 }}>{o.title}</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
                {[libelleTaux(o.taux_min, o.taux_max, langue), libelleValeurOffre(t, o.contract_type), libelleValeurOffre(t, o.work_mode), o.location].filter(Boolean).join(" · ")}
              </p>
              <p style={{ fontSize: 12.5, marginTop: 6, color: expiree ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                {expiree ? t("offresForm.expiree", { date: date(o.expires_at) }) : t("offresForm.enLigneJusqua", { date: date(o.expires_at) })}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {o.apply_url && <a href={o.apply_url} target="_blank" rel="noopener noreferrer" className="btn btn-clair btn-sm" aria-label={t("offresForm.voirSite")}><ExternalLink size={14} aria-hidden="true" /></a>}
              <button type="button" className="btn btn-clair btn-sm" onClick={() => setEdition(o)} disabled={enCours}><Pencil size={14} aria-hidden="true" /> {t("offresForm.modifierCourt")}</button>
              <button type="button" className="btn btn-fantome btn-sm" onClick={() => supprimer(o)} disabled={enCours} aria-label={t("offresForm.retirerOffre", { titre: o.title })}><Trash2 size={14} aria-hidden="true" /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
