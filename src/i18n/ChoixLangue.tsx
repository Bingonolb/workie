"use client";

import { COOKIE_LANGUE, NOM_LANGUE, OUVERTES, type Langue } from "./config";
import { useLangue, useT } from "./FournisseurLangue";

/**
 * Le choix de la langue du site (profil, pied de page).
 *
 * La langue est gardée dans un cookie, valable un an : le middleware sert
 * ensuite chaque page dans cette langue, à la même adresse. On recharge la
 * page plutôt que de la mettre à jour sur place : tout ce qui est déjà affiché
 * (menus, textes en cache du routeur) repart ainsi dans la nouvelle langue,
 * sans mélange.
 *
 * Rien à choisir tant qu'une seule langue est ouverte : le composant ne
 * s'affiche pas.
 */
/** Garde la langue (un an) et recharge la page dans cette langue, à la même adresse. */
function passerEn(l: Langue) {
  document.cookie = `${COOKIE_LANGUE}=${l}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  // Une adresse préfixée (/de/…) garderait l'ancienne langue : on revient à la racine.
  const chemin = location.pathname.replace(/^\/(fr|de|en|it)(?=\/|$)/, "") || "/";
  location.assign(chemin + location.search);
}

export function ChoixLangue({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const actuelle = useLangue();
  if (OUVERTES.length < 2) return null;

  const choisir = (l: Langue) => { if (l !== actuelle) passerEn(l); };

  return (
    <div className={`choix-langue${compact ? " choix-langue--compact" : ""}`}>
      <style>{`
        .choix-langue-liste { display: flex; flex-wrap: wrap; gap: 6px; }
        .choix-langue-liste button { height: 40px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--border2); background: var(--surface);
          color: var(--text-muted); font: inherit; font-size: 14px; font-weight: 650; cursor: pointer; }
        .choix-langue-liste button[aria-pressed="true"] { border-color: var(--text); color: var(--text); background: var(--surface2); }
        .choix-langue-liste button:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
        /* Compact (menu) : les codes, collés en un seul bouton à deux positions. */
        .choix-langue--compact .choix-langue-liste { gap: 0; padding: 3px; border-radius: 10px; border: 1px solid var(--border2); background: var(--surface2); flex-wrap: nowrap; }
        .choix-langue--compact .choix-langue-liste button { height: 30px; padding: 0 9px; border: 0; border-radius: 7px; background: transparent; font-size: 12.5px; letter-spacing: .04em; }
        .choix-langue--compact .choix-langue-liste button[aria-pressed="true"] { background: var(--surface); box-shadow: 0 1px 2px rgba(16,19,25,.15); }
      `}</style>
      {!compact && <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{t("langue.titre")}</p>}
      {!compact && <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>{t("langue.aide")}</p>}
      <div role="group" aria-label={t("langue.titre")} className="choix-langue-liste">
        {OUVERTES.map(l => (
          <button key={l} type="button" lang={l} aria-pressed={l === actuelle} onClick={() => choisir(l)}
            aria-label={compact ? NOM_LANGUE[l] : undefined} title={compact ? NOM_LANGUE[l] : undefined}>
            {compact ? l.toUpperCase() : NOM_LANGUE[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
