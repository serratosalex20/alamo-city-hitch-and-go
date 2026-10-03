import type { Booking } from "@/types/models";
import type { PickupRequestRecord } from "@/lib/pickup-requests/types";
import {
  formatBusinessDate,
  localPickupToUtc,
  BUSINESS_TIME_ZONE,
} from "./schedule";
import { validThrough } from "@/lib/customers/returning";

export function canCompleteDocuments(booking: Booking) {
  return (
    booking.paymentStatus === "succeeded" &&
    [
      "pending_identity",
      "pending_insurance",
      "pending_signature",
      "under_review",
    ].includes(booking.status) &&
    booking.insuranceStatus !== "rejected"
  );
}

/** Acceptance of supplied proof is not insurer verification of the document or coverage. */
export function automaticConfirmationIssue(
  booking: Booking,
  request: PickupRequestRecord | null,
  nowMs = Date.now(),
  requireDeposit = true,
): string | null {
  if (booking.paymentStatus !== "succeeded" || !booking.rentalPaymentIntentId)
    return "Payment must be completed.";
  if (booking.identityStatus !== "verified")
    return "Identity verification must be completed.";
  if (booking.agreementStatus !== "signed")
    return "The rental agreement must be signed.";
  if (
    !["uploaded", "accepted", "approved"].includes(booking.insuranceStatus) ||
    !booking.insuranceStoragePath ||
    !booking.insuranceCarrier?.trim() ||
    !booking.insurancePolicyNumber?.trim() ||
    !booking.insurancePolicyholder?.trim()
  )
    return "Complete insurance details and upload current proof.";
  const normalize = (name: string) =>
    name.trim().toLowerCase().replace(/\s+/g, " ");
  if (
    normalize(booking.insurancePolicyholder) !==
    normalize(`${booking.customer.firstName} ${booking.customer.lastName}`)
  )
    return "The policyholder name needs review before confirmation.";
  if (
    !Number.isFinite(booking.startTimeMs) ||
    !Number.isFinite(booking.endTimeMs) ||
    booking.startTimeMs <= nowMs ||
    booking.endTimeMs <= booking.startTimeMs ||
    Date.parse(booking.startTime) !== booking.startTimeMs ||
    Date.parse(booking.endTime) !== booking.endTimeMs
  )
    return "The pickup schedule needs attention before confirmation.";
  const returnDate = formatBusinessDate(booking.endTimeMs);
  if (!validThrough(booking.insuranceExpiresAt, returnDate))
    return "Insurance must remain current through the return date.";
  if (
    booking.identityExpiresAt &&
    !validThrough(booking.identityExpiresAt, returnDate)
  )
    return "Your ID must remain current through the return date.";
  if (
    requireDeposit &&
    (!["charged", "authorized"].includes(booking.depositStatus) ||
      !booking.depositPaymentIntentId)
  )
    return "The security deposit must be in place before confirmation.";
  if (
    booking.depositCollectedAtCheckout &&
    (booking.depositStatus !== "charged" ||
      booking.depositPaymentIntentId !== booking.rentalPaymentIntentId)
  )
    return "The checkout deposit needs attention before confirmation.";
  if (
    booking.depositStatus === "authorized" &&
    (!booking.depositCaptureBeforeMs || booking.depositCaptureBeforeMs <= nowMs)
  )
    return "The security deposit authorization must be current.";
  if (booking.pickupRequestId) {
    if (
      !request ||
      !["approved", "booked"].includes(request.status) ||
      request.decision?.kind !== "approved" ||
      request.id !== booking.pickupRequestId ||
      request.bookingId !== booking.id ||
      request.email !== booking.customerEmail ||
      request.trailerId !== booking.trailerId ||
      request.duration !== booking.duration ||
      request.startTimeMs !== booking.startTimeMs ||
      request.endTimeMs !== booking.endTimeMs
    )
      return "The outside-hours pickup approval must match this booking.";
  } else {
    try {
      const time = new Intl.DateTimeFormat("en-GB", {
        timeZone: BUSINESS_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date(booking.startTimeMs));
      if (
        localPickupToUtc(
          formatBusinessDate(booking.startTimeMs),
          time,
        ).getTime() !== booking.startTimeMs
      )
        throw new Error();
    } catch {
      return "Pickup must be during business hours or have an approved outside-hours request.";
    }
  }
  return null;
}
