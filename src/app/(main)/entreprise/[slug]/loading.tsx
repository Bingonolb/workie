export default function Loading() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px 80px" }}>
      <div style={{ height: 280, background: "var(--surface2)", marginBottom: 36, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ height: 100, borderRadius: 14, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 200, borderRadius: 18, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 300, borderRadius: 16, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ height: 120, borderRadius: 16, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 160, borderRadius: 16, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
