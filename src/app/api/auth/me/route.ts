/**
 * GET /api/auth/me
 *
 * Returns the current session, or null if unauthenticated.
 * Used by client-side components (e.g. Navbar) that need to render
 * differently for signed-in vs anonymous visitors without converting
 * the whole component to a Server Component.
 *
 * Cached: no — must always reflect the live cookie.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ email: null }, { headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(
    { email: session.email },
    { headers: { "Cache-Control": "no-store" } },
  );
}
