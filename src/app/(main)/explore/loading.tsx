export default function Loading() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 32px 80px" }}>
      <div style={{ height: 38, width: 200, borderRadius: 10, background: "var(--surface2)", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 20, width: 140, borderRadius: 8, background: "var(--surface2)", marginBottom: 32, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 48, borderRadius: 12, background: "var(--surface2)", marginBottom: 20, animation: "pulse 1.5s ease-in-out infinite" }} />
      {/* Matches the real grid: same columns, same 28px gap, same card height
          (210px cover + ~130px body) so there is no layout jump on hydration. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 28 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeleton-card" style={{ borderRadius: 20, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        /* Heights measured against the rendered CompanyCard at each breakpoint
           (cover + body) so the skeleton→content swap doesn't shift the page. */
        .skeleton-card { height: 350px; }
        @media (max-width: 900px) { .skeleton-card { height: 330px; } }
        @media (max-width: 480px) { .skeleton-card { height: 312px; } }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-card { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
