export default function ReviewsLoading() {
  return (
    <div className="biz-page" style={{ maxWidth: 860 }}>
      <div style={{ height: 28, width: 180, borderRadius: 8, background: "var(--surface2)", marginBottom: 24 }} />
      {[1,2,3,4].map(i => <div key={i} style={{ height: 130, borderRadius: 16, background: "var(--surface2)", marginBottom: 12, animation: "pulse 1.5s ease-in-out infinite" }} />)}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
