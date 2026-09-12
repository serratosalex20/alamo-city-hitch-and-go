import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import { hasConflict } from "../src/lib/booking/availability";
import { calculatePrice } from "../src/lib/booking/pricing";
import {
  buildRentalSchedule,
  localPickupToUtc,
  PICKUP_TIME_OPTIONS,
} from "../src/lib/booking/schedule";
import { checkoutSchema } from "../src/lib/booking/validation";
import {
  BookingConflictError,
  completeRentalPaymentRecord,
  createBookingHold,
  getBooking,
  updateBooking,
} from "../src/lib/booking/repository";
import { markRentalPaymentSucceeded, markPaymentIntentCanceled, markPaymentIntentFailed } from "../src/lib/booking/workflow";
import { depositMethodForDuration, syncDepositPayment } from "../src/lib/stripe/deposits";
import { agreementTextTabs } from "../src/lib/docusign/server";
import { performAdminBookingAction } from "../src/lib/booking/admin-actions";
import type { Booking } from "../src/types/models";
import { resolveAppUrl } from "../src/lib/env";
import {
  pickupChecklist,
  returnChecklist,
  returnReminderScheduledAt,
} from "../src/lib/booking/communications";

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
    checkoutTotalCents: 36500,
  });
});

test("San Antonio pickup time converts through daylight saving time", () => {
  assert.equal(localPickupToUtc("2026-09-05", "10:00").toISOString(), "2026-09-05T15:00:00.000Z");
  assert.equal(localPickupToUtc("2026-12-05", "10:00").toISOString(), "2026-12-05T16:00:00.000Z");
  assert.throws(() => localPickupToUtc("2026-03-08", "02:30"), /6:00 AM/);
});

test("pickup choices use customer-friendly 30-minute operating-hour slots", () => {
  assert.equal(PICKUP_TIME_OPTIONS.length, 32);
  assert.deepEqual(PICKUP_TIME_OPTIONS[0], { value: "06:00", label: "6:00 AM" });
  assert.deepEqual(PICKUP_TIME_OPTIONS.at(-1), { value: "21:30", label: "9:30 PM" });
  assert.throws(
    () => localPickupToUtc("2026-09-05", "15:01"),
    /every 30 minutes/,
  );
});

test("deployment callbacks use the current Vercel preview origin", () => {
  assert.equal(
    resolveAppUrl(undefined, "booking-preview.example.vercel.app"),
    "https://booking-preview.example.vercel.app",
  );
  assert.equal(
    resolveAppUrl("https://www.alamocityhitchandgo.com/ignored-path", "preview.vercel.app"),
    "https://www.alamocityhitchandgo.com",
  );
  assert.throws(() => resolveAppUrl("not-a-url", undefined), /valid absolute URL/);
});

test("return reminder is scheduled exactly two hours before drop-off", () => {
  const now = Date.parse("2026-09-04T12:00:00.000Z");
  const returnTime = Date.parse("2026-09-05T18:30:00.000Z");
  assert.equal(
    returnReminderScheduledAt(returnTime, now),
    "2026-09-05T16:30:00.000Z",
  );
  assert.equal(
    returnReminderScheduledAt(now + 90 * 60 * 1000, now),
    null,
  );
});

test("pickup and return checklists require inspection, ID, insurance, cleaning, and documented lock costs", () => {
  const contact = {
    pickupAddress: "Private test address",
    pickupInstructions: "Wait for the representative before connecting.",
    supportPhone: "210-555-0100",
    supportEmail: "support@example.com",
  };
  const pickup = pickupChecklist(contact).join(" ");
  const returning = returnChecklist(contact).join(" ");
  assert.match(pickup, /physical government-issued ID or driver's license/i);
  assert.match(pickup, /proof of insurance/i);
  assert.match(pickup, /visual inspection/i);
  assert.match(pickup, /documented replacement cost/i);
  assert.doesNotMatch(pickup, /forfeit/i);
  assert.match(returning, /sweep/i);
  assert.match(returning, /lock, and key/i);
  assert.match(returning, /within 24 hours/i);
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

test("pre-confirmation agreement never contains the private pickup address", () => {
  const tabs = agreementTextTabs(bookingFixture("agreement-privacy"));
  assert.equal(tabs.find((tab) => tab.tabLabel === "business_address")?.value,
    "San Antonio, Texas — private pickup location provided after confirmation");
});

test("deposit event replays cannot reopen a rental or overwrite a newer owner action", async () => {
  for (const status of ["active", "return_inspection", "completed", "cancelled"] as const) {
    const fixture = bookingFixture(`replay-${status}`);
    fixture.status = status;
    fixture.depositStatus = status === "completed" ? "captured" : "authorized";
    fixture.depositPaymentIntentId = `pi_${fixture.id}`;
    await createBookingHold(fixture, 1);
    for (const paymentStatus of ["requires_capture", "succeeded", "requires_action"] as const) {
      const result = await syncDepositPayment(fixture, {
        id: fixture.depositPaymentIntentId, status: paymentStatus,
        metadata: { bookingId: fixture.id, kind: "deposit", depositMethod: "authorization" },
      } as unknown as Stripe.PaymentIntent);
      assert.equal(result.status, status);
      assert.equal(result.depositStatus, fixture.depositStatus);
    }
  }
  const stale = bookingFixture("stale-deposit-snapshot");
  stale.status = "confirmed";
  stale.depositPaymentIntentId = "pi_stale";
  await createBookingHold(stale, 1);
  await updateBooking(stale.id, { status: "active", depositStatus: "authorized" });
  const result = await syncDepositPayment(stale, {
    id: "pi_stale", status: "requires_capture",
    metadata: { bookingId: stale.id, kind: "deposit", depositMethod: "authorization" },
  } as unknown as Stripe.PaymentIntent);
  assert.equal(result.status, "active");
});

test("late failure does not invalidate an authorized deposit; expiry preserves checked-out state", async () => {
  const fixture = bookingFixture("deposit-failure-replay");
  fixture.status = "active";
  fixture.depositStatus = "authorized";
  fixture.depositPaymentIntentId = "pi_failure_replay";
  await createBookingHold(fixture, 1);
  const intent = { id: fixture.depositPaymentIntentId,
    metadata: { bookingId: fixture.id, kind: "deposit" } } as unknown as Stripe.PaymentIntent;
  assert.equal((await markPaymentIntentFailed(intent))?.depositStatus, "authorized");
  const expired = await markPaymentIntentCanceled(intent);
  assert.equal(expired?.status, "active");
  assert.equal(expired?.depositStatus, "failed");
});

test("rental payment webhook fulfillment is idempotent", async () => {
  const fixture = bookingFixture("24c2a311-62af-4fe1-83a2-01096c39eea5");
  fixture.trailerId = "trailer-002";
  fixture.rentalPaymentIntentId = "pi_test_rental";
  await createBookingHold(fixture, 1);
  const paymentIntent = {
    id: "pi_test_rental",
    status: "succeeded", currency: "usd", amount_received: 16500,
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

test("pickup records return-reminder state without blocking demo operations", async () => {
  const fixture = bookingFixture("24c2a311-62af-4fe1-83a2-01096c39eeab");
  fixture.status = "ready_for_pickup";
  fixture.depositStatus = "authorized";
  fixture.preInspectionPhotos = ["demo/pre-inspection.jpg"];
  fixture.endTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  fixture.endTimeMs = Date.parse(fixture.endTime);
  await createBookingHold(fixture, 1);
  const pickedUp = await performAdminBookingAction({
    bookingId: fixture.id,
    action: "mark_picked_up",
    actor: "owner@example.com",
  });
  assert.equal(pickedUp.status, "active");
  assert.equal(pickedUp.returnReminderStatus, "not_configured");
  const returned = await performAdminBookingAction({
    bookingId: fixture.id,
    action: "mark_returned",
    actor: "owner@example.com",
  });
  assert.equal(returned.status, "return_inspection");
});
