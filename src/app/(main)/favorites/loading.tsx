export default function Loading() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 32px 80px" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ height: 36, width: 180, borderRadius: 10, background: "var(--surface2)", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 18, width: 140, borderRadius: 8, background: "var(--surface2)", marginBottom: 32, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: 260, borderRadius: 20, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.07}s` }} />
        ))}
      </div>
    </div>
  );
}
