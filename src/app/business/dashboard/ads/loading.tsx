export default function AdsLoading() {
  return (
    <div className="biz-page" style={{ maxWidth: 960 }}>
      <div style={{ height: 28, width: 160, borderRadius: 8, background: "var(--surface2)", marginBottom: 28 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 70, borderRadius: 14, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
      </div>
      {[1,2,3].map(i => <div key={i} style={{ height: 110, borderRadius: 16, background: "var(--surface2)", marginBottom: 10, animation: "pulse 1.5s ease-in-out infinite" }} />)}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
