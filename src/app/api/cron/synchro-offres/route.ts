import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureServerError } from "@/lib/monitoring";
import { synchroniserTout } from "@/lib/synchroOffres/moteur.mjs";

/**
 * Synchronisation des offres, lancée chaque nuit par Vercel (vercel.json).
 *
 * Seul Vercel peut l'appeler : il envoie « Authorization: Bearer CRON_SECRET »,
 * un secret défini dans les variables du projet. Toute autre requête reçoit 401.
 *
 * Une passe dispose d'un budget de temps : elle commence par les entreprises
 * synchronisées il y a le plus longtemps et s'arrête proprement avant la
 * limite de la fonction. La passe suivante (même nuit, plus tard) reprend là.
 *
 * Le bilan apparaît dans les journaux du projet sur Vercel (Logs), et chaque
 * entreprise garde le sien dans la table sources_offres.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BUDGET_MS = 230_000; // laisse ~70 s pour finir les entreprises en cours

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });
  }
  try {
    const bilan = await synchroniserTout({ client: createAdminClient(), budgetMs: BUDGET_MS, journal: (l: string) => console.log(l) });
    // Les fiches lisent leurs offres depuis un cache : on le vide pour que les
    // nouvelles offres apparaissent sans attendre.
    if (bilan.ajoutees || bilan.modifiees || bilan.fermees) revalidateTag("companies", {});
    console.log(`Synchro : ${bilan.entreprises} entreprises (${bilan.reportees} reportées), +${bilan.ajoutees} ~${bilan.modifiees} −${bilan.fermees}, ${bilan.erreurs.length} en erreur, ${bilan.duree} s`);
    const { details, ...resume } = bilan;
    void details;
    return NextResponse.json(resume, { status: bilan.echec ? 500 : 200 });
  } catch (e) {
    captureServerError(e, { action: "cron synchro-offres" });
    return NextResponse.json({ erreur: "échec de la synchronisation" }, { status: 500 });
  }
}
