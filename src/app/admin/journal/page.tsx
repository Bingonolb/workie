import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ligne = { id: number; quand: string; action: string; cible: string | null; details: Record<string, unknown> | null; origine: string | null };

const LIBELLES: Record<string, string> = {
  "companies.insert": "Fiche créée",
  "companies.update": "Fiche modifiée",
  "companies.delete": "Fiche supprimée",
  "secteurs_en_ligne.insert": "Catégorie mise en ligne",
  "secteurs_en_ligne.delete": "Catégorie retirée",
  "company_claims.update": "Revendication traitée",
  "profiles.update": "Droits d'un compte modifiés",
  "ad_campaigns.update": "Statut d'une campagne modifié",
};

const ORIGINES: Record<string, string> = {
  service_role: "Admin (site)",
  authenticated: "Compte connecté",
  postgres: "Maintenance (base)",
};

function resume(l: Ligne): string {
  if (!l.details) return "";
  if (l.action.endsWith(".update")) {
    return Object.keys(l.details).join(", ");
  }
  return "";
}

/** Journal des actions d'administration : qui a fait quoi, et quand. */
export default async function Journal() {
  const supabase = await createClient();
  // Table hors des types générés.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("journal_admin" as any) as any)
    .select("id, quand, action, cible, details, origine")
    .order("quand", { ascending: false })
    .limit(300);
  const lignes = (data ?? []) as Ligne[];

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Journal des actions</h1>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--text-muted)" }}>Retour à l&apos;admin</Link>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 20 }}>
        Les 300 dernières modifications de fiches, de catégories, de droits de comptes et de campagnes.
      </p>
      {lignes.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>Aucune action enregistrée pour l&apos;instant.</p>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                {["Quand", "Action", "Concerne", "Champs", "Par"].map(t => (
                  <th key={t} style={{ padding: "10px 14px", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map(l => (
                <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                    {new Date(l.quand).toLocaleString("fr-CH", { timeZone: "Europe/Zurich", dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{LIBELLES[l.action] ?? l.action}</td>
                  <td style={{ padding: "10px 14px" }}>{l.cible}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{resume(l)}</td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap", color: "var(--text-muted)" }}>{ORIGINES[l.origine ?? ""] ?? l.origine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
