"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { ajouterPhoto, legenderPhoto, ordonnerPhotos, retirerPhoto, type PhotoCoulisses } from "@/lib/actions/espaceEntreprise";
import { largeurCouverture } from "@/lib/coverUrl";
import { useT } from "@/i18n/FournisseurLangue";

const MAX = 8;

/**
 * « En coulisses » : les photos des locaux, gérées à part du formulaire de la
 * fiche. Chaque geste est enregistré tout de suite ; il n'y a rien à valider
 * en bas de page, et rien à perdre en quittant.
 */
export function GestionCoulisses({ initiales }: { initiales: PhotoCoulisses[] }) {
  const t = useT();
  const [photos, setPhotos] = useState(initiales);
  const [etat, setEtat] = useState<{ ok: boolean; texte: string } | null>(null);
  const [envoi, setEnvoi] = useState<string | null>(null);
  const [, demarrer] = useTransition();
  const entree = useRef<HTMLInputElement>(null);

  const ajouter = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichiers = [...(e.target.files ?? [])].slice(0, MAX - photos.length);
    e.target.value = "";
    if (!fichiers.length) return;
    setEtat(null);
    const { preparerImage } = await import("@/lib/preparerImage");
    // Une photo après l'autre : chacune prépare dix tailles dans le stockage.
    for (const [i, f] of fichiers.entries()) {
      setEnvoi(t("coulisses.envoi", { i: i + 1, n: fichiers.length }));
      const { fichier } = await preparerImage(f);
      const fd = new FormData();
      fd.set("photo", fichier);
      const r = await ajouterPhoto(fd);
      if (r.photo) setPhotos(p => [...p, r.photo!]);
      else { setEtat({ ok: false, texte: r.error ?? "" }); break; }
    }
    setEnvoi(null);
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

  const plein = photos.length >= MAX;

  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 22px", display: "grid", gap: 16, maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 480 }}>
          <h2 style={{ fontSize: 16, fontWeight: 750, letterSpacing: "-0.01em" }}>
            {t("coulisses.titre")} <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", marginLeft: 6 }}>{t("coulisses.compteur", { n: photos.length, max: MAX })}</span>
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginTop: 4 }}>{t("coulisses.espaceAide")}</p>
        </div>
        <label className="btn btn-clair btn-sm" aria-disabled={plein || !!envoi} style={{ cursor: plein || envoi ? "not-allowed" : "pointer", opacity: plein ? 0.5 : 1 }}>
          <ImagePlus size={15} aria-hidden="true" /> {t("coulisses.ajouter")}
          <input ref={entree} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={plein || !!envoi} onChange={ajouter} style={{ display: "none" }} />
        </label>
      </div>

      {envoi && <p role="status" style={{ fontSize: 13, color: "var(--text-muted)" }}>{envoi}</p>}

      {photos.length === 0 && !envoi ? (
        <button type="button" onClick={() => entree.current?.click()} style={{
          display: "grid", placeItems: "center", gap: 8, padding: "34px 16px", borderRadius: 14,
          border: "1.5px dashed var(--border2)", background: "var(--surface2)", color: "var(--text-muted)", fontSize: 13.5, cursor: "pointer",
        }}>
          <ImagePlus size={22} aria-hidden="true" />
          {t("coulisses.vide")}
        </button>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))", gap: 14 }}>
          {photos.map((p, i) => (
            <li key={p.id} style={{ display: "grid", gap: 8, alignContent: "start" }}>
              <div style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 12, overflow: "hidden", background: "var(--surface2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={largeurCouverture(p.url, 480)} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                {i === 0 && (
                  <span style={{ position: "absolute", top: 8, left: 8, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(10,10,14,0.6)", color: "#fff", backdropFilter: "blur(6px)" }}>
                    {t("coulisses.principale")}
                  </span>
                )}
                <div style={{ position: "absolute", right: 6, bottom: 6, display: "flex", gap: 4 }}>
                  {[
                    { Icone: ArrowLeft, label: t("coulisses.avant"), action: () => deplacer(i, -1), off: i === 0 },
                    { Icone: ArrowRight, label: t("coulisses.apres"), action: () => deplacer(i, 1), off: i === photos.length - 1 },
                    { Icone: Trash2, label: t("coulisses.retirer"), action: () => retirer(p), off: false },
                  ].map(({ Icone, label, action, off }) => (
                    <button key={label} type="button" onClick={action} disabled={off} aria-label={label} title={label} style={{
                      width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 9, border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(10,10,14,0.55)", color: "#fff", backdropFilter: "blur(6px)", cursor: off ? "default" : "pointer", opacity: off ? 0.35 : 1,
                    }}>
                      <Icone size={15} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
              <input type="text" maxLength={90} defaultValue={p.legende ?? ""} aria-label={t("coulisses.legende")} placeholder={t("coulisses.legendeEx")}
                onBlur={e => legender(p, e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 13.5 }} />
            </li>
          ))}
        </ul>
      )}

      {etat && <p role="status" style={{ fontSize: 13, color: etat.ok ? "#10b981" : "#ef4444" }}>{etat.texte}</p>}
    </section>
  );
}
