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
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.delete("welcome");
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  if (!visible) return null;

  return (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 10200, backdropFilter: "blur(6px)" }} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bienvenue sur Workie"
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10201,
          width: "min(460px, calc(100vw - 32px))",
          background: "#ffffff",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04)",
          animation: "wm-in 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}>

        {/* Top gradient band */}
        <div style={{ height: 200, background: "linear-gradient(135deg, #8b5cf6 0%, #f97316 100%)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.08)", top: -40, right: -40 }} />
          <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)", bottom: -20, left: 30 }} />

          <div style={{ position: "relative", textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 8, lineHeight: 1 }}>🎉</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Compte confirmé
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "32px 36px 36px" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            {firstName ? `Bienvenue ${firstName} ! 👋` : "Bienvenue sur Workie ! 👋"}
          </h2>

          <p style={{ margin: "0 0 24px", fontSize: 15, color: "#6b7280", lineHeight: 1.65 }}>
            Ton compte est prêt. Explore les vraies conditions de travail des entreprises suisses — avis anonymes, salaires réels, culture d'entreprise sans filtre.
          </p>

          {/* Features list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {[
              { icon: "⭐", text: "Avis 100% anonymes d'employés vérifiés" },
              { icon: "💰", text: "Salaires réels partagés par la communauté" },
              { icon: "🔍", text: "1 733 entreprises suisses répertoriées" },
            ].map(f => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f9fafb", border: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>

          <button onClick={close} style={{
            width: "100%",
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            color: "#fff", fontWeight: 800, fontSize: 15, border: "none",
            borderRadius: 14, padding: "15px 0", cursor: "pointer",
            letterSpacing: "-0.01em",
            boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
          }}>
            Explorer les entreprises →
          </button>

          <p style={{ margin: "14px 0 0", textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
            Toujours anonyme · Jamais de spam
          </p>
        </div>
      </div>

      <style>{`
        @keyframes wm-in {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
