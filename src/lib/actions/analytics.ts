"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function trackCompanyView(companyId: string): Promise<void> {
  try {
    const [supabase, h] = await Promise.all([createClient(), headers()]);
    const { data: { user } } = await supabase.auth.getUser();
    const viewer_canton = h.get("x-vercel-ip-country-region") ?? null;
    const viewer_city   = h.get("x-vercel-ip-city") ?? null;
    await supabase.from("company_views").insert({ company_id: companyId, user_id: user?.id ?? null, viewer_canton, viewer_city });
  } catch { /* silent */ }
}

export async function trackJobApplyClick(jobId: string, companyId: string): Promise<void> {
  try {
    if (!UUID_RE.test(jobId) || !UUID_RE.test(companyId)) return;
    const hdrs = await headers();
    const canton = hdrs.get("x-vercel-ip-country-region") ?? null;
    const admin = createAdminClient();
    const { data: job } = await admin.from("job_offers").select("id").eq("id", jobId).eq("company_id", companyId).maybeSingle();
    if (!job) return;
    const { error } = await admin.from("job_apply_clicks").insert({ job_id: jobId, company_id: companyId, viewer_canton: canton });
    if (!error) await admin.rpc("increment_job_apply_click", { job_id: jobId });
  } catch { /* silent */ }
}
