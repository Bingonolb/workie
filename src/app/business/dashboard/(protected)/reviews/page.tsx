import { getBusinessReviews } from "@/lib/actions/business";
import { ReviewsClient } from "./ReviewsClient";

export default async function ReviewsPage() {
  const result = await getBusinessReviews();
  const initialReviews = (result.reviews ?? []) as Parameters<typeof ReviewsClient>[0]["initialReviews"];
  return <ReviewsClient initialReviews={initialReviews} />;
}
