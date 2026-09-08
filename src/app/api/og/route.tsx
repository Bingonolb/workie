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

const BRAND = "#8b5cf6";
const FOND = "#101319";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title   = searchParams.get("title")   ?? "Workie";
  const sub     = searchParams.get("sub")     ?? "Avis anonymes, salaires, conditions de travail";
  const rating  = searchParams.get("rating");
  const reviews = searchParams.get("reviews");

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

          {rating && reviews && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)",
              borderRadius: 50, padding: "10px 22px",
            }}>
              {/* L'etoile en caractere s'affichait en carre vide : la police
                  par defaut de cette image ne contient pas ce signe. Dessinee,
                  elle ne depend d'aucune police. */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#f59e0b">
                <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
              </svg>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>{rating}</span>
              <span style={{ fontSize: 17, color: "rgba(255,255,255,0.5)" }}>· {reviews} avis</span>
            </div>
          )}
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
