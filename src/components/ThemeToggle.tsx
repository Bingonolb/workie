"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { useT } from "@/i18n/FournisseurLangue";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const t = useT();
  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? t("divers.modeClair") : t("divers.modeSombre")}
      aria-label={theme === "dark" ? t("divers.modeClair") : t("divers.modeSombre")}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 34, borderRadius: 8,
        background: "var(--surface2)", border: "1px solid var(--border2)",
        color: "var(--text-muted)", cursor: "pointer",
        transition: "all 0.2s",
        flexShrink: 0,
      }}
    >
      {theme === "dark" ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
    </button>
  );
}
