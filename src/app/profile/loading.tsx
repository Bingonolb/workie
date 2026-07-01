export default function Loading() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 32px", display: "grid", gridTemplateColumns: "280px 1fr", gap: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ height: 320, borderRadius: 20, background: "#e8e8e8", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 180, borderRadius: 20, background: "#e8e8e8", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <div style={{ height: 480, borderRadius: 20, background: "#e8e8e8", animation: "pulse 1.5s ease-in-out infinite" }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
