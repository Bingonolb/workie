import { NextResponse } from "next/server";
import { offresParIds } from "@/lib/offresAffichage";
import { RE_UUID } from "@/lib/urlFiche";
import { localiserOffres } from "@/lib/traductionsEntreprises";
import { estOuverte } from "@/i18n/config";

/**
 * Les offres gardées par un visiteur sans compte (leurs identifiants sont
 * dans son navigateur). Données publiques : ce sont des offres d'emploi, et
 * la réponse ne dit rien de qui les a gardées. Clôturées comprises, pour
 * qu'elles s'affichent grisées plutôt que de disparaître.
 */
export async function GET(req: Request) {
  const ids = [...new Set((new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(id => RE_UUID.test(id)))].slice(0, 300);
  const site = new URL(req.url).searchParams.get("site");
  const offres = await offresParIds(ids).then(o => localiserOffres(o, estOuverte(site) ? site : "fr")).catch(() => null);
  if (!offres) return NextResponse.json({ offres: [] }, { status: 500 });
  return NextResponse.json({ offres }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
