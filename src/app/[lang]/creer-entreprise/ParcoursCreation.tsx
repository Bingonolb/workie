"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { demarrerCreation } from "@/lib/actions/creationEntreprise";
import { verifierCodeRevendication, lancerAbonnement, type EtatRevendication } from "@/lib/actions/revendication";
import { ABONNEMENT, type Formule } from "@/lib/tarifs";
import { EMPLOYEE_RANGES, LANGUES_SAISIE } from "@/lib/types";
import { useT, useLangue } from "@/i18n/FournisseurLangue";
import { ChampsMotDePasse } from "@/components/ChampsMotDePasse";
import { riche } from "@/i18n/riche";
import { nomSecteur } from "@/i18n/secteurs";
import { nomLangue } from "@/lib/langues";

const carte: React.CSSProperties = {
  marginTop: 16, background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 18, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16,
};
const champ: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 11, border: "1px solid var(--border)",
  background: "var(--surface2)", color: "var(--text)", fontSize: 15,
};
const etiquette: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, display: "block" };
const aide: React.CSSProperties = { fontSize: 12.5, color: "var(--text-muted)", marginTop: 6, display: "block", lineHeight: 1.5 };
const titreBloc: React.CSSProperties = { fontSize: 13, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 16 };


function Progression({ actuelle }: { actuelle: number }) {
  const t = useT();
  const ETAPES = [t("creation.etape1"), t("revend.etapeVerif"), t("revend.etapeAbo")];
  return (
    <ol aria-label={t("revend.etapes")} style={{ display: "flex", gap: 8, listStyle: "none", padding: 0, margin: "16px 0 0" }}>
      {ETAPES.map((e, i) => (
        <li key={e} style={{ flex: 1 }}>
          <div style={{ height: 4, borderRadius: 2, background: i <= actuelle ? "var(--brand)" : "var(--border)" }} />
          <p style={{ fontSize: 11.5, marginTop: 6, color: i === actuelle ? "var(--text)" : "var(--text-muted)", fontWeight: i === actuelle ? 700 : 500 }}>{e}</p>
        </li>
      ))}
    </ol>
  );
}

type Proche = { name: string; slug: string; city: string };

export function ParcoursCreation({ connecte, etatInitial, secteurs, cantons }: {
  connecte: boolean; etatInitial: EtatRevendication & { nom?: string }; secteurs: string[]; cantons: { code: string; nom: string }[];
}) {
  const router = useRouter();
  const t = useT();
  const langue = useLangue();
  const loc = langue === "de" ? "de-CH" : "fr-CH";
  const libelle = (f: Formule) => t(f === "annuel" ? "revend.libelleAnnuel" : "revend.libelleMensuel", { chf: ABONNEMENT[f].chf.toLocaleString(loc) });
  const [etat, setEtat] = useState<EtatRevendication>(etatInitial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [compteExistant, setCompteExistant] = useState(false);
  const [doublons, setDoublons] = useState<Proche[] | null>(null);
  const [langues, setLangues] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [formule, setFormule] = useState<Formule>("annuel");
  const [enCours, demarrer] = useTransition();
  const formulaire = useRef<HTMLFormElement>(null);
  const lienConnexion = `/login?next=${encodeURIComponent("/creer-entreprise")}`;

  const envoyer = (fd: FormData, confirme = false) => {
    setErreur(null);
    if (confirme) fd.set("confirme_nouvelle", "1");
    demarrer(async () => {
      const r = await demarrerCreation(fd);
      setCompteExistant(!!r.compteExistant);
      if (r.doublons) { setDoublons(r.doublons); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      if (r.error) setErreur(r.error);
      else if (r.etat) { setDoublons(null); setEtat(r.etat); window.scrollTo({ top: 0 }); }
    });
  };

  const verifier = (e: React.FormEvent) => {
    e.preventDefault();
    if (etat.etape !== "code") return;
    setErreur(null);
    demarrer(async () => {
      const r = await verifierCodeRevendication(etat.id, code);
      if (r.error) setErreur(r.error);
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

  if (etat.etape === "refusee") {
    return (
      <div style={carte}>
        <h1 style={{ fontSize: 21, fontWeight: 800 }}>{t("revend.refuseeTitre")}</h1>
        <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
          {t("creation.refuseeTexte")}
        </p>
        <button type="button" className="btn btn-encre" onClick={() => setEtat({ etape: "formulaire", domaine: null })}>{t("creation.nouvelleDemande")}</button>
      </div>
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
          <button type="submit" className="btn btn-encre btn-bloc" disabled={code.length !== 6 || enCours}>{enCours ? t("revend.verification") : t("revend.verifier")}</button>
          <button type="button" onClick={() => { setErreur(null); setCode(""); setEtat({ etape: "formulaire", domaine: null }); }}
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
            {riche(etatInitial.nom ? t("creation.recueTexteNom", { nom: etatInitial.nom }) : t("creation.recueTexte"))}{" "}
            {riche(t("creation.recueSuite", { email: etat.email }))}
          </p>
          <Link href="/" className="btn btn-clair btn-bloc">{t("creation.retourAccueil")}</Link>
        </div>
      </>
    );
  }

  if (etat.etape === "paiement") {
    return (
      <>
        <Progression actuelle={2} />
        <div style={carte}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10b981", fontSize: 13.5, fontWeight: 700 }}>
            <Check size={16} aria-hidden="true" /> {t("creation.acceptee")}
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em" }}>{t("revend.choisirFormule")}</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55 }}>
            {riche(etatInitial.nom ? t("creation.publieeNom", { nom: etatInitial.nom }) : t("creation.publiee"))}
          </p>
          <div role="radiogroup" aria-label={t("revend.formule")} style={{ display: "grid", gap: 10 }}>
            {(Object.keys(ABONNEMENT) as Formule[]).map(f => {
              const choisie = formule === f;
              return (
                <button key={f} type="button" role="radio" aria-checked={choisie} onClick={() => setFormule(f)}
                  style={{
                    textAlign: "left", padding: "14px 16px", borderRadius: 13, cursor: "pointer", color: "var(--text)",
                    border: `2px solid ${choisie ? "var(--brand)" : "var(--border)"}`,
                    background: choisie ? "color-mix(in srgb, var(--brand) 7%, var(--surface))" : "var(--surface)",
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                  }}>
                  <span>
                    <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{f === "annuel" ? t("revend.annuel") : t("revend.mensuel")}</span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{libelle(f)}</span>
                  </span>
                  {f === "annuel" && <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.12)", padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>{t("revend.deuxMois")}</span>}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>{t("revend.stripe")}</p>
          {alerte}
          <button type="button" onClick={payer} className="btn btn-marque btn-bloc" disabled={enCours}>
            {enCours ? t("revend.ouverture") : t("creation.activerPublier")}
          </button>
        </div>
      </>
    );
  }

  // Formulaire
  return (
    <>
      <h1 style={{ fontSize: 26, fontWeight: 850, letterSpacing: "-0.03em", marginTop: 6 }}>{t("creation.titre")}</h1>
      <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6, marginTop: 6 }}>
        {t("creation.intro")}
      </p>
      <Progression actuelle={0} />

      {doublons && (
        <div role="alert" style={{ ...carte, borderColor: "#f59e0b" }}>
          <p style={{ fontWeight: 800, fontSize: 15.5 }}>{t("creation.doublonTitre")}</p>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55 }}>{t("creation.doublonTexte")}</p>
          <div style={{ display: "grid", gap: 8 }}>
            {doublons.map(d => (
              <Link key={d.slug} href={`/revendiquer/${d.slug}`} className="btn btn-clair" style={{ justifyContent: "space-between" }}>
                <span>{d.name} <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>· {d.city}</span></span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
          <button type="button" className="btn btn-fantome" disabled={enCours}
            onClick={() => formulaire.current && envoyer(new FormData(formulaire.current), true)}>
            {t("creation.doublonContinuer")}
          </button>
        </div>
      )}

      {/* onSubmit et non action : React vide un formulaire soumis par action,
          et une erreur ferait perdre toute la saisie. */}
      <form ref={formulaire} onSubmit={e => { e.preventDefault(); envoyer(new FormData(e.currentTarget)); }} style={carte}>
        <p style={{ ...titreBloc, borderTop: "none", paddingTop: 0 }}>{t("creation.blocEntreprise")}</p>
        <label><span style={etiquette}>{t("creation.nomEntreprise")}</span>
          <input name="name" required maxLength={120} placeholder={t("creation.nomEx")} style={champ} />
          <span style={aide}>{t("creation.nomAide")}</span>
        </label>
        <label><span style={etiquette}>{t("creation.secteur")}</span>
          <select name="sector" required defaultValue="" style={{ ...champ, cursor: "pointer" }}>
            <option value="" disabled>{t("creation.choisirSecteur")}</option>
            {secteurs.map(s => <option key={s} value={s}>{nomSecteur(s, langue)}</option>)}
          </select>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 12 }}>
          <label><span style={etiquette}>{t("creation.ville")}</span><input name="city" required maxLength={80} placeholder={t("creation.villeEx")} autoComplete="address-level2" style={champ} /></label>
          <label><span style={etiquette}>{t("creation.canton")}</span>
            <select name="canton" required defaultValue="" style={{ ...champ, cursor: "pointer" }}>
              <option value="" disabled>{t("creation.choisir")}</option>
              {cantons.map(c => <option key={c.code} value={c.code}>{c.nom}</option>)}
            </select>
          </label>
        </div>
        <label><span style={etiquette}>{t("creation.site")}</span>
          <input name="website_url" required inputMode="url" placeholder={t("creation.siteEx")} style={champ} />
          <span style={aide}>{t("creation.siteAide")}</span>
        </label>
        <label><span style={etiquette}>{t("creation.description")}</span>
          <textarea name="description" required minLength={80} maxLength={3000} rows={5} placeholder={t("creation.descriptionEx")} style={{ ...champ, resize: "vertical", lineHeight: 1.55 }} />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 12 }}>
          <label><span style={etiquette}>{t("creation.taille")}</span>
            <select name="employee_range" defaultValue="" style={{ ...champ, cursor: "pointer" }}>
              <option value="">{t("creation.nonPrecise")}</option>
              {EMPLOYEE_RANGES.map(x => <option key={x} value={x}>{t("creation.employes", { n: x })}</option>)}
            </select>
          </label>
          <div><span style={etiquette}>{t("creation.langues")}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {LANGUES_SAISIE.map(({ code, nom }) => {
                const on = langues.includes(code);
                return (
                  <button key={code} type="button" aria-pressed={on} className={on ? "btn btn-encre btn-sm" : "btn btn-clair btn-sm"}
                    onClick={() => setLangues(l => (l.includes(code) ? l.filter(x => x !== code) : [...l, code]))}>{langue === "fr" ? nom : nomLangue(code, langue)}</button>
                );
              })}
            </div>
            <input type="hidden" name="langues" value={langues.join(",")} />
          </div>
        </div>

        <p style={titreBloc}>{t("creation.blocVous")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label><span style={etiquette}>{t("revend.prenom")}</span><input name="prenom" required autoComplete="given-name" style={champ} /></label>
          <label><span style={etiquette}>{t("revend.nom")}</span><input name="nom" required autoComplete="family-name" style={champ} /></label>
        </div>
        <label><span style={etiquette}>{t("revend.fonction")}</span><input name="fonction" required placeholder={t("revend.fonctionExemple")} autoComplete="organization-title" style={champ} /></label>
        <label><span style={etiquette}>{t("revend.email")}</span>
          <input name="email" type="email" required autoComplete="email" placeholder={t("revend.emailExemple", { domaine: t("revend.domaineExemple") })} style={champ} />
          <span style={aide}>{t("creation.aideCode")}</span>
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
        <button type="submit" className="btn btn-encre btn-bloc" disabled={enCours}>{enCours ? t("revend.envoi") : t("revend.recevoirCode")}</button>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
          {t("creation.rienFacture", { mois: libelle("mensuel"), an: libelle("annuel") })}
        </p>
        {!connecte && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
            {t("revend.dejaCompte")} <Link href={lienConnexion} style={{ color: "var(--brand)", fontWeight: 600 }}>{t("revend.seConnecter")}</Link>
          </p>
        )}
      </form>
    </>
  );
}
