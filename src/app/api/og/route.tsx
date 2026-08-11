import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title   = searchParams.get("title")   ?? "Workie : les entreprises suisses, sans filtre.";
  const sub     = searchParams.get("sub")     ?? "Avis anonymes · Salaires · Culture";
  const rating  = searchParams.get("rating");
  const reviews = searchParams.get("reviews");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px 72px",
          background: "linear-gradient(135deg, #0d0d0f 0%, #1a0a2e 50%, #0d0d0f 100%)",
          position: "relative",
        }}
      >
        {/* Gradient orbs */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(ellipse 600px 400px at 20% 30%, rgba(139,92,246,0.25) 0%, transparent 70%)",
          display: "flex",
        }} />
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(ellipse 500px 350px at 80% 70%, rgba(249,115,22,0.18) 0%, transparent 70%)",
          display: "flex",
        }} />

        {/* Logo badge */}
        <div style={{
          position: "absolute", top: 56, left: 72,
          display: "flex", alignItems: "center", gap: "16px",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 900, color: "#fff",
          }}>W</div>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Workie</span>
          <span style={{
            fontSize: 13, fontWeight: 700, color: "#8b5cf6",
            background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)",
            borderRadius: 50, padding: "4px 12px", letterSpacing: "0.04em",
          }}>Suisse</span>
        </div>

        {/* Rating badge */}
        {rating && reviews && (
          <div style={{
            position: "absolute", top: 56, right: 72,
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)",
            borderRadius: 50, padding: "10px 20px",
          }}>
            <span style={{ fontSize: 24, color: "#f59e0b" }}>★</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>{rating}</span>
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }}>· {reviews} avis</span>
          </div>
        )}

        {/* Separator */}
        <div style={{
          width: 60, height: 4, borderRadius: 2,
          background: "linear-gradient(90deg, #8b5cf6, #f97316)",
          marginBottom: 24,
        }} />

        {/* Title */}
        <div style={{
          fontSize: title.length > 50 ? 42 : 52,
          fontWeight: 900,
          color: "#fff",
          lineHeight: 1.15,
          letterSpacing: "-1px",
          marginBottom: 18,
          maxWidth: 900,
        }}>{title}</div>

        {/* Subtitle */}
        <div style={{
          fontSize: 22,
          color: "rgba(255,255,255,0.55)",
          fontWeight: 500,
          letterSpacing: "0.01em",
        }}>{sub}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
