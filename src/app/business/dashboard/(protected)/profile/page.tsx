import { getBusinessCompany } from "@/lib/actions/business";
import { ProfileClient } from "./ProfileClient";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const result = await getBusinessCompany();
  if (!result.company) redirect("/business");
  return <ProfileClient initialCompany={result.company as Parameters<typeof ProfileClient>[0]["initialCompany"]} />;
}
