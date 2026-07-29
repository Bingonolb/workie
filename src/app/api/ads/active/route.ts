import { NextResponse } from "next/server";
import { getActiveAds, getViewerCanton } from "@/lib/actions/ads";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sector = searchParams.get("sector") ?? undefined;

  const canton = await getViewerCanton().catch(() => null);

  const [squareAds, swipeAds] = await Promise.all([
    getActiveAds({ format: "square", canton: canton ?? undefined, sector }).catch(() => []),
    getActiveAds({ format: "swipe",  canton: canton ?? undefined, sector }).catch(() => []),
  ]);

  return NextResponse.json(
    { squareAds, swipeAds },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
