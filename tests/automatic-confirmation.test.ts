import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import type { Booking } from "../src/types/models";
import { bookingFixture } from "./fixtures/booking";
import {
  createBookingHold,
  getBooking,
  updateBooking,
} from "../src/lib/booking/repository";
import {
  completeAgreement,
  syncIdentityVerificationSession,
} from "../src/lib/booking/workflow";
import {
  createPickupRequest,
  mutatePickupRequest,
} from "../src/lib/pickup-requests/repository";
import { randomUUID } from "node:crypto";

let sequence = 0;
async function prepared(patch: Partial<Booking> = {}) {
  const b = bookingFixture(`auto-${++sequence}`);
  const start = Date.UTC(2030, 0, sequence * 3, 16); // 10 AM Central, separate rentals
  Object.assign(b, {
    trailerId: "trailer-004",
    startTimeMs: start,
    endTimeMs: start + 86400000,
    startTime: new Date(start).toISOString(),
    endTime: new Date(start + 86400000).toISOString(),
    paymentStatus: "succeeded",
    rentalPaymentIntentId: `pi_${b.id}`,
    depositCollectedAtCheckout: true,
    depositStatus: "charged",
    depositMethod: "refundable_charge",
    depositPaymentIntentId: `pi_${b.id}`,
    status: "pending_signature",
    identityStatus: "verified",
    identityVerifiedAt: new Date().toISOString(),
    stripeIdentitySessionId: `vs_${b.id}`,
    insuranceStatus: "uploaded",
    insuranceStoragePath: `bookings/${b.id}/proof.pdf`,
    insuranceCarrier: "Test Insurance",
    insurancePolicyholder: "Test Renter",
    insurancePolicyNumber: "POL-123",
    insuranceExpiresAt: "2031-01-01",
    insuranceMimeType: "application/pdf",
    docusignEnvelopeId: `envelope_${b.id}`,
    agreementStatus: "sent",
    ...patch,
  });
  await createBookingHold(b, 5);
  return b;
}

test("signing the last requirement automatically confirms a paid in-hours rental exactly once", async () => {
  const b = await prepared();
  const result = await completeAgreement(b, "renter");
  assert.equal(result.status, "ready_for_pickup");
  assert.equal(result.insuranceStatus, "accepted");
  assert.ok(result.confirmedAt);
  await Promise.all([
    completeAgreement(b, "renter"),
    completeAgreement(b, "renter"),
  ]);
  const saved = (await getBooking(b.id))!;
  assert.equal(
    saved.auditTrail.filter((e) => e.action === "booking_auto_confirmed")
      .length,
    1,
  );
  assert.equal(
    saved.auditTrail.filter((e) => e.action === "agreement_signed").length,
    1,
  );
});

test("incomplete, expired, mismatched and explicitly rejected records never become ready", async () => {
  const cases: Partial<Booking>[] = [
    { paymentStatus: "pending" },
    { depositStatus: "failed" },
    { identityStatus: "requires_input" },
    { identityExpiresAt: "2029-12-31" },
    { insuranceStoragePath: undefined },
    { insurancePolicyNumber: "" },
    { insuranceExpiresAt: "2029-12-31" },
    { insurancePolicyholder: "Someone Else" },
    { insuranceStatus: "resubmit_requested" },
    { insuranceStatus: "rejected" },
    { status: "cancelled" },
    { status: "rejected" },
    { status: "completed" },
  ];
  for (const patch of cases) {
    const b = await prepared(patch);
    const result = await completeAgreement(b, "renter");
    assert.notEqual(result.status, "ready_for_pickup", JSON.stringify(patch));
    assert.equal(result.confirmedAt, undefined);
    if (patch.status) assert.equal(result.status, patch.status);
  }
});

test("late agreement and identity callbacks cannot resurrect cancelled rentals or superseded documents", async () => {
  const stale = await prepared();
  await updateBooking(stale.id, { status: "cancelled" });
  await completeAgreement(stale, "renter");
  await syncIdentityVerificationSession(identityEvent(stale));
  assert.equal((await getBooking(stale.id))!.status, "cancelled");
  const replaced = await prepared();
  await updateBooking(replaced.id, {
    docusignEnvelopeId: "replacement",
    agreementStatus: "sent",
  });
  await completeAgreement(replaced, "renter");
  assert.equal((await getBooking(replaced.id))!.agreementStatus, "sent");
});

test("identity arriving after the signature confirms, and an older identity failure cannot undo verification", async () => {
  const b = await prepared({
    identityStatus: "pending",
    agreementStatus: "signed",
  });
  const event = identityEvent(b);
  const verified = await syncIdentityVerificationSession(event);
  assert.equal(verified?.status, "ready_for_pickup");
  await syncIdentityVerificationSession({ ...event, status: "requires_input" });
  assert.equal((await getBooking(b.id))!.identityStatus, "verified");
});

test("outside-hours confirmation requires the owner's decision for this exact rental", async () => {
  const { request } = await createPickupRequest(
    {
      submissionKey: randomUUID(),
      firstName: "Test",
      lastName: "Renter",
      email: "outside@example.com",
      phone: "2105550100",
      trailerId: "trailer-004",
      date: "2032-01-10",
      time: "07:30",
      duration: "fullDay",
      message: "Early pickup",
    },
    randomUUID(),
  );
  await mutatePickupRequest(request.id, (r) => ({
    ...r,
    status: "approved",
    decision: {
      kind: "approved",
      actor: "owner",
      note: "See you at 7:30",
      at: Date.now(),
    },
  }));
  const b = await prepared({
    pickupRequestId: request.id,
    customerEmail: request.email,
    startTime: request.startTime,
    startTimeMs: request.startTimeMs,
    endTime: request.endTime,
    endTimeMs: request.endTimeMs,
    insuranceExpiresAt: "2033-01-01",
  });
  await mutatePickupRequest(request.id, (r) => ({ ...r, status: "booked" }));
  assert.equal(
    (await completeAgreement(b, "renter")).status,
    "ready_for_pickup",
  );
  const unapproved = await prepared({
    startTime: "2032-02-10T13:30:00.000Z",
    startTimeMs: Date.parse("2032-02-10T13:30:00.000Z"),
    endTime: "2032-02-11T13:30:00.000Z",
    endTimeMs: Date.parse("2032-02-11T13:30:00.000Z"),
    insuranceExpiresAt: "2033-01-01",
  });
  assert.notEqual(
    (await completeAgreement(unapproved, "renter")).status,
    "ready_for_pickup",
  );
});

test("a conflicting paid booking prevents automatic pickup release", async () => {
  const b = await prepared();
  await prepared({
    startTime: b.startTime,
    startTimeMs: b.startTimeMs,
    endTime: b.endTime,
    endTimeMs: b.endTimeMs,
  });
  const result = await completeAgreement(b, "renter");
  assert.notEqual(result.status, "ready_for_pickup");
  assert.match(result.automaticConfirmationIssue!, /availability/i);
});

test("an approved request changed after checkout cannot confirm the wrong schedule", async () => {
  const { request } = await createPickupRequest(
    {
      submissionKey: randomUUID(),
      firstName: "Test",
      lastName: "Renter",
      email: "mismatch@example.com",
      phone: "2105550100",
      trailerId: "trailer-004",
      date: "2032-03-10",
      time: "19:30",
      duration: "fullDay",
      message: "Late pickup",
    },
    randomUUID(),
  );
  await mutatePickupRequest(request.id, (r) => ({
    ...r,
    status: "approved",
    decision: {
      kind: "approved",
      actor: "owner",
      note: "Approved",
      at: Date.now(),
    },
  }));
  const b = await prepared({
    pickupRequestId: request.id,
    customerEmail: request.email,
    startTime: request.startTime,
    startTimeMs: request.startTimeMs,
    endTime: request.endTime,
    endTimeMs: request.endTimeMs,
    insuranceExpiresAt: "2033-01-01",
  });
  await mutatePickupRequest(request.id, (r) => ({
    ...r,
    startTimeMs: r.startTimeMs + 1800000,
  }));
  assert.notEqual(
    (await completeAgreement(b, "renter")).status,
    "ready_for_pickup",
  );
});

test("concurrent completion of identity and agreement uses the fresh document state", async () => {
  const b = await prepared({ identityStatus: "pending" });
  await Promise.all([
    completeAgreement(b, "renter"),
    syncIdentityVerificationSession(identityEvent(b)),
  ]);
  const saved = (await getBooking(b.id))!;
  assert.equal(saved.status, "ready_for_pickup");
  assert.equal(saved.identityStatus, "verified");
  assert.equal(saved.agreementStatus, "signed");
  assert.equal(
    saved.auditTrail.filter((e) => e.action === "booking_auto_confirmed")
      .length,
    1,
  );
});

test("returning renters can reuse automatically accepted current insurance but must sign again", async () => {
  const { reusableInsurance } = await import("../src/lib/customers/returning");
  const b = await prepared();
  const confirmed = await completeAgreement(b, "renter");
  assert.equal(reusableInsurance(confirmed, b, "2030-12-01"), true);
  assert.equal(reusableInsurance(confirmed, b, "2032-01-01"), false);
  assert.equal(
    reusableInsurance(
      { ...confirmed, insuranceStatus: "uploaded" },
      b,
      "2030-12-01",
    ),
    false,
  );
});

function identityEvent(b: Booking): Stripe.Identity.VerificationSession {
  return {
    id: b.stripeIdentitySessionId!,
    object: "identity.verification_session",
    status: "verified",
    metadata: { bookingId: b.id },
    created: 1,
    livemode: false,
    client_reference_id: null,
    client_secret: null,
    last_error: null,
    last_verification_report: null,
    options: { document: { require_matching_selfie: true } },
    redaction: null,
    related_customer: null,
    related_customer_account: null,
    type: "document",
    url: null,
  };
}

test("manual exception approval cannot bypass expiration, inventory, or outside-hours requirements", async () => {
  const { performAdminBookingAction } = await import(
    "../src/lib/booking/admin-actions"
  );
  for (const patch of [
    { insuranceExpiresAt: "2029-01-01" },
    { insuranceStoragePath: undefined },
    { pickupRequestId: "missing-request" },
  ] as Partial<Booking>[]) {
    const b = await prepared();
    await updateBooking(b.id, {
      ...patch,
      status: "under_review",
      agreementStatus: "signed",
    });
    await assert.rejects(
      performAdminBookingAction({
        bookingId: b.id,
        action: "approve",
        actor: "owner",
      }),
    );
    assert.equal((await getBooking(b.id))!.status, "under_review");
  }
  const occupied = await prepared({
    agreementStatus: "signed",
    status: "under_review",
  });
  await prepared({
    startTime: occupied.startTime,
    startTimeMs: occupied.startTimeMs,
    endTime: occupied.endTime,
    endTimeMs: occupied.endTimeMs,
  });
  await assert.rejects(
    performAdminBookingAction({
      bookingId: occupied.id,
      action: "approve",
      actor: "owner",
    }),
    /availability/,
  );
});
