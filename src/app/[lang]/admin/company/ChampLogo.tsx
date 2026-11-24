"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { logoAffichable } from "@/lib/logo";

/**
 * Le logo se dépose comme la bannière : on choisit un fichier, il est réduit
 * dans le navigateur, envoyé dans le stockage, puis servi à la bonne taille.
 * Coller une adresse ne marchait de toute façon pas : seuls les logos hébergés
 * chez nous s'affichent (voir lib/logo.ts).
 *
 * Sans logo, la fiche garde ses initiales. Le champ caché `logo_url` porte le
 * logo déjà enregistré : vidé par « Retirer », il rend les initiales.
 */

const LOGO_MAX = 512;

export function ChampLogo({ actuel, nom }: { actuel: string; nom: string }) {
  const [url, setUrl] = useState(actuel);
  const [apercu, setApercu] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef<string | null>(null);

  useEffect(() => () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }, []);

  const liberer = () => { if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; } };

  const choisir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setInfo("Optimisation…");
    const { preparerImage, formaterPoids } = await import("@/lib/preparerImage");
    const r = await preparerImage(fichier, LOGO_MAX);
    if (r.reduite && fileRef.current) {
      const dt = new DataTransfer();
      dt.items.add(r.fichier);
      fileRef.current.files = dt.files;
    }
    setInfo(`${formaterPoids(r.apres)} · prêt, enregistré avec la fiche`);
    liberer();
    blobRef.current = URL.createObjectURL(r.fichier);
    setApercu(blobRef.current);
  };

  const retirer = () => {
    liberer();
    setApercu(null);
    setUrl("");
    setInfo(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const affiche = apercu ?? logoAffichable(url);
  const initiales = nom.trim().slice(0, 2).toUpperCase() || "?";

  return (
    <div>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
        marginBottom: 5, letterSpacing: "0.05em", textTransform: "uppercase",
      }}>Logo</label>
      <input type="hidden" name="logo_url" value={url} />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10, flexShrink: 0, overflow: "hidden",
          background: "var(--surface2)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 800, color: "var(--text-muted)",
        }}>
          {affiche
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={affiche} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
            : initiales}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <label style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8, cursor: "pointer",
              background: "var(--surface2)", border: "1px solid var(--border)",
              fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
            }}>
              <ImageIcon size={13} aria-hidden="true" /> Choisir un logo
              <input ref={fileRef} name="logo_file" type="file" accept="image/png,image/webp,image/jpeg" onChange={choisir} style={{ display: "none" }} />
            </label>
            {affiche && (
              <button type="button" onClick={retirer} style={{
                fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600,
              }}>
                ✕ Retirer
              </button>
            )}
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {info ?? (affiche ? "Logo en place." : "Aucun logo : la fiche affiche les initiales.")}
          </span>
        </div>
      </div>
    </div>
  );
}
