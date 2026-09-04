import { Resend } from "resend";
import { emailFrom, hasEmail, resendApiKey } from "@/lib/env";

let cached: Resend | null = null;

function getResend() {
  if (!hasEmail || !resendApiKey) return null;
  cached ??= new Resend(resendApiKey);
  return cached;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] as string);
}

export async function sendAccessLinkEmail({
  to,
  link,
  subject = "Your secure Alamo City Hitch & Go link",
  intro = "Use the secure link below to access your booking.",
  idempotencyKey,
}: {
  to: string;
  link: string;
  subject?: string;
  intro?: string;
  idempotencyKey?: string;
}) {
  const resend = getResend();
  if (!resend) return { sent: false as const };
  const safeLink = escapeHtml(link);
  const { error } = await resend.emails.send(
    {
      from: emailFrom,
      to,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;background:#111;color:#f5f5f5;padding:32px">
          <div style="max-width:560px;margin:0 auto;background:#1d1d1d;padding:32px;border-top:4px solid #f97316">
            <h1 style="font-size:26px;margin:0 0 16px">Alamo City Hitch &amp; Go</h1>
            <p style="line-height:1.6;color:#d4d4d4">${escapeHtml(intro)}</p>
            <p style="margin:28px 0"><a href="${safeLink}" style="display:inline-block;background:#f97316;color:white;padding:14px 22px;text-decoration:none;font-weight:bold">Open secure booking</a></p>
            <p style="font-size:13px;line-height:1.5;color:#a3a3a3">This link expires in 10 minutes. If you did not request it, you can ignore this email.</p>
          </div>
        </div>`,
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
  if (error) throw new Error(error.message);
  return { sent: true as const };
}

export async function sendBookingStatusEmail({
  to,
  subject,
  heading,
  message,
  bookingUrl,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  heading: string;
  message: string;
  bookingUrl: string;
  idempotencyKey: string;
}) {
  const resend = getResend();
  if (!resend) return { sent: false as const };
  const { error } = await resend.emails.send(
    {
      from: emailFrom,
      to,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;background:#111;color:#f5f5f5;padding:32px">
          <div style="max-width:560px;margin:0 auto;background:#1d1d1d;padding:32px;border-top:4px solid #f97316">
            <h1 style="font-size:26px;margin:0 0 16px">${escapeHtml(heading)}</h1>
            <p style="line-height:1.6;color:#d4d4d4">${escapeHtml(message)}</p>
            <p style="margin:28px 0"><a href="${escapeHtml(bookingUrl)}" style="display:inline-block;background:#f97316;color:white;padding:14px 22px;text-decoration:none;font-weight:bold">View booking</a></p>
          </div>
        </div>`,
    },
    { idempotencyKey },
  );
  if (error) throw new Error(error.message);
  return { sent: true as const };
}

export { hasEmail };
