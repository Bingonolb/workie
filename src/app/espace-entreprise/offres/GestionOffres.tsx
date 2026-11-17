"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ExternalLink, Download } from "lucide-react";
import { enregistrerOffre, retirerOffre, importerOffre, type Offre } from "@/lib/actions/espaceEntreprise";
import { CONTRATS, MODES, NIVEAUX } from "@/lib/offres";

const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 };
const inp: React.CSSProperties = { width: "100%", padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 15 };
const carte: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" };

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich" }) : "");

function Choix({ nom, liste, valeur, libelle }: { nom: string; liste: readonly string[]; valeur: string | null; libelle: string }) {
  return (
    <label><span style={lbl}>{libelle}</span>
      <select name={nom} defaultValue={valeur ?? ""} style={{ ...inp, cursor: "pointer" }}>
        <option value="">Non précisé</option>
        {liste.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </label>
    );
}

/** Ce que le formulaire affiche : une offre existante, ou les valeurs importées. */
type Valeurs = Pick<Offre, "title" | "apply_url" | "location" | "contract_type" | "work_mode" | "experience_level" | "description">;

function ImportDepuisLien({ onImporte }: { onImporte: (v: Valeurs) => void }) {
  const [lien, setLien] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, demarrer] = useTransition();
  const importer = () => {
    setMessage(null);
    demarrer(async () => {
      const r = await importerOffre(lien);
      if (r.offre) {
        onImporte({ ...r.offre, experience_level: null });
        setMessage({ ok: true, texte: "Offre importée. Relisez et complétez les champs avant de publier." });
      } else {
        setMessage({ ok: false, texte: r.error ?? "Import impossible." });
      }
    });
  };
  return (
    <div style={{ background: "var(--surface2)", border: "1px dashed var(--border2)", borderRadius: 13, padding: "14px 16px", display: "grid", gap: 10 }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
          <Download size={15} aria-hidden="true" /> Importer depuis le lien de l&apos;offre
        </p>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5 }}>
          Collez le lien de l&apos;offre publiée sur votre site : nous reprenons son intitulé, son texte et son lieu. Rien n&apos;est publié avant votre relecture.
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={lien} onChange={e => setLien(e.target.value)} type="url" placeholder="https://www.entreprise.ch/carriere/poste-123"
          aria-label="Lien de l'offre à importer" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (lien.trim()) importer(); } }}
          style={{ ...inp, flex: "1 1 260px", background: "var(--surface)" }} />
        <button type="button" className="btn btn-clair" onClick={importer} disabled={enCours || !lien.trim()}>
          {enCours ? "Lecture…" : "Importer"}
        </button>
      </div>
      {message && <p role="status" style={{ fontSize: 13, color: message.ok ? "#10b981" : "#ef4444", lineHeight: 1.5 }}>{message.texte}</p>}
    </div>
  );
}

function Formulaire({ offre, onFini }: { offre: Offre | null; onFini: () => void }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  // Valeurs importées : la clé remonte les champs pour qu'ils les reprennent.
  const [importees, setImportees] = useState<Valeurs | null>(null);
  const [version, setVersion] = useState(0);
  const v: Partial<Valeurs> = importees ?? offre ?? {};
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
      <p style={{ fontWeight: 800, fontSize: 16 }}>{offre ? "Modifier l'offre" : "Nouvelle offre"}</p>
      {!offre && <ImportDepuisLien onImporte={val => { setImportees(val); setVersion(n => n + 1); }} />}
      {offre && <input type="hidden" name="id" value={offre.id} />}
      <div key={version} style={{ display: "grid", gap: 14 }}>
        <label><span style={lbl}>Intitulé du poste</span><input name="title" required maxLength={120} defaultValue={v.title ?? ""} placeholder="Responsable logistique" style={inp} /></label>
        <label>
          <span style={lbl}>Lien pour postuler</span>
          <input name="apply_url" type="url" required defaultValue={v.apply_url ?? ""} placeholder="https://www.entreprise.ch/carriere/poste-123" style={inp} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, display: "block" }}>La page de l&apos;offre sur votre site : c&apos;est là que les candidats postulent.</span>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          <label><span style={lbl}>Lieu</span><input name="location" maxLength={80} defaultValue={v.location ?? ""} placeholder="Genève" style={inp} /></label>
          <Choix nom="contract_type" liste={CONTRATS} valeur={v.contract_type ?? null} libelle="Contrat" />
          <Choix nom="work_mode" liste={MODES} valeur={v.work_mode ?? null} libelle="Organisation" />
          <Choix nom="experience_level" liste={NIVEAUX} valeur={v.experience_level ?? null} libelle="Expérience" />
        </div>
        <label><span style={lbl}>Description (facultative)</span>
          <textarea name="description" rows={importees ? 12 : 5} maxLength={4000} defaultValue={v.description ?? ""} placeholder="Missions, profil recherché, ce que vous offrez." style={{ ...inp, resize: "vertical", lineHeight: 1.55 }} />
        </label>
      </div>
      <label><span style={lbl}>En ligne pendant</span>
        <select name="duree" defaultValue="60" style={{ ...inp, cursor: "pointer", maxWidth: 220 }}>
          <option value="30">30 jours</option><option value="60">60 jours</option><option value="90">90 jours</option>
        </select>
      </label>
      {erreur && <p role="alert" style={{ fontSize: 13.5, color: "#ef4444" }}>{erreur}</p>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-fantome" onClick={onFini} disabled={enCours}>Annuler</button>
        <button type="submit" className="btn btn-encre" disabled={enCours}>{enCours ? "Enregistrement…" : offre ? "Enregistrer" : "Publier l'offre"}</button>
      </div>
    </form>
  );
}
export function GestionOffres({ offres, maintenant }: { offres: Offre[]; maintenant: number }) {
  const router = useRouter();
  const [edition, setEdition] = useState<Offre | "nouvelle" | null>(null);
  const [enCours, demarrer] = useTransition();

  const supprimer = (o: Offre) => {
    if (!window.confirm(`Retirer l'offre « ${o.title} » ? Elle disparaît de votre fiche.`)) return;
    demarrer(async () => { await retirerOffre(o.id); router.refresh(); });
  };

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 820 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <p style={{ fontSize: 14.5, color: "var(--text-muted)", maxWidth: 520, lineHeight: 1.55 }}>
          Vos offres apparaissent sur votre fiche, dans le bloc Offres d&apos;emploi. Chaque offre renvoie vers votre site pour postuler.
        </p>
        {edition === null && (
          <button type="button" className="btn btn-encre" onClick={() => setEdition("nouvelle")}><Plus size={16} aria-hidden="true" /> Ajouter une offre</button>
        )}
      </div>

      {edition !== null && <Formulaire offre={edition === "nouvelle" ? null : edition} onFini={() => setEdition(null)} />}

      {offres.length === 0 && edition === null && (
        <div style={{ ...carte, textAlign: "center", padding: "36px 20px" }}>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Aucune offre pour l&apos;instant</p>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Ajoutez votre première offre : elle sera visible sur votre fiche dès sa publication.</p>
        </div>
      )}

      {offres.map(o => {
        const expiree = o.expires_at ? new Date(o.expires_at).getTime() < maintenant : false;
        return (
          <div key={o.id} style={{ ...carte, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <p style={{ fontWeight: 750, fontSize: 15.5 }}>{o.title}</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
                {[o.contract_type, o.work_mode, o.location].filter(Boolean).join(" · ")}
              </p>
              <p style={{ fontSize: 12.5, marginTop: 6, color: expiree ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                {expiree ? `Expirée le ${date(o.expires_at)} : modifiez-la pour la remettre en ligne` : `En ligne jusqu'au ${date(o.expires_at)}`}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {o.apply_url && <a href={o.apply_url} target="_blank" rel="noopener noreferrer" className="btn btn-clair btn-sm" aria-label="Voir l'offre sur votre site"><ExternalLink size={14} aria-hidden="true" /></a>}
              <button type="button" className="btn btn-clair btn-sm" onClick={() => setEdition(o)} disabled={enCours}><Pencil size={14} aria-hidden="true" /> Modifier</button>
              <button type="button" className="btn btn-fantome btn-sm" onClick={() => supprimer(o)} disabled={enCours} aria-label={`Retirer l'offre ${o.title}`}><Trash2 size={14} aria-hidden="true" /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
