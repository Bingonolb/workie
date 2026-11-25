"use client";

import { useT, useLangue } from "@/i18n/FournisseurLangue";
import { nomSecteur } from "@/i18n/secteurs";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Users, X, Flame, Info, ExternalLink } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { fetchSwipePage as swipeServeur } from "@/lib/actions/companies";
import { langueDocument } from "@/i18n/langueDocument";

// Les fiches arrivent dans la langue de la page (description, sous-secteur).
const fetchSwipePage: typeof swipeServeur = (f, o) => swipeServeur(f, o, langueDocument());
import type { Company } from "@/lib/types";
import { SECTOR_COLORS, lieuAffiche } from "@/lib/types";
import { prechargerCouvertures } from "@/components/CoverImage";
import { largeurCouverture, styleCadrage } from "@/lib/coverUrl";
import { ajouterFavoriInvite, idsFavorisInvite } from "@/lib/favorisInvite";
import { trackAdImpression, trackAdClick } from "@/lib/actions/ads";
import type { PublicAdCampaign } from "@/lib/actions/ads";
import { rafraichirFiches } from "@/lib/rafraichirFiches";
import { PileSwipe, TamponSwipe, type Direction } from "@/components/swipe/PileSwipe";
import { urlFiche } from "@/lib/urlFiche";

const PREFETCH_AHEAD = 25;
const AD_SESSION_KEY = "workie_swipe_ad_shown";
const STATE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type AdItem = { __ad: true; campaign: PublicAdCampaign };
type SwipeItem = Company | AdItem;
function isAd(item: SwipeItem | undefined): item is AdItem {
  return !!item && "__ad" in item;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SwipeView({
  companies: initialCompanies,
  initialFavIds,
  initialFlameIds,
  isLoggedIn,
  isAdmin = false,
  filters,
  swipeAds = [],
}: {
  companies: Company[];
  initialFavIds: string[];
  initialFlameIds: string[];
  isLoggedIn: boolean;
  isAdmin?: boolean;
  filters?: { sector?: string; canton?: string; search?: string };
  swipeAds?: PublicAdCampaign[];
}) {
  const t = useT();
  const router = useRouter();

  const stateKey = `workie_swipe_${filters?.sector ?? ""}_${filters?.canton ?? ""}`;

  /** Deck en cours, s'il a été laissé récemment. Lu une fois, pas à chaque état. */
  type Sauvegarde = { deck?: SwipeItem[]; index: number; actedIds: string[]; offsetSuivant?: number; timestamp: number };
  // Lue une seule fois, à l'initialisation : la lire à chaque rendu appelait
  // Date.now(), donc rendait le rendu non reproductible — deux rendus
  // successifs pouvaient prendre des décisions différentes.
  const [sauvegarde] = useState<Sauvegarde | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(stateKey);
      if (!raw) return null;
      const s = JSON.parse(raw) as Sauvegarde;
      if (Date.now() - s.timestamp >= STATE_TTL_MS) return null;
      return s.deck?.length ? s : null;
    } catch { return null; }
  });

  // Build the initial deck: restore from sessionStorage if recent, otherwise shuffle fresh
  const [companies, setCompanies] = useState<SwipeItem[]>(() => {
    if (sauvegarde) return sauvegarde.deck!;
    const shuffled: SwipeItem[] = shuffle(initialCompanies);
    const alreadyShown = typeof window !== "undefined" && sessionStorage.getItem(AD_SESSION_KEY) === "1";
    if (swipeAds.length > 0 && !alreadyShown) {
      const pos = 5 + Math.floor(Math.random() * 8);
      const campaign = swipeAds[Math.floor(Math.random() * swipeAds.length)];
      shuffled.splice(Math.min(pos, shuffled.length), 0, { __ad: true, campaign });
    }
    return shuffled;
  });

  // Un paquet restitué peut contenir des fiches modifiées depuis : on le remet
  // à jour une fois, juste après l'affichage, sans toucher à l'ordre.
  // (Déclaré après le paquet qu'il met à jour.)
  useEffect(() => {
    if (!sauvegarde?.deck) return;
    void rafraichirFiches(sauvegarde.deck as Array<SwipeItem & { id?: string }>).then(frais => {
      if (frais) setCompanies(frais as SwipeItem[]);
    });
  }, [sauvegarde]);

  const [index, setIndex] = useState<number>(() => sauvegarde?.index ?? 0);
  // Sans compte, les favoris gardés dans le navigateur allument aussi la flamme.
  const [favIds, setFavIds] = useState<Set<string>>(() => new Set([...initialFavIds, ...(isLoggedIn ? [] : idsFavorisInvite())]));
  const [flameIds, setFlameIds] = useState<Set<string>>(() => new Set([...initialFlameIds, ...(isLoggedIn ? [] : idsFavorisInvite())]));
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);


  // Entreprises déjà vues : restaurées pour ne pas les reproposer.
  useEffect(() => {
    sauvegarde?.actedIds?.forEach(id => actedIds.current.add(id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [exhausted, setExhausted] = useState(false);
  // Track all companies seen/acted on this session to avoid re-showing them in new batches
  const actedIds = useRef<Set<string>>(new Set([...initialFavIds, ...initialFlameIds]));

  // Le geste (glisser, lancer, relève sans flash, verrou contre les doubles
  // swipes) est dans PileSwipe, commun à toutes les piles. Ici : le paquet.

  const fetchingRef = useRef(false);
  // Départ à un offset aléatoire pour varier le pool plutôt que de resservir
  // toujours les mieux notées. Mais uniquement SANS filtre : un filtre réduit
  // souvent le pool sous cet offset (Uri : 1 entreprise, Glaris : 4, Neuchâtel
  // : 45), la requête repartait au-delà du dernier résultat et il fallait un
  // second aller-retour pour s'en remettre — d'où un écran blanc prolongé.
  const hasFilters = !!(filters?.sector || filters?.canton || filters?.search);
  // Tiré une seule fois. Dans une ref, il était recalculé à chaque rendu du
  // corps du composant : un tirage au sort pendant le rendu rend celui-ci
  // imprévisible, ce que React interdit.
  const [decalageDepart] = useState(() => hasFilters ? 0 : 50 + Math.floor(Math.random() * 150));
  const nextOffsetRef = useRef(
    sauvegarde?.offsetSuivant
      ?? (initialCompanies.length > 0 ? initialCompanies.length : decalageDepart)
  );

  // Track impression when the ad card becomes the current card
  const current = companies[index];
  useEffect(() => {
    if (isAd(current)) trackAdImpression(current.campaign.id);
    else if (current) router.prefetch(urlFiche(current));

    // Les 8 cartes suivantes, décodées d'avance. On demande la largeur de la
    // carte et non l'original stocké en 1600 px : à cette taille, huit
    // téléchargements simultanés saturaient la connexion et retardaient la
    // carte que l'utilisateur avait sous les yeux.
    const aPrecharger: (string | null | undefined)[] = [];
    for (let i = 0; i <= 8; i++) {
      const item = companies[index + i];
      if (!item) break;
      aPrecharger.push(isAd(item) ? item.campaign.image_url : (item as Company).cover_url);
    }
    prechargerCouvertures(aPrecharger, 940);

    // Persist state to sessionStorage so navigating away and back restores position
    try {
      // On enregistre le deck lui-même, pas seulement les identifiants.
      // L'ancienne version les relisait dans `initialCompanies` — un tableau
      // toujours vide ici, puisque le swipe charge son propre pool. La
      // restauration échouait donc systématiquement : retour au swipe, tout
      // était rechargé et l'utilisateur perdait l'entreprise qu'il regardait.
      //
      // On ne garde que ce qui reste à voir, plafonné : au-delà, l'espace de
      // session se remplirait pour des cartes qui seront de toute façon
      // remplacées par la pagination.
      const aGarder = companies.slice(Math.max(0, index - 1), index + 40);
      sessionStorage.setItem(stateKey, JSON.stringify({
        deck: aGarder,
        index: Math.min(index, 1),
        actedIds: [...actedIds.current],
        offsetSuivant: nextOffsetRef.current,
        timestamp: Date.now(),
      }));
    } catch { /* ignore quota errors */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Précharge le deck dès qu'il arrive. Les dépendances étaient vides, donc
  // cet effet tournait au montage alors que le deck est encore vide (il est
  // chargé à un offset aléatoire juste après) : plus rien n'était préchargé et
  // chaque carte se téléchargeait sous les yeux de l'utilisateur.
  //
  // On couvre les 25 premières, comme /explore couvre son lot de 24 : assez
  // pour qu'on ne voie jamais une carte se charger, sans mettre un deck de cent
  // requêtes en file — la toute première carte, la seule regardée, attendrait
  // alors derrière les autres.
  const preloadedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const aFaire: string[] = [];
    for (const item of companies.slice(0, 25)) {
      const url = isAd(item) ? item.campaign.image_url : (item as Company).cover_url;
      if (!url || preloadedRef.current.has(url)) continue;
      preloadedRef.current.add(url);
      aFaire.push(url);
    }
    prechargerCouvertures(aFaire, 940);
  }, [companies]);

  // Prefetch next batch silently — triggers on mount when deck is empty, and when nearing the end
  useEffect(() => {
    if (exhausted || fetchingRef.current) return;
    const nearEnd = index >= companies.length - PREFETCH_AHEAD;
    const isEmpty = companies.length === 0;
    if (!nearEnd && !isEmpty) return;
    fetchingRef.current = true;

    (async () => {
      try {
        let batch = await fetchSwipePage(filters, nextOffsetRef.current);

        // L'offset de départ est volontairement aléatoire (50–200) pour varier
        // le pool. Mais un filtre étroit peut renvoyer bien moins d'entreprises
        // que cet offset — Uri en compte 1, Nidwald 2, Glaris 4 — et la requête
        // repart alors au-delà du dernier résultat : deck vide, écran blanc.
        // Si rien ne revient alors que le deck est encore vide, on reprend à 0.
        if (batch.length === 0 && isEmpty && nextOffsetRef.current > 0) {
          nextOffsetRef.current = 0;
          batch = await fetchSwipePage(filters, 0);
        }

        fetchingRef.current = false;
        if (batch.length === 0) { setExhausted(true); return; }
        nextOffsetRef.current += batch.length;
        const fresh = shuffle(batch.filter(c => !actedIds.current.has(c.id)));
        if (fresh.length > 0) setCompanies(prev => [...prev, ...fresh]);
        if (batch.length < 50) setExhausted(true);
      } catch {
        fetchingRef.current = false;
      }
    })();
  }, [index, companies.length, filters, exhausted]);

  // Auto-reshuffle when deck is empty instead of showing an end screen
  //
  // Exception assumée et délimitée. Remettre le paquet à zéro touche huit
  // valeurs d'un coup, et ce n'est pas une synchronisation avec l'affichage :
  // c'est une remise à zéro déclenchée par une condition — le paquet est
  // épuisé. La règle vise les effets qui recopient un état dans un autre ;
  // ici il n'y a rien à recopier, et découper ce bloc rendrait le
  // rechargement du paquet moins lisible sans rien gagner.
  const deckEmpty = index > 0 && index >= companies.length;
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability */
  useEffect(() => {
    if (!deckEmpty) return;
    // Même règle qu'au démarrage : pas d'offset aléatoire quand un filtre
    // restreint le pool, sinon le re-mélange retombe sur un deck vide.
    nextOffsetRef.current = hasFilters ? 0 : 50 + Math.floor(Math.random() * 200);
    fetchingRef.current = false;
    actedIds.current = new Set();
    setExhausted(false);
    setCompanies([]);
    setIndex(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckEmpty]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/immutability */

  const next = companies[index + 1];

  const showToast = (msg: string, color: string) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 1800);
  };



  const markActed = (id: string) => actedIds.current.add(id);

  // Instantané courant, relu au démontage. L'enregistrement ne se déclenchait
  // que sur changement d'index : quitter la vue sans swiper, ou juste après un
  // swipe, laissait la sauvegarde en retard d'une carte.
  const instantaneRef = useRef<{ deck: SwipeItem[]; index: number } | null>(null);
  useEffect(() => { instantaneRef.current = { deck: companies, index }; });

  useEffect(() => () => {
    const inst = instantaneRef.current;
    if (!inst?.deck.length) return;
    try {
      sessionStorage.setItem(stateKey, JSON.stringify({
        deck: inst.deck.slice(Math.max(0, inst.index - 1), inst.index + 40),
        index: Math.min(inst.index, 1),
        actedIds: [...actedIds.current],
        offsetSuivant: nextOffsetRef.current,
        timestamp: Date.now(),
      }));
    } catch { /* quota : la sauvegarde précédente reste valable */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Ce que veut dire le geste, pour une entreprise ou une publicité. */
  const decider = useCallback((item: SwipeItem, dir: Direction) => {
    if (isAd(item)) {
      sessionStorage.setItem(AD_SESSION_KEY, "1");
      if (dir === "right") {
        trackAdClick(item.campaign.id);
        window.open(item.campaign.cta_url, "_blank", "noopener,noreferrer");
      }
      return;
    }
    // Plus de limite pour les visiteurs : le swipe est ouvert à tous. Sans
    // compte, le favori est gardé dans le navigateur et rejoindra le compte à
    // l'inscription.
    markActed(item.id);
    if (dir === "right") {
      const id = item.id;
      setFavIds(prev => { const n = new Set(prev); n.add(id); return n; });
      setFlameIds(prev => { const n = new Set(prev); n.add(id); return n; });
      // Avec compte : toggleFavorite pose aussi la flamme. Un favori déjà
      // présent ne doit pas être retiré par un swipe à droite.
      if (isLoggedIn) { if (!favIds.has(id)) toggleFavorite(id); }
      else ajouterFavoriInvite(id);
      showToast(t("swipe.enregistre"), "#f97316");
    } else {
      showToast(t("swipe.passe"), "#ef4444");
    }
  }, [isLoggedIn, favIds, t]);

  const avancer = useCallback(() => setIndex(i => i + 1), []);

  /** Un toucher sur la carte : la fiche, ou le site de l'annonceur. */
  const ouvrir = useCallback((item: SwipeItem) => {
    if (isAd(item)) {
      trackAdClick(item.campaign.id);
      window.open(item.campaign.cta_url, "_blank", "noopener,noreferrer");
    } else router.push(urlFiche(item));
  }, [router]);

  if (!current) return null;

  return (
    <PileSwipe<SwipeItem>
      courant={current}
      suivant={next}
      cle={item => isAd(item) ? `pub-${item.campaign.id}` : item.id}
      onDecision={decider}
      onAvance={avancer}
      onTouche={ouvrir}
      toast={toast}
      rendu={(item, r) => isAd(item)
        ? <AdSwipeCard campaign={item.campaign} overlayDir={r.direction} overlayOpacity={r.intensite} />
        : <SwipeCard company={item} flameIds={flameIds} overlayDir={r.direction} overlayOpacity={r.intensite} />}
      boutons={(agir, occupe) => (
        <>
          {/* Les trois boutons ne bougent pas pendant qu'une carte s'en va :
              c'est la carte qui part, eux restent. Ils sont désactivés le
              temps de l'animation, pour qu'un second appui n'avance pas de
              deux cartes. */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <BoutonRond taille={64} couleur="239,68,68" onClick={() => agir("left")} disabled={occupe} label={t("swipe.passerEntreprise")}>
              <X size={26} strokeWidth={2.5} aria-hidden="true" />
            </BoutonRond>
            <BoutonRond taille={48} couleur="99,102,241" teinte="#818cf8" onClick={() => !isAd(current) && router.push(urlFiche(current))} disabled={occupe || isAd(current)} label={t("swipe.voirFiche")}>
              <Info size={18} strokeWidth={2} aria-hidden="true" />
            </BoutonRond>
            <BoutonRond taille={64} couleur="249,115,22" onClick={() => agir("right")} disabled={occupe} label={t("swipe.sauverEntreprise")}
              plein={!isAd(current) && flameIds.has(current.id)}>
              <Flame size={26} fill={!isAd(current) && flameIds.has(current.id) ? "#fff" : "none"} strokeWidth={2} aria-hidden="true" />
            </BoutonRond>
          </div>
          {/* Légende, masquée sur téléphone : ce que les boutons ne disent pas
              (on peut aussi glisser, et se servir des flèches du clavier). */}
          <div className="swipe-legend" style={{ flexDirection: "column", alignItems: "center", gap: 6 }}>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              {t("swipe.aideEntreprises")}
              {" "}&nbsp;·{" "}<Touche>←</Touche>{" "}<Touche>→</Touche>
            </p>
          </div>
        </>
      )}
    />
  );
}

/** Touche de clavier, dans la légende. */
export function Touche({ children }: { children: React.ReactNode }) {
  return <kbd style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "var(--surface3)", border: "1px solid var(--border2)", color: "var(--text-muted)", fontFamily: "monospace" }}>{children}</kbd>;
}

/** Bouton rond sous la pile (passer, voir, garder). `couleur` : « r,g,b ». */
export function BoutonRond({ taille, couleur, teinte, plein = false, onClick, disabled, label, children }: {
  taille: number; couleur: string; teinte?: string; plein?: boolean;
  onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className="bouton-rond-swipe"
      style={{
        width: taille, height: taille, borderRadius: "50%",
        background: plein ? `rgb(${couleur})` : "var(--surface)",
        border: `2px solid rgba(${couleur},${plein ? 0.8 : 0.4})`,
        color: plein ? "#fff" : (teinte ?? `rgb(${couleur})`),
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        boxShadow: `0 6px 24px rgba(${couleur},${plein ? 0.45 : 0.15})`,
        transition: "transform 0.18s, background 0.18s, box-shadow 0.18s",
      }}>
      {children}
      <style>{`.bouton-rond-swipe:not(:disabled):hover { transform: scale(1.1); }`}</style>
    </button>
  );
}


function SwipeCard({ company, flameIds, overlayDir, overlayOpacity }: {
  company: Company; flameIds: Set<string>;
  overlayDir: "left" | "right" | null; overlayOpacity: number;
}) {
  const t = useT();
  const langue = useLangue();
  const sectorColor = SECTOR_COLORS[company.sector] ?? "#8b5cf6";
  const isFav = flameIds.has(company.id);
  const [imgLoaded, setImgLoaded] = useState(false);
  // Meme regle que la grille : sans photo, la couleur du secteur, pas une
  // image fabriquee a la demande qui revenait vide.
  const coverSrc = company.cover_url;

  return (
    <div style={{ width: "100%", height: "100%", borderRadius: 22, overflow: "hidden", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", userSelect: "none", display: "flex", flexDirection: "column" }}>
      {/* Fond à la couleur dominante de la photo : la carte est colorée dès le
          premier rendu, donc pas de shimmer ni d'aplat gris même hors ligne. */}
      <div
        // L'animation de chargement ne s'applique que s'il y a une image a
        // attendre : sans photo, elle balayait le degrade du secteur d'une
        // bande claire figee.
        className={coverSrc && !imgLoaded && !company.cover_color ? "img-placeholder" : undefined}
        style={{
          // La photo prenait 55 % de la hauteur, le texte le reste, et comme
          // le texte fait deux lignes il restait un vide en bas de chaque
          // carte. Elle prend maintenant tout ce que le texte ne prend pas.
          flex: 1, minHeight: 0, position: "relative", overflow: "hidden",
          background: company.cover_color
            || (coverSrc ? "var(--surface2)" : `linear-gradient(135deg, ${sectorColor} 0%, #0f172a 100%)`),
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
          {coverSrc && <img
          src={largeurCouverture(coverSrc, 940)}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
            ...styleCadrage(coverSrc),
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.25s ease-out",
          }}
          onLoad={() => setImgLoaded(true)}
          />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.8))" }} />

        <TamponSwipe direction={overlayDir} intensite={overlayOpacity} droite={{ texte: "🔥 SAVE", rgb: "249,115,22" }} gauche={{ texte: "✕ PASS", rgb: "239,68,68" }} />

        {/* Même pastille que sur la fiche : la couleur du secteur, éclaircie pour
            le texte, en verre teinté sombre pour le fond. Posée en haut de la
            photo, là où le voile est le plus léger, l'ancienne disparaissait
            sur les images claires. */}
        <div style={{ position: "absolute", top: 16, left: 16, background: `color-mix(in srgb, ${sectorColor} 38%, rgba(10,10,14,0.55))`, border: `1px solid color-mix(in srgb, ${sectorColor} 55%, transparent)`, borderRadius: 50, padding: "5px 14px", fontSize: 13.5, fontWeight: 700, color: `color-mix(in srgb, ${sectorColor} 30%, #fff)`, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          {nomSecteur(company.sector, langue)}
        </div>
        {isFav && (
          <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(249,115,22,0.9)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Flame size={16} fill="#fff" color="#fff" />
          </div>
        )}
        <div style={{ position: "absolute", bottom: 16, left: 20, right: 20 }}>
          <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {company.name}{company.is_verified && (
              <svg viewBox="0 0 22 22" style={{ display: "inline", verticalAlign: "middle", marginLeft: 7, width: 20, height: 20, flexShrink: 0 }} aria-label={t("fiche.verifiee")}>
                <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
                <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
              </svg>
            )}
          </p>
          {company.subsector && <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.85)", marginTop: 3, textShadow: "0 1px 3px rgba(0,0,0,0.45)" }}>{company.subsector}</p>}
        </div>
      </div>

      {/* Le bas de carte porte autant de marge que les cotes, et une de plus
          sous la derniere ligne : un texte colle au bord se lit comme une
          erreur de mise en page. */}
      <div style={{ padding: "20px 18px 24px", display: "flex", flexDirection: "column", gap: 13, flexShrink: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Chip icon={<MapPin size={12} aria-hidden="true" />} label={lieuAffiche(company.city, company.canton, langue)} />
          {company.employee_range && <Chip icon={<Users size={12} aria-hidden="true" />} label={`${company.employee_range} emp.`} />}
          {/* Aucun salaire affiché (décision du 2026-11-16). */}
        </div>
        {company.description && (
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {company.description}
          </p>
        )}
        {/* Les étiquettes ont été retirées.

            Elles redisaient le secteur en minuscules, et surtout elles
            étaient inventées : faute d'étiquettes en base, la carte
            piochait dans une table de valeurs par défaut par secteur, et
            affichait donc des mots que personne n'avait saisis. */}
      </div>
    </div>
  );
}

function AdSwipeCard({ campaign, overlayDir, overlayOpacity }: {
  campaign: PublicAdCampaign;
  overlayDir: "left" | "right" | null;
  overlayOpacity: number;
}) {
  const t = useT();
  return (
    <div style={{ width: "100%", height: "100%", borderRadius: 22, overflow: "hidden", background: "var(--surface)", border: "1px solid var(--border2)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", userSelect: "none", display: "flex", flexDirection: "column", cursor: "pointer" }}>
      {/* Image zone — same 55% as SwipeCard */}
      <div style={{ height: "55%", position: "relative", overflow: "hidden", flexShrink: 0,
        background: campaign.image_url
          ? `url(${campaign.image_url}) center / cover no-repeat`
          : "var(--brand)",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.0) 20%, rgba(0,0,0,0.75))" }} />

        {/* Swipe overlays */}
        <TamponSwipe direction={overlayDir} intensite={overlayOpacity} droite={{ texte: "↗ VOIR", rgb: "139,92,246" }} gauche={{ texte: "✕ PASSER", rgb: "239,68,68" }} />

        {/* Sponsored badge — gradient, more visible */}
        <div style={{ position: "absolute", top: 14, left: 14, background: "var(--brand)", borderRadius: 50, padding: "4px 12px", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.12em" }}>{t("swipe.sponsorise")}</span>
        </div>

        {/* Headline over image */}
        <div style={{ position: "absolute", bottom: 14, left: 18, right: 18 }}>
          <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.1, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {campaign.headline}
          </p>
        </div>
      </div>

      {/* Content zone */}
      <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, justifyContent: "space-between" }}>
        {campaign.body_text && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {campaign.body_text}
          </p>
        )}
        {/* CTA button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderRadius: 14, background: "var(--brand)", boxShadow: "0 4px 16px rgba(139,92,246,0.35)" }}>
          <ExternalLink size={15} color="#fff" aria-hidden="true" />
          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", flex: 1, letterSpacing: "-0.01em" }}>{campaign.cta_label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{t("swipe.ouvrir")}</span>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, label, color }: { icon: React.ReactNode; label: string; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: color ?? "var(--text-muted)", background: "var(--surface2)", borderRadius: 8, padding: "4px 10px" }}>
      {icon} {label}
    </span>
  );
}
