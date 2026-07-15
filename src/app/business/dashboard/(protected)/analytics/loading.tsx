export default function AnalyticsLoading() {
  return (
    <div className="biz-page" style={{ maxWidth: 1000 }}>
      <div style={{ height: 28, width: 160, borderRadius: 8, background: "var(--surface2)", marginBottom: 8 }} />
      <div style={{ height: 18, width: 360, borderRadius: 6, background: "var(--surface2)", marginBottom: 32, opacity: 0.6 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 90, borderRadius: 14, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
      </div>
      <div style={{ height: 160, borderRadius: 16, background: "var(--surface2)", marginBottom: 28, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {[1,2].map(i => <div key={i} style={{ height: 200, borderRadius: 16, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
