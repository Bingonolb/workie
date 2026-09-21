"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Info, Flame, ArrowRight } from "lucide-react";
import { largeurCouverture } from "@/lib/coverUrl";

/**
 * La pile de cartes de la page d'accueil, qui se manipule vraiment.
 *
 * Une capture d'écran dit ce que le site montre ; une carte qu'on fait glisser
 * dit ce qu'on y fait. C'est le geste qui distingue Workie d'un annuaire, et
 * le décrire en mots coûte un paragraphe que personne ne lit.
 *
 * Dix entreprises réelles, tirées du catalogue. Rien n'est enregistré : la
 * flamme ne pose pas de favori, puisque le visiteur n'a pas encore de compte.
 * C'est une démonstration, et la dernière carte le dit en proposant d'entrer.
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

const SEUIL = 90;

export function ApercuSwipe({ entreprises }: { entreprises: EntrepriseApercu[] }) {
  const [index, setIndex] = useState(0);
  const [glissement, setGlissement] = useState(0);
  const [partie, setPartie] = useState<"gauche" | "droite" | null>(null);
  const depart = useRef<number | null>(null);

  const courante = entreprises[index];
  const finie = index >= entreprises.length;

  /*
   * Les dix photos sont pretes avant le premier geste.
   *
   * Chaque carte demandait sa photo au moment de s'afficher : on voyait donc
   * un aplat gris, puis l'image. On les charge toutes des l'arrivee sur la
   * page, et on les decode : un fichier telecharge mais pas decode laisse
   * encore un a-coup au moment de le peindre. Dix images de 940 pixels, soit
   * a peine le poids d'une seule photo de telephone.
   */
  useEffect(() => {
    for (const e of entreprises) {
      if (!e.cover_url) continue;
      const img = new Image();
      img.src = largeurCouverture(e.cover_url, 940);
      img.decode?.().catch(() => { /* l'image s'affichera quand meme */ });
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
   * lien.
   *
   * La carte capturait le pointeur des qu'on la touchait, bouton compris :
   * tous les evenements suivants lui revenaient, et le clic sur « Voir les
   * offres d'emploi » n'atteignait jamais le lien. Le bouton ne menait nulle
   * part.
   *
   * La capture attend aussi que le doigt ait bouge de quelques pixels : un
   * simple toucher reste un toucher.
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

  // Apres la derniere carte, une seule chose a faire : entrer.
  if (finie) {
    return (
      <div className="landing-apercu">
        <div className="apercu-fin">
          <div className="apercu-fin-halo" aria-hidden="true" />
          <p className="apercu-fin-titre">Votre prochain employeur est quelque part dans les 1000.</p>
          <Link href="/signup" className="btn btn-marque btn-lg btn-bloc" style={{ position: "relative" }}>
            Créer un compte <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <button type="button" onClick={() => setIndex(0)} className="apercu-fin-revoir">
            Revoir
          </button>
        </div>
      </div>
    );
  }

  const decalage = partie === "gauche" ? -460 : partie === "droite" ? 460 : glissement;

  return (
    <div className="landing-apercu">
      <div style={{ position: "relative" }}>
        {/* La carte suivante, a peine visible dessous : elle dit qu'il y en a
            d'autres sans demander qu'on la regarde. */}
        {entreprises[index + 1] && (
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0, transform: "scale(0.96) translateY(10px)",
            background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 22,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)", overflow: "hidden",
          }}>
            {/* La photo de la carte suivante est deja peinte dessous : quand
                la carte du dessus s'en va, il n'y a rien a charger. */}
            <div style={{
              height: 260,
              backgroundColor: "var(--surface3)",
              backgroundImage: entreprises[index + 1].cover_url
                ? `url(${largeurCouverture(entreprises[index + 1].cover_url as string, 940)})`
                : undefined,
              backgroundSize: "cover", backgroundPosition: "center",
            }} />
          </div>
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
              backgroundImage: courante.cover_url ? `url(${largeurCouverture(courante.cover_url, 940)})` : undefined,
              backgroundSize: "cover", backgroundPosition: "center",
            }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.42) 52%, rgba(0,0,0,0.82) 100%)" }} />
            <span style={{
              position: "absolute", top: 14, left: 14,
              fontSize: 11, fontWeight: 700, color: "#fff",
              background: "rgba(59,130,246,0.9)", borderRadius: 50, padding: "4px 11px",
            }}>{courante.sector}</span>
            <div style={{ position: "absolute", left: 20, right: 20, bottom: 16 }}>
              <p style={{ fontSize: 23, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.15 }}>{courante.name}</p>
              {courante.subsector && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", marginTop: 3 }}>{courante.subsector}</p>
              )}
            </div>
          </div>

          <div style={{ padding: "16px 18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[courante.lieu, courante.langues].filter(Boolean).map(t => (
                <span key={t} style={{
                  display: "inline-flex", alignItems: "center",
                  background: "var(--surface2)", border: "1px solid var(--border2)",
                  borderRadius: 50, padding: "5px 11px", fontSize: 12.5, fontWeight: 600, color: "var(--text-sub)",
                }}>{t}</span>
              ))}
            </div>

            {courante.description && (
              <p style={{
                fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>{courante.description}</p>
            )}

            <Link href={`/company/${courante.id}`} className="btn btn-marque btn-bloc" style={{ textDecoration: "none" }}>
              Voir les offres d&apos;emploi <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 18 }}>
        <BoutonRond onClick={() => avancer("gauche")} libelle="Passer cette entreprise" couleur="#ef4444" taille={56}>
          <X size={24} strokeWidth={2} aria-hidden="true" />
        </BoutonRond>
        <Link
          href={`/company/${courante.id}`}
          aria-label={`En savoir plus sur ${courante.name}`}
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "var(--surface)", border: "2px solid var(--border2)", color: "var(--text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 18px rgba(0,0,0,0.08)", textDecoration: "none",
          }}
        >
          <Info size={17} strokeWidth={2} aria-hidden="true" />
        </Link>
        <BoutonRond onClick={() => avancer("droite")} libelle="Garder cette entreprise" couleur="#f97316" taille={56}>
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
