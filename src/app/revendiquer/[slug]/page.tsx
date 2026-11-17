import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";
import { etatRevendication } from "@/lib/actions/revendication";
import { urlFiche } from "@/lib/urlFiche";
import { domaineOfficiel } from "@/lib/domaineEntreprise";
import { NavbarClient } from "@/components/NavbarClient";
import { CoverImage } from "@/components/CoverImage";
import { ParcoursRevendication } from "./ParcoursRevendication";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gérer cette fiche", robots: { index: false, follow: false } };

export default async function PageRevendiquer({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect(`/login?next=/revendiquer/${encodeURIComponent(slug)}`);

  const [{ data }, enLigne] = await Promise.all([
    createAdminClient().from("companies")
      .select("id, slug, name, sector, city, cover_url, cover_color, website_url").eq("slug", slug).maybeSingle(),
    getSecteursEnLigne(),
  ]);
  const c = data as { id: string; slug: string; name: string; sector: string; city: string; cover_url: string | null; cover_color: string | null; website_url: string | null } | null;
  if (!c || !enLigne.includes(c.sector)) notFound();

  const etat = await etatRevendication(c.id);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <NavbarClient />
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "28px 16px 64px" }}>
        <Link href={urlFiche(c)} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
          ← Retour à la fiche
        </Link>

        <div style={{
          marginTop: 16, display: "flex", alignItems: "center", gap: 14,
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 14,
        }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", position: "relative", flexShrink: 0, background: c.cover_color ?? "var(--surface3)" }}>
            <CoverImage src={c.cover_url} color={c.cover_color} sizes="64px" vignette />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Gérer la fiche de</p>
            <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{c.sector} · {c.city}</p>
          </div>
        </div>

        <ParcoursRevendication companyId={c.id} slug={c.slug} domaine={domaineOfficiel(c.website_url)} etatInitial={etat} />
      </main>
    </div>
  );
}
