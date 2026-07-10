"use client";

import { useEffect, useRef } from "react";
import { trackCompanyView } from "@/lib/actions/business";

export function ViewTracker({ companyId }: { companyId: string }) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackCompanyView(companyId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
