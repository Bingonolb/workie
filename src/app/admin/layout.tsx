import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, getEstAdminSansMfa, getNiveauAal } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Garde centrale de l'administration : toutes les pages /admin/* en héritent.
// Le rôle admin ne suffit pas : la session doit avoir passé la double
// authentification (code à 6 chiffres). Les actions serveur le revérifient,
// et la base aussi.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, estAdmin, niveau] = await Promise.all([getUser(), getEstAdminSansMfa(), getNiveauAal()]);
  if (!user) redirect("/api/auth/signout?next=/login");
  if (!estAdmin) redirect("/explore");
  if (niveau !== "aal2") redirect("/securite/code");
  return <>{children}</>;
}
