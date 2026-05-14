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
import { appUrl } from "@/lib/env";

const Body = z.object({
  email: z.string().email("Enter a valid email address."),
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

  const token = createToken(parsed.email, "link");
  const link = `${appUrl}/api/auth/callback?token=${encodeURIComponent(token)}`;

  // "Send" the email — for now, log it.
  // Sprint 3 wires this to a transactional email provider (Resend / SendGrid).
  console.log(
    `[auth] Magic link for ${parsed.email}: ${link}\n` +
      `(Sprint 2 stub — production must email this via a transactional provider.)`,
  );

  const isDev = process.env.NODE_ENV !== "production";
  return NextResponse.json({
    ok: true,
    ...(isDev ? { devLink: link } : {}),
  });
}
