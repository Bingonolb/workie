import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, getEstAdminSansMfa } from "@/lib/supabase/server";
import { CodeAdmin } from "./CodeAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Code de sécurité", robots: { index: false, follow: false } };

export default async function PageCode() {
  const [user, estAdmin] = await Promise.all([getUser(), getEstAdminSansMfa()]);
  if (!user) redirect("/login?next=/securite/code");
  if (!estAdmin) redirect("/explore");
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16, background: "var(--bg)" }}>
      <CodeAdmin />
    </main>
  );
}
