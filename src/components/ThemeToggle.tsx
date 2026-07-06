"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Apparence</p>
      <div style={{ display: "flex", gap: 10 }}>
        {([
          { value: "dark", icon: <Moon size={15} />, label: "Mode sombre" },
          { value: "light", icon: <Sun size={15} />, label: "Mode clair" },
        ] as const).map(({ value, icon, label }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              onClick={() => { if (theme !== value) toggle(); }}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                gap: 8, padding: "14px 12px", borderRadius: 12, cursor: "pointer",
                border: active ? "1.5px solid #8b5cf6" : "1.5px solid var(--border2)",
                background: active ? "rgba(139,92,246,0.1)" : "var(--surface2)",
                color: active ? "#8b5cf6" : "var(--text-muted)",
                fontWeight: active ? 700 : 500, fontSize: 13,
                transition: "all 0.2s",
              }}
            >
              {icon}
              {label}
              {active && (
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                  color: "#8b5cf6", background: "rgba(139,92,246,0.15)",
                  borderRadius: 20, padding: "2px 8px",
                }}>
                  Actif
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
