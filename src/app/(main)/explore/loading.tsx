export default function Loading() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 32px 80px" }}>
      <div style={{ height: 38, width: 200, borderRadius: 10, background: "var(--surface2)", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 20, width: 140, borderRadius: 8, background: "var(--surface2)", marginBottom: 32, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 48, borderRadius: 12, background: "var(--surface2)", marginBottom: 20, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ height: 280, borderRadius: 20, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
