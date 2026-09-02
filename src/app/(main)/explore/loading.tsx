export default function Loading() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 32px 80px" }}>
      <div style={{ height: 38, width: 200, borderRadius: 10, background: "var(--surface2)", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 20, width: 140, borderRadius: 8, background: "var(--surface2)", marginBottom: 32, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 48, borderRadius: 12, background: "var(--surface2)", marginBottom: 20, animation: "pulse 1.5s ease-in-out infinite" }} />
      {/* Le squelette copie la grille reelle : memes colonnes, memes
          gouttieres, memes hauteurs de carte, faute de quoi la page se
          reorganise au moment ou le contenu arrive. */}
      <div className="skeleton-grille" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "44px 30px" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeleton-card" style={{ borderRadius: 20, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        /* Hauteurs relevees sur la carte rendue, aux trois paliers ou la
           couverture change de hauteur. Elles valaient 350, 330 et 312 quand la
           carte portait une rangee d'etiquettes et une rangee de puces ; la
           carte en a perdu deux et ces valeurs ne correspondaient plus a rien. */
        .skeleton-card { height: 325px; }
        @media (max-width: 900px) { .skeleton-card { height: 365px; } }
        @media (max-width: 768px) { .skeleton-grille { gap: 32px !important; } }
        @media (max-width: 480px) { .skeleton-card { height: 375px; } }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-card { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
