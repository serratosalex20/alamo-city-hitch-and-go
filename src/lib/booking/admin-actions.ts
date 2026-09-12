import { appUrl } from "@/lib/env";
import { getBooking, updateBooking } from "@/lib/booking/repository";
import {
  cancelReturnReminderEmail,
  scheduleReturnReminderEmail,
  sendBookingStatusEmail,
} from "@/lib/email/server";
import { captureDeposit, releaseDeposit, requestDeposit, notifyReadyForPickup } from "@/lib/stripe/deposits";
import type { Booking } from "@/types/models";

const DEPOSIT_REQUEST_WINDOW_MS = 48 * 60 * 60 * 1000;

export type AdminBookingAction =
  | "approve"
  | "request_insurance_resubmission"
  | "reject"
  | "request_deposit"
  | "mark_picked_up"
  | "retry_return_reminder"
  | "mark_returned"
  | "release_deposit"
  | "retain_deposit";

function assertState(booking: Booking, allowed: Booking["status"][], action: string) {
  if (!allowed.includes(booking.status)) {
    throw new Error(`${action} is not available while this booking is ${booking.status.replaceAll("_", " ")}.`);
  }
}

function requireNote(note: string | undefined) {
  const normalized = note?.trim() ?? "";
  if (normalized.length < 5) throw new Error("Add a clear note of at least 5 characters.");
  return normalized;
}

async function emailStatus(
  booking: Booking,
  details: { subject: string; heading: string; message: string; event: string },
) {
  try {
    await sendBookingStatusEmail({
      to: booking.customerEmail,
      subject: details.subject,
      heading: details.heading,
      message: details.message,
      bookingUrl: `${appUrl}/booking/${booking.id}/documents`,
      idempotencyKey: `${details.event}-${booking.id}-${booking.updatedAtMs}`,
    });
  } catch (error) {
    console.error(`[booking-email:${details.event}]`, error);
  }
}

async function ensureReturnReminder(booking: Booking, actor: string) {
  if (
    booking.returnReminderEmailId &&
    (booking.returnReminderStatus === "scheduled" ||
      booking.returnReminderStatus === "sent_immediately")
  ) {
    return booking;
  }
  try {
    const delivery = await scheduleReturnReminderEmail(booking);
    if (!delivery.sent) {
      return updateBooking(
        booking.id,
        { returnReminderStatus: "not_configured" },
        { action: "return_reminder_not_configured", actor },
      );
    }
    return updateBooking(
      booking.id,
      {
        returnReminderEmailId: delivery.emailId,
        returnReminderScheduledAt: delivery.scheduledAt ?? new Date().toISOString(),
        returnReminderStatus: delivery.sentImmediately
          ? "sent_immediately"
          : "scheduled",
        returnReminderCancelledAt: undefined,
      },
      {
        action: delivery.sentImmediately
          ? "return_reminder_sent_immediately"
          : "return_reminder_scheduled",
        actor,
      },
    );
  } catch (error) {
    console.error(`[booking-email:return-reminder:${booking.id}]`, error);
    return updateBooking(
      booking.id,
      { returnReminderStatus: "failed" },
      {
        action: "return_reminder_schedule_failed",
        actor,
        note: error instanceof Error ? error.message : "Return reminder scheduling failed.",
      },
    );
  }
}

async function cancelPendingReturnReminder(booking: Booking, actor: string) {
  if (!booking.returnReminderEmailId || booking.returnReminderStatus !== "scheduled") {
    return booking;
  }
  try {
    const result = await cancelReturnReminderEmail(booking.returnReminderEmailId);
    if (!result.cancelled) return booking;
    const now = new Date().toISOString();
    return updateBooking(
      booking.id,
      { returnReminderStatus: "cancelled", returnReminderCancelledAt: now },
      { action: "return_reminder_cancelled", actor, note: "Trailer returned before the reminder was sent." },
    );
  } catch (error) {
    console.error(`[booking-email:return-reminder-cancel:${booking.id}]`, error);
    return updateBooking(
      booking.id,
      { returnReminderStatus: "cancel_failed" },
      {
        action: "return_reminder_cancel_failed",
        actor,
        note: error instanceof Error ? error.message : "Return reminder cancellation failed.",
      },
    );
  }
}

export async function performAdminBookingAction({
  bookingId,
  action,
  actor,
  note,
  amountCents,
}: {
  bookingId: string;
  action: AdminBookingAction;
  actor: string;
  note?: string;
  amountCents?: number;
}) {
  const booking = await getBooking(bookingId);
  if (!booking) throw new Error("Booking not found.");
  const now = new Date();

  switch (action) {
    case "approve": {
      assertState(booking, ["under_review"], "Approval");
      if (
        booking.paymentStatus !== "succeeded" ||
        booking.agreementStatus !== "signed" ||
        booking.identityStatus !== "verified" ||
        booking.insuranceStatus !== "uploaded"
      ) {
        throw new Error("Payment, agreement, identity, and insurance must all be complete.");
      }
      if (booking.depositCollectedAtCheckout && booking.depositStatus !== "charged") {
        throw new Error("The refundable checkout deposit must be collected before approval.");
      }
      const updated = await updateBooking(
        bookingId,
        {
          status: booking.depositCollectedAtCheckout ? "ready_for_pickup" : "confirmed",
          insuranceStatus: "approved",
          confirmedAt: now.toISOString(),
          reviewNote: note?.trim() || undefined,
        },
        { action: "booking_approved", actor, note: note?.trim() || undefined },
      );
      await emailStatus(updated, {
        subject: "Your trailer reservation is confirmed",
        heading: "Reservation confirmed",
        message: booking.depositCollectedAtCheckout ? "Your documents are approved and your refundable deposit was collected at checkout. Pickup instructions will follow." : "Your documents are approved. We will request the security deposit authorization close to pickup and notify you if your card needs confirmation.",
        event: "booking-approved",
      });
      return booking.depositCollectedAtCheckout ? notifyReadyForPickup(updated) : updated;
    }
    case "request_insurance_resubmission": {
      assertState(booking, ["under_review"], "Insurance resubmission");
      const reason = requireNote(note);
      const updated = await updateBooking(
        bookingId,
        { status: "pending_insurance", insuranceStatus: "resubmit_requested", reviewNote: reason },
        { action: "insurance_resubmission_requested", actor, note: reason },
      );
      await emailStatus(updated, {
        subject: "Please update your insurance document",
        heading: "Insurance update required",
        message: reason,
        event: "insurance-resubmit",
      });
      return updated;
    }
    case "reject": {
      assertState(booking, ["under_review", "pending_insurance"], "Rejection");
      const reason = requireNote(note);
      const updated = await updateBooking(
        bookingId,
        { status: "rejected", insuranceStatus: "rejected", reviewNote: reason },
        { action: "booking_rejected", actor, note: reason },
      );
      await emailStatus(updated, {
        subject: "Update on your trailer booking",
        heading: "Booking needs attention",
        message: `${reason} Please contact us so we can discuss next steps and any applicable rental refund.`,
        event: "booking-rejected",
      });
      return updated;
    }
    case "request_deposit": {
      assertState(booking, ["confirmed", "deposit_action_required"], "Deposit request");
      if (booking.insuranceStatus !== "approved") throw new Error("Approve the insurance document first.");
      if (booking.startTimeMs - now.getTime() > DEPOSIT_REQUEST_WINDOW_MS) {
        throw new Error("Request the deposit no more than 48 hours before pickup so the card authorization does not expire.");
      }
      const updated = await requestDeposit(bookingId, actor);
      if (updated.status === "deposit_action_required") {
        await emailStatus(updated, {
          subject: "Confirm your security deposit",
          heading: "Deposit confirmation required",
          message: "Your bank needs you to confirm the $200 security deposit before pickup. Open your booking to complete it.",
          event: "deposit-action",
        });
      }
      return updated;
    }
    case "mark_picked_up": {
      assertState(booking, ["ready_for_pickup"], "Pickup");
      if (booking.preInspectionPhotos.length === 0) {
        throw new Error("Upload at least one pre-rental inspection photo before releasing the trailer.");
      }
      const pickedUp = await updateBooking(
        bookingId,
        { status: "active", pickedUpAt: now.toISOString() },
        { action: "trailer_picked_up", actor, note: note?.trim() || undefined },
      );
      return ensureReturnReminder(pickedUp, actor);
    }
    case "retry_return_reminder":
      assertState(booking, ["active"], "Return reminder");
      return ensureReturnReminder(booking, actor);
    case "mark_returned": {
      assertState(booking, ["active"], "Return");
      const returned = await updateBooking(
        bookingId,
        { status: "return_inspection", returnedAt: now.toISOString(), returnedAtMs: now.getTime() },
        { action: "trailer_returned", actor, note: note?.trim() || undefined },
      );
      return cancelPendingReturnReminder(returned, actor);
    }
    case "release_deposit": {
      assertState(booking, ["return_inspection"], "Deposit release");
      if (booking.postInspectionPhotos.length === 0) {
        throw new Error("Upload at least one return inspection photo before releasing the deposit.");
      }
      return releaseDeposit(bookingId, actor, note?.trim() || "Clean return inspection completed.");
    }
    case "retain_deposit": {
      assertState(booking, ["return_inspection"], "Deposit retention");
      if (booking.postInspectionPhotos.length === 0) {
        throw new Error("Upload return inspection photos before retaining any deposit amount.");
      }
      return captureDeposit(bookingId, amountCents ?? 0, actor, requireNote(note));
    }
  }
}
