"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Compass, User, LogOut, Settings } from "lucide-react";

export function MobileTopActions({ profileUrl, signOutUrl }: { profileUrl: string; signOutUrl: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {/* Explorer */}
      <Link
        href="/explore"
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "6px 11px", borderRadius: 8,
          fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
          textDecoration: "none",
          background: "var(--surface2)",
          border: "1px solid var(--border2)",
        }}
      >
        <Compass size={13} strokeWidth={2} aria-hidden="true" />
        Explorer
      </Link>

      {/* Profile dropdown */}
      <div ref={ref} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-label="Menu du profil"
          aria-expanded={open}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: 8,
            background: open ? "var(--surface3)" : "var(--surface2)",
            border: "1px solid var(--border2)",
            color: "var(--text-muted)", cursor: "pointer",
          }}
        >
          <User size={15} strokeWidth={2} aria-hidden="true" />
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            width: 200,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            overflow: "hidden",
            zIndex: 10050,
          }}>
            <Link
              href={profileUrl}
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 16px",
                fontSize: 13, fontWeight: 600, color: "var(--text)",
                textDecoration: "none",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Settings size={14} color="var(--text-muted)" aria-hidden="true" />
              Modifier le profil
            </Link>
            <a
              href={signOutUrl}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 16px",
                fontSize: 13, fontWeight: 600, color: "#ef4444",
                textDecoration: "none",
              }}
            >
              <LogOut size={14} aria-hidden="true" />
              Se déconnecter
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
