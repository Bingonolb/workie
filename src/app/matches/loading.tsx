export default function Loading() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 32px" }}>
      <div style={{ height: 32, width: 160, borderRadius: 8, background: "#e8e8e8", marginBottom: 24, animation: "pulse 1.5s ease-in-out infinite" }} />
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 82, borderRadius: 16, background: "#e8e8e8", marginBottom: 10, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
