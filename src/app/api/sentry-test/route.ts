import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    throw new Error("[Workie Sentry Test] Server-side error intentionnelle");
  } catch (e) {
    Sentry.captureException(e);
  }
  return NextResponse.json({ ok: true });
}
