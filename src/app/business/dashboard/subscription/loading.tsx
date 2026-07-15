export default function Loading() {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "36px 24px 80px" }}>
      <div style={{ height: 32, width: 200, borderRadius: 10, background: "var(--surface2)", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 20, width: 140, borderRadius: 8, background: "var(--surface2)", marginBottom: 32, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 220, borderRadius: 20, background: "var(--surface2)", marginBottom: 16, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 52, borderRadius: 12, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
