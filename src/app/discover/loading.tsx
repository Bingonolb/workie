export default function Loading() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 32px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Card skeleton */}
        <div style={{ width: "100%", maxWidth: 420, height: 580, borderRadius: 20, background: "#e8e8e8", animation: "pulse 1.5s ease-in-out infinite" }} />
        {/* Buttons skeleton */}
        <div style={{ display: "flex", gap: 20, marginTop: 28 }}>
          {[52, 64, 64, 52].map((size, i) => (
            <div key={i} style={{ width: size, height: size, borderRadius: "50%", background: "#e8e8e8", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ height: 200, borderRadius: 16, background: "#e8e8e8", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 280, borderRadius: 16, background: "#e8e8e8", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
