/**
 * POST /api/auth/logout
 *
 * Clears the session cookie and redirects home. Method is POST so a
 * malicious link can't log a user out on a simple GET (CSRF surface).
 */

import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
