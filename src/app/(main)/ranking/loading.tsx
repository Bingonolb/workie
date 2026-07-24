export default function Loading() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ height: 40, width: 220, borderRadius: 10, background: "var(--surface2)", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 18, width: 160, borderRadius: 8, background: "var(--surface2)", marginBottom: 28, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ borderRadius: 20, background: "var(--surface)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ height: 52, background: "var(--surface2)", borderBottom: "1px solid var(--border)" }} />
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{
            height: 64, borderBottom: "1px solid var(--border)",
            background: "var(--surface)", padding: "0 20px",
            display: "flex", alignItems: "center", gap: 16,
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.04}s`,
          }}>
            <div style={{ width: 32, height: 16, borderRadius: 4, background: "var(--surface2)" }} />
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--surface2)", flexShrink: 0 }} />
            <div style={{ flex: 1, height: 14, borderRadius: 4, background: "var(--surface2)", maxWidth: 200 }} />
            <div style={{ width: 80, height: 20, borderRadius: 4, background: "var(--surface2)", marginLeft: "auto" }} />
            <div style={{ width: 60, height: 22, borderRadius: 4, background: "var(--surface2)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
