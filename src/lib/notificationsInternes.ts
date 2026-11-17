/**
 * Notifications envoyées par le serveur lui-même. Ce n'est PAS un fichier
 * d'actions serveur : rien ici n'est appelable depuis le navigateur. Chaque
 * appelant vérifie les droits (ex. adminAddCompany, réservé à l'admin).
 */
import { createAdminClient } from "@/lib/supabase/admin";

// Internal: annonce une nouvelle entreprise à tous les membres.
// Le regroupement est fait côté Postgres (voir notify_new_company) : plusieurs
// entreprises ajoutées dans la même journée arrivent dans UNE seule
// notification, pas une par entreprise.
export async function notifyNewCompany(
  companyId: string,
  companyName: string,
  sector?: string | null,
  city?: string | null,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.rpc("notify_new_company", {
      p_company_id: companyId,
      p_company_name: companyName,
      p_company_sector: sector ?? null,
      p_company_city: city ?? null,
    });
  } catch { /* silent — ne doit jamais bloquer la création d'entreprise */ }
}

// Internal: fan-out notifications to all users who favorited a company
// Called from createJobOffer after insert
export async function notifyFavoriteUsers(
  companyId: string,
  companyName: string,
  jobTitle: string,
  jobId: string,
): Promise<void> {
  try {
    const admin = createAdminClient();

    // Find all users who favorited this company
    const { data: favs } = await admin
      .from("favorites")
      .select("user_id")
      .eq("company_id", companyId);

    if (!favs || favs.length === 0) return;

    // Cap fan-out to avoid serverless timeout on very popular companies
    const recipients = favs.slice(0, 500);

    const rows = recipients.map(f => ({
      user_id: f.user_id,
      type: "new_job_offer",
      title: `Nouvelle offre chez ${companyName}`,
      body: jobTitle,
      data: { company_id: companyId, job_id: jobId, company_name: companyName },
      read: false,
    }));

    // Insert in batches of 100 to stay within PostgREST payload limits
    for (let i = 0; i < rows.length; i += 100) {
      await admin.from("notifications").insert(rows.slice(i, i + 100));
    }
  } catch { /* silent — never block job creation */ }
}
