import { statsFiche, ficheGeree, listerOffres } from "@/lib/actions/espaceEntreprise";
import { Completude } from "./Completude";
import { Activite } from "./Activite";
import { CANTON_NAMES } from "@/lib/types";
import { tServeur, langueDeLaPage } from "@/i18n/page";
import { nomCanton } from "@/i18n/cantons";
import { nomSecteur } from "@/i18n/secteurs";

const PERIODES = [7, 30, 90] as const;

export default async function TableauDeBord({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const periode = (PERIODES as readonly number[]).includes(Number(p)) ? (Number(p) as 7 | 30 | 90) : 30;
  const [s, c, offres, t, langue] = await Promise.all([statsFiche(periode), ficheGeree(), listerOffres(), tServeur(), langueDeLaPage()]);
  // La langue passe par la requête, jamais par une variable de module partagée.
  const nf = (n: number) => Number(n).toLocaleString(langue === "de" ? "de-CH" : "fr-CH");
  if (!s) return <p style={{ color: "var(--text-muted)" }}>{t("espace.statsIndispo")}</p>;

  // Seuls les vrais cantons sont nommés ; une région étrangère enregistrée
  // avant le correctif rejoint les visites non localisées.
  const cantons = s.cantons.filter(x => CANTON_NAMES[x.canton]).map(x => ({ nom: nomCanton(x.canton, langue, CANTON_NAMES[x.canton]), n: Number(x.n) }));
  const nonLocalisees = s.non_localisees + s.cantons.filter(x => !CANTON_NAMES[x.canton]).reduce((a, x) => a + Number(x.n), 0);
  const totalVisites = cantons.reduce((a, x) => a + x.n, 0) + nonLocalisees;
  const lignesCantons = [...cantons, ...(nonLocalisees ? [{ nom: t("espace.nonLocalisees"), n: nonLocalisees }] : [])];
  const pct = (n: number) => { const v = (n / totalVisites) * 100; return v > 0 && v < 1 ? "<1 %" : `${Math.round(v)} %`; };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {c && <Completude c={c} offres={offres} />}

      <Activite
        jours={s.par_jour.map(j => ({ jour: j.jour, visites: Number(j.visites), postuler: Number(j.postuler), site: Number(j.site), favoris: Number(j.favoris) }))}
        periode={periode}
        totaux={{ visites: Number(s.visites), postuler: Number(s.postuler), site: Number(s.clics_offres), favoris: Number(s.favoris_nouveaux) }}
        visitesAvant={Number(s.visites_avant)} favorisTotal={Number(s.favoris_total)}
        rang={Number(s.rang_secteur)} totalSecteur={Number(s.total_secteur)} secteur={c ? nomSecteur(c.sector, langue) : ""}
      />

      <div className="grille-espace">
        <section className="carte-espace">
          <div className="carte-titre">
            <h2>{t("espace.vosOffres")}</h2>
            <span className="aide">{t("espace.vosOffresAide")}</span>
          </div>
          {s.offres.length === 0 ? (
            <p style={{ padding: "18px 22px", fontSize: 13.5, color: "var(--text-muted)" }}>{t("graphique.vide")}</p>
          ) : (
            <ul className="liste-espace">
              {s.offres.map(o => (
                <li key={o.id}>
                  <span className="nom">{o.titre}</span>
                  <span className="chiffre">{t("espace.clics", { n: Number(o.clics) })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="carte-espace">
          <div className="carte-titre">
            <h2>{t("espace.provenance")}</h2>
            <span className="aide">{t("espace.visitesN", { n: totalVisites })}</span>
          </div>
          {totalVisites === 0 ? (
            <p style={{ padding: "18px 22px", fontSize: 13.5, color: "var(--text-muted)" }}>{t("espace.pasDeVisites")}</p>
          ) : (
            <>
              <ul className="liste-espace">
                {lignesCantons.map((x, i) => (
                  <li key={x.nom}>
                    <span className="rang">{i + 1}</span>
                    <span className="nom">{x.nom}</span>
                    <span className="chiffre">{nf(x.n)}</span>
                    <span className="part">{pct(x.n)}</span>
                  </li>
                ))}
              </ul>
              <p style={{ padding: "0 22px 16px", fontSize: 12, color: "var(--text-muted)" }}>{t("espace.provenanceAide", { n: nf(totalVisites) })}</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
