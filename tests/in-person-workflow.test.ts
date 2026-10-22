import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import { bookingFixture } from "./fixtures/booking";
import { createBookingHold, getBooking, updateBooking } from "../src/lib/booking/repository";
import { markRentalPaymentSucceeded, syncIdentityVerificationSession, completeAgreement, reconcileBookingConfirmation } from "../src/lib/booking/workflow";
import { performAdminBookingAction } from "../src/lib/booking/admin-actions";
import { nextDocumentStatus } from "../src/lib/customers/returning";
import { hasVerifiedAgreement } from "../src/lib/booking/confirmation-policy";
import { isAdminEmail, canAccessBooking } from "../src/lib/auth/authorization";

test("combined payment progresses to paper signing, audited owner verification and inspected pickup without providers", async t => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => { requests++; throw new Error("No external requests permitted"); });
  const b = bookingFixture("paper-paid-progression");
  const start = Date.parse("2030-07-10T15:00:00Z");
  Object.assign(b, { trailerId: "trailer-002", startTime: new Date(start).toISOString(), startTimeMs: start,
    endTime: new Date(start + 86400000).toISOString(), endTimeMs: start + 86400000,
    depositCollectedAtCheckout: true, rentalPaymentIntentId: "pi_paper", stripeIdentitySessionId: "vs_paper" });
  await createBookingHold(b, 1);
  const intent = { id: "pi_paper", metadata: { bookingId: b.id, kind: "rental" }, status: "succeeded", currency: "usd",
    amount_received: b.rentalTotal + b.depositAmount, customer: "cus_fixture", payment_method: "pm_fixture" } as unknown as Stripe.PaymentIntent;
  await assert.rejects(markRentalPaymentSucceeded({ ...intent, amount_received: b.rentalTotal }), /amount/);
  const paid = (await markRentalPaymentSucceeded(intent))!;
  assert.equal(paid.status, "pending_identity");
  assert.equal(paid.agreementStatus, "awaiting_in_person");
  assert.equal(paid.depositStatus, "charged");
  assert.equal(paid.depositPaymentIntentId, "pi_paper");
  await markRentalPaymentSucceeded(intent);
  assert.equal((await getBooking(b.id))!.auditTrail.filter(e => e.action === "rental_payment_succeeded").length, 1);
  const identified = (await syncIdentityVerificationSession({ id: "vs_paper", metadata: { bookingId: b.id }, status: "verified" } as unknown as Stripe.Identity.VerificationSession))!;
  assert.equal(identified.status, "pending_insurance");
  const insurance = { insuranceStatus: "uploaded" as const, insuranceCarrier: "Fixture Insurance", insurancePolicyholder: "Test Renter",
    insurancePolicyNumber: "POL-PAPER", insuranceExpiresAt: "2031-01-01", insuranceStoragePath: "fixture/proof.pdf" };
  await updateBooking(b.id, { ...insurance, status: nextDocumentStatus({ ...identified, ...insurance }) });
  const awaiting = await reconcileBookingConfirmation(b.id);
  assert.equal(awaiting.status, "pending_signature");
  assert.equal(hasVerifiedAgreement(awaiting), false);
  assert.equal(awaiting.docusignEnvelopeId, undefined);
  // Delayed electronic callbacks cannot manufacture a signature for paper mode.
  assert.equal((await completeAgreement(awaiting, "docusign")).agreementStatus, "awaiting_in_person");
  await assert.rejects(performAdminBookingAction({ bookingId: b.id, action: "approve", actor: "owner" }), /not available/);
  await assert.rejects(performAdminBookingAction({ bookingId: b.id, action: "mark_picked_up", actor: "owner" }), /not available/);
  await assert.rejects(performAdminBookingAction({ bookingId: b.id, action: "verify_in_person_agreement", actor: "owner" }), /note/);
  await assert.rejects(performAdminBookingAction({ bookingId: b.id, action: "verify_in_person_agreement", actor: "", note: "Witnessed and retained" }), /identity/);
  assert.equal(isAdminEmail("renter@example.com"), false);
  assert.equal(canAccessBooking({ email: "someone@example.com" }, b), false);
  const verified = await performAdminBookingAction({ bookingId: b.id, action: "verify_in_person_agreement", actor: "owner@alamocityhitchandgo.test", note: "Witnessed renter signature; original retained in office under booking ID." });
  assert.equal(verified.status, "ready_for_pickup");
  assert.equal(verified.agreementStatus, "signed_in_person");
  assert.equal(hasVerifiedAgreement(verified), true);
  assert.equal(verified.docusignEnvelopeId, undefined);
  assert.equal(verified.auditTrail.filter(e => e.action === "in_person_agreement_verified").length, 1);
  await assert.rejects(performAdminBookingAction({ bookingId: b.id, action: "mark_picked_up", actor: "owner" }), /inspection photo/);
  await updateBooking(b.id, { preInspectionPhotos: ["fixture/pre.jpg"] });
  assert.equal((await performAdminBookingAction({ bookingId: b.id, action: "mark_picked_up", actor: "owner" })).status, "active");
  assert.equal(requests, 0);
});
