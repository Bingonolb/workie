export const revalidate = 60;

import type { Metadata } from "next";
import { meta } from "@/i18n/meta";
import { getCachedTopCompanies } from "@/lib/actions/scores";
import { RankingTable } from "./RankingList";
import type { Company } from "@/lib/types";
import { lieuAffiche } from "@/lib/types";
import { urlFiche } from "@/lib/urlFiche";
import { tServeur, langueDeLaPage } from "@/i18n/page";

export const generateMetadata = () => meta({ titre: "meta.rankingTitre", description: "meta.rankingDescription", chemin: "/ranking" });

export default async function RankingPage() {
  const companies = await getCachedTopCompanies(200).catch(() => [] as Company[]);
  const typedCompanies = companies as Company[];
  const t = await tServeur();
  const langue = await langueDeLaPage();


  const rankingJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": t("classement.titre"),
    "description": t("classement.sousTitre"),
    "url": "https://www.workie.ch/ranking",
    "numberOfItems": typedCompanies.length,
    "itemListElement": typedCompanies.slice(0, 10).map((c, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": c.name,
      "url": `https://www.workie.ch${urlFiche(c)}`,
      "description": lieuAffiche(c.city, c.canton, langue),
    })),
  };

  return (
    <div className="page-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(rankingJsonLd).replace(/<\/script>/gi, "<\\/script>") }} />
      <main className="page-main-md">

        {/* Table */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
          {/* Le titre et son sous-titre sont rendus par la table.
              Ils annoncaient « Top 200 » et « Trie par score communautaire »
              depuis le serveur, donc immuables : des qu'un filtre reduisait la
              liste a vingt-quatre lignes, la page continuait d'annoncer deux
              cents. Le sous-titre suit maintenant ce qui est reellement
              affiche. */}

          {companies.length === 0 ? (
            <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{t("classement.vide")}</p>
              <p style={{ fontSize: 13 }}>{t("classement.videAide")}</p>
            </div>
          ) : (
            <RankingTable companies={typedCompanies} />
          )}
        </div>
      </main>
      {/* Pas de pied de page ici.
          Les mentions legales et le contact s'adressent a quelqu'un qui
          decouvre le site ; elles restent donc sur les pages publiques et
          dans les reglages du profil. Sur un classement filtre a deux
          lignes, ce pave devenait la chose la plus visible de l'ecran. */}
    </div>
  );
}
