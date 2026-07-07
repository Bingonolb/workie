export default function Loading() {
  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px 100px" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      {/* Header skeleton */}
      <div style={{ height: 120, borderRadius: 20, background: "var(--surface2)", marginBottom: 20, animation: "pulse 1.5s ease-in-out infinite" }} />
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ height: 80, borderRadius: 16, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        <div style={{ height: 480, borderRadius: 18, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ height: 280, borderRadius: 18, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "0.1s" }} />
          <div style={{ height: 100, borderRadius: 18, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "0.2s" }} />
        </div>
      </div>
    </div>
  );
}
