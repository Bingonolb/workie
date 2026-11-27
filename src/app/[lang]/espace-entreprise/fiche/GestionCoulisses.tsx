"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { ajouterPhoto, legenderPhoto, ordonnerPhotos, retirerPhoto, type PhotoCoulisses } from "@/lib/actions/espaceEntreprise";
import { largeurCouverture } from "@/lib/coverUrl";
import { useT } from "@/i18n/FournisseurLangue";

const MAX = 8;

type EnCours = { cle: string; apercu: string; etat: "attente" | "preparation" | "envoi" };

/** Une vignette n'apparaît qu'une fois chargée, en fondu (déjà en cache : tout de suite). */
const pretSiCharge = (el: HTMLImageElement | null) => { if (el?.complete && el.naturalWidth) el.dataset.pret = "1"; };

/**
 * « En coulisses » : les photos des locaux, gérées à part du formulaire de la
 * fiche. Chaque geste est enregistré tout de suite ; il n'y a rien à valider
 * en bas de page, et rien à perdre en quittant.
 */
export function GestionCoulisses({ initiales }: { initiales: PhotoCoulisses[] }) {
  const t = useT();
  const [photos, setPhotos] = useState(initiales);
  const [etat, setEtat] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, setEnCours] = useState<EnCours[]>([]);
  const [total, setTotal] = useState(0);
  const envoi = enCours.length ? t("coulisses.envoi", { i: total - enCours.length + 1, n: total }) : null;
  const [, demarrer] = useTransition();
  const entree = useRef<HTMLInputElement>(null);
  // L'aperçu local de chaque photo envoyée reste sous la vignette du serveur
  // le temps qu'elle arrive : aucune case vide, aucun clignotement.
  const apercus = useRef<Record<string, string>>({});

  const ajouter = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichiers = [...(e.target.files ?? [])].slice(0, MAX - photos.length);
    e.target.value = "";
    if (!fichiers.length) return;
    setEtat(null);
    // Chaque photo apparaît tout de suite à sa place, en attente.
    const file = fichiers.map((f, i) => ({ cle: `${Date.now()}-${i}`, apercu: URL.createObjectURL(f), etat: "attente" as const }));
    setEnCours(file);
    setTotal(file.length);
    const { preparerImage } = await import("@/lib/preparerImage");
    // Une photo après l'autre : chacune prépare dix tailles dans le stockage.
    for (const [i, f] of fichiers.entries()) {
      const cle = file[i].cle;
      const marquer = (etatTuile: EnCours["etat"]) => setEnCours(x => x.map(y => (y.cle === cle ? { ...y, etat: etatTuile } : y)));
      marquer("preparation");
      const { fichier } = await preparerImage(f);
      marquer("envoi");
      const fd = new FormData();
      fd.set("photo", fichier);
      const r = await ajouterPhoto(fd);
      if (r.photo) {
        apercus.current[r.photo.id] = file[i].apercu;
        setPhotos(p => [...p, r.photo!]);
        setEnCours(x => x.filter(y => y.cle !== cle));
      } else {
        setEtat({ ok: false, texte: r.error ?? "" });
        file.slice(i).forEach(x => URL.revokeObjectURL(x.apercu));
        setEnCours([]);
        break;
      }
    }
  };

  const deplacer = (i: number, sens: -1 | 1) => {
    const j = i + sens;
    if (j < 0 || j >= photos.length) return;
    const suite = [...photos];
    [suite[i], suite[j]] = [suite[j], suite[i]];
    setPhotos(suite);
    demarrer(async () => {
      const r = await ordonnerPhotos(suite.map(p => p.id));
      if (r.error) { setPhotos(photos); setEtat({ ok: false, texte: r.error }); }
    });
  };

  const retirer = (p: PhotoCoulisses) => {
    if (!window.confirm(t("coulisses.confirmerRetrait"))) return;
    const avant = photos;
    setPhotos(x => x.filter(y => y.id !== p.id));
    demarrer(async () => {
      const r = await retirerPhoto(p.id);
      if (r.error) { setPhotos(avant); setEtat({ ok: false, texte: r.error }); }
    });
  };

  const legender = (p: PhotoCoulisses, texte: string) => {
    if ((p.legende ?? "") === texte.trim()) return;
    setPhotos(x => x.map(y => (y.id === p.id ? { ...y, legende: texte.trim() || null } : y)));
    demarrer(async () => {
      const r = await legenderPhoto(p.id, texte);
      setEtat(r.error ? { ok: false, texte: r.error } : { ok: true, texte: t("coulisses.enregistree") });
    });
  };

  const plein = photos.length + enCours.length >= MAX;

  const ajout = (
    <input ref={entree} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={plein || !!envoi} onChange={ajouter} style={{ display: "none" }} />
  );

  return (
    <section className="carte-espace" style={{ maxWidth: 760 }}>
      <div className="carte-titre">
        <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {t("coulisses.titre")}
          <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "var(--surface2)", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{t("coulisses.compteur", { n: photos.length, max: MAX })}</span>
        </h2>
        <label className="btn btn-clair btn-sm" aria-disabled={plein || !!envoi} style={{ cursor: plein || envoi ? "not-allowed" : "pointer", opacity: plein ? 0.5 : 1 }}>
          <ImagePlus size={15} aria-hidden="true" /> {t("coulisses.ajouter")}
          {ajout}
        </label>
      </div>

      <div style={{ padding: "16px 22px 22px", display: "grid", gap: 16 }}>
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55, maxWidth: 560 }}>{t("coulisses.espaceAide")}</p>
        {envoi && <p role="status" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}><span className="rouage" aria-hidden="true" />{envoi}</p>}

        <ul className="coulisses-gestion">
          {photos.map((p, i) => (
            <li key={p.id} className="coulisses-carte">
              <div style={{ position: "relative", aspectRatio: "4 / 3", background: apercus.current[p.id] ? `center / cover no-repeat url(${apercus.current[p.id]})` : "var(--surface2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={pretSiCharge} onLoad={e => { e.currentTarget.dataset.pret = "1"; }} className="coulisses-img" src={largeurCouverture(p.url, 480)} alt="" loading="lazy" decoding="async" />
                {i === 0 && <span className="coulisses-principale">{t("coulisses.principale")}</span>}
                {/* Une seule pastille de verre pour les trois gestes, plutôt que
                    trois boutons posés côte à côte sur la photo. */}
                <div className="coulisses-outils">
                  {[
                    { Icone: ArrowLeft, label: t("coulisses.avant"), action: () => deplacer(i, -1), off: i === 0 },
                    { Icone: ArrowRight, label: t("coulisses.apres"), action: () => deplacer(i, 1), off: i === photos.length - 1 },
                    { Icone: Trash2, label: t("coulisses.retirer"), action: () => retirer(p), off: false },
                  ].map(({ Icone, label, action, off }) => (
                    <button key={label} type="button" onClick={action} disabled={off} aria-label={label} title={label}>
                      <Icone size={15} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
              <input type="text" maxLength={90} defaultValue={p.legende ?? ""} aria-label={t("coulisses.legende")} placeholder={t("coulisses.legendeEx")}
                onBlur={e => legender(p, e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                className="coulisses-legende" />
            </li>
          ))}
          {enCours.map(x => (
            <li key={x.cle} className="coulisses-carte coulisses-encours" data-etat={x.etat} aria-busy="true">
              <div style={{ position: "relative", aspectRatio: "4 / 3", background: `center / cover no-repeat url(${x.apercu}), var(--surface2)` }}>
                <div className="coulisses-voile">
                  {x.etat === "attente" ? null : <span className="rouage rouage-clair" aria-hidden="true" />}
                  <span>{x.etat === "attente" ? t("coulisses.attente") : x.etat === "preparation" ? t("coulisses.preparation") : t("coulisses.envoiCourt")}</span>
                </div>
              </div>
              <div className="coulisses-legende" aria-hidden="true" style={{ color: "transparent" }}>.</div>
            </li>
          ))}
          {/* La place suivante, à l'endroit où la photo arrivera. */}
          {!plein && (
            <li>
              <label className="coulisses-place" aria-disabled={!!envoi}>
                <ImagePlus size={22} strokeWidth={1.8} aria-hidden="true" />
                <span>{photos.length === 0 ? t("coulisses.vide") : t("coulisses.ajouter")}</span>
                {ajout}
              </label>
            </li>
          )}
        </ul>

        {etat && <p role="status" style={{ fontSize: 13, color: etat.ok ? "#10b981" : "#ef4444" }}>{etat.texte}</p>}
      </div>
    </section>
  );
}
