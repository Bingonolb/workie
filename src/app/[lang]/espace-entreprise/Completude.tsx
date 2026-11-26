import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import type { FicheGeree, Offre } from "@/lib/actions/espaceEntreprise";
import { tServeur, langueDeLaPage } from "@/i18n/page";

/**
 * « Votre fiche est complète à x % » : ce qui reste à faire, chaque point
 * menant à l'endroit où le faire. Une fiche complète est plus consultée, et
 * c'est l'argument qui fait revenir l'entreprise dans son espace.
 */
export async function Completude({ c, offres }: { c: FicheGeree; offres: Offre[] }) {
  const t = await tServeur();
  const points = [
    { ok: (c.description ?? "").trim().length >= 200, t: t("espace.c1"), href: "/espace-entreprise/fiche" },
    { ok: !!c.cover_url, t: t("espace.c2"), href: "/espace-entreprise/fiche" },
    { ok: !!c.logo_url, t: t("espace.c3"), href: "/espace-entreprise/fiche" },
    { ok: !!c.website_url, t: t("espace.c4"), href: "/espace-entreprise/fiche" },
    { ok: (c.langues ?? []).length > 0, t: t("espace.c5"), href: "/espace-entreprise/fiche" },
    { ok: !!c.employee_range, t: t("espace.c6"), href: "/espace-entreprise/fiche" },
    { ok: offres.some(o => o.is_active), t: t("espace.c7"), href: "/espace-entreprise/offres" },
  ];
  const faits = points.filter(p => p.ok).length;
  const pct = Math.round((faits / points.length) * 100);
  if (pct === 100) return null;
  const restants = points.filter(p => !p.ok);

  return (
    <section className="carte-espace">
      <div className="carte-titre">
        <h2>{t("espace.completeA", { pct })}</h2>
        <span className="aide">{t("espace.completeAide")}</span>
      </div>
      <div style={{ padding: "16px 22px 6px" }}>
        <div style={{ height: 6, borderRadius: 3, background: "var(--surface2)", overflow: "hidden" }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t("espace.complete")}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--brand)", borderRadius: 3 }} />
        </div>
      </div>
      <ul className="liste-espace">
        {restants.map(p => (
          <li key={p.t} style={{ padding: 0 }}>
            <Link href={p.href} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 22px", color: "var(--text)", textDecoration: "none" }}>
              <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid var(--border2)", flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{p.t}</span>
              <ArrowRight size={15} color="var(--text-muted)" aria-hidden="true" />
            </Link>
          </li>
        ))}
        {faits > 0 && (
          <li style={{ color: "var(--text-muted)", fontSize: 13 }}>
            <Check size={18} color="#10b981" aria-hidden="true" /> {t("espace.pointsFaits", { n: faits })}
          </li>
        )}
      </ul>
    </section>
  );
}
