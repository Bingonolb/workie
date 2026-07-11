export default function DashboardLoading() {
  return (
    <div className="biz-page" style={{ maxWidth: 1100 }}>
      <div style={{ height: 36, width: 200, borderRadius: 8, background: "var(--surface2)", marginBottom: 8 }} />
      <div style={{ height: 20, width: 300, borderRadius: 6, background: "var(--surface2)", marginBottom: 36, opacity: 0.6 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 100, borderRadius: 16, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {[1,2].map(i => <div key={i} style={{ height: 220, borderRadius: 16, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
