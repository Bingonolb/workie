"use client";

import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 50 * 60 * 1000; // 50 min — before the 1h access token expiry

async function refresh() {
  try {
    await fetch("/api/auth/refresh", { method: "GET", credentials: "include" });
  } catch {
    // Network error — will retry on next interval
  }
}

export function SessionKeepAlive() {
  useEffect(() => {
    // Refresh immediately on mount to fix any token that expired while the tab was closed
    refresh();

    // Then refresh every 50 minutes to keep the session alive indefinitely
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);

    // Also refresh when the user comes back to the tab after being away
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
