import assert from "node:assert/strict";
import test, { mock } from "node:test";
import type Stripe from "stripe";
import type { Booking } from "../src/types/models";

// No network requests: provider methods are mocked below. No real credentials.
test("upfront deposit lifecycle", async (t) => {
process.env.STRIPE_SECRET_KEY = "sk_test_local_fixture";
const { getStripe } = await import("../src/lib/stripe/server");
const { createBookingHold, getBooking, updateBooking } = await import("../src/lib/booking/repository");
const { markRentalPaymentSucceeded, markPaymentIntentFailed } = await import("../src/lib/booking/workflow");
const { requestDeposit, releaseDeposit, captureDeposit } = await import("../src/lib/stripe/deposits");
const { performAdminBookingAction } = await import("../src/lib/booking/admin-actions");
const { agreementTextTabs } = await import("../src/lib/docusign/server");
const stripe = getStripe()!;
const refunds: Stripe.RefundCreateParams[] = [];
mock.method(stripe.refunds, "create", async (params: Stripe.RefundCreateParams) => {
  refunds.push(params);
  return { id: "re_local", status: "succeeded" };
});
mock.method(stripe.paymentIntents, "create", async () => { throw new Error("Unexpected second deposit charge"); });

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


async function paidBooking(id: string) {
  const fixture = bookingFixture(id);
  fixture.trailerId = "trailer-002";
  // Keep each independently testable booking away from others.
  fixture.startTimeMs += Number(id.slice(-1)) * 864000000;
  fixture.endTimeMs = fixture.startTimeMs + 86400000;
  fixture.rentalPaymentIntentId = `pi_${id}`;
  fixture.depositCollectedAtCheckout = true;
  await createBookingHold(fixture, 1);
  const intent = { id: fixture.rentalPaymentIntentId, status: "succeeded", currency: "usd",
    amount_received: 36500, metadata: { bookingId: id, kind: "rental" },
    payment_method: "pm_local", customer: "cus_local" } as unknown as Stripe.PaymentIntent;
  return { fixture, intent };
}

await t.test("combined payment validates amount and status, records deposit once, and saves payment method", async () => {
  const { fixture, intent } = await paidBooking("combined-1");
  await assert.rejects(markRentalPaymentSucceeded({ ...intent, amount_received: 16500 }), /does not match/);
  await assert.rejects(markRentalPaymentSucceeded({ ...intent, status: "processing" }), /does not match/);
  assert.equal((await getBooking(fixture.id))?.depositStatus, "not_requested");
  const paid = await markRentalPaymentSucceeded(intent);
  assert.equal(paid?.depositStatus, "charged");
  assert.equal(paid?.depositPaymentIntentId, intent.id);
  assert.equal(paid?.stripePaymentMethodId, "pm_local");
  assert.equal(paid?.status, "pending_signature");
  assert.equal((await markPaymentIntentFailed(intent))?.depositStatus, "charged");
  await markRentalPaymentSucceeded(intent);
  assert.equal((await getBooking(fixture.id))?.auditTrail.filter(e => e.action === "rental_payment_succeeded").length, 1);
  assert.equal((await requestDeposit(fixture.id, "owner")).depositStatus, "charged");
  assert.equal(agreementTextTabs(paid!).find(t => t.tabLabel === "total_charge")?.value, "$365.00");
});

await t.test("upfront deposit does not bypass document verification; owner insurance approval makes pickup ready", async () => {
  const { fixture, intent } = await paidBooking("combined-2");
  await markRentalPaymentSucceeded(intent);
  await updateBooking(fixture.id, { status: "under_review", insuranceStatus: "uploaded" });
  await assert.rejects(performAdminBookingAction({ bookingId: fixture.id, action: "approve", actor: "owner" }), /must all be complete/);
  await updateBooking(fixture.id, { agreementStatus: "signed", identityStatus: "verified" });
  const approved = await performAdminBookingAction({ bookingId: fixture.id, action: "approve", actor: "owner" });
  assert.equal(approved.insuranceStatus, "approved");
  assert.equal(approved.status, "ready_for_pickup");
});

async function inspected(id: string) {
  const { fixture, intent } = await paidBooking(id);
  await markRentalPaymentSucceeded(intent);
  await updateBooking(id, { status: "return_inspection", postInspectionPhotos: ["test/return.jpg"] });
  return fixture;
}

await t.test("full deposit refund leaves rental and tax intact and cannot be settled twice", async () => {
  const fixture = await inspected("combined-3");
  const before = refunds.length;
  await releaseDeposit(fixture.id, "owner");
  assert.deepEqual(refunds[before], { payment_intent: fixture.rentalPaymentIntentId, amount: 20000 });
  await releaseDeposit(fixture.id, "owner");
  assert.equal(refunds.length, before + 1);
  await assert.rejects(captureDeposit(fixture.id, 5000, "owner", "Documented damage"), /different deposit settlement/);
  assert.equal((await getBooking(fixture.id))?.paymentStatus, "succeeded");
});

await t.test("partial retention refunds only the unused deposit and blocks a conflicting settlement", async () => {
  const fixture = await inspected("combined-4");
  const before = refunds.length;
  await captureDeposit(fixture.id, 5000, "owner", "Documented damage");
  await assert.rejects(releaseDeposit(fixture.id, "owner"), /different deposit settlement/);
  assert.deepEqual(refunds[before], { payment_intent: fixture.rentalPaymentIntentId, amount: 15000 });
  assert.equal(refunds.length, before + 1);
  assert.equal((await getBooking(fixture.id))?.depositAmountRetained, 5000);
});

await t.test("concurrent settlement requests reserve exactly one amount", async () => {
  const fixture = await inspected("combined-6");
  const before = refunds.length;
  const results = await Promise.allSettled([
    captureDeposit(fixture.id, 5000, "owner", "Documented damage"),
    releaseDeposit(fixture.id, "owner"),
  ]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(refunds.length, before + 1);
  const current = await getBooking(fixture.id);
  assert.equal(refunds[before].amount, 20000 - current!.depositAmountRetained!);
});

await t.test("expired combined checkout refunds both rental and deposit", async () => {
  const { fixture, intent } = await paidBooking("combined-5");
  await updateBooking(fixture.id, { checkoutExpiresAtMs: 1 });
  const before = refunds.length;
  await assert.rejects(markRentalPaymentSucceeded(intent), /refunded automatically/);
  assert.deepEqual(refunds[before], { payment_intent: intent.id, reason: "requested_by_customer" });
  assert.equal((await getBooking(fixture.id))?.depositStatus, "released");
});

});
