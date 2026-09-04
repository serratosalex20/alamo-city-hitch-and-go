/**
 * POST /api/auth/send-link
 *
 * Body: { email: string }
 * Response: { ok: true, devLink?: string }
 *
 * Generates a short-lived (10 min) magic-link token for the supplied email
 * and "sends" it. Today, sending means logging the link to the server
 * console — a transactional-email provider integration is a Sprint 3 task.
 *
 * In development, the link is also returned in the JSON body so the
 * /sign-in/sent page can show a clickable shortcut. In production, the
 * link is only logged server-side; the user has to click it from their
 * actual email.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createToken } from "@/lib/auth/session";
import { appUrl, isDemoEnvironment } from "@/lib/env";
import { hasEmail, sendAccessLinkEmail } from "@/lib/email/server";

const Body = z.object({
  email: z.string().email("Enter a valid email address."),
  next: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    const json = await request.json();
    parsed = Body.parse(json);
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.issues[0]?.message : "Invalid request body.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  if (!hasEmail && !isDemoEnvironment) {
    return NextResponse.json(
      { ok: false, error: "Email sign-in is temporarily unavailable." },
      { status: 503 },
    );
  }

  const token = createToken(parsed.email, "link", parsed.next);
  const link = `${appUrl}/api/auth/callback?token=${encodeURIComponent(token)}`;

  if (hasEmail) {
    try {
      await sendAccessLinkEmail({ to: parsed.email, link });
    } catch (error) {
      console.error("[auth-email]", error);
      return NextResponse.json({ ok: false, error: "Could not send the sign-in email." }, { status: 502 });
    }
  } else {
    console.log(`[auth-demo] Magic link for ${parsed.email}: ${link}`);
  }

  return NextResponse.json({
    ok: true,
    ...(isDemoEnvironment ? { devLink: link } : {}),
  });
}
