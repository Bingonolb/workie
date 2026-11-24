"use client";

export type VueListe = "entreprises" | "offres";

/**
 * Entreprises | Offres : ce que l'on regarde. Le même sélecteur dans
 * Explorer, le swipe et les favoris : deux positions de même poids, visibles
 * sans chercher, sans ajouter de bouton au menu.
 */
export function SelecteurVue({ vue, onChange, label = "Ce que vous explorez" }: { vue: VueListe; onChange: (v: VueListe) => void; label?: string }) {
  return (
    <div role="group" aria-label={label} className="selecteur-vue">
      <style>{`
        .selecteur-vue { display: inline-flex; height: 42px; padding: 3px; border-radius: 12px; background: var(--surface2); border: 1px solid var(--border); }
        .selecteur-vue button { height: 100%; padding: 0 16px; border: 0; border-radius: 9px; background: transparent; color: var(--text-muted);
          font: inherit; font-size: 13.5px; font-weight: 650; cursor: pointer; transition: background .15s, color .15s; }
        .selecteur-vue button[aria-pressed="true"] { background: var(--surface); color: var(--text); box-shadow: 0 1px 3px rgba(16,19,25,.12); }
        .selecteur-vue button:focus-visible { outline: 2px solid var(--brand); outline-offset: 1px; }
        @media (max-width: 380px) { .selecteur-vue button { padding: 0 12px; font-size: 13px; } }
      `}</style>
      <button type="button" aria-pressed={vue === "entreprises"} onClick={() => onChange("entreprises")}>Entreprises</button>
      <button type="button" aria-pressed={vue === "offres"} onClick={() => onChange("offres")}>Offres</button>
    </div>
  );
}
