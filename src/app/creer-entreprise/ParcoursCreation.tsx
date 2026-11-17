"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { demarrerCreation } from "@/lib/actions/creationEntreprise";
import { verifierCodeRevendication, lancerAbonnement, type EtatRevendication } from "@/lib/actions/revendication";
import { ABONNEMENT, type Formule } from "@/lib/tarifs";
import { EMPLOYEE_RANGES, LANGUES_SAISIE } from "@/lib/types";

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

const ETAPES = ["L'entreprise et vous", "Vérification", "Abonnement"];

function Progression({ actuelle }: { actuelle: number }) {
  return (
    <ol aria-label="Étapes" style={{ display: "flex", gap: 8, listStyle: "none", padding: 0, margin: "16px 0 0" }}>
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
      {erreur}{compteExistant && <> <Link href={lienConnexion} style={{ color: "var(--brand)", fontWeight: 700 }}>Se connecter</Link></>}
    </p>
  );

  if (etat.etape === "refusee") {
    return (
      <div style={carte}>
        <h1 style={{ fontSize: 21, fontWeight: 800 }}>Demande non retenue</h1>
        <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Nous n&apos;avons pas pu valider cette fiche. Pour en savoir plus, écrivez à contact@workie.ch.
        </p>
        <button type="button" className="btn btn-encre" onClick={() => setEtat({ etape: "formulaire", domaine: null })}>Faire une nouvelle demande</button>
      </div>
    );
  }

  if (etat.etape === "code") {
    return (
      <>
        <Progression actuelle={1} />
        <form onSubmit={verifier} style={carte}>
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em" }}>Vérifiez votre adresse</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Nous avons envoyé un code à 6 chiffres à <strong>{etat.email}</strong>. Il est valable 30 minutes.
          </p>
          <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="123456" aria-label="Code à 6 chiffres"
            style={{ ...champ, fontSize: 24, letterSpacing: "0.3em", textAlign: "center", fontVariantNumeric: "tabular-nums" }} />
          {alerte}
          <button type="submit" className="btn btn-encre btn-bloc" disabled={code.length !== 6 || enCours}>{enCours ? "Vérification…" : "Vérifier"}</button>
          <button type="button" onClick={() => { setErreur(null); setCode(""); setEtat({ etape: "formulaire", domaine: null }); }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
            Pas reçu ou mauvaise adresse ? Refaire la demande
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
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em" }}>Demande reçue</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Votre adresse est confirmée. Notre équipe relit maintenant la fiche{etatInitial.nom ? <> de <strong>{etatInitial.nom}</strong></> : null}.
            Vous recevrez un e-mail à <strong>{etat.email}</strong> dès qu&apos;elle est acceptée : il ne restera alors qu&apos;à activer l&apos;abonnement, et la fiche sera publiée aussitôt.
          </p>
          <Link href="/" className="btn btn-clair btn-bloc">Retour à l&apos;accueil</Link>
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
            <Check size={16} aria-hidden="true" /> Fiche acceptée
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em" }}>Choisissez votre formule</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55 }}>
            La fiche{etatInitial.nom ? <> de <strong>{etatInitial.nom}</strong></> : null} est publiée sur Workie dès le paiement, et votre espace entreprise s&apos;ouvre.
          </p>
          <div role="radiogroup" aria-label="Formule" style={{ display: "grid", gap: 10 }}>
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
                    <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{f === "annuel" ? "Annuel" : "Mensuel"}</span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{ABONNEMENT[f].libelle}</span>
                  </span>
                  {f === "annuel" && <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.12)", padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>2 mois offerts</span>}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>Paiement sécurisé par Stripe. Résiliable à tout moment depuis votre espace entreprise.</p>
          {alerte}
          <button type="button" onClick={payer} className="btn btn-marque btn-bloc" disabled={enCours}>
            {enCours ? "Ouverture du paiement…" : "Activer l'abonnement et publier la fiche"}
          </button>
        </div>
      </>
    );
  }

  // Formulaire
  return (
    <>
      <h1 style={{ fontSize: 26, fontWeight: 850, letterSpacing: "-0.03em", marginTop: 6 }}>Créer la fiche de votre entreprise</h1>
      <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6, marginTop: 6 }}>
        Votre entreprise n&apos;est pas encore sur Workie ? Présentez-la : notre équipe relit la fiche, puis elle est publiée dès l&apos;abonnement activé.
      </p>
      <Progression actuelle={0} />

      {doublons && (
        <div role="alert" style={{ ...carte, borderColor: "#f59e0b" }}>
          <p style={{ fontWeight: 800, fontSize: 15.5 }}>Cette entreprise est peut-être déjà sur Workie</p>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55 }}>Si c&apos;est la vôtre, gérez la fiche existante plutôt que d&apos;en créer une seconde.</p>
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
            Non, c&apos;est une autre entreprise : continuer
          </button>
        </div>
      )}

      {/* onSubmit et non action : React vide un formulaire soumis par action,
          et une erreur ferait perdre toute la saisie. */}
      <form ref={formulaire} onSubmit={e => { e.preventDefault(); envoyer(new FormData(e.currentTarget)); }} style={carte}>
        <p style={{ ...titreBloc, borderTop: "none", paddingTop: 0 }}>L&apos;entreprise</p>
        <label><span style={etiquette}>Nom de l&apos;entreprise</span>
          <input name="name" required maxLength={120} placeholder="Tel que les gens la nomment" style={champ} />
          <span style={aide}>Le nom de la marque, pas forcément la raison sociale : « Boulangerie Martin » plutôt que « Martin Frères Sàrl ».</span>
        </label>
        <label><span style={etiquette}>Secteur</span>
          <select name="sector" required defaultValue="" style={{ ...champ, cursor: "pointer" }}>
            <option value="" disabled>Choisir un secteur</option>
            {secteurs.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 12 }}>
          <label><span style={etiquette}>Ville</span><input name="city" required maxLength={80} placeholder="Lausanne" autoComplete="address-level2" style={champ} /></label>
          <label><span style={etiquette}>Canton</span>
            <select name="canton" required defaultValue="" style={{ ...champ, cursor: "pointer" }}>
              <option value="" disabled>Choisir</option>
              {cantons.map(c => <option key={c.code} value={c.code}>{c.nom}</option>)}
            </select>
          </label>
        </div>
        <label><span style={etiquette}>Site de l&apos;entreprise</span>
          <input name="website_url" required inputMode="url" placeholder="www.entreprise.ch/emplois" style={champ} />
          <span style={aide}>Idéalement la page emplois de votre site : c&apos;est là que les candidats arriveront.</span>
        </label>
        <label><span style={etiquette}>Description</span>
          <textarea name="description" required minLength={80} maxLength={3000} rows={5} placeholder="Ce que fait l'entreprise, où, avec qui. Quelques phrases simples et factuelles." style={{ ...champ, resize: "vertical", lineHeight: 1.55 }} />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 12 }}>
          <label><span style={etiquette}>Taille (facultatif)</span>
            <select name="employee_range" defaultValue="" style={{ ...champ, cursor: "pointer" }}>
              <option value="">Non précisé</option>
              {EMPLOYEE_RANGES.map(t => <option key={t} value={t}>{t} employés</option>)}
            </select>
          </label>
          <div><span style={etiquette}>Langues de travail (facultatif)</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {LANGUES_SAISIE.map(({ code, nom }) => {
                const on = langues.includes(code);
                return (
                  <button key={code} type="button" aria-pressed={on} className={on ? "btn btn-encre btn-sm" : "btn btn-clair btn-sm"}
                    onClick={() => setLangues(l => (l.includes(code) ? l.filter(x => x !== code) : [...l, code]))}>{nom}</button>
                );
              })}
            </div>
            <input type="hidden" name="langues" value={langues.join(",")} />
          </div>
        </div>

        <p style={titreBloc}>Vous</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label><span style={etiquette}>Prénom</span><input name="prenom" required autoComplete="given-name" style={champ} /></label>
          <label><span style={etiquette}>Nom</span><input name="nom" required autoComplete="family-name" style={champ} /></label>
        </div>
        <label><span style={etiquette}>Fonction</span><input name="fonction" required placeholder="Responsable RH" autoComplete="organization-title" style={champ} /></label>
        <label><span style={etiquette}>E-mail professionnel</span>
          <input name="email" type="email" required autoComplete="email" placeholder="prenom.nom@entreprise.ch" style={champ} />
          <span style={aide}>Nous y envoyons un code à 6 chiffres.</span>
        </label>
        {!connecte && (
          <label><span style={etiquette}>Mot de passe de votre compte Workie Business</span>
            <input name="mot_de_passe" type="password" required minLength={8} autoComplete="new-password" style={champ} />
            <span style={aide}>8 caractères au minimum. Vous l&apos;utiliserez pour revenir dans votre espace entreprise.</span>
          </label>
        )}
        {alerte}
        <button type="submit" className="btn btn-encre btn-bloc" disabled={enCours}>{enCours ? "Envoi…" : "Recevoir mon code"}</button>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
          Rien n&apos;est publié ni facturé à cette étape. {ABONNEMENT.mensuel.libelle} ou {ABONNEMENT.annuel.libelle}, une fois la fiche acceptée.
        </p>
        {!connecte && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
            Vous avez déjà un compte Workie ? <Link href={lienConnexion} style={{ color: "var(--brand)", fontWeight: 600 }}>Se connecter</Link>
          </p>
        )}
      </form>
    </>
  );
}
