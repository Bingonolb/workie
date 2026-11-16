import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ficheGeree } from "@/lib/actions/espaceEntreprise";
import { NavbarClient } from "@/components/NavbarClient";
import { OngletsEspace } from "./OngletsEspace";
import { SansEntreprise } from "./SansEntreprise";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Espace entreprise", robots: { index: false, follow: false } };

export default async function LayoutEspace({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/espace-entreprise");
  const c = await ficheGeree();

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <NavbarClient />
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 16px 72px" }}>
        {c ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Espace entreprise</p>
                <h1 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800, letterSpacing: "-0.025em" }}>{c.name}</h1>
              </div>
            </div>
            <OngletsEspace slug={c.slug} />
            <div style={{ marginTop: 22 }}>{children}</div>
          </>
        ) : (
          <SansEntreprise />
        )}
      </main>
    </div>
  );
}
