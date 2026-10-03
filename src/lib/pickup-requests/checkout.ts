import type { TokenPayload } from "@/lib/auth/session";
import type { CheckoutInput } from "@/lib/booking/validation";
import type { Booking } from "@/types/models";
import { canAccessPickupRequest } from "./access";
import { getPickupRequest, PickupRequestError } from "./repository";
import type { PickupRequestRecord } from "./types";
import { createHmac } from "node:crypto";
import { authSecret } from "@/lib/env";
import { getBooking } from "@/lib/booking/repository";
import { trailers } from "@/lib/data/trailers";
import type { BookingFormData } from "@/components/booking/BookingWizard";

/** Stable server-only authorization, issued only after full request-email authentication. */
export function pickupCheckoutProof(
  record: PickupRequestRecord,
  bookingId: string,
) {
  return createHmac("sha256", authSecret)
    .update(`pickup-checkout:${record.id}:${record.email}:${bookingId}`)
    .digest("hex");
}

export async function getResumablePickupCheckout(
  id: string,
  session: TokenPayload | null,
  nowMs = Date.now(),
) {
  const record = await getApprovedPickupRequest(id, session, nowMs);
  const booking = record.bookingId ? await getBooking(record.bookingId) : null;
  if (
    !booking ||
    booking.status !== "pending_payment" ||
    booking.paymentStatus === "succeeded" ||
    booking.paymentStatus === "refunded" ||
    booking.checkoutExpiresAtMs <= nowMs
  )
    return null;
  // Reuse the exact binding checks; never expose another booking through a corrupted link.
  bindRequestToBooking(record, booking, booking, nowMs);
  const savedDetails: BookingFormData = {
    pickupRequestId: record.id,
    trailerId: booking.trailerId,
    trailerSlug: trailers.find((t) => t.id === booking.trailerId)?.slug ?? "",
    date: record.date,
    time: record.time,
    duration: booking.duration,
    firstName: booking.customer.firstName,
    lastName: booking.customer.lastName,
    email: booking.customerEmail,
    phone: booking.customer.phone,
    address: booking.customer.address,
    towVehicle: {
      ...booking.towVehicle,
      plate: booking.towVehicle.plate ?? "",
    },
    referralSource: booking.customer.referralSource,
    referralDetail: booking.customer.referralDetail ?? "",
    policiesAccepted: Boolean(booking.policiesAcceptedAt),
    emailMarketingOptIn: Boolean(booking.emailMarketingOptIn),
  };
  return { checkoutKey: booking.checkoutKey, savedDetails };
}
export async function getApprovedPickupRequest(
  id: string,
  session: TokenPayload | null,
  nowMs = Date.now(),
) {
  const record = await getPickupRequest(id);
  if (!record || !canAccessPickupRequest(session, record))
    throw new PickupRequestError(
      "Sign in with the request email to access this pickup approval.",
      403,
    );
  if (record.status !== "approved")
    throw new PickupRequestError(
      "This pickup request is not available for a new booking.",
      409,
    );
  if (record.startTimeMs <= nowMs)
    throw new PickupRequestError("This pickup approval has expired.", 409);
  return record;
}
export function assertRequestMatchesCheckout(
  record: PickupRequestRecord,
  input: CheckoutInput,
) {
  if (
    record.email !== input.email.trim().toLowerCase() ||
    record.trailerId !== input.trailerId ||
    record.date !== input.date ||
    record.time !== input.time ||
    record.duration !== input.duration
  )
    throw new PickupRequestError(
      "The rental details do not match the approved pickup request.",
      409,
    );
}
export function bindRequestToBooking(
  record: PickupRequestRecord,
  booking: Booking,
  previous: Booking | undefined,
  nowMs = Date.now(),
): PickupRequestRecord {
  if (record.status !== "approved" || record.startTimeMs <= nowMs)
    throw new PickupRequestError(
      "This pickup approval is unavailable or expired.",
      409,
    );
  if (
    record.id !== booking.pickupRequestId ||
    record.email !== booking.customerEmail ||
    record.trailerId !== booking.trailerId ||
    record.startTimeMs !== booking.startTimeMs ||
    record.endTimeMs !== booking.endTimeMs ||
    record.duration !== booking.duration
  )
    throw new PickupRequestError(
      "Booking does not match the approved pickup request.",
      409,
    );
  if (record.bookingId && record.bookingId !== booking.id) {
    if (
      !previous ||
      previous.paymentStatus === "succeeded" ||
      previous.paymentStatus === "refunded" ||
      (previous.status !== "cancelled" && previous.checkoutExpiresAtMs > nowMs)
    )
      throw new PickupRequestError(
        "This request already has a checkout in progress. Return to that checkout or wait for its hold to expire.",
        409,
      );
  }
  return { ...record, bookingId: booking.id, updatedAtMs: nowMs };
}
