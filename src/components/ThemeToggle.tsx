"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 34, borderRadius: 8,
        background: "var(--surface2)", border: "1px solid var(--border2)",
        color: "var(--text-muted)", cursor: "pointer",
        transition: "all 0.2s",
        flexShrink: 0,
      }}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
