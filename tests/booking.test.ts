import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import { hasConflict } from "../src/lib/booking/availability";
import { calculatePrice } from "../src/lib/booking/pricing";
import { buildRentalSchedule, localPickupToUtc } from "../src/lib/booking/schedule";
import { checkoutSchema } from "../src/lib/booking/validation";
import {
  BookingConflictError,
  completeRentalPaymentRecord,
  createBookingHold,
  getBooking,
} from "../src/lib/booking/repository";
import { markRentalPaymentSucceeded } from "../src/lib/booking/workflow";
import { depositMethodForDuration } from "../src/lib/stripe/deposits";
import { performAdminBookingAction } from "../src/lib/booking/admin-actions";
import type { Booking } from "../src/types/models";

function bookingFixture(id: string): Booking {
  const now = new Date("2026-09-04T12:00:00.000Z");
  return {
    id,
    schemaVersion: 2,
    checkoutKey: id,
    customerEmail: `${id}@example.com`,
    customer: {
      firstName: "Test",
      lastName: "Renter",
      phone: "210-555-0123",
      address: { street: "123 Main St", city: "San Antonio", state: "TX", zip: "78205" },
      referralSource: "website",
    },
    towVehicle: { year: "2022", make: "Ford", model: "F-150" },
    trailerId: `trailer-${id}`,
    trailerName: "Test Trailer",
    unitId: "TEST-01",
    status: "pending_payment",
    fulfillmentType: "pickup",
    duration: "fullDay",
    startTime: "2026-09-06T15:00:00.000Z",
    endTime: "2026-09-07T15:00:00.000Z",
    startTimeMs: Date.parse("2026-09-06T15:00:00.000Z"),
    endTimeMs: Date.parse("2026-09-07T15:00:00.000Z"),
    checkoutExpiresAt: "2099-09-04T12:15:00.000Z",
    checkoutExpiresAtMs: Date.parse("2099-09-04T12:15:00.000Z"),
    policiesAcceptedAt: now.toISOString(),
    extensions: [],
    rentalSubtotal: 15000,
    taxAmount: 1500,
    rentalTotal: 16500,
    depositAmount: 20000,
    paymentStatus: "pending",
    depositStatus: "not_requested",
    agreementStatus: "not_started",
    identityStatus: "not_started",
    insuranceStatus: "not_uploaded",
    preInspectionPhotos: [],
    postInspectionPhotos: [],
    auditTrail: [],
    createdAt: now.toISOString(),
    createdAtMs: now.getTime(),
    updatedAt: now.toISOString(),
    updatedAtMs: now.getTime(),
  };
}

test("pricing is calculated in cents and excludes the deposit from rental total", () => {
  const quote = calculatePrice("trailer-002", "fullDay");
  assert.deepEqual(quote, {
    trailerId: "trailer-002",
    duration: "fullDay",
    rentalCents: 15000,
    depositCents: 20000,
    taxCents: 1500,
    totalCents: 16500,
  });
});

test("San Antonio pickup time converts through daylight saving time", () => {
  assert.equal(localPickupToUtc("2026-09-05", "10:00").toISOString(), "2026-09-05T15:00:00.000Z");
  assert.equal(localPickupToUtc("2026-12-05", "10:00").toISOString(), "2026-12-05T16:00:00.000Z");
  assert.throws(() => localPickupToUtc("2026-03-08", "02:30"), /6:00 AM/);
});

test("one-week schedules are exactly 168 elapsed hours", () => {
  const schedule = buildRentalSchedule("2026-09-05", "10:00", "oneWeek", Date.parse("2026-09-04T00:00:00Z"));
  assert.equal(schedule.endTimeMs - schedule.startTimeMs, 168 * 60 * 60 * 1000);
});

test("availability includes the 30-minute turnaround buffer", () => {
  const existing = [{ startMs: 1_000_000, endMs: 2_000_000 }];
  assert.equal(hasConflict({ startMs: 2_000_000 + 29 * 60_000, endMs: 3_000_000 }, existing), true);
  assert.equal(hasConflict({ startMs: 2_000_000 + 30 * 60_000, endMs: 3_000_000 }, existing), false);
});

test("checkout validation normalizes customer fields and requires policy consent", () => {
  const result = checkoutSchema.parse({
    checkoutKey: "24c2a311-62af-4fe1-83a2-01096c39eea4",
    trailerId: "trailer-002",
    duration: "fullDay",
    date: "2026-09-05",
    time: "10:00",
    firstName: " Alex ",
    lastName: " Renter ",
    email: " ALEX@EXAMPLE.COM ",
    phone: "(210) 555-0123",
    address: { street: "123 Main St", city: "San Antonio", state: "tx", zip: "78205" },
    referralSource: "website",
    towVehicle: { year: "2022", make: "Ford", model: "F-150" },
    policiesAccepted: true,
  });
  assert.equal(result.email, "alex@example.com");
  assert.equal(result.address.state, "TX");
  assert.equal(checkoutSchema.safeParse({ ...result, policiesAccepted: false }).success, false);
});

test("deposit method uses a hold for short rentals and refundable charge for long rentals", () => {
  assert.equal(depositMethodForDuration("halfDay"), "authorization");
  assert.equal(depositMethodForDuration("fullDay"), "authorization");
  assert.equal(depositMethodForDuration("oneWeek"), "refundable_charge");
  assert.equal(depositMethodForDuration("twoWeeks"), "refundable_charge");
});

test("rental payment webhook fulfillment is idempotent", async () => {
  const fixture = bookingFixture("24c2a311-62af-4fe1-83a2-01096c39eea5");
  fixture.trailerId = "trailer-002";
  fixture.rentalPaymentIntentId = "pi_test_rental";
  await createBookingHold(fixture, 1);
  const paymentIntent = {
    id: "pi_test_rental",
    metadata: { bookingId: fixture.id, kind: "rental" },
    payment_method: "pm_test",
    customer: "cus_test",
  } as unknown as Stripe.PaymentIntent;
  await markRentalPaymentSucceeded(paymentIntent);
  await markRentalPaymentSucceeded(paymentIntent);
  const updated = await getBooking(fixture.id);
  assert.equal(updated?.paymentStatus, "succeeded");
  assert.equal(updated?.status, "pending_signature");
  assert.equal(updated?.auditTrail.filter((event) => event.action === "rental_payment_succeeded").length, 1);
});

test("booking holds reject overlapping inventory", async () => {
  const first = bookingFixture("24c2a311-62af-4fe1-83a2-01096c39eea6");
  const second = bookingFixture("24c2a311-62af-4fe1-83a2-01096c39eea7");
  first.trailerId = "conflict-test-trailer";
  second.trailerId = "conflict-test-trailer";
  await createBookingHold(first, 1);
  await assert.rejects(() => createBookingHold(second, 1), BookingConflictError);
});

test("a checkout key cannot be reused with different customer or schedule details", async () => {
  const original = bookingFixture("24c2a311-62af-4fe1-83a2-01096c39eea9");
  await createBookingHold(original, 1);
  const changed = structuredClone(original);
  changed.customerEmail = "different@example.com";
  await assert.rejects(() => createBookingHold(changed, 1), BookingConflictError);
});

test("an expired checkout cannot be promoted to a paid reservation", async () => {
  const expired = bookingFixture("24c2a311-62af-4fe1-83a2-01096c39eeaa");
  expired.rentalPaymentIntentId = "pi_expired_checkout";
  expired.checkoutExpiresAt = new Date(Date.now() - 1_000).toISOString();
  expired.checkoutExpiresAtMs = Date.now() - 1_000;
  await createBookingHold(expired, 1);
  await assert.rejects(
    () => completeRentalPaymentRecord({
      bookingId: expired.id,
      paymentIntentId: "pi_expired_checkout",
      capacity: 1,
      updates: { paymentStatus: "succeeded", status: "pending_signature" },
    }),
    /15-minute checkout hold expired/,
  );
});

test("owner approval requires the review state and complete documents", async () => {
  const fixture = bookingFixture("24c2a311-62af-4fe1-83a2-01096c39eea8");
  fixture.status = "under_review";
  fixture.paymentStatus = "succeeded";
  fixture.agreementStatus = "signed";
  fixture.identityStatus = "verified";
  fixture.insuranceStatus = "uploaded";
  await createBookingHold(fixture, 1);
  const approved = await performAdminBookingAction({
    bookingId: fixture.id,
    action: "approve",
    actor: "owner@example.com",
  });
  assert.equal(approved.status, "confirmed");
  assert.equal(approved.insuranceStatus, "approved");
  await assert.rejects(
    () => performAdminBookingAction({ bookingId: fixture.id, action: "approve", actor: "owner@example.com" }),
    /not available/,
  );
});
