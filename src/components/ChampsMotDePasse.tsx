"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useT } from "@/i18n/FournisseurLangue";

/**
 * Mot de passe d'un nouveau compte : saisi deux fois, lisible à la demande.
 *
 * La confirmation passe par la validation du navigateur (setCustomValidity) :
 * tant que les deux champs diffèrent, le formulaire ne part pas et le message
 * s'affiche sous le champ. Le serveur revérifie de son côté.
 */
export function ChampsMotDePasse({ libelle, aide, styleChamp, styleEtiquette }: {
  libelle: string; aide: string; styleChamp: React.CSSProperties; styleEtiquette: React.CSSProperties;
}) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [mdp, setMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const different = confirmation.length > 0 && confirmation !== mdp;
  const champConfirmation = useRef<HTMLInputElement>(null);
  // Revérifié quand l'un OU l'autre change : corriger le premier champ après
  // coup doit aussi lever (ou poser) le blocage.
  useEffect(() => {
    champConfirmation.current?.setCustomValidity(confirmation !== mdp ? t("mdpChamp.different") : "");
  }, [mdp, confirmation, t]);

  const oeil = (
    <button type="button" onClick={() => setVisible(v => !v)}
      aria-label={visible ? t("mdpChamp.masquer") : t("mdpChamp.afficher")} aria-pressed={visible}
      style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
      {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  );
  const type = visible ? "text" : "password";

  return (
    <>
      <label>
        <span style={styleEtiquette}>{libelle}</span>
        <span style={{ position: "relative", display: "block" }}>
          <input name="mot_de_passe" type={type} required minLength={8} autoComplete="new-password"
            value={mdp} onChange={e => setMdp(e.target.value)} style={{ ...styleChamp, paddingRight: 48 }} />
          {oeil}
        </span>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 6, display: "block" }}>{aide}</span>
      </label>
      <label>
        <span style={styleEtiquette}>{t("mdpChamp.confirmer")}</span>
        <span style={{ position: "relative", display: "block" }}>
          <input name="mot_de_passe_confirmation" type={type} required autoComplete="new-password"
            value={confirmation}
            ref={champConfirmation}
            onChange={e => setConfirmation(e.target.value)}
            aria-invalid={different}
            style={{ ...styleChamp, paddingRight: 48, borderColor: different ? "#ef4444" : undefined }} />
          {oeil}
        </span>
        {different && <span role="alert" style={{ fontSize: 12.5, color: "#ef4444", marginTop: 6, display: "block" }}>{t("mdpChamp.different")}</span>}
      </label>
    </>
  );
}
