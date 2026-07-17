"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("workie-theme") as Theme | null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = (t: Theme) => {
      setTheme(t);
      if (t === "light") document.documentElement.classList.add("light");
      else document.documentElement.classList.remove("light");
    };

    if (saved === "light" || saved === "dark") {
      apply(saved);
    } else {
      // No saved preference → follow system
      apply(systemDark.matches ? "dark" : "light");
    }

    // Live-update when system theme changes (only if no manual preference saved)
    const onSystemChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("workie-theme")) {
        apply(e.matches ? "dark" : "light");
      }
    };
    systemDark.addEventListener("change", onSystemChange);
    return () => systemDark.removeEventListener("change", onSystemChange);
  }, []);

  const toggle = () => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("workie-theme", next);
      if (next === "light") document.documentElement.classList.add("light");
      else document.documentElement.classList.remove("light");
      return next;
    });
  };

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
