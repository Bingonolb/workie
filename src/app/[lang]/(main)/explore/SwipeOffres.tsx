"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Info, MapPin, X } from "lucide-react";
import type { OffreAffichee } from "@/lib/offresTypes";
import { PileSwipe, TamponSwipe, type Direction } from "@/components/swipe/PileSwipe";
import { BoutonRond, Touche } from "./SwipeView";
import { JobOfferCard } from "@/components/JobOfferCard";
import { prechargerCouvertures } from "@/components/CoverImage";
import { largeurCouverture, styleCadrage } from "@/lib/coverUrl";
import { libelleTaux } from "@/lib/offres";
import { lieuAffiche, SECTOR_COLORS } from "@/lib/types";
import { poserSignet, useOffresEnregistrees } from "@/lib/offresEnregistrees";

/**
 * Le swipe des offres d'emploi : à droite on garde l'offre (signet), à
 * gauche on passe. Le geste est celui des entreprises (PileSwipe) ; ce qui
 * change, c'est la carte et ce que « garder » veut dire : un signet privé,
 * pas une flamme.
 *
 * Le paquet suit les filtres d'Explorer, page après page. Une offre déjà
 * vue dans la session ou déjà gardée n'est pas reproposée.
 */

type Filtres = { sector: string; canton: string; langue: string; contrat: string };
const CODE_LANGUE: Record<string, string> = { fr: "FR", de: "DE", en: "EN", it: "IT" };
const BRAND = "124,58,237";

/** Offres vues dans la session, par filtres : un retour au swipe ne les reprend pas. */
function cleVues(f: Filtres) { return `workie_swipe_offres_vues_${f.sector}_${f.canton}_${f.langue}_${f.contrat}`; }
function lireVues(f: Filtres): Set<string> {
  try { return new Set(JSON.parse(sessionStorage.getItem(cleVues(f)) ?? "[]") as string[]); } catch { return new Set(); }
}
function ecrireVues(f: Filtres, vues: Set<string>) {
  try { sessionStorage.setItem(cleVues(f), JSON.stringify([...vues].slice(-2000))); } catch { /* sans mémoire, on reverra peut-être une offre */ }
}

export function SwipeOffres({ filtres }: { filtres: Filtres }) {
  const router = useRouter();
  const { estEnregistree, ids: gardees } = useOffresEnregistrees();
  const [paquet, setPaquet] = useState<OffreAffichee[]>([]);
  const [index, setIndex] = useState(0);
  const [fin, setFin] = useState(false);
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);
  const [apercu, setApercu] = useState<OffreAffichee | null>(null);
  const page = useRef(0);
  const enCours = useRef(false);
  const vues = useRef<Set<string>>(new Set());
  const gardeesRef = useRef(gardees);
  useEffect(() => { gardeesRef.current = gardees; });

  // Paquet suivant, quand il en reste moins de dix à voir.
  const charger = useCallback(async () => {
    if (enCours.current || fin) return;
    enCours.current = true;
    try {
      const p = new URLSearchParams();
      if (filtres.sector) p.set("sector", filtres.sector);
      if (filtres.canton) p.set("canton", filtres.canton);
      if (filtres.langue) p.set("langue", filtres.langue);
      if (filtres.contrat) p.set("contrat", filtres.contrat);
      if (page.current) p.set("page", String(page.current));
      const r = await fetch(`/api/offres?${p}`);
      if (!r.ok) return;
      const d = await r.json() as { offres: OffreAffichee[]; total: number; parPage: number };
      page.current += 1;
      // Ni les offres déjà vues dans la session, ni celles déjà gardées.
      const nouvelles = d.offres.filter(o => !vues.current.has(o.id) && !gardeesRef.current.has(o.id));
      setPaquet(prec => [...prec, ...nouvelles.filter(o => !prec.some(x => x.id === o.id))]);
      if (d.offres.length < (d.parPage ?? 24) || page.current * (d.parPage ?? 24) >= d.total) setFin(true);
    } catch { /* réseau : on retentera au prochain swipe */ }
    finally { enCours.current = false; }
  }, [filtres, fin]);

  // Au montage : les offres déjà vues dans la session, puis le premier paquet.
  useEffect(() => {
    vues.current = lireVues(filtres);
    void charger();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const courant = paquet[index];
  const suivant = paquet[index + 1];

  useEffect(() => {
    if (!fin && paquet.length - index < 10) void charger();
    prechargerCouvertures(paquet.slice(index, index + 8).map(o => o.entreprise.cover_url), 940);
  }, [index, paquet, fin, charger]);

  const montrer = (msg: string, color: string) => { setToast({ msg, color }); setTimeout(() => setToast(null), 1800); };

  const decider = useCallback((o: OffreAffichee, dir: Direction) => {
    vues.current.add(o.id);
    ecrireVues(filtres, vues.current);
    if (dir === "right") {
      // Garder : intention explicite, jamais une bascule (déjà gardée → reste gardée).
      if (!estEnregistree(o.id)) void poserSignet(o.id, true);
      montrer("Enregistrée", `rgb(${BRAND})`);
    } else montrer("Passée", "#ef4444");
  }, [filtres, estEnregistree]);

  const avancer = useCallback(() => setIndex(i => i + 1), []);

  if (!courant) {
    if (!fin) return <p style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>Chargement des offres…</p>;
    return (
      <div style={{ textAlign: "center", padding: "72px 24px", color: "var(--text-muted)" }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Vous avez vu toutes les offres</p>
        <p style={{ fontSize: 14, marginBottom: 22 }}>Pour ces filtres. Élargissez-les, ou retrouvez celles que vous avez gardées.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-clair" onClick={() => { vues.current = new Set(); ecrireVues(filtres, vues.current); page.current = 0; setPaquet([]); setIndex(0); setFin(false); setTimeout(() => void charger(), 0); }}>Recommencer</button>
          <button type="button" className="btn btn-encre" onClick={() => router.push("/favorites?vue=offres")}>Mes offres gardées</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PileSwipe<OffreAffichee>
        courant={courant}
        suivant={suivant}
        cle={o => o.id}
        onDecision={decider}
        onAvance={avancer}
        onTouche={o => setApercu(o)}
        toast={toast}
        rendu={(o, r) => <CarteSwipeOffre o={o} direction={r.direction} intensite={r.intensite} gardee={estEnregistree(o.id)} />}
        boutons={(agir, occupe) => (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <BoutonRond taille={64} couleur="239,68,68" onClick={() => agir("left")} disabled={occupe} label="Passer cette offre">
                <X size={26} strokeWidth={2.5} aria-hidden="true" />
              </BoutonRond>
              <BoutonRond taille={48} couleur="99,102,241" teinte="#818cf8" onClick={() => setApercu(courant)} disabled={occupe} label="Voir l'offre">
                <Info size={18} strokeWidth={2} aria-hidden="true" />
              </BoutonRond>
              <BoutonRond taille={64} couleur={BRAND} onClick={() => agir("right")} disabled={occupe} label="Enregistrer cette offre" plein={estEnregistree(courant.id)}>
                <Bookmark size={26} fill={estEnregistree(courant.id) ? "#fff" : "none"} strokeWidth={2} aria-hidden="true" />
              </BoutonRond>
            </div>
            <div className="swipe-legend" style={{ flexDirection: "column", alignItems: "center", gap: 6 }}>
              <p style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                Glissez la carte à droite pour garder l&apos;offre, à gauche pour passer
                {" "}&nbsp;·{" "}<Touche>←</Touche>{" "}<Touche>→</Touche>
              </p>
            </div>
          </>
        )}
      />
      {/* L'aperçu de l'offre, le même que partout ; « En savoir plus » y mène chez l'employeur. */}
      {apercu && (
        <JobOfferCard
          job={{ ...apercu, created_at: apercu.created_at ?? "" }}
          companyName={apercu.entreprise.name}
          companyId={apercu.entreprise.id}
          declencheur={() => null}
          ouvert
          onFermer={() => setApercu(null)}
        />
      )}
    </>
  );
}

/** La carte d'une offre dans le swipe : l'entreprise en image, le poste en titre, les faits dessous. */
function CarteSwipeOffre({ o, direction, intensite, gardee }: { o: OffreAffichee; direction: Direction | null; intensite: number; gardee: boolean }) {
  const e = o.entreprise;
  const couleur = SECTOR_COLORS[e.sector ?? ""] ?? "#8b5cf6";
  const [chargee, setChargee] = useState(false);
  const taux = libelleTaux(o.taux_min, o.taux_max);
  const lieu = o.location || (e.city ? lieuAffiche(e.city, e.canton) : null);
  const faits = [o.contract_type, taux, o.langue ? CODE_LANGUE[o.langue] : null].filter(Boolean) as string[];
  return (
    <div style={{ width: "100%", height: "100%", borderRadius: 22, overflow: "hidden", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", userSelect: "none", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden", background: e.cover_color || (e.cover_url ? "var(--surface2)" : `linear-gradient(135deg, ${couleur} 0%, #0f172a 100%)`) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {e.cover_url && <img src={largeurCouverture(e.cover_url, 940)} alt="" loading="eager" decoding="async"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...styleCadrage(e.cover_url), opacity: chargee ? 1 : 0, transition: "opacity 0.25s ease-out" }}
          onLoad={() => setChargee(true)} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.85))" }} />
        <TamponSwipe direction={direction} intensite={intensite} droite={{ texte: "🔖 GARDER", rgb: BRAND }} gauche={{ texte: "✕ PASSER", rgb: "239,68,68" }} />
        {/* L'entreprise, en haut : c'est elle qu'on choisit autant que le poste. */}
        <div style={{ position: "absolute", top: 16, left: 16, right: 64, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: "rgba(10,10,14,0.55)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 50, padding: "5px 12px", fontSize: 13.5, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {e.name}
          </span>
        </div>
        {gardee && (
          <div style={{ position: "absolute", top: 16, right: 16, background: `rgba(${BRAND},0.92)`, borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bookmark size={16} fill="#fff" color="#fff" aria-hidden="true" />
          </div>
        )}
        <div style={{ position: "absolute", bottom: 16, left: 20, right: 20 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>{e.subsector || e.sector}</p>
          <p style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.15, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{o.title}</p>
        </div>
      </div>
      <div style={{ padding: "18px 18px 22px", display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {lieu && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginRight: 4 }}><MapPin size={14} aria-hidden="true" />{lieu}</span>}
          {faits.map(f => <span key={f} style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, padding: "6px 8px", borderRadius: 7, background: "var(--surface2)", color: "var(--text)" }}>{f}</span>)}
        </div>
        {o.apercu && <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{o.apercu}</p>}
      </div>
    </div>
  );
}

