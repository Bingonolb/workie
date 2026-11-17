"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Etat =
  | { etape: "chargement" }
  | { etape: "inscription"; factorId: string; qr: string; secret: string }
  | { etape: "code"; factorId: string }
  | { etape: "erreur"; message: string };

/**
 * Double authentification de l'administration.
 *
 * Première fois : un QR code à scanner avec une application (Google
 * Authenticator, 1Password…), puis le code à 6 chiffres pour confirmer.
 * Ensuite : seulement le code, à chaque nouvelle connexion.
 */
export function CodeAdmin() {
  const [etat, setEtat] = useState<Etat>({ etape: "chargement" });
  const [code, setCode] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return setEtat({ etape: "erreur", message: "Impossible de lire vos facteurs de sécurité. Rechargez la page." });
      const verifie = data.totp.find(f => f.status === "verified");
      if (verifie) return setEtat({ etape: "code", factorId: verifie.id });
      // Une inscription commencée puis abandonnée bloquerait la suivante.
      for (const f of data.all.filter(f => f.status !== "verified")) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const ins = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Workie admin" });
      if (ins.error || !ins.data) return setEtat({ etape: "erreur", message: "La création du code a échoué. Rechargez la page." });
      setEtat({ etape: "inscription", factorId: ins.data.id, qr: ins.data.totp.qr_code, secret: ins.data.totp.secret });
    })();
  }, []);

  const valider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (etat.etape !== "inscription" && etat.etape !== "code") return;
    setEnvoi(true);
    setErreur(null);
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: etat.factorId, code: code.trim() });
    if (error) {
      setEnvoi(false);
      setErreur("Code incorrect ou expiré. Saisissez le code affiché maintenant dans l'application.");
      return;
    }
    // Retour là où l'admin allait (ex. la fiche, pour la vue entreprise).
    const suite = new URLSearchParams(window.location.search).get("next") ?? "";
    window.location.href = /^\/(?![/\\])/.test(suite) ? suite : "/admin";
  };

  const carte: React.CSSProperties = {
    width: "100%", maxWidth: 400, background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", gap: 16,
  };

  if (etat.etape === "chargement") return <div style={carte}><p style={{ color: "var(--text-muted)" }}>Chargement…</p></div>;
  if (etat.etape === "erreur") return <div style={carte}><p>{etat.message}</p></div>;

  return (
    <form onSubmit={valider} style={carte}>
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>
        {etat.etape === "inscription" ? "Activer la double authentification" : "Code de sécurité"}
      </h1>
      {etat.etape === "inscription" ? (
        <>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55 }}>
            Scannez ce QR code avec Google Authenticator ou 1Password, puis saisissez le code à 6 chiffres affiché.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={etat.qr} alt="QR code de la double authentification" width={200} height={200}
            style={{ alignSelf: "center", background: "#fff", borderRadius: 12, padding: 8 }} />
          <p style={{ fontSize: 12, color: "var(--text-muted)", wordBreak: "break-all" }}>
            Sans appareil photo, saisissez cette clé dans l&apos;application : <code>{etat.secret}</code>
          </p>
        </>
      ) : (
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55 }}>
          Saisissez le code à 6 chiffres affiché dans votre application d&apos;authentification.
        </p>
      )}
      <input
        value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="123456"
        aria-label="Code à 6 chiffres"
        style={{ fontSize: 22, letterSpacing: "0.3em", textAlign: "center", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontVariantNumeric: "tabular-nums" }}
      />
      {erreur && <p role="alert" style={{ fontSize: 13, color: "#ef4444" }}>{erreur}</p>}
      <button type="submit" className="btn btn-encre btn-bloc" disabled={code.length !== 6 || envoi}>
        {envoi ? "Vérification…" : "Valider"}
      </button>
    </form>
  );
}
