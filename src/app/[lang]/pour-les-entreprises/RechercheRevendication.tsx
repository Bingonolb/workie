"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";

type Resultat = { id: string; slug: string | null; name: string; city: string; sector: string };

/**
 * « Trouvez votre entreprise » : la recherche du site, branchée directement
 * sur la revendication. Une RH tape son nom et arrive sur sa fiche à gérer,
 * sans passer par Explorer.
 */
export function RechercheRevendication({ id = "trouver", creation = false }: { id?: string; creation?: boolean } = {}) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Resultat[]>([]);
  const [charge, setCharge] = useState(false);
  const minuteur = useRef<number | null>(null);

  useEffect(() => {
    if (minuteur.current) window.clearTimeout(minuteur.current);
    const terme = q.trim();
    // Sous 2 lettres, la liste n'est pas affichée : rien à vider.
    if (terme.length < 2) return;
    minuteur.current = window.setTimeout(async () => {
      setCharge(true);
      try {
        const r = await fetch(`/api/companies/search?q=${encodeURIComponent(terme)}`);
        const d = await r.json();
        setRes(((d.companies ?? []) as Resultat[]).filter(c => c.slug).slice(0, 6));
      } catch { setRes([]); }
      setCharge(false);
    }, 220);
  }, [q]);

  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <label htmlFor={id} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Nom de votre entreprise</label>
      <div style={{ position: "relative" }}>
        <Search size={18} aria-hidden="true" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input id={id} value={q} onChange={e => setQ(e.target.value)} placeholder="Nom de votre entreprise" autoComplete="off"
          style={{ width: "100%", padding: "16px 16px 16px 46px", borderRadius: 14, border: "1px solid var(--border2)", background: "var(--surface)", color: "var(--text)", fontSize: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }} />
      </div>
      {q.trim().length >= 2 && (
        <div style={{ marginTop: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          {res.length === 0 ? (
            <p style={{ padding: "14px 16px", fontSize: 14, color: "var(--text-muted)" }}>
              {charge ? "Recherche…" : creation
                ? <>Aucune fiche trouvée. <Link href="/creer-entreprise" style={{ color: "var(--brand)", fontWeight: 700 }}>Créez la fiche de votre entreprise</Link></>
                : <>Aucune fiche trouvée. Votre entreprise n&apos;est pas encore sur Workie ? Écrivez à contact@workie.ch.</>}
            </p>
          ) : [...res.map(c => (
            <Link key={c.id} href={`/entreprise/${c.slug}?gerer=1`} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              padding: "13px 16px", borderTop: "1px solid var(--border)", textDecoration: "none", color: "var(--text)",
            }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{c.sector} · {c.city}</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand)", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                Voir la fiche <ArrowRight size={14} aria-hidden="true" />
              </span>
            </Link>
          )), ...(creation && !charge ? [
            <Link key="creer" href="/creer-entreprise" style={{ display: "block", padding: "12px 16px", borderTop: "1px solid var(--border)", fontSize: 13.5, color: "var(--text-muted)", textDecoration: "none" }}>
              Pas dans la liste ? <span style={{ color: "var(--brand)", fontWeight: 700 }}>Créez la fiche de votre entreprise</span>
            </Link>,
          ] : [])]}
        </div>
      )}
    </div>
  );
}
