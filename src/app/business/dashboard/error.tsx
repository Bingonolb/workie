"use client";

export default function DashboardError({ error }: { error: Error & { digest?: string } }) {
  return (
    <div style={{ padding: 40 }}>
      <p style={{ color: "red", fontWeight: 700 }}>Dashboard Error</p>
      <p style={{ fontFamily: "monospace", marginTop: 8 }}>digest: {error.digest ?? "none"}</p>
      <p style={{ fontFamily: "monospace", marginTop: 4 }}>message: {error.message ?? "hidden"}</p>
    </div>
  );
}
