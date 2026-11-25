import Link from "next/link";
import { notFound } from "next/navigation";
import { ficheTestVisible } from "@/lib/fichesTest";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";
import { etatRevendication } from "@/lib/actions/revendication";
import { urlFiche } from "@/lib/urlFiche";
import { domaineOfficiel } from "@/lib/domaineEntreprise";
import { revendicationOuverte } from "@/lib/ouverture";
import { NavbarClient } from "@/components/NavbarClient";
import { CoverImage } from "@/components/CoverImage";
import { ParcoursRevendication } from "./ParcoursRevendication";
import { meta } from "@/i18n/meta";
import { tServeur, langueDeLaPage } from "@/i18n/page";
import { nomSecteur } from "@/i18n/secteurs";
import { nomVille } from "@/i18n/lieux";

export const dynamic = "force-dynamic";
export const generateMetadata = () => meta({ titre: "revend.metaTitre", indexer: false });

export default async function PageRevendiquer({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Fermée au public tant que l'offre entreprise n'est pas ouverte.
  if (!revendicationOuverte) notFound();
  // Ouverte sans compte : le parcours Workie Business crée le compte avec la demande.
  const user = await getUser();

  const [{ data }, enLigne] = await Promise.all([
    createAdminClient().from("companies")
      .select("id, slug, name, sector, city, cover_url, cover_color, website_url").eq("slug", slug).maybeSingle(),
    getSecteursEnLigne(),
  ]);
  const c = data as { id: string; slug: string; name: string; sector: string; city: string; cover_url: string | null; cover_color: string | null; website_url: string | null } | null;
  if (!c || (!enLigne.includes(c.sector) && !ficheTestVisible(c.slug))) notFound();

  const etat = await etatRevendication(c.id);
  const langue = await langueDeLaPage();
  const t = await tServeur();

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <NavbarClient />
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "28px 16px 64px" }}>
        <Link href={urlFiche(c)} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
          {t("revend.retourFiche")}
        </Link>

        <div style={{
          marginTop: 16, display: "flex", alignItems: "center", gap: 14,
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 14,
        }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", position: "relative", flexShrink: 0, background: c.cover_color ?? "var(--surface3)" }}>
            <CoverImage src={c.cover_url} color={c.cover_color} sizes="64px" vignette />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--brand)" }}>Workie Business</span> {t("revend.gererLaFiche")}
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{nomSecteur(c.sector, langue)} · {nomVille(c.city, langue)}</p>
          </div>
        </div>

        <ParcoursRevendication companyId={c.id} slug={c.slug} domaine={domaineOfficiel(c.website_url)} connecte={!!user} etatInitial={etat} />
      </main>
    </div>
  );
}
