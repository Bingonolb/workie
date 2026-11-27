"use server";

import { empreinteDuJour as empreinte, ROBOT } from "@/lib/empreinte";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** La région n'est un canton que pour une connexion suisse. */
function enSuisse(h: Headers): boolean {
  return h.get("x-vercel-ip-country") === "CH";
}


/**
 * Une visite de fiche : 1 point au classement. Comptée une fois par personne,
 * par fiche et par jour. Les robots ne comptent pas. Sans cela, recharger la
 * page en boucle suffisait à faire monter une entreprise.
 */
export async function trackCompanyView(companyId: string): Promise<void> {
  try {
    if (!UUID_RE.test(companyId)) return;
    const [supabase, h] = await Promise.all([createClient(), headers()]);
    const ua = h.get("user-agent") ?? "";
    if (!ua || ROBOT.test(ua)) return;
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const { data: { user } } = await supabase.auth.getUser();
    const cle = user ? `u:${user.id}` : empreinte(ip, ua);

    const admin = createAdminClient();
    // Les visites de l'entreprise sur sa propre fiche, et celles de
    // l'administration, ne sont pas des visiteurs : elles gonflaient le
    // tableau de bord (et le classement) à chaque contrôle.
    if (user) {
      const { data: p } = await admin.from("profiles").select("role, claimed_company_id").eq("id", user.id).maybeSingle();
      if (p?.role === "admin" || p?.claimed_company_id === companyId) return;
    }
    const depuis = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    // Table et colonne hors des types générés.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vues = admin.from("company_views") as any;
    const { count } = await vues
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId).eq("empreinte", cle).gte("viewed_at", depuis);
    if ((count ?? 0) > 0) return;

    await vues.insert({
      company_id: companyId,
      user_id: user?.id ?? null,
      empreinte: cle,
      // La région n'est un canton que pour une connexion suisse : une visite
      // depuis Paris arrivait avec « IDF » et s'affichait comme un canton.
      viewer_canton: enSuisse(h) ? h.get("x-vercel-ip-country-region") ?? null : null,
      viewer_city: enSuisse(h) ? h.get("x-vercel-ip-city") ?? null : null,
    });
  } catch { /* silencieux : une statistique ne doit jamais casser une page */ }
}

export async function trackJobApplyClick(jobId: string, companyId: string): Promise<void> {
  try {
    if (!UUID_RE.test(jobId) || !UUID_RE.test(companyId)) return;
    const hdrs = await headers();
    const canton = enSuisse(hdrs) ? hdrs.get("x-vercel-ip-country-region") ?? null : null;
    const admin = createAdminClient();
    const { data: job } = await admin.from("job_offers").select("id").eq("id", jobId).eq("company_id", companyId).maybeSingle();
    if (!job) return;
    const { error } = await admin.from("job_apply_clicks").insert({ job_id: jobId, company_id: companyId, viewer_canton: canton });
    if (!error) await admin.rpc("increment_job_apply_click", { job_id: jobId });
  } catch { /* silent */ }
}
