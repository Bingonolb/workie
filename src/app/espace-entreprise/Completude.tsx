import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import type { FicheGeree, Offre } from "@/lib/actions/espaceEntreprise";

/**
 * « Votre fiche est complète à x % » : ce qui reste à faire, chaque point
 * menant à l'endroit où le faire. Une fiche complète est plus consultée, et
 * c'est l'argument qui fait revenir l'entreprise dans son espace.
 */
export function Completude({ c, offres }: { c: FicheGeree; offres: Offre[] }) {
  const points = [
    { ok: (c.description ?? "").trim().length >= 200, t: "Une présentation d'au moins quelques lignes", href: "/espace-entreprise/fiche" },
    { ok: !!c.cover_url, t: "Une bannière", href: "/espace-entreprise/fiche" },
    { ok: !!c.logo_url, t: "Votre logo", href: "/espace-entreprise/fiche" },
    { ok: !!c.website_url, t: "Le lien vers votre page carrière", href: "/espace-entreprise/fiche" },
    { ok: (c.langues ?? []).length > 0, t: "Vos langues de travail", href: "/espace-entreprise/fiche" },
    { ok: !!c.employee_range, t: "La taille de l'entreprise", href: "/espace-entreprise/fiche" },
    { ok: offres.some(o => o.is_active), t: "Au moins une offre d'emploi", href: "/espace-entreprise/offres" },
  ];
  const faits = points.filter(p => p.ok).length;
  const pct = Math.round((faits / points.length) * 100);
  if (pct === 100) return null;
  const restants = points.filter(p => !p.ok);

  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px", display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Votre fiche est complète à {pct} %</h2>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Une fiche complète donne plus envie de postuler.</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "var(--surface2)", overflow: "hidden" }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Fiche complète">
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--brand)", borderRadius: 4 }} />
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
        {restants.map(p => (
          <li key={p.t}>
            <Link href={p.href} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text)", textDecoration: "none" }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--border2)", flexShrink: 0 }} />
              {p.t} <ArrowRight size={14} color="var(--text-muted)" aria-hidden="true" />
            </Link>
          </li>
        ))}
        {points.filter(p => p.ok).length > 0 && (
          <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
            <Check size={16} color="#10b981" aria-hidden="true" /> {faits} point{faits > 1 ? "s" : ""} déjà en place
          </li>
        )}
      </ul>
    </section>
  );
}
