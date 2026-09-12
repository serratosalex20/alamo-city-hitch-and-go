import { Resend } from "resend";
import {
  adminEmails,
  appUrl,
  emailFrom,
  hasEmail,
  pickupAddress,
  pickupInstructions,
  resendApiKey,
  supportEmail,
  supportPhone,
} from "@/lib/env";
import {
  pickupChecklist,
  returnChecklist,
  returnReminderScheduledAt,
} from "@/lib/booking/communications";
import type { Booking } from "@/types/models";

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

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  dateStyle: "full",
  timeStyle: "short",
});

function bookingEmailShell({
  heading,
  body,
  buttonLabel,
  buttonUrl,
}: {
  heading: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;background:#111;color:#f5f5f5;padding:32px">
      <div style="max-width:600px;margin:0 auto;background:#1d1d1d;padding:32px;border-top:4px solid #f97316">
        <h1 style="font-size:26px;margin:0 0 16px">${escapeHtml(heading)}</h1>
        ${body}
        <p style="margin:28px 0"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#f97316;color:white;padding:14px 22px;text-decoration:none;font-weight:bold">${escapeHtml(buttonLabel)}</a></p>
        <p style="font-size:13px;line-height:1.5;color:#a3a3a3">Questions? Call or text ${escapeHtml(supportPhone)}, or email <a style="color:#fdba74" href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.</p>
      </div>
    </div>`;
}

function checklistHtml(items: string[]) {
  return `<ul style="padding-left:22px;line-height:1.65;color:#d4d4d4">${items
    .map((item) => `<li style="margin:8px 0">${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
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
      replyTo: supportEmail,
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
      replyTo: supportEmail,
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

export async function sendReadyForPickupEmail(booking: Booking) {
  const resend = getResend();
  if (!resend) return { sent: false as const };
  if (!pickupAddress) throw new Error("The private pickup address is not configured.");
  const bookingUrl = `${appUrl}/booking/${booking.id}/documents`;
  const items = pickupChecklist({
    pickupAddress,
    pickupInstructions,
    supportPhone,
    supportEmail,
  });
  const { data, error } = await resend.emails.send(
    {
      from: emailFrom,
      to: booking.customerEmail,
      replyTo: supportEmail,
      subject: `Ready for pickup — ${booking.trailerName}`,
      html: bookingEmailShell({
        heading: "Your trailer is ready for pickup",
        body: `
          <p style="line-height:1.6;color:#d4d4d4"><strong>Pickup:</strong> ${escapeHtml(dateTimeFormatter.format(new Date(booking.startTime)))}</p>
          <p style="line-height:1.6;color:#d4d4d4"><strong>Private pickup address:</strong> ${escapeHtml(pickupAddress)}</p>
          ${checklistHtml(items)}`,
        buttonLabel: "View secure booking",
        buttonUrl: bookingUrl,
      }),
    },
    { idempotencyKey: `pickup-ready-${booking.id}` },
  );
  if (error) throw new Error(error.message);
  return { sent: true as const, emailId: data?.id };
}

export async function sendOwnerReviewEmail(booking: Booking) {
  const resend = getResend();
  const recipients = Array.from(adminEmails);
  if (!resend || recipients.length === 0) return { sent: false as const };
  const { data, error } = await resend.emails.send(
    {
      from: emailFrom,
      to: recipients,
      replyTo: booking.customerEmail,
      subject: `Booking ready for review — ${booking.customer.firstName} ${booking.customer.lastName}`,
      html: bookingEmailShell({
        heading: "Booking ready for owner review",
        body: `
          <p style="line-height:1.6;color:#d4d4d4">Payment, agreement, identity verification, and insurance submission are complete.</p>
          <p style="line-height:1.6;color:#d4d4d4"><strong>Renter:</strong> ${escapeHtml(`${booking.customer.firstName} ${booking.customer.lastName}`)}<br><strong>Trailer:</strong> ${escapeHtml(booking.trailerName)}<br><strong>Pickup:</strong> ${escapeHtml(dateTimeFormatter.format(new Date(booking.startTime)))}</p>`,
        buttonLabel: "Review booking",
        buttonUrl: `${appUrl}/admin/bookings/${booking.id}`,
      }),
    },
    { idempotencyKey: `owner-review-${booking.id}` },
  );
  if (error) throw new Error(error.message);
  return { sent: true as const, emailId: data?.id };
}

export async function scheduleReturnReminderEmail(booking: Booking) {
  const resend = getResend();
  if (!resend) return { sent: false as const };
  if (!pickupAddress) throw new Error("The private pickup address is not configured.");
  const scheduledAt = returnReminderScheduledAt(booking.endTimeMs);
  const items = returnChecklist({
    pickupAddress,
    pickupInstructions,
    supportPhone,
    supportEmail,
  });
  const { data, error } = await resend.emails.send(
    {
      from: emailFrom,
      to: booking.customerEmail,
      replyTo: supportEmail,
      subject: `Return reminder — ${booking.trailerName}`,
      html: bookingEmailShell({
        heading: scheduledAt ? "Trailer return in two hours" : "Your trailer return is coming up",
        body: `
          <p style="line-height:1.6;color:#d4d4d4"><strong>Return by:</strong> ${escapeHtml(dateTimeFormatter.format(new Date(booking.endTime)))}</p>
          <p style="line-height:1.6;color:#d4d4d4"><strong>Return address:</strong> ${escapeHtml(pickupAddress)}</p>
          ${checklistHtml(items)}`,
        buttonLabel: "View secure booking",
        buttonUrl: `${appUrl}/booking/${booking.id}/documents`,
      }),
      ...(scheduledAt ? { scheduledAt } : {}),
    },
    { idempotencyKey: `return-reminder-${booking.id}-${booking.endTimeMs}` },
  );
  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("Resend did not return an email ID.");
  return {
    sent: true as const,
    emailId: data.id,
    scheduledAt,
    sentImmediately: scheduledAt === null,
  };
}

export async function cancelReturnReminderEmail(emailId: string) {
  const resend = getResend();
  if (!resend) return { cancelled: false as const };
  const { data, error } = await resend.emails.cancel(emailId);
  if (error) throw new Error(error.message);
  return { cancelled: true as const, emailId: data?.id ?? emailId };
}

export { hasEmail };
