import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Route Handlers CAN write cookies (unlike Server Components).
// Called periodically by SessionKeepAlive to refresh the access token
// before it expires, saving the new tokens to the browser.
export async function GET() {
  try {
    const supabase = await createClient();
    await supabase.auth.getUser();
  } catch {
    // Supabase unreachable — not fatal, client will retry
  }
  return NextResponse.json({ ok: true });
}
