export default function Loading() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 24px 80px" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ height: 42, width: 280, borderRadius: 10, background: "var(--surface2)", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 18, width: 200, borderRadius: 8, background: "var(--surface2)", marginBottom: 32, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[100, 80, 90, 110].map((w, i) => (
          <div key={i} style={{ height: 36, width: w, borderRadius: 20, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: 130, borderRadius: 16, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
    </div>
  );
}
