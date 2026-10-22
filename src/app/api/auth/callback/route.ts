import { portalSignInDestination } from "@/lib/auth/portal-navigation";
import { getBooking } from "@/lib/booking/repository";
/**
 * GET /api/auth/callback?token=<link-token>
 *
 * Handles the magic-link return:
 *   1. Verifies the supplied link token (HMAC + expiry + kind="link").
 *   2. Mints a 14-day session cookie tied to the same email.
 *   3. Redirects to /account.
 *
 * On any failure (missing token, invalid, expired, wrong kind), redirects
 * back to /sign-in with `?error=<code>` so the form can surface a message.
 */

import { NextResponse } from "next/server";
import { setSessionCookie, verifyToken } from "@/lib/auth/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/sign-in?error=missing-token", url.origin));
  }

  const payload = verifyToken(token, "link");
  if (!payload) {
    return NextResponse.redirect(new URL("/sign-in?error=invalid-or-expired", url.origin));
  }

  await setSessionCookie(payload.email);
  const match = payload.next?.match(/^\/booking\/([^/]+)\/documents(?:\?.*)?$/);
  const booking = match ? await getBooking(match[1]) : null;
  const destination = portalSignInDestination(payload.next, payload.email, booking);
  return NextResponse.redirect(new URL(destination, url.origin));
}
