import { getBusinessJobs } from "@/lib/actions/business";
import { JobsClient } from "./JobsClient";

export default async function JobsPage() {
  const result = await getBusinessJobs();
  const initialJobs = (result.jobs ?? []) as Parameters<typeof JobsClient>[0]["initialJobs"];
  return <JobsClient initialJobs={initialJobs} />;
}
