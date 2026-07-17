"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export function WelcomeModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      setVisible(true);
      // Try to get first name from Supabase session
      import("@/lib/supabase/client").then(({ createClient }) => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          const name = data.user?.user_metadata?.first_name as string | undefined;
          if (name) setFirstName(name);
        });
      });
    }
  }, [searchParams]);

  function close() {
    setVisible(false);
    // Remove ?welcome=1 from URL without reload
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.delete("welcome");
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          zIndex: 10200, backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10201, width: "min(420px, calc(100vw - 40px))",
        background: "var(--surface, #111827)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        animation: "wm-in 0.25s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Gradient top strip */}
        <div style={{ height: 5, background: "linear-gradient(90deg,#8b5cf6,#f97316)" }} />

        <div style={{ padding: "32px 32px 28px" }}>
          {/* Icon */}
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: "linear-gradient(135deg,#8b5cf6,#f97316)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, marginBottom: 20,
          }}>
            👋
          </div>

          <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 900, color: "var(--text, #fff)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {firstName ? `Bienvenue ${firstName} !` : "Bienvenue sur Workie !"}
          </h2>

          <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-muted, rgba(255,255,255,0.5))", lineHeight: 1.6 }}>
            Ton compte est confirmé. Tu peux maintenant explorer les entreprises suisses, consulter les salaires et lire les vrais avis de leurs employés.
          </p>

          <p style={{ margin: "0 0 28px", fontSize: 14, color: "var(--text-muted, rgba(255,255,255,0.5))", lineHeight: 1.6 }}>
            100% anonyme. Sans filtre.
          </p>

          <button
            onClick={close}
            style={{
              width: "100%", background: "linear-gradient(135deg,#8b5cf6,#f97316)",
              color: "#fff", fontWeight: 800, fontSize: 15, border: "none",
              borderRadius: 12, padding: "14px 0", cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            Explorer les entreprises →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes wm-in {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
