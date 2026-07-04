"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Params = { sector?: string; city?: string; q?: string; view?: string; page?: string };

function buildHref(params: Params, page: number) {
  const p = new URLSearchParams();
  if (params.sector) p.set("sector", params.sector);
  if (params.city) p.set("city", params.city);
  if (params.q) p.set("q", params.q);
  if (params.view) p.set("view", params.view);
  p.set("page", String(page));
  return `/explore?${p.toString()}`;
}

export function Pagination({ page, pageCount, total, params }: {
  page: number;
  pageCount: number;
  total: number;
  params: Params;
}) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 36, height: 36, borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text-muted)",
    fontWeight: 600, fontSize: 13,
    textDecoration: "none",
    transition: "all 0.15s",
  };

  const activeBtnStyle: React.CSSProperties = {
    ...btnBase,
    background: "linear-gradient(135deg, #8b5cf6, #f97316)",
    border: "none",
    color: "#fff",
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 8, marginTop: 40, flexWrap: "wrap",
    }}>
      {/* Prev */}
      {page > 1 ? (
        <Link href={buildHref(params, page - 1)} style={btnBase}>
          <ChevronLeft size={16} />
        </Link>
      ) : (
        <span style={{ ...btnBase, opacity: 0.3, cursor: "not-allowed" }}>
          <ChevronLeft size={16} />
        </span>
      )}

      {/* Page numbers */}
      {pages.map(p => {
        const show = p === 1 || p === pageCount || Math.abs(p - page) <= 2;
        const showEllipsis = !show && (p === 2 || p === pageCount - 1);
        if (showEllipsis) return (
          <span key={p} style={{ ...btnBase, cursor: "default", letterSpacing: 1 }}>…</span>
        );
        if (!show) return null;
        return (
          <Link key={p} href={buildHref(params, p)} style={p === page ? activeBtnStyle : btnBase}>
            {p}
          </Link>
        );
      })}

      {/* Next */}
      {page < pageCount ? (
        <Link href={buildHref(params, page + 1)} style={btnBase}>
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span style={{ ...btnBase, opacity: 0.3, cursor: "not-allowed" }}>
          <ChevronRight size={16} />
        </span>
      )}

      <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
        Page {page} / {pageCount} · {total} entreprises
      </span>
    </div>
  );
}
