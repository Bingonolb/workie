"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ShieldCheck, BarChart3, PenLine, BadgeCheck } from "lucide-react";
import {
  demarrerRevendication, verifierCodeRevendication, lancerAbonnement, type EtatRevendication,
} from "@/lib/actions/revendication";
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

const ETAPES = ["Vos informations", "Vérification", "Abonnement"];

function Progression({ actuelle }: { actuelle: number }) {
  return (
    <ol aria-label="Étapes" style={{ display: "flex", gap: 8, listStyle: "none", padding: 0, margin: "20px 0 0" }}>
      {ETAPES.map((e, i) => (
        <li key={e} style={{ flex: 1 }}>
          <div style={{ height: 4, borderRadius: 2, background: i <= actuelle ? "var(--brand)" : "var(--border)" }} />
          <p style={{ fontSize: 11.5, marginTop: 6, color: i === actuelle ? "var(--text)" : "var(--text-muted)", fontWeight: i === actuelle ? 700 : 500 }}>{e}</p>
        </li>
      ))}
    </ol>
  );
}

export function ParcoursRevendication({ companyId, slug, domaine, etatInitial }: { companyId: string; slug: string; domaine: string | null; etatInitial: EtatRevendication }) {
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
      else if (r.etat) setEtat(r.etat);
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

  const alerte = erreur && <p role="alert" style={{ fontSize: 13.5, color: "#ef4444" }}>{erreur}</p>;

  if (etat.etape === "deja_geree") {
    return (
      <div style={carte}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Cette fiche est déjà gérée</h1>
        <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Une personne de l&apos;entreprise gère déjà cette fiche. Pour obtenir un accès, adressez-vous à elle ou écrivez à contact@workie.ch.
        </p>
        <Link href={`/entreprise/${slug}`} className="btn btn-clair">Retour à la fiche</Link>
      </div>
    );
  }

  if (etat.etape === "refusee") {
    return (
      <div style={carte}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Demande non retenue</h1>
        <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Nous n&apos;avons pas pu confirmer votre lien avec l&apos;entreprise. Recommencez avec une adresse e-mail de l&apos;entreprise : la vérification est alors immédiate.
        </p>
        <button type="button" className="btn btn-encre" onClick={() => setEtat({ etape: "formulaire", domaine })}>
          Recommencer la demande
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
            <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>Vous représentez cette entreprise ?</h1>
            <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Gérez sa fiche, suivez sa fréquentation et affichez le badge vérifié.
            </p>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {[
              { I: PenLine, t: "Description, bannière, logo et lien carrière à jour" },
              { I: BarChart3, t: "Visites, favoris et clics vers vos offres, jour par jour" },
              { I: BadgeCheck, t: "Badge « Entreprise vérifiée » sur la fiche" },
            ].map(({ I, t }) => (
              <li key={t} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14 }}>
                <I size={17} color="var(--brand)" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
          <form action={envoyer} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label><span style={etiquette}>Prénom</span><input name="prenom" required autoComplete="given-name" style={champ} /></label>
              <label><span style={etiquette}>Nom</span><input name="nom" required autoComplete="family-name" style={champ} /></label>
            </div>
            <label><span style={etiquette}>Fonction</span><input name="fonction" required placeholder="Responsable RH" autoComplete="organization-title" style={champ} /></label>
            <label>
              <span style={etiquette}>E-mail professionnel</span>
              <input name="email" type="email" required autoComplete="email"
                placeholder={etat.domaine ? `prenom.nom@${etat.domaine}` : "prenom.nom@entreprise.ch"} style={champ} />
              <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 6, display: "block", lineHeight: 1.5 }}>
                {etat.domaine
                  ? <>Avec une adresse en <strong>@{etat.domaine}</strong>, la vérification est immédiate. Sinon, notre équipe valide la demande à la main.</>
                  : "Notre équipe vérifie la demande à la main."}
              </span>
            </label>
            {alerte}
            <button type="submit" className="btn btn-encre btn-bloc" disabled={enCours}>
              {enCours ? "Envoi…" : "Continuer"}
            </button>
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
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em" }}>Vérifiez votre adresse</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Nous avons envoyé un code à 6 chiffres à <strong>{etat.email}</strong>. Il est valable 30 minutes.
          </p>
          <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="123456" aria-label="Code à 6 chiffres"
            style={{ ...champ, fontSize: 24, letterSpacing: "0.3em", textAlign: "center", fontVariantNumeric: "tabular-nums" }} />
          {alerte}
          <button type="submit" className="btn btn-encre btn-bloc" disabled={code.length !== 6 || enCours}>
            {enCours ? "Vérification…" : "Vérifier"}
          </button>
          <button type="button" onClick={() => { setErreur(null); setCode(""); setEtat({ etape: "formulaire", domaine }); }}
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
            Votre adresse n&apos;appartient pas au domaine officiel de l&apos;entreprise : notre équipe vérifie la demande à la main.
            Vous recevrez un e-mail à <strong>{etat.email}</strong> dès qu&apos;elle est acceptée, généralement sous 1 jour ouvré.
          </p>
          <Link href={`/entreprise/${slug}`} className="btn btn-clair btn-bloc">Retour à la fiche</Link>
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
          <Check size={16} aria-hidden="true" /> Vérification réussie
        </div>
        <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em" }}>Choisissez votre formule</h1>
        <div role="radiogroup" aria-label="Formule" style={{ display: "grid", gap: 10 }}>
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
                  <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{f === "annuel" ? "Annuel" : "Mensuel"}</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{ABONNEMENT[f].libelle}</span>
                </span>
                {f === "annuel" && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.12)", padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    2 mois offerts
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Paiement sécurisé par Stripe. Résiliable à tout moment depuis votre espace entreprise.
        </p>
        {alerte}
        <button type="button" onClick={payer} className="btn btn-marque btn-bloc" disabled={enCours}>
          {enCours ? "Ouverture du paiement…" : "Activer l'abonnement"}
        </button>
      </div>
    </>
  );
}
