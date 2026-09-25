"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { lireRecentes, ajouterRecente, retirerRecente, viderRecentes, type EntrepriseRecente } from "@/lib/recherchesRecentes";

type Suggestion = { id: string; name: string; city: string; sector: string; logo_url?: string | null };

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Hauteur du clavier, zero quand il est ferme.
  const [clavier, setClavier] = useState(0);
  const [recentes, setRecentes] = useState<EntrepriseRecente[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Portail : il n'a pas d'équivalent dans le HTML du serveur.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useLayoutEffect(() => { setMounted(true); }, []);

  /*
   * Fermer, c'est revenir en arriere.
   *
   * L'entree d'historique posee a l'ouverture doit etre consommee par la
   * fermeture, sinon elle s'accumule. Le retour declenche `popstate`, qui
   * appelle `onClose` : un seul chemin de fermeture, quel que soit le geste.
   *
   * Surtout, cette consommation ne doit jamais se faire au demontage. Elle y
   * etait, et elle annulait la navigation : cliquer sur une entreprise fermait
   * la recherche, le demontage revenait en arriere, et le clic se perdait. On
   * repartait sur Explorer au lieu d'ouvrir la fiche.
   */
  const fermer = useCallback(() => {
    if (history.state?.recherche) history.back();
    else onClose();
  }, [onClose]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentes(lireRecentes());
    setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") fermer(); };
    document.addEventListener("keydown", onKey);

    /*
     * La page dessous est immobilisée, vraiment.
     *
     * `overflow: hidden` sur la racine ne suffit pas sur iPhone : le doigt
     * continue d'entraîner la page, la fenêtre de recherche reste fixe
     * par-dessus, et le geste semble ne rien faire. Avec le clavier ouvert,
     * l'écran se met en plus à rebondir. Vu de l'utilisateur, la recherche est
     * bloquée.
     *
     * La seule méthode qui tienne sur iPhone est de sortir la page du flux, à
     * sa position exacte, puis de l'y remettre à la fermeture. Le décalage que
     * cette méthode provoquait vient d'un retour à zéro ; on retient donc la
     * position et on la rétablit.
     */
    const y = window.scrollY;
    const style = document.body.style;
    const memoire = { position: style.position, top: style.top, left: style.left, right: style.right, width: style.width };
    style.position = "fixed";
    style.top = `-${y}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      style.position = memoire.position;
      style.top = memoire.top;
      style.left = memoire.left;
      style.right = memoire.right;
      style.width = memoire.width;
      window.scrollTo(0, y);
    };
  }, [fermer]);

  /*
   * Seule la dernière frappe décide de ce qui s'affiche.
   *
   * Les réponses n'arrivent pas dans l'ordre où elles sont parties : en
   * écrivant vite plusieurs recherches de suite, une réponse vide partie plus
   * tôt revenait après la bonne et effaçait les résultats. L'écran annonçait
   * alors « Aucun résultat » pour un nom parfaitement juste, et rien ne le
   * corrigeait tant qu'on ne changeait pas la saisie.
   *
   * Chaque recherche porte donc un numéro, et une réponse dont le numéro n'est
   * plus le dernier est ignorée. La précédente est annulée au passage, pour ne
   * pas laisser courir une requête dont on ne veut plus.
   */
  const dernierRef = useRef(0);
  const controleurRef = useRef<AbortController | null>(null);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    controleurRef.current?.abort();
    const numero = ++dernierRef.current;
    if (!q.trim()) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controleur = new AbortController();
      controleurRef.current = controleur;
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(q.trim())}`, { signal: controleur.signal });
        const data = await res.json();
        if (numero !== dernierRef.current) return;
        setSuggestions(data.companies ?? []);
      } catch {
        if (numero === dernierRef.current) setSuggestions([]);
      } finally {
        if (numero === dernierRef.current) setLoading(false);
      }
    }, 150);
  }, []);

  // La recherche est lancee par la frappe, et son resultat est un etat :
  // c'est le seul endroit ou il peut etre pose.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { search(query); }, [query, search]);

  /*
   * La fenetre couvre tout l'ecran, et recule ses resultats au-dessus du
   * clavier.
   *
   * Premiere tentative : raccourcir la fenetre a la hauteur visible. C'etait
   * pire. Sur iPhone la page ne bouge pas quand le clavier monte ; une fenetre
   * raccourcie laissait donc voir la page dessous, entre son bord et le
   * clavier. Le fond doit couvrir tout l'ecran, toujours.
   *
   * Ce qui change, c'est la place laissee aux resultats : on retranche la
   * hauteur du clavier au bas de la liste, sinon les dernieres lignes sont
   * derriere lui et inatteignables. Aucune unite CSS ne decrit le clavier,
   * seul visualViewport le connait.
   */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    // La hauteur ne se repose que lorsqu'elle change vraiment : le clavier
    // envoie une rafale d'événements en montant et en descendant, et chacun
    // refaisait la liste pour la même valeur.
    const suivre = () => {
      const hauteur = Math.max(0, Math.round(window.innerHeight - vv.height));
      setClavier(actuel => (Math.abs(actuel - hauteur) > 2 ? hauteur : actuel));
    };
    suivre();
    vv.addEventListener("resize", suivre);
    return () => { vv.removeEventListener("resize", suivre); };
  }, []);

  /*
   * Le geste de retour ferme la recherche.
   *
   * La fenetre n'est pas une page : elle se superpose a celle qu'on regardait.
   * Glisser vers l'arriere quittait donc cette page, et la recherche restait
   * affichee par-dessus la precedente. On ajoute une entree d'historique a
   * l'ouverture, que le geste consomme : il ferme la recherche, et la page
   * dessous ne bouge pas.
   */
  useEffect(() => {
    history.pushState({ recherche: true }, "");
    const retour = () => onClose();
    window.addEventListener("popstate", retour);
    return () => window.removeEventListener("popstate", retour);
  }, [onClose]);

  const ouvrir = (e: Suggestion) => {
    setRecentes(ajouterRecente({ id: e.id, name: e.name, city: e.city, sector: e.sector }));
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0,
        zIndex: 10100,
        background: "var(--bg)",
        display: "flex", flexDirection: "column",
        animation: "gsIn 0.15s ease both",
        overscrollBehavior: "none",
      }}
    >
      <style>{`
        @keyframes gsIn { from { opacity: 0; } to { opacity: 1; } }
        .gs-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          text-decoration: none;
          cursor: pointer;
          transition: background 0.1s;
        }
        .gs-row:active { background: var(--surface2); }
        @media (hover: hover) { .gs-row:hover { background: var(--surface2); } }
        .gs-scroll { overflow-y: auto; flex: 1; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y; }
        .gs-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Top bar — fixed height, never moves */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        background: "var(--bg)",
      }}>
        <button
          onClick={fermer}
          aria-label="Fermer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: "var(--text)", flexShrink: 0 }}
        >
          <ArrowLeft size={21} aria-hidden="true" />
        </button>

        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && suggestions[0]) { ouvrir(suggestions[0]); router.push(`/company/${suggestions[0].id}`); }
              if (e.key === "Escape") fermer();
            }}
            placeholder="Rechercher une entreprise…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="search"
            style={{
              width: "100%", height: 42, borderRadius: 10,
              background: "var(--surface2)", border: "1px solid var(--border2)",
              padding: "0 36px 0 38px", fontSize: 16, color: "var(--text)",
              outline: "none", boxSizing: "border-box",
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setSuggestions([]); inputRef.current?.focus(); }}
              aria-label="Effacer"
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {/* Le clavier se retire des qu'on fait defiler.
          Il occupe la moitie de l'ecran : le garder ouvert pendant qu'on
          parcourt une liste, c'est parcourir une liste dans une fente. C'est
          ce que font les applications, et c'est aussi ce qui evite que la
          page se decroche derriere lui sur iPhone. */}
      <div
        className="gs-scroll"
        onTouchStart={() => {
          // Une seule fois, au tout début du geste.
          //
          // C'était posé sur `onTouchMove` : l'événement part des dizaines de
          // fois par seconde, et chacune appelait `blur()`. Sur iPhone, chaque
          // appel redemande le retrait du clavier, la fenêtre visible change de
          // hauteur, l'état suit, et la liste se refait pendant qu'on la fait
          // défiler. Le défilement se bloquait net.
          if (document.activeElement === inputRef.current) inputRef.current?.blur();
        }}
        style={{ paddingBottom: clavier }}
      >
        {loading && (
          <div style={{ padding: "16px 20px", fontSize: 13, color: "var(--text-muted)" }}>Recherche…</div>
        )}

        {!loading && query && suggestions.length === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Aucun résultat</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Aucune entreprise pour « {query} »</p>
          </div>
        )}

        {suggestions.map(s => (
          <Link
            key={s.id}
            href={`/company/${s.id}`}
            prefetch={false}
            onClick={() => ouvrir(s)}
            className="gs-row"
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.name}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.city} · {s.sector}</p>
            </div>
            <Search size={13} color="var(--text-muted)" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.35 }} />
          </Link>
        ))}

        {/* Ce qu'on vient chercher en rouvrant la loupe.
            On revient rarement sur une recherche neuve, on revient sur celle
            d'hier. La phrase d'accueil ne s'affiche donc que la premiere
            fois, quand il n'y a rien a reprendre. */}
        {!query && recentes.length > 0 && (
          <>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px 10px",
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Récentes</p>
              <button
                type="button"
                onClick={() => setRecentes(viderRecentes())}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", fontFamily: "inherit" }}
              >
                Tout effacer
              </button>
            </div>
            {recentes.map(r => (
              <div key={r.id} className="gs-row" style={{ cursor: "default" }}>
                <Link
                  href={`/company/${r.id}`}
                  prefetch={false}
                  onClick={() => ouvrir({ ...r, logo_url: null })}
                  style={{ flex: 1, minWidth: 0, textDecoration: "none" }}
                >
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.name}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.city} · {r.sector}</p>
                </Link>
                {/* La croix retire la ligne, et rien d'autre : elle ne doit
                    pas ouvrir la fiche par-dessus le marche. */}
                <button
                  type="button"
                  aria-label={`Retirer ${r.name} des recherches récentes`}
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setRecentes(retirerRecente(r.id)); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, flexShrink: 0, marginRight: -6,
                    background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                  }}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            ))}
          </>
        )}

        {!query && recentes.length === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Rechercher une entreprise</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Nom, ville ou secteur d&apos;activité</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
