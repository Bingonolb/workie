"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, BarChart3, PenLine, BadgeCheck } from "lucide-react";
import {
  demarrerRevendication, verifierCodeRevendication, lancerAbonnement, type EtatRevendication,
} from "@/lib/actions/revendication";
import { useT, useLangue } from "@/i18n/FournisseurLangue";
import { ChampsMotDePasse } from "@/components/ChampsMotDePasse";
import { riche } from "@/i18n/riche";
import { ABONNEMENT, type Formule } from "@/lib/tarifs";

const carte: React.CSSProperties = {
  marginTop: 16, background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 18, padding: "24px 22px", display: "flex", flexDirection: "column", gap: 16,
};
const champ: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 11, border: "1px solid var(--border)",
  background: "var(--surface2)", color: "var(--text)", fontSize: 15,
};
const etiquette: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, display: "block" };


function Progression({ actuelle }: { actuelle: number }) {
  const t = useT();
  const ETAPES = [t("revend.etapeInfos"), t("revend.etapeVerif"), t("revend.etapeAbo")];
  return (
    <ol aria-label={t("revend.etapes")} style={{ display: "flex", gap: 8, listStyle: "none", padding: 0, margin: "20px 0 0" }}>
      {ETAPES.map((e, i) => (
        <li key={e} style={{ flex: 1 }}>
          <div style={{ height: 4, borderRadius: 2, background: i <= actuelle ? "var(--brand)" : "var(--border)" }} />
          <p style={{ fontSize: 11.5, marginTop: 6, color: i === actuelle ? "var(--text)" : "var(--text-muted)", fontWeight: i === actuelle ? 700 : 500 }}>{e}</p>
        </li>
      ))}
    </ol>
  );
}

export function ParcoursRevendication({ companyId, slug, domaine, connecte, etatInitial }: { companyId: string; slug: string; domaine: string | null; connecte: boolean; etatInitial: EtatRevendication }) {
  const router = useRouter();
  const t = useT();
  const langue = useLangue();
  const [compteExistant, setCompteExistant] = useState(false);
  const lienConnexion = `/login?next=${encodeURIComponent(`/revendiquer/${slug}`)}`;
  const [etat, setEtat] = useState<EtatRevendication>(etatInitial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [formule, setFormule] = useState<Formule>("annuel");
  const [enCours, demarrer] = useTransition();

  const envoyer = (formData: FormData) => {
    setErreur(null);
    formData.set("company_id", companyId);
    demarrer(async () => {
      const r = await demarrerRevendication(formData);
      setCompteExistant(!!r.compteExistant);
      if (r.error) setErreur(r.error);
      else if (r.etat) setEtat(r.etat);
    });
  };

  const verifier = (e: React.FormEvent) => {
    e.preventDefault();
    if (etat.etape !== "code") return;
    setErreur(null);
    demarrer(async () => {
      const r = await verifierCodeRevendication(etat.id, code);
      if (r.error) setErreur(r.error);
      // La session vient de s'ouvrir pour un nouveau compte : la page est
      // rechargée pour que la barre du haut l'affiche connecté.
      else if (r.etat) { setEtat(r.etat); if (!connecte) window.location.reload(); else router.refresh(); }
    });
  };

  const payer = () => {
    if (etat.etape !== "paiement") return;
    setErreur(null);
    demarrer(async () => {
      const r = await lancerAbonnement(etat.id, formule);
      if (r.error) setErreur(r.error);
      else if (r.url) window.location.assign(r.url);
    });
  };

  const alerte = erreur && (
    <p role="alert" style={{ fontSize: 13.5, color: "#ef4444" }}>
      {erreur}{compteExistant && <> <Link href={lienConnexion} style={{ color: "var(--brand)", fontWeight: 700 }}>{t("revend.seConnecter")}</Link></>}
    </p>
  );

  if (etat.etape === "deja_geree") {
    return (
      <div style={carte}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>{t("revend.dejaGereeTitre")}</h1>
        <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
          {t("revend.dejaGereeTexte")}
        </p>
        <Link href={`/entreprise/${slug}`} className="btn btn-clair">{t("revend.retour")}</Link>
      </div>
    );
  }

  if (etat.etape === "refusee") {
    return (
      <div style={carte}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>{t("revend.refuseeTitre")}</h1>
        <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
          {t("revend.refuseeTexte")}
        </p>
        <button type="button" className="btn btn-encre" onClick={() => setEtat({ etape: "formulaire", domaine })}>
          {t("revend.recommencer")}
        </button>
      </div>
    );
  }

  if (etat.etape === "formulaire") {
    return (
      <>
        <Progression actuelle={0} />
        <div style={carte}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>{t("revend.titre")}</h1>
            <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {t("revend.sousTitre")}
            </p>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {[
              { I: PenLine, t: t("revend.avantage1") },
              { I: BarChart3, t: t("revend.avantage2") },
              { I: BadgeCheck, t: t("revend.avantage3") },
            ].map(({ I, t: texte }) => (
              <li key={texte} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14 }}>
                <I size={17} color="var(--brand)" aria-hidden="true" /> {texte}
              </li>
            ))}
          </ul>
          <form action={envoyer} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label><span style={etiquette}>{t("revend.prenom")}</span><input name="prenom" required autoComplete="given-name" style={champ} /></label>
              <label><span style={etiquette}>{t("revend.nom")}</span><input name="nom" required autoComplete="family-name" style={champ} /></label>
            </div>
            <label><span style={etiquette}>{t("revend.fonction")}</span><input name="fonction" required placeholder={t("revend.fonctionExemple")} autoComplete="organization-title" style={champ} /></label>
            <label>
              <span style={etiquette}>{t("revend.email")}</span>
              <input name="email" type="email" required autoComplete="email"
                placeholder={etat.domaine ? t("revend.emailExemple", { domaine: etat.domaine }) : t("revend.emailExemple", { domaine: t("revend.domaineExemple") })} style={champ} />
              <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 6, display: "block", lineHeight: 1.5 }}>
                {etat.domaine
                  ? riche(t("revend.aideDomaine", { domaine: etat.domaine }))
                  : t("revend.aideSansDomaine")}
              </span>
            </label>
            <label>
              <span style={etiquette}>{t("revend.telephone")}</span>
              <input name="telephone" type="tel" required autoComplete="tel" placeholder="+41 32 000 00 00" style={champ} />
              <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 6, display: "block" }}>{t("revend.telephoneAide")}</span>
            </label>
            {!connecte && (
              <ChampsMotDePasse libelle={t("revend.motDePasse")} aide={t("revend.motDePasseAide")} styleChamp={champ} styleEtiquette={etiquette} />
            )}
            {alerte}
            <button type="submit" className="btn btn-encre btn-bloc" disabled={enCours}>
              {enCours ? t("revend.envoi") : t("revend.recevoirCode")}
            </button>
            {!connecte && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
                {t("revend.dejaCompte")} <Link href={lienConnexion} style={{ color: "var(--brand)", fontWeight: 600 }}>{t("revend.seConnecter")}</Link>
              </p>
            )}
          </form>
        </div>
      </>
    );
  }

  if (etat.etape === "code") {
    return (
      <>
        <Progression actuelle={1} />
        <form onSubmit={verifier} style={carte}>
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em" }}>{t("revend.verifTitre")}</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {riche(t("revend.verifTexte", { email: etat.email }))}
          </p>
          <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="123456" aria-label={t("revend.codeLabel")}
            style={{ ...champ, fontSize: 24, letterSpacing: "0.3em", textAlign: "center", fontVariantNumeric: "tabular-nums" }} />
          {alerte}
          <button type="submit" className="btn btn-encre btn-bloc" disabled={code.length !== 6 || enCours}>
            {enCours ? t("revend.verification") : t("revend.verifier")}
          </button>
          <button type="button" onClick={() => { setErreur(null); setCode(""); setEtat({ etape: "formulaire", domaine }); }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
            {t("revend.refaire")}
          </button>
        </form>
      </>
    );
  }

  if (etat.etape === "en_attente") {
    return (
      <>
        <Progression actuelle={1} />
        <div style={carte}>
          <ShieldCheck size={28} color="var(--brand)" aria-hidden="true" />
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em" }}>{t("revend.recueTitre")}</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {riche(t("revend.recueTexte", { email: etat.email }))}
          </p>
          <Link href={`/entreprise/${slug}`} className="btn btn-clair btn-bloc">{t("revend.retour")}</Link>
        </div>
      </>
    );
  }

  // Paiement
  return (
    <>
      <Progression actuelle={2} />
      <div style={carte}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10b981", fontSize: 13.5, fontWeight: 700 }}>
          <Check size={16} aria-hidden="true" /> {t("revend.reussie")}
        </div>
        <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em" }}>{t("revend.choisirFormule")}</h1>
        <div role="radiogroup" aria-label={t("revend.formule")} style={{ display: "grid", gap: 10 }}>
          {(Object.keys(ABONNEMENT) as Formule[]).map(f => {
            const choisie = formule === f;
            return (
              <button key={f} type="button" role="radio" aria-checked={choisie} onClick={() => setFormule(f)}
                style={{
                  textAlign: "left", padding: "14px 16px", borderRadius: 13, cursor: "pointer",
                  border: `2px solid ${choisie ? "var(--brand)" : "var(--border)"}`,
                  background: choisie ? "color-mix(in srgb, var(--brand) 7%, var(--surface))" : "var(--surface)",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, color: "var(--text)",
                }}>
                <span>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{f === "annuel" ? t("revend.annuel") : t("revend.mensuel")}</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{t(f === "annuel" ? "revend.libelleAnnuel" : "revend.libelleMensuel", { chf: ABONNEMENT[f].chf.toLocaleString(langue === "de" ? "de-CH" : "fr-CH") })}</span>
                </span>
                {f === "annuel" && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.12)", padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    {t("revend.deuxMois")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
          {t("revend.stripe")}
        </p>
        {alerte}
        <button type="button" onClick={payer} className="btn btn-marque btn-bloc" disabled={enCours}>
          {enCours ? t("revend.ouverture") : t("revend.activer")}
        </button>
      </div>
    </>
  );
}
