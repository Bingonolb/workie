import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * L'image d'aperçu fabriquée à la demande, pour une entreprise ou une page.
 *
 * Elle répondait 200 avec zéro octet. Un aperçu vide se comporte comme une
 * image valide pour qui vérifie le code de réponse, ce qui est la pire forme de
 * panne : rien ne signale l'erreur, et le lien partagé arrive nu.
 *
 * Deux causes. Le dessin appelait `var(--brand)` pour deux fonds : cette image
 * n'a pas de feuille de style ni de `:root`, la variable ne valait rien et le
 * rendu échouait après l'envoi des en-têtes, d'où le corps vide. Et la marque y
 * figurait encore sous l'ancienne identité, un carré violet portant un « W »
 * sur un dégradé violet-orange, alors que ce lettrage a été remplacé partout
 * ailleurs.
 *
 * Le tracé du logo est lu sur le disque, donc cette route quitte le runtime
 * edge, qui n'accède pas aux fichiers. Elle reste rapide : Vercel la met en
 * cache, et une image d'aperçu n'est demandée qu'une fois par lien partagé.
 */
export const runtime = "nodejs";

const BRAND = "#6e56cf";
const FOND = "#101319";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  // Longueurs bornées : un nom d'entreprise, pas un message arbitraire.
  const title   = (searchParams.get("title") ?? "Workie").slice(0, 70);
  const sub     = (searchParams.get("sub")   ?? "Les entreprises suisses et leurs offres d'emploi").slice(0, 90);

  // Le même tracé que l'image statique et que la barre de navigation : le
  // logo ne peut pas diverger d'un endroit à l'autre.
  const fichier = await readFile(join(process.cwd(), "public", "workie-mot.svg"), "utf-8");
  const traces = [...fichier.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: FOND,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          {/* Le mot seul. Son fichier porte le tracé complet, recadré par son
              viewBox : repris tel quel, le symbole reviendrait par la gauche. */}
          <svg width={300} height={108} viewBox="1319 0 3849 1384" fill="#ffffff">
            {traces.map((d, i) => <path key={i} d={d} />)}
          </svg>

          {/* Plus de note ni de nombre d'avis : Workie n'en affiche aucun. Le
              bloc lisait ses chiffres dans l'adresse, si bien que n'importe
              qui pouvait fabriquer une image « 5 étoiles · 999 avis » signée
              Workie. */}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{
            fontSize: title.length > 44 ? 52 : 62,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.12,
            letterSpacing: "-1.5px",
            maxWidth: 940,
          }}>{title}</div>
          <div style={{
            fontSize: 29,
            color: "#9aa3b2",
            marginTop: 22,
            maxWidth: 900,
          }}>{sub}</div>
        </div>

        <div style={{ display: "flex", width: 120, height: 8, borderRadius: 4, background: BRAND }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
