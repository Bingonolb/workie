export default function Loading() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 24px 80px" }}>
      <div style={{ height: 38, width: 220, borderRadius: 10, background: "var(--surface2)", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 20, width: 160, borderRadius: 8, background: "var(--surface2)", marginBottom: 32, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ height: 64, borderRadius: 14, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
