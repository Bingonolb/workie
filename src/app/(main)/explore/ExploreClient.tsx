"use client";

import { useState, useMemo, useCallback, useRef, useTransition, useEffect, useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CompanyCard } from "@/components/CompanyCard";
import { prechargerCouvertures } from "@/components/CoverImage";
import { ExploreFilters } from "./ExploreFilters";
import { AdSquareCard } from "@/components/AdSquareCard";
import { SwipeView } from "./SwipeView";
import { fetchGridPage, fetchSwipePage } from "@/lib/actions/companies";
import { GRID_PAGE_SIZE } from "@/lib/actions/columns";
import { SECTORS } from "@/lib/types";
import type { Company } from "@/lib/types";
import type { PublicAdCampaign } from "@/lib/actions/ads";
import { lireCache, ecrireCache, CLE_CONTEXTE } from "@/lib/cacheSession";

// Guests see the first 12 companies + 6 blurred
/**
 * Durée de vie de l'ordre d'affichage de l'explorateur.
 *
 * Trente minutes depuis la dernière visite, la même fenêtre que le swipe.
 *
 * Ce n'est ni « à chaque rafraîchissement » ni « à chaque connexion ». Rebattre
 * à chaque rafraîchissement ferait perdre l'entreprise qu'on venait de repérer
 * — on rafraîchit justement pour retrouver quelque chose. Lier l'ordre à la
 * connexion ne rebattrait presque jamais : personne ne se déconnecte.
 *
 * Le compteur repart à chaque passage, donc une session de trois heures garde
 * le même ordre du début à la fin. C'est en revenant après une pause qu'on
 * découvre autre chose — le moment où on en a envie.
 *
 * Conservé dans localStorage et non sessionStorage : sur mobile l'onglet n'est
 * jamais fermé, une mémoire liée à l'onglet ne serait donc jamais renouvelée.
 */
/** Paramètre d'URL lu au tout premier rendu, sans passer par un effet. */
function parametreUrl(nom: string, defaut: string): string {
  if (typeof window === "undefined") return defaut;
  return new URLSearchParams(window.location.search).get(nom) ?? defaut;
}

const DUREE_GRAINE_MS = 30 * 60 * 1000;

/** Où l'on en était dans la grille, pour y revenir. */
const CLE_DEFILEMENT = "workie_grille_defilement";

const GUEST_VISIBLE = 12;
const GUEST_BLUR = 6;

const CANTONS = [
  { code: "ZH", name: "Zürich" }, { code: "BE", name: "Bern" }, { code: "LU", name: "Lucerne" },
  { code: "UR", name: "Uri" }, { code: "SZ", name: "Schwyz" }, { code: "OW", name: "Obwald" },
  { code: "NW", name: "Nidwald" }, { code: "GL", name: "Glaris" }, { code: "ZG", name: "Zug" },
  { code: "FR", name: "Fribourg" }, { code: "SO", name: "Soleure" }, { code: "BS", name: "Bâle-Ville" },
  { code: "BL", name: "Bâle-Camp." }, { code: "SH", name: "Schaffhouse" }, { code: "AR", name: "Appenzell A.Rh." },
  { code: "AI", name: "Appenzell I.Rh." }, { code: "SG", name: "St-Gallen" }, { code: "GR", name: "Grisons" },
  { code: "AG", name: "Argovie" }, { code: "TG", name: "Thurgovie" }, { code: "TI", name: "Tessin" },
  { code: "VD", name: "Vaud" }, { code: "VS", name: "Valais" }, { code: "NE", name: "Neuchâtel" },
  { code: "GE", name: "Genève" }, { code: "JU", name: "Jura" },
];


export function ExploreClient({
  initialCompanies,
  initialTotal,
  favIds: initialFavIds,
  flameIds: initialFlameIds,
  swipeAds,
  isLoggedIn: initialIsLoggedIn,
  isGuest: initialIsGuest,
  isAdmin: initialIsAdmin,
  penaltyCredits: initialPenaltyCredits,
  penaltySuccess,
  initialView,
  initialSector,
  initialCanton,
  initialSort,
  squareAds,
}: {
  initialCompanies: Company[];
  initialTotal: number;
  favIds: string[];
  flameIds: string[];
  swipeAds: PublicAdCampaign[];
  isLoggedIn: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  penaltyCredits: number;
  penaltySuccess: boolean;
  initialView: "grid" | "swipe";
  initialSector?: string;
  initialCanton?: string;
  initialSort?: string;
  squareAds: PublicAdCampaign[];
}) {
  // La vue suit l'URL, lue auprès du routeur et non du navigateur.
  //
  // `window.location` ne convient pas ici. En arrivant depuis une autre page,
  // Next met l'adresse à jour dans un effet du routeur, qui est un composant
  // parent (`window.history.pushState`, dans app-router.js). Or les effets
  // d'un enfant s'exécutent avant ceux de son parent : au montage de cet
  // écran, `window.location.search` contient encore l'adresse de la page
  // qu'on vient de quitter. Depuis /favoris, « /explore?view=swipe » se lisait
  // donc sans paramètre, et la grille s'affichait à la place du swipe.
  //
  // `useSearchParams` lit l'état de rendu du routeur : il est juste dès le
  // premier rendu, quelle que soit la provenance.
  //
  // L'ajustement se fait pendant le rendu et seulement quand l'URL change
  // réellement de vue, jamais dans un effet : la bonne vue est peinte du
  // premier coup, et la bascule instantanée de la barre de navigation, qui
  // change l'état avant l'adresse, n'est pas écrasée au rendu suivant.
  const parametres = useSearchParams();
  const vueUrl: "grid" | "swipe" = parametres.get("view") === "swipe" ? "swipe" : initialView;
  const [view, setView] = useState<"grid" | "swipe">(vueUrl);
  const [vueUrlPrecedente, setVueUrlPrecedente] = useState<"grid" | "swipe">(vueUrl);
  if (vueUrl !== vueUrlPrecedente) {
    setVueUrlPrecedente(vueUrl);
    setView(vueUrl);
  }
  const [sector, setSector] = useState(() => parametreUrl("sector", initialSector ?? ""));
  const [canton, setCanton] = useState(() => parametreUrl("canton", initialCanton ?? ""));
  const [sort, setSort] = useState(() => parametreUrl("sort", initialSort ?? "recent"));

  // null = auth not yet resolved (loading). Avoids flash of cadenas for logged-in users.
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [isGuest, setIsGuest] = useState(false); // optimistic false until auth resolves
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [penaltyCredits, setPenaltyCredits] = useState(initialPenaltyCredits);
  // Repris de la mémoire : sans cela les flammes partaient éteintes à chaque
  // navigation et s'allumaient une fois le réseau revenu, souvent après les
  // images — d'où l'impression qu'elles surgissaient.
  const memoireContexte = typeof window !== "undefined"
    ? lireCache<{ favIds: string[]; flameIds: string[]; boostIds?: string[]; penaltyIds?: string[] }>(CLE_CONTEXTE)
    : undefined;
  const [favIds, setFavIds] = useState<string[]>(memoireContexte?.favIds ?? initialFavIds);
  const [flameIds, setFlameIds] = useState<string[]>(memoireContexte?.flameIds ?? initialFlameIds);
  // Boost et pénalité repartaient de zéro à chaque chargement : le bouton
  // s'affichait éteint alors que le geste était enregistré, et un second clic
  // l'annulait sans que l'utilisateur l'ait voulu.
  const [boostIds, setBoostIds] = useState<string[]>(memoireContexte?.boostIds ?? []);
  const [penaltyIds, setPenaltyIds] = useState<string[]>(memoireContexte?.penaltyIds ?? []);
  const [squareAdsState, setSquareAdsState] = useState<PublicAdCampaign[]>(squareAds);
  const [swipeAdsState, setSwipeAdsState] = useState<PublicAdCampaign[]>(swipeAds);

  // Graine de mélange, propre à la session.
  //
  // L'explorateur affichait toujours les mêmes entreprises en tête : le menu
  // paraissait inutile puisqu'on y voyait toujours la même chose. L'ordre est
  // désormais tiré d'une graine, sur la totalité du catalogue.
  //
  // Elle doit rester stable tant qu'on navigue, sinon la pagination
  // répéterait ou sauterait des entreprises ; et changer à la visite suivante,
  // pour qu'on découvre autre chose. sessionStorage donne exactement ça : une
  // valeur par onglet, effacée à la fermeture.
  const [graine] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const brut = localStorage.getItem("workie_graine");
      if (brut) {
        const { valeur, vue } = JSON.parse(brut) as { valeur: number; vue: number };
        // Toujours valable : on reprend le même ordre. Rafraîchir la page ou
        // passer d'un menu à l'autre ne doit rien rebattre — on rafraîchit
        // souvent pour retrouver ce qu'on regardait, pas pour tout perdre.
        if (Date.now() - vue < DUREE_GRAINE_MS) {
          localStorage.setItem("workie_graine", JSON.stringify({ valeur, vue: Date.now() }));
          return valeur;
        }
      }
    } catch { /* stockage indisponible : on tire une graine sans mémoire */ }

    const nouvelle = Math.floor(Math.random() * 100);
    try {
      localStorage.setItem("workie_graine", JSON.stringify({ valeur: nouvelle, vue: Date.now() }));
    } catch { /* sans conséquence : l'ordre sera simplement retiré au prochain chargement */ }
    return nouvelle;
  });

  // État de la grille conservé d'un aller-retour à l'autre : revenir sur
  // l'explorateur ne doit pas tout recharger ni replacer l'utilisateur en haut
  // d'une liste différente.
  const etatMemorise = (() => {
    if (typeof window === "undefined") return null;
    try {
      const brut = sessionStorage.getItem("workie_grille");
      if (!brut) return null;
      const e = JSON.parse(brut) as { graine: number; sector: string; canton: string; sort: string; companies: Company[]; total: number; page: number };
      // Un état constitué avec d'autres filtres ou une autre graine n'a plus
      // de sens : on repart du serveur plutôt que d'afficher un mélange bâtard.
      //
      // La comparaison porte sur les états, pas sur les propriétés du serveur.
      // Elle testait `e.sort === (initialSort ?? "")`, or `sort` s'initialise à
      // « recent » faute de paramètre d'URL : « recent » ne valant jamais « »,
      // aucun état mémorisé n'était accepté. On rechargeait donc les 24
      // premières entreprises à chaque retour, et l'enregistrement suivant
      // écrasait la liste complète par ces 24. L'ordre restait le bon, la
      // graine étant stable une demi-heure, ce qui masquait la panne.
      const memeContexte = e.graine === graine
        && e.sector === sector && e.canton === canton && e.sort === sort;
      return memeContexte && Array.isArray(e.companies) && e.companies.length > 0 ? e : null;
    } catch { return null; }
  })();

  // Position de défilement, retenue à part de l'état de la grille : l'écrire
  // dans le même enregistrement obligerait à re-sérialiser la liste entière à
  // chaque pixel parcouru.
  //
  // Elle n'est reprise que si la grille elle-même l'est. Sur une liste
  // différente — autres filtres, autre mélange — retomber au même pixel
  // n'aurait aucun sens.
  const [defilementInitial] = useState<number | null>(() => {
    if (typeof window === "undefined" || !etatMemorise) return null;
    try {
      const v = Number(sessionStorage.getItem(CLE_DEFILEMENT));
      return Number.isFinite(v) && v > 0 ? v : null;
    } catch { return null; }
  });

  // Server-driven company list + total count
  // La liste affichée provient-elle d'une requête mélangée ?
  //
  // Le premier rendu vient du serveur, donc d'un ordre non mélangé. Sans ce
  // drapeau, cette liste était enregistrée comme si elle l'était, puis
  // restituée à la visite suivante — et la suite de la pagination, elle,
  // arrivait bien mélangée. Les deux ordres se mélangeaient : mesuré en
  // production, 5 entreprises en double sur 144 chargées.
  const [melangeApplique, setMelangeApplique] = useState(false);
  // La liste part de celle du serveur, et c'est délibéré : le premier rendu du
  // client doit reproduire le HTML reçu, sinon React détecte un écart et
  // reconstruit l'arbre — ce qui produit justement un clignotement.
  //
  // Le remplacement a lieu juste après, dans un effet de disposition, donc
  // avant que le navigateur peigne. C'est ce qui fait disparaître l'entreprise
  // fantôme : la liste non mélangée du serveur n'est jamais affichée.
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);

  // Faux tant que la liste affichée n'est pas celle qu'on veut montrer.
  // On affiche alors des cartes grises aux mêmes dimensions plutôt que la
  // liste du serveur, qui serait remplacée sous les yeux de l'utilisateur.
  const [pretAAfficher, setPretAAfficher] = useState(true);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Préchargement des bannières encore hors écran du lot courant.
  //
  // La version précédente tirait l'URL stockée telle quelle, soit 1600 px de
  // large, pour chaque entreprise de la liste. Ces téléchargements entraient en
  // concurrence avec les images réellement visibles et retardaient l'affichage
  // au lieu de l'accélérer. On demande désormais la largeur d'une carte, et on
  // laisse passer le premier rendu avant de commencer.
  useEffect(() => {
    const t = setTimeout(() => {
      prechargerCouvertures(companies.slice(6).map(c => c.cover_url), 640);
    }, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lecture des paramètres d'URL au montage.
  //
  // useLayoutEffect et non useEffect : la page étant servie depuis le cache, le
  // serveur rend toujours la grille, et c'est le client qui bascule sur le
  // swipe quand l'URL le demande. Avec useEffect, la bascule survient après le
  // premier affichage — on voit donc la grille apparaître puis céder la place
  // aux cartes. Ici elle a lieu avant que le navigateur peigne, sans à-coup.
  // Exception assumée à la règle « pas de setState dans un effet ».
  //
  // Le premier rendu doit reproduire le HTML du serveur, sinon React
  // reconstruit l'arbre et l'écran clignote. La correction ne peut donc pas
  // avoir lieu pendant le rendu — elle doit venir juste après, et avant que le
  // navigateur peigne. C'est précisément ce que useLayoutEffect permet, et la
  // seule façon d'éviter que la liste non mélangée du serveur soit visible.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    // Reprise de ce que l'utilisateur regardait, avant peinture.
    if (etatMemorise) {
      setCompanies(etatMemorise.companies);
      setTotal(etatMemorise.total);
      setPage(etatMemorise.page);
      setMelangeApplique(true);
      return;
    }
    // Sinon la liste du serveur va être remplacée : on masque la grille pour
    // ne pas la montrer une fraction de seconde.
    setPretAAfficher(false);

    const sp = new URLSearchParams(window.location.search);
    const urlSector = sp.get("sector") ?? "";
    const urlCanton = sp.get("canton") ?? "";
    const urlSort   = sp.get("sort")   ?? "recent";

    // Les filtres et la vue sont déjà pris en compte à l'initialisation des
    // états correspondants : les corriger ici forçait un rendu de plus, avec
    // un affichage intermédiaire visible à l'écran.
    // Le `finally` n'est pas une précaution de principe : sans lui, un appel
    // qui échoue laisse `pretAAfficher` à faux pour toujours, et la grille
    // reste bloquée sur ses six cartes grises, sans erreur et sans retour
    // possible autrement qu'en rechargeant. Or cet appel échoue vraiment :
    // il répond 503 pendant chaque mise en production, le temps que Vercel
    // bascule d'une version à l'autre, et à la moindre coupure réseau.
    // En cas d'échec, la liste rendue par le serveur reste affichée : elle
    // n'est pas mélangée, ce qui est très préférable à un écran vide.
    if (urlSector || urlCanton || urlSort !== "recent") {
      startTransition(async () => {
        try {
          const result = await fetchGridPage(
            { sector: urlSector || undefined, canton: urlCanton || undefined, sort: urlSort || undefined, graine },
            0,
          );
          setCompanies(result.companies);
          setTotal(result.total);
          setMelangeApplique(true);
        } catch {
          /* on garde la liste du serveur */
        } finally {
          setPretAAfficher(true);
        }
      });
    } else if (!etatMemorise) {
      // La page arrive du cache, donc rendue sans graine : sans ce rappel, la
      // grille afficherait éternellement le même ordre et le mélange ne
      // servirait à rien. On ne le fait qu'en l'absence d'état mémorisé —
      // sinon on écraserait ce que l'utilisateur était en train de regarder.
      startTransition(async () => {
        try {
          const result = await fetchGridPage({ graine }, 0);
          if (result.companies.length > 0) {
            setCompanies(result.companies);
            setTotal(result.total);
            setMelangeApplique(true);
          }
        } catch {
          /* on garde la liste du serveur */
        } finally {
          setPretAAfficher(true);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Hydrate auth state + ads client-side (page is ISR/CDN-cached, no cookies in SSR)
  useEffect(() => {
    const sectorParam = sector ? `&sector=${encodeURIComponent(sector)}` : "";
    Promise.all([
      fetch("/api/user/context").then(r => r.json()),
      fetch(`/api/ads/active?${sectorParam}`).then(r => r.json()),
    ]).then(([ctx, ads]) => {
      setIsLoggedIn(ctx.isLoggedIn);
      setIsGuest(!ctx.isLoggedIn);  // only lock after we know for sure
      setAuthReady(true);
      setIsAdmin(ctx.isAdmin);
      ecrireCache(CLE_CONTEXTE, ctx);
      setFavIds(ctx.favIds);
      setFlameIds(ctx.flameIds);
      setBoostIds(ctx.boostIds ?? []);
      setPenaltyIds(ctx.penaltyIds ?? []);
      setPenaltyCredits(ctx.penaltyCredits);
      if (ads.squareAds) setSquareAdsState(ads.squareAds);
      if (ads.swipeAds) setSwipeAdsState(ads.swipeAds);
    }).catch(() => { setAuthReady(true); /* leave defaults */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for instant view switch from BottomNav/NavLinks (no server round-trip)
  useEffect(() => {
    const handler = (e: Event) => setView((e as CustomEvent<"grid" | "swipe">).detail);
    window.addEventListener("workie:view", handler);
    return () => window.removeEventListener("workie:view", handler);
  }, []);

  // L'URL doit refléter l'état complet (filtres + vue), pas seulement la vue.
  // L'ancienne version réécrivait « /explore » ou « /explore?view=swipe » en
  // dur, ce qui effaçait sector/canton/sort : un lien filtré n'était pas
  // partageable et un rechargement perdait les filtres.
  const syncUrl = useCallback((s: string, c: string, so: string, v: string) => {
    const p = new URLSearchParams();
    if (s) p.set("sector", s);
    if (c) p.set("canton", c);
    if (so && so !== "recent") p.set("sort", so);
    if (v === "swipe") p.set("view", "swipe");
    const qs = p.toString();
    const target = `/explore${qs ? `?${qs}` : ""}`;
    if (window.location.pathname + window.location.search !== target) {
      window.history.replaceState({}, "", target);
    }
  }, []);

  // Au montage, l'URL fait déjà foi — on ne la réécrit qu'après un changement,
  // sinon on écraserait les paramètres d'arrivée avant leur lecture.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    syncUrl(sector, canton, sort, view);
  }, [sector, canton, sort, view, syncUrl]);

  // La vue swipe occupe exactement l'écran et ne défile pas.
  //
  // Elle défilait de 56 px auparavant — la hauteur de la barre de navigation,
  // que .page-root ne déduisait pas de son 100dvh. Ce débattement minuscule
  // suffisait à gâcher le geste : le verrou de direction du glissement rendait
  // la main au navigateur dès qu'un mouvement partait vers le bas, et une fois
  // en butée il n'y avait plus rien à faire défiler. Le geste était mort pour
  // toute sa durée et la carte semblait figée.
  //
  // Le verrou posé sur le corps du document plutôt que sur un conteneur : la
  // barre du bas est en position fixe et la barre du haut collante, aucune des
  // deux ne se laisse contenir proprement par un parent en hauteur figée.
  useEffect(() => {
    if (view !== "swipe") return;
    document.body.classList.add("mode-swipe");
    return () => document.body.classList.remove("mode-swipe");
  }, [view]);

  // Re-fetch from page 0 whenever filters/sort change
  const applyFilters = useCallback((
    newSector: string,
    newCanton: string,
    newSort: string,
  ) => {
    setSector(newSector);
    setCanton(newCanton);
    setSort(newSort);
    setPage(0);
    startTransition(async () => {
      try {
        const result = await fetchGridPage(
          { sector: newSector || undefined, canton: newCanton || undefined, sort: newSort || undefined, graine },
          0,
        );
        setCompanies(result.companies);
        setTotal(result.total);
        setMelangeApplique(true);
      } catch {
        /* filtre non appliqué : la liste précédente reste, plutôt qu'un vide */
      }
    });
  }, []);

  const handleFilter = useCallback((key: string, value: string | undefined) => {
    const newSector = key === "sector" ? (value ?? "") : sector;
    const newCanton = key === "canton" ? (value ?? "") : canton;
    const newSort   = key === "sort"   ? (value ?? "recent") : sort;
    applyFilters(newSector, newCanton, newSort);
  }, [sector, canton, sort, applyFilters]);

  const handleClear = useCallback(() => {
    applyFilters("", "", "recent");
  }, [applyFilters]);

  const [newFrom, setNewFrom] = useState<number>(-1);

  /**
   * Photos du lot suivant, téléchargées et décodées à l'avance.
   *
   * On précharge les images, pas les données : la requête de données prend
   * quelques dizaines de millisecondes, alors que 24 photos représentent
   * l'essentiel de l'attente. Au clic, le rendu est immédiat parce que les
   * images sont déjà dans le cache du navigateur.
   *
   * Une version antérieure réutilisait aussi la promesse de données ; elle
   * renvoyait un lot vide au moment du clic et la liste ne grandissait plus.
   * Le gain ne valait pas le risque : la récupération des données reste dans
   * loadMore, là où elle a toujours fonctionné.
   */
  useEffect(() => {
    if ((page + 1) * GRID_PAGE_SIZE >= total) return;

    // requestIdleCallback : on ne dispute pas la bande passante aux images
    // encore en cours de chargement dans le lot visible.
    const lancer = () => {
      fetchGridPage(
        { sector: sector || undefined, canton: canton || undefined, sort: sort || undefined, graine },
        page + 1,
      )
        .then(r => prechargerCouvertures(r.companies.map(c => c.cover_url), 640))
        .catch(() => { /* le clic refera la requête */ });
    };

    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const surIdle = typeof w.requestIdleCallback === "function";
    const id = surIdle
      ? w.requestIdleCallback!(lancer, { timeout: 2500 })
      : window.setTimeout(lancer, 1500);
    return () => {
      if (surIdle) (window as unknown as { cancelIdleCallback: (i: number) => void }).cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [page, sector, canton, sort, total]);

  const loadMore = async () => {
    if (loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const result = await fetchGridPage(
        { sector: sector || undefined, canton: canton || undefined, sort: sort || undefined, graine },
        nextPage,
      );
      setCompanies(prev => {
        setNewFrom(prev.length);
        return [...prev, ...result.companies];
      });
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  // Position de la première publicité dans la grille.
  //
  // Elle était conservée dans une ref, lue et écrite pendant le rendu : React
  // interdit cela — une ref n'est pas suivie, donc l'affichage peut ne pas se
  // mettre à jour quand elle change, et l'appel à Math.random rendait le rendu
  // non reproductible. C'est un état calculé une fois, pas une référence.
  const [decalagePub] = useState<number>(() => {
    if (typeof window === "undefined") return 4;
    try {
      const memorise = sessionStorage.getItem("w_ad_off");
      if (memorise !== null) return parseInt(memorise, 10);
      const tire = 3 + Math.floor(Math.random() * 3);
      sessionStorage.setItem("w_ad_off", String(tire));
      return tire;
    } catch {
      return 4;
    }
  });

  // Swipe uses its own fetched pool (random offset) — pass empty so SwipeView fetches immediately
  const swipeCompanies: Company[] = [];

  // Conserve l'état pour le retour sur la page. Sans cela, revenir depuis un
  // autre menu rechargeait tout et replaçait l'utilisateur en haut d'une liste
  // qui n'était plus la même — on perdait ce qu'on était en train de regarder.
  useEffect(() => {
    // Rien n'est enregistré tant que la liste vient du rendu serveur :
    // la restituer plus tard produirait un ordre bâtard, et des doublons.
    if (typeof window === "undefined" || companies.length === 0 || !melangeApplique) return;
    try {
      sessionStorage.setItem("workie_grille", JSON.stringify({
        graine, sector, canton, sort, companies, total, page,
      }));
    } catch {
      // Quota dépassé : le confort disparaît, la page continue de fonctionner.
    }
  }, [graine, sector, canton, sort, companies, total, page, melangeApplique]);

  // Retenir où l'on en est, tant qu'on est bien dans la grille. En vue swipe
  // la page ne défile pas : y enregistrer zéro effacerait la position.
  useEffect(() => {
    if (view !== "grid") return;
    let planifie = false;
    const surDefilement = () => {
      if (planifie) return;
      planifie = true;
      requestAnimationFrame(() => {
        planifie = false;
        try { sessionStorage.setItem(CLE_DEFILEMENT, String(Math.round(window.scrollY))); } catch { /* quota */ }
      });
    };
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => window.removeEventListener("scroll", surDefilement);
  }, [view]);

  // Y revenir. La position ne peut pas être rétablie d'un seul coup : au
  // premier rendu la page n'a pas encore sa hauteur définitive, et le
  // navigateur ramènerait le défilement à son maximum du moment. On réessaie
  // donc à chaque image jusqu'à ce que la page soit assez haute, sans dépasser
  // une quarantaine d'images.
  //
  // Le moindre geste annule la reprise : si la main a déjà repris le contrôle,
  // lui arracher la page serait pire que de ne rien faire.
  useEffect(() => {
    if (defilementInitial === null) return;
    let annule = false;
    let essais = 0;
    const abandonner = () => { annule = true; };

    const tenter = () => {
      if (annule || essais++ > 40) return;
      window.scrollTo(0, defilementInitial);
      if (Math.abs(window.scrollY - defilementInitial) > 4) requestAnimationFrame(tenter);
    };
    requestAnimationFrame(tenter);

    window.addEventListener("wheel", abandonner, { once: true, passive: true });
    window.addEventListener("touchstart", abandonner, { once: true, passive: true });
    window.addEventListener("keydown", abandonner, { once: true });
    return () => {
      annule = true;
      window.removeEventListener("wheel", abandonner);
      window.removeEventListener("touchstart", abandonner);
      window.removeEventListener("keydown", abandonner);
    };
  }, [defilementInitial]);

  // Le bouton n'apparaît qu'une fois le mélange appliqué. Cliquer avant
  // aurait ajouté des pages mélangées à la suite d'une première page qui ne
  // l'était pas — d'où des entreprises en double. L'attente est de l'ordre de
  // la centaine de millisecondes, le temps du défilement jusqu'au bouton.
  const hasMore = melangeApplique && (page + 1) * GRID_PAGE_SIZE < total;

  // Ad slot map: one ad every 7 companies starting at adOffset
  const AD_INTERVAL = 7;
  const adsForGrid = (authReady && isGuest) ? [] : squareAdsState;
  const adSlotMap = useMemo((): Map<number, number> => {
    if (adsForGrid.length === 0 || companies.length < decalagePub + 1) return new Map();
    const map = new Map<number, number>();
    let slotNum = 0;
    for (let idx = decalagePub; idx < companies.length; idx += AD_INTERVAL) {
      map.set(idx, slotNum++);
    }
    return map;
  }, [adsForGrid.length, companies.length, decalagePub]);

  const current = {
    sector: sector || undefined,
    canton: canton || undefined,
    sort: sort !== "recent" ? sort : undefined,
    view: view as "grid" | "swipe",
  };

  if (view === "swipe") {
    return (
      <>
        <ExploreFilters
          sectors={SECTORS}
          cantons={CANTONS}
          current={current}
          onFilter={(key, value) => {
            if (key === "sector") applyFilters(value ?? "", canton, sort);
            else if (key === "canton") applyFilters(sector, value ?? "", sort);
          }}
          onClear={() => applyFilters("", "", sort)}
        />
        <SwipeView
          key={`${sector}-${canton}`}
          companies={swipeCompanies}
          initialFavIds={favIds}
          initialFlameIds={flameIds}
          initialBoostIds={boostIds}
          initialPenaltyIds={penaltyIds}
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          penaltyCredits={penaltyCredits}
          penaltySuccess={penaltySuccess}
          filters={{ sector: sector || undefined, canton: canton || undefined }}
          swipeAds={swipeAdsState}
        />
      </>
    );
  }

  // Guest: show first GUEST_VISIBLE, blur GUEST_BLUR, hide the rest
  // Only apply guest restrictions after auth is confirmed (avoids flash of cadenas for logged-in users)
  const guestActive = authReady && isGuest;
  const visibleCompanies = guestActive ? companies.slice(0, GUEST_VISIBLE) : companies;
  const blurCompanies    = guestActive ? companies.slice(GUEST_VISIBLE, GUEST_VISIBLE + GUEST_BLUR) : [];

  return (
    <>
      <ExploreFilters
        sectors={SECTORS}
        cantons={CANTONS}
        current={current}
        onFilter={handleFilter}
        onClear={handleClear}
      />

      {guestActive && total > 0 && (
        <div style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(249,115,22,0.06))",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: 16, padding: "16px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          <p style={{ fontSize: 14, color: "var(--text-muted)", flex: 1 }}>
            <strong style={{ color: "var(--text)" }}>{total} entreprises disponibles.</strong>{" "}
            <a href="/signup" style={{ color: "#8b5cf6", fontWeight: 700, textDecoration: "none" }}>Créer un compte gratuit</a> pour tout voir.
          </p>
        </div>
      )}

      {/* Pending overlay — fades the grid while new results load */}
      <div style={{ opacity: isPending ? 0.5 : 1, transition: "opacity 0.15s" }}>
        {visibleCompanies.length === 0 && !isPending ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Aucune entreprise trouvée</p>
            <p style={{ fontSize: 14 }}>Essaie d&apos;autres filtres.</p>
          </div>
        ) : (
          <>
            <div className="explore-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "38px 24px" }}>
              {!pretAAfficher ? (
                /* Cartes grises aux dimensions exactes des vraies : la liste
                   du serveur va être remplacée, l'afficher la ferait
                   disparaître sous les yeux de l'utilisateur — c'est
                   l'entreprise « fantôme » qu'on voyait passer en haut. */
                Array.from({ length: 6 }, (_, i) => (
                  <div key={`attente-${i}`} className="company-card" aria-hidden="true" style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 20, overflow: "hidden",
                  }}>
                    <div className="card-cover img-placeholder" style={{ height: 210 }} />
                    <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
                      <div style={{ height: 12, width: "45%", borderRadius: 4, background: "var(--surface3)" }} />
                      <div style={{ height: 11, width: "90%", borderRadius: 4, background: "var(--surface3)" }} />
                      <div style={{ height: 11, width: "65%", borderRadius: 4, background: "var(--surface3)" }} />
                    </div>
                  </div>
                ))
              ) : (() => {
                const items: React.ReactNode[] = [];
                visibleCompanies.forEach((c, i) => {
                  const slotNum = adSlotMap.get(i);
                  if (slotNum !== undefined) {
                    const ad = adsForGrid[slotNum % adsForGrid.length];
                    items.push(<AdSquareCard key={`ad-slot-${slotNum}`} ad={ad} />);
                  }
                  const isNew = newFrom >= 0 && i >= newFrom;
                  const delay = isNew ? Math.min((i - newFrom) * 40, 400) : 0;
                  items.push(
                    <div
                      key={c.id}
                      style={isNew ? {
                        animation: `cardIn 0.35s ease-out both`,
                        animationDelay: `${delay}ms`,
                      } : undefined}
                    >
                      <CompanyCard
                        company={c}
                        isFav={favIds.includes(c.id)}
                        isLoggedIn={isLoggedIn}
                        priority={i < 8}
                      />
                    </div>
                  );
                });
                return items;
              })()}
            </div>

            {/* Blurred preview + CTA for guests */}
            {guestActive && blurCompanies.length > 0 && (
              <>
                <div style={{ position: "relative", marginTop: 20, overflow: "hidden" }}>
                  <div aria-hidden="true" className="guest-blur-preview">
                    {blurCompanies.map(c => (
                      <CompanyCard key={c.id} company={c} isFav={false} isLoggedIn={false} priority={false} />
                    ))}
                  </div>
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to bottom, transparent 38%, var(--bg) 88%)",
                    pointerEvents: "none",
                  }} />
                </div>

                <div className="guest-gate-cta">
                  <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.025em" }}>
                    {total - GUEST_VISIBLE} entreprises de plus
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 22, maxWidth: 300, lineHeight: 1.6 }}>
                    Avis complets, salaires réels, classements. Gratuit et 100% anonyme.
                  </p>
                  <a href="/signup" style={{
                    display: "inline-block", padding: "13px 28px", borderRadius: 12,
                    background: "linear-gradient(135deg, #8b5cf6, #f97316)",
                    color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
                  }}>
                    Créer un compte, gratuit
                  </a>
                  <a href="/login" style={{
                    marginTop: 12, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontWeight: 500,
                  }}>
                    Déjà un compte ? <span style={{ color: "#8b5cf6", fontWeight: 600 }}>Se connecter</span>
                  </a>
                </div>
              </>
            )}

            {/* Load more for logged-in users */}
            {!guestActive && hasMore && (
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                  <span style={{ color: "var(--text)", fontWeight: 700 }}>{companies.length}</span> sur <span style={{ fontWeight: 700 }}>{total}</span> entreprises
                </p>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    padding: "12px 32px", borderRadius: 50, border: "1.5px solid rgba(139,92,246,0.4)",
                    background: "rgba(139,92,246,0.08)", color: "#8b5cf6", cursor: loadingMore ? "not-allowed" : "pointer",
                    fontSize: 14, fontWeight: 700, opacity: loadingMore ? 0.6 : 1, transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!loadingMore) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.16)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#8b5cf6"; }}}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.08)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.4)"; }}
                >
                  {loadingMore ? "Chargement…" : `Voir ${Math.min(GRID_PAGE_SIZE, total - companies.length)} de plus`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
