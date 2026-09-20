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
  const [hauteur, setHauteur] = useState("100dvh");
  const [recentes, setRecentes] = useState<EntrepriseRecente[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Portail : il n'a pas d'équivalent dans le HTML du serveur.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useLayoutEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentes(lireRecentes());
    setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    // Simple scroll lock — no body position manipulation (causes iOS jump)
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSuggestions(data.companies ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 150);
  }, []);

  // La recherche est lancee par la frappe, et son resultat est un etat :
  // c'est le seul endroit ou il peut etre pose.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { search(query); }, [query, search]);

  /*
   * La fenetre epouse la hauteur reellement visible.
   *
   * Sur iPhone, l'ouverture du clavier retrecit la zone visible sans changer
   * la hauteur de la page : une fenetre calee sur `bottom: 0` continue donc
   * derriere le clavier, et le defilement se decroche. `100dvh` suffit sur les
   * navigateurs recents ; `visualViewport` couvre les autres et le cas du
   * clavier, qu'aucune unite CSS ne decrit.
   */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const suivre = () => setHauteur(`${vv.height}px`);
    suivre();
    vv.addEventListener("resize", suivre);
    vv.addEventListener("scroll", suivre);
    return () => { vv.removeEventListener("resize", suivre); vv.removeEventListener("scroll", suivre); };
  }, []);

  const ouvrir = (e: Suggestion) => {
    setRecentes(ajouterRecente({ id: e.id, name: e.name, city: e.city, sector: e.sector }));
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: hauteur,
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
        .gs-scroll { overflow-y: auto; flex: 1; overscroll-behavior: contain; }
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
          onClick={onClose}
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
              if (e.key === "Enter" && suggestions[0]) { onClose(); router.push(`/company/${suggestions[0].id}`); }
              if (e.key === "Escape") onClose();
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
      <div className="gs-scroll" onTouchMove={() => inputRef.current?.blur()}>
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
