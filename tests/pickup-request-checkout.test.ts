import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  createPickupRequest,
  getPickupRequest,
  mutatePickupRequest,
} from "../src/lib/pickup-requests/repository";
import {
  createBookingHold,
  getBooking,
  updateBooking,
} from "../src/lib/booking/repository";
import { bookingFixture } from "./fixtures/booking";
import type { TokenPayload } from "../src/lib/auth/session";
import type { CheckoutInput } from "../src/lib/booking/validation";
async function approved(date = "2028-10-10") {
  const r = (
    await createPickupRequest(
      {
        submissionKey: randomUUID(),
        firstName: "Lead",
        lastName: "Test",
        email: `${randomUUID()}@example.com`,
        phone: "2105550100",
        trailerId: "trailer-004",
        date,
        time: "07:30",
        duration: "fullDay",
        message: "",
      },
      randomUUID(),
    )
  ).request;
  return mutatePickupRequest(r.id, (x) => ({
    ...x,
    status: "approved",
    decision: { kind: "approved", note: "yes", actor: "owner", at: Date.now() },
  }));
}
function session(email: string): TokenPayload {
  return { email, version: 2, kind: "session", iat: 1, exp: 9999999999 };
}
test("only the approved verified renter can resume the exact requested schedule", async () => {
  const mod = await import("../src/lib/pickup-requests/checkout").catch(
    () => null,
  );
  assert.ok(mod, "approved checkout validation must exist");
  const r = await approved();
  for (const s of [
    null,
    session("other@example.com"),
    { ...session(r.email), bookingId: "scoped" },
  ])
    await assert.rejects(
      mod.getApprovedPickupRequest(r.id, s, Date.now()),
      /access/i,
    );
  assert.equal(
    (await mod.getApprovedPickupRequest(r.id, session(r.email), Date.now()))
      .firstName,
    "Lead",
  );
  await assert.rejects(
    mod.getApprovedPickupRequest(r.id, session(r.email), r.startTimeMs),
    /expired/i,
  );
  const input = {
    email: r.email,
    trailerId: r.trailerId,
    date: r.date,
    time: r.time,
    duration: r.duration,
  } as CheckoutInput;
  assert.doesNotThrow(() => mod.assertRequestMatchesCheckout(r, input));
  for (const patch of [
    { email: "other@example.com" },
    { time: "19:00" },
    { date: "2028-10-11" },
    { duration: "halfDay" },
    { trailerId: "trailer-002" },
  ])
    assert.throws(
      () =>
        mod.assertRequestMatchesCheckout(r, {
          ...input,
          ...patch,
        } as CheckoutInput),
      /match/i,
    );
});
test("one approved request cannot fund two concurrent checkouts and an expired unpaid hold can be retried", async () => {
  const r = await approved(),
    one = bookingFixture(randomUUID()),
    two = bookingFixture(randomUUID());
  for (const b of [one, two])
    Object.assign(b, {
      pickupRequestId: r.id,
      customerEmail: r.email,
      trailerId: r.trailerId,
      duration: r.duration,
      startTime: r.startTime,
      endTime: r.endTime,
      startTimeMs: r.startTimeMs,
      endTimeMs: r.endTimeMs,
    });
  const outcomes = await Promise.allSettled([
    createBookingHold(one, 2),
    createBookingHold(two, 2),
  ]);
  assert.equal(
    outcomes.filter((x) => x.status === "fulfilled").length,
    1,
    "approval must bind once even when capacity allows two rentals",
  );
  const linked = (await getPickupRequest(r.id))!.bookingId!;
  assert.ok([one.id, two.id].includes(linked));
  const winner = linked === one.id ? one : two,
    other = linked === one.id ? two : one;
  assert.equal((await createBookingHold(winner, 2)).id, linked);
  await updateBooking(linked, { checkoutExpiresAtMs: Date.now() - 1 });
  assert.equal((await createBookingHold(other, 2)).id, other.id);
  assert.equal((await getPickupRequest(r.id))?.bookingId, other.id);
  assert.equal((await getBooking(linked))?.paymentStatus, "pending");
});
test("payment completion books the request once and paid replay repairs missing linkage without changing the rental", async () => {
  const { markRentalPaymentSucceeded } = await import(
    "../src/lib/booking/workflow"
  );
  const r = await approved("2028-11-10"),
    b = bookingFixture(randomUUID());
  Object.assign(b, {
    pickupRequestId: r.id,
    customerEmail: r.email,
    trailerId: r.trailerId,
    startTime: r.startTime,
    endTime: r.endTime,
    startTimeMs: r.startTimeMs,
    endTimeMs: r.endTimeMs,
    rentalPaymentIntentId: `pi_${b.id}`,
  });
  await createBookingHold(b, 1);
  const intent: import("stripe").default.PaymentIntent = {
    id: b.rentalPaymentIntentId!,
    object: "payment_intent",
    amount: 16500,
    amount_capturable: 0,
    application: null,
    application_fee_amount: null,
    automatic_payment_methods: null,
    canceled_at: null,
    cancellation_reason: null,
    capture_method: "automatic",
    client_secret: null,
    confirmation_method: "automatic",
    created: 1790000000,
    customer_account: null,
    description: null,
    excluded_payment_method_types: null,
    last_payment_error: null,
    latest_charge: null,
    livemode: false,
    managed_payments: null,
    next_action: null,
    on_behalf_of: null,
    payment_method_configuration_details: null,
    payment_method_options: null,
    payment_method_types: ["card"],
    processing: null,
    receipt_email: null,
    review: null,
    setup_future_usage: null,
    shipping: null,
    source: null,
    statement_descriptor: null,
    statement_descriptor_suffix: null,
    transfer_group: null,
    status: "succeeded",
    currency: "usd",
    amount_received: 16500,
    metadata: { bookingId: b.id, kind: "rental" },
    customer: "cus_fixture",
    payment_method: "pm_fixture",
  };
  await markRentalPaymentSucceeded(intent);
  assert.equal((await getPickupRequest(r.id))?.status, "booked");
  assert.equal((await getPickupRequest(r.id))?.bookingId, b.id);
  await updateBooking(b.id, { status: "active" });
  await mutatePickupRequest(r.id, (record) => ({
    ...record,
    status: "approved",
  }));
  await markRentalPaymentSucceeded(intent);
  assert.equal((await getPickupRequest(r.id))?.status, "booked");
  assert.equal((await getBooking(b.id))?.status, "active");
  assert.equal(
    (await getBooking(b.id))?.auditTrail.filter(
      (x) => x.action === "rental_payment_succeeded",
    ).length,
    1,
  );
  await assert.rejects(
    markRentalPaymentSucceeded({ ...intent, id: "pi_wrong" }),
  );
  assert.equal((await getPickupRequest(r.id))?.bookingId, b.id);
});

test("reopening an approval recovers the active checkout and its authorization after a lost response", async () => {
  const mod = await import("../src/lib/pickup-requests/checkout");
  assert.equal(typeof mod.getResumablePickupCheckout, "function");
  const r = await approved("2028-12-10");
  const b = bookingFixture(randomUUID());
  const { hashCheckoutProof } = await import("../src/lib/auth/checkout-proof");
  Object.assign(b, {
    pickupRequestId: r.id,
    customerEmail: r.email,
    trailerId: r.trailerId,
    startTime: r.startTime,
    endTime: r.endTime,
    startTimeMs: r.startTimeMs,
    endTimeMs: r.endTimeMs,
    checkoutAccessHash: hashCheckoutProof(mod.pickupCheckoutProof(r, b.id)),
  });
  await createBookingHold(b, 1);
  const recovered = await mod.getResumablePickupCheckout(
    r.id,
    session(r.email),
  );
  assert.equal(recovered?.checkoutKey, b.id);
  assert.deepEqual(recovered?.savedDetails.address, b.customer.address);
  assert.deepEqual(recovered?.savedDetails.towVehicle, {
    ...b.towVehicle,
    plate: b.towVehicle.plate ?? "",
  });
  assert.equal(recovered?.savedDetails.policiesAccepted, true);
  // Recreated proof is identical even when the original cookie response was lost.
  const retry = {
    ...b,
    towVehicle: recovered!.savedDetails.towVehicle,
    checkoutAccessHash: hashCheckoutProof(
      mod.pickupCheckoutProof(r, recovered!.checkoutKey),
    ),
  };
  assert.equal((await createBookingHold(retry, 1)).id, b.id);
  assert.notEqual(
    mod.pickupCheckoutProof(r, b.id),
    mod.pickupCheckoutProof(r, randomUUID()),
  );
  await assert.rejects(
    mod.getResumablePickupCheckout(r.id, session("wrong@example.com")),
  );
  await assert.rejects(
    mod.getResumablePickupCheckout(r.id, {
      ...session(r.email),
      bookingId: b.id,
    }),
  );
  await updateBooking(b.id, { checkoutExpiresAtMs: Date.now() - 1 });
  assert.equal(
    await mod.getResumablePickupCheckout(r.id, session(r.email)),
    null,
  );
});
