"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Info, Flame, ArrowRight, ExternalLink } from "lucide-react";
import { largeurCouverture } from "@/lib/coverUrl";

/**
 * La pile de cartes de la page d'accueil, qui se manipule vraiment.
 *
 * Une capture d'écran dit ce que le site montre ; une carte qu'on fait glisser
 * dit ce qu'on y fait. C'est le geste qui distingue Workie d'un annuaire, et
 * le décrire en mots coûte un paragraphe que personne ne lit.
 *
 * Rien n'est enregistré : la flamme ne pose pas de favori, puisque le visiteur
 * n'a pas encore de compte. C'est une démonstration, et la dernière carte le
 * dit en proposant d'entrer.
 *
 * La même pile sert aux annonceurs : des annonces d'exemple glissées entre
 * les fiches montrent, mieux qu'une phrase, qu'une annonce a ici la forme du
 * contenu qui l'entoure.
 *
 * Le geste est volontairement plus simple que celui de l'écran de swipe : pas
 * de rotation, pas de superposition de couleur, pas de reprise de l'élan. Une
 * page d'accueil n'a pas à réimplémenter une fonctionnalité, elle doit la
 * laisser reconnaître.
 */

export type EntrepriseApercu = {
  id: string;
  name: string;
  sector: string;
  subsector: string | null;
  lieu: string;
  langues: string;
  description: string | null;
  cover_url: string | null;
};

/**
 * Une annonce d'exemple.
 *
 * Aucun annonceur n'est nommé : une marque inventée finit toujours par
 * ressembler à une vraie, et une vraie ne nous a rien demandé.
 */
export type AnnonceApercu = {
  type: "annonce";
  id: string;
  titre: string;
  texte: string;
  cta: string;
  image: string;
  ciblage: string;
};

export type CarteApercu = ({ type?: "entreprise" } & EntrepriseApercu) | AnnonceApercu;

type Fin = { titre: string; libelle: string; href: string };

const FIN_DEFAUT: Fin = {
  titre: "Votre prochain employeur est quelque part dans les 1000.",
  libelle: "Créer un compte",
  href: "/signup",
};

const imageDe = (c: CarteApercu): string | null =>
  c.type === "annonce" ? c.image : c.cover_url ? largeurCouverture(c.cover_url, 940) : null;

const SEUIL = 90;

export function ApercuSwipe({ entreprises, fin = FIN_DEFAUT }: { entreprises: CarteApercu[]; fin?: Fin }) {
  const [index, setIndex] = useState(0);
  const [glissement, setGlissement] = useState(0);
  const [partie, setPartie] = useState<"gauche" | "droite" | null>(null);
  const depart = useRef<number | null>(null);

  const courante = entreprises[index];
  const finie = index >= entreprises.length;

  /*
   * Toutes les photos sont prêtes avant le premier geste.
   *
   * Chaque carte demandait sa photo au moment de s'afficher : on voyait donc
   * un aplat gris, puis l'image. On les charge toutes dès l'arrivée sur la
   * page, et on les décode : un fichier téléchargé mais pas décodé laisse
   * encore un à-coup au moment de le peindre.
   */
  useEffect(() => {
    for (const e of entreprises) {
      const src = imageDe(e);
      if (!src) continue;
      const img = new Image();
      img.src = src;
      img.decode?.().catch(() => { /* l'image s'affichera quand même */ });
    }
  }, [entreprises]);

  const avancer = (sens: "gauche" | "droite") => {
    if (partie) return;
    setPartie(sens);
    setGlissement(0);
    window.setTimeout(() => {
      setPartie(null);
      setIndex(i => i + 1);
    }, 220);
  };

  /*
   * Le glissement ne commence que sur la photo et le texte, jamais sur un
   * lien : la capture du pointeur avalait le clic sur « Voir les offres
   * d'emploi ». Elle attend aussi que le doigt ait bougé de quelques pixels :
   * un simple toucher reste un toucher.
   */
  const capture = useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    if (partie) return;
    if ((e.target as HTMLElement).closest("a, button")) return;
    depart.current = e.clientX;
    capture.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (depart.current === null) return;
    const d = e.clientX - depart.current;
    if (!capture.current && Math.abs(d) > 6) {
      capture.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (capture.current) setGlissement(d);
  };
  const onPointerUp = () => {
    if (depart.current === null) return;
    const d = glissement;
    depart.current = null;
    setGlissement(0);
    if (d <= -SEUIL) avancer("gauche");
    else if (d >= SEUIL) avancer("droite");
  };

  // Après la dernière carte, une seule chose à faire : entrer.
  if (finie) {
    return (
      <div className="landing-apercu">
        <div className="apercu-fin">
          <p className="apercu-fin-titre">{fin.titre}</p>
          <Link href={fin.href} className="btn btn-marque btn-lg btn-bloc" style={{ position: "relative" }}>
            {fin.libelle} <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <button type="button" onClick={() => setIndex(0)} className="apercu-fin-revoir">
            Revoir
          </button>
        </div>
      </div>
    );
  }

  const decalage = partie === "gauche" ? -460 : partie === "droite" ? 460 : glissement;
  const annonce = courante.type === "annonce" ? courante : null;
  const entreprise = courante.type === "annonce" ? null : courante;
  const image = imageDe(courante);
  const nom = annonce ? annonce.titre : entreprise!.name;

  return (
    <div className="landing-apercu">
      <div style={{ position: "relative" }}>
        {/* Le bord de la carte suivante, sans sa photo : on voyait l'image
            d'après par-dessous pendant le glissement. */}
        {entreprises[index + 1] && (
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0, transform: "scale(0.96) translateY(10px)",
            background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 22,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }} />
        )}

        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: "relative",
            background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 22,
            overflow: "hidden", boxShadow: "0 18px 50px rgba(0,0,0,0.13)",
            display: "flex", flexDirection: "column",
            transform: `translateX(${decalage}px)`,
            opacity: partie ? 0 : 1,
            transition: partie || depart.current === null
              ? "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease"
              : "none",
            touchAction: "pan-y",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          <div style={{ position: "relative", height: 260 }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundColor: "var(--surface3)",
              backgroundImage: image ? `url(${image})` : undefined,
              backgroundSize: "cover", backgroundPosition: "center",
            }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.42) 52%, rgba(0,0,0,0.82) 100%)" }} />
            <span style={{
              position: "absolute", top: 14, left: 14,
              fontSize: 11, fontWeight: 700, color: "#fff",
              background: annonce ? "var(--brand)" : "rgba(59,130,246,0.9)", borderRadius: 50, padding: "4px 11px",
            }}>{annonce ? "Sponsorisé" : entreprise!.sector}</span>
            <div style={{ position: "absolute", left: 20, right: 20, bottom: 16 }}>
              <p style={{ fontSize: 23, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.15 }}>{nom}</p>
              {entreprise?.subsector && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", marginTop: 3 }}>{entreprise.subsector}</p>
              )}
            </div>
          </div>

          <div style={{ padding: "16px 18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(annonce ? [annonce.ciblage] : [entreprise!.lieu, entreprise!.langues]).filter(Boolean).map(t => (
                <span key={t} style={{
                  display: "inline-flex", alignItems: "center",
                  background: "var(--surface2)", border: "1px solid var(--border2)",
                  borderRadius: 50, padding: "5px 11px", fontSize: 12.5, fontWeight: 600, color: "var(--text-sub)",
                }}>{t}</span>
              ))}
            </div>

            {(annonce ? annonce.texte : entreprise!.description) && (
              <p style={{
                fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>{annonce ? annonce.texte : entreprise!.description}</p>
            )}

            {/* L'annonce d'exemple ne mène nulle part : son bouton a la forme
                du vrai, sans lien vers un annonceur qui n'existe pas. */}
            {annonce ? (
              <span className="btn btn-marque btn-bloc" aria-hidden="true">
                {annonce.cta} <ExternalLink size={14} aria-hidden="true" />
              </span>
            ) : (
              <Link href={`/company/${entreprise!.id}`} className="btn btn-marque btn-bloc" style={{ textDecoration: "none" }}>
                Voir les offres d&apos;emploi <ArrowRight size={15} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 18 }}>
        <BoutonRond onClick={() => avancer("gauche")} libelle="Passer" couleur="#ef4444" taille={56}>
          <X size={24} strokeWidth={2} aria-hidden="true" />
        </BoutonRond>
        {entreprise ? (
          <Link
            href={`/company/${entreprise.id}`}
            aria-label={`En savoir plus sur ${entreprise.name}`}
            style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "var(--surface)", border: "2px solid var(--border2)", color: "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 18px rgba(0,0,0,0.08)", textDecoration: "none",
            }}
          >
            <Info size={17} strokeWidth={2} aria-hidden="true" />
          </Link>
        ) : (
          <span aria-hidden="true" style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "var(--surface)", border: "2px solid var(--border2)", color: "var(--text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
          }}>
            <Info size={17} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
        <BoutonRond onClick={() => avancer("droite")} libelle="Garder" couleur="#f97316" taille={56}>
          <Flame size={24} strokeWidth={2} aria-hidden="true" />
        </BoutonRond>
      </div>

      <p style={{ fontSize: 12.5, color: "var(--text-muted)", textAlign: "center", marginTop: 12 }}>
        Glissez, ou touchez un bouton.
      </p>
    </div>
  );
}

function BoutonRond({ onClick, libelle, couleur, taille, children }: {
  onClick: () => void; libelle: string; couleur: string; taille: number; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={libelle}
      style={{
        width: taille, height: taille, borderRadius: "50%",
        background: "var(--surface)", border: `2px solid ${couleur}66`, color: couleur,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 18px rgba(0,0,0,0.08)", cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
