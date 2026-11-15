"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changerBlocage, type Utilisateur } from "@/lib/actions/utilisateurs";

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich" }) : "jamais";

export function ListeUtilisateurs({ utilisateurs }: { utilisateurs: Utilisateur[] }) {
  const router = useRouter();
  const [filtre, setFiltre] = useState("");
  const [cible, setCible] = useState<Utilisateur | null>(null);
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const visibles = useMemo(() => {
    const f = filtre.trim().toLowerCase();
    return f ? utilisateurs.filter(u => u.email.toLowerCase().includes(f) || (u.nom ?? "").toLowerCase().includes(f)) : utilisateurs;
  }, [filtre, utilisateurs]);

  const confirmer = () => {
    if (!cible) return;
    setErreur(null);
    demarrer(async () => {
      const r = await changerBlocage(cible.id, !cible.bloque, motif);
      if (r.error) { setErreur(r.error); return; }
      setCible(null); setMotif("");
      router.refresh();
    });
  };

  const cellule: React.CSSProperties = { padding: "10px 14px", borderBottom: "1px solid var(--border)", verticalAlign: "middle" };

  return (
    <>
      <input
        value={filtre} onChange={e => setFiltre(e.target.value)} placeholder="Rechercher par e-mail ou nom"
        aria-label="Rechercher un utilisateur"
        style={{ width: "100%", maxWidth: 360, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", marginBottom: 14 }}
      />
      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
              {["Compte", "Type", "Inscrit le", "Dernière connexion", "Statut", ""].map(t => (
                <th key={t} style={{ ...cellule, fontWeight: 600 }}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map(u => (
              <tr key={u.id}>
                <td style={cellule}>
                  <div style={{ fontWeight: 600 }}>{u.nom || "Sans nom"}</div>
                  <div style={{ color: "var(--text-muted)" }}>{u.email}{!u.confirme && " · e-mail non confirmé"}</div>
                </td>
                <td style={cellule}>{u.type}</td>
                <td style={{ ...cellule, fontVariantNumeric: "tabular-nums" }}>{date(u.inscrit)}</td>
                <td style={{ ...cellule, fontVariantNumeric: "tabular-nums" }}>{date(u.derniereConnexion)}</td>
                <td style={cellule}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
                    background: u.bloque ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                    color: u.bloque ? "#ef4444" : "#10b981",
                  }}>{u.bloque ? "Bloqué" : "Actif"}</span>
                </td>
                <td style={{ ...cellule, textAlign: "right" }}>
                  {u.type !== "Admin" && (
                    <button type="button" onClick={() => { setCible(u); setMotif(""); setErreur(null); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: "var(--text-muted)", textDecoration: "underline" }}>
                      {u.bloque ? "Débloquer" : "Bloquer"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cible && (
        <div role="dialog" aria-modal="true" aria-label={cible.bloque ? "Débloquer le compte" : "Bloquer le compte"}
          style={{ position: "fixed", inset: 0, zIndex: 10100, background: "rgba(0,0,0,0.6)", display: "grid", placeItems: "center", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800 }}>{cible.bloque ? "Débloquer ce compte ?" : "Bloquer ce compte ?"}</h2>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {cible.email}<br />
              {cible.bloque
                ? "La personne pourra de nouveau se connecter."
                : "La personne ne pourra plus se connecter. Ses données restent intactes, et vous pourrez la débloquer à tout moment."}
            </p>
            <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={2} maxLength={300}
              placeholder={cible.bloque ? "Motif (facultatif)" : "Motif du blocage (obligatoire)"} aria-label="Motif"
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", resize: "vertical" }} />
            {erreur && <p role="alert" style={{ fontSize: 13, color: "#ef4444" }}>{erreur}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="btn btn-fantome" onClick={() => setCible(null)} disabled={enCours}>Annuler</button>
              <button type="button" className="btn btn-encre" onClick={confirmer}
                disabled={enCours || (!cible.bloque && motif.trim().length < 3)}>
                {enCours ? "…" : cible.bloque ? "Débloquer" : "Bloquer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
