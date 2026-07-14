"use client";

import { ExternalLink } from "lucide-react";
import { trackJobApplyClick } from "@/lib/actions/business";

export function JobApplyButton({ jobId, companyId, applyUrl }: { jobId: string; companyId: string; applyUrl: string }) {
  const handleClick = () => {
    trackJobApplyClick(jobId, companyId);
  };

  return (
    <a
      href={applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 20px", borderRadius: 10, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}
    >
      Postuler <ExternalLink size={13} />
    </a>
  );
}
