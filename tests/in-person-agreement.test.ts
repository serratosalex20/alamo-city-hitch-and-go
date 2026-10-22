import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { bookingFixture } from "./fixtures/booking";
import { createBookingHold, getBooking } from "../src/lib/booking/repository";
import { performAdminBookingAction } from "../src/lib/booking/admin-actions";
import { automaticConfirmationIssue } from "../src/lib/booking/confirmation-policy";
import { isAdminEmail } from "../src/lib/auth/authorization";

test.beforeEach(() => { mock.method(globalThis, "fetch", async () => { throw new Error("External provider calls forbidden in this test"); }); });
test.afterEach(() => mock.restoreAll());

test("owner can request corrected insurance or reject while paper signing is pending", async () => {
  assert.equal(isAdminEmail("renter@example.com"), false);
  for (const action of ["request_insurance_resubmission", "reject"] as const) {
    const b = bookingFixture(`paper-review-${action}`);
    Object.assign(b, { status: "pending_signature", paymentStatus: "succeeded", agreementStatus: "awaiting_in_person", identityStatus: "verified", insuranceStatus: "uploaded" });
    await createBookingHold(b, 1);
    const updated = await performAdminBookingAction({ bookingId: b.id, action, actor: "owner@alamocityhitchandgo.test", note: "Insurance proof does not cover this rental." });
    assert.equal(updated.status, action === "reject" ? "rejected" : "pending_insurance");
    assert.equal(updated.agreementStatus, "awaiting_in_person");
    await assert.rejects(performAdminBookingAction({ bookingId: b.id, action: "verify_in_person_agreement", actor: "owner", note: "Signed and retained" }), /not available/);
  }
});

test("awaiting physical signature cannot confirm or release a trailer", async () => {
  const b = bookingFixture("physical-gate");
  Object.assign(b, {status:"ready_for_pickup",paymentStatus:"succeeded",rentalPaymentIntentId:"pi_test",agreementStatus:"awaiting_in_person",identityStatus:"verified",preInspectionPhotos:["pre.jpg"]});
  await createBookingHold(b, 1);
  assert.match(automaticConfirmationIssue(b, null)!, /in.person/i);
  await assert.rejects(performAdminBookingAction({bookingId:b.id,action:"mark_picked_up",actor:"owner@example.com"}), /signed.*person|agreement/i);
  assert.equal((await getBooking(b.id))!.status,"ready_for_pickup");
});

test("owner verifies physical signature with an audited note, never a DocuSign signature", async () => {
  const b = bookingFixture("physical-owner");
  Object.assign(b, {status:"pending_signature",paymentStatus:"succeeded",agreementStatus:"awaiting_in_person",identityStatus:"verified",insuranceStatus:"uploaded"});
  await createBookingHold(b,1);
  await assert.rejects(performAdminBookingAction({bookingId:b.id,action:"verify_in_person_agreement" as never,actor:"owner@example.com"}), /note/i);
  await performAdminBookingAction({bookingId:b.id,action:"verify_in_person_agreement" as never,actor:"owner@example.com",note:"Physical signature witnessed; paper agreement retained in office."});
  const saved=(await getBooking(b.id))!;
  assert.equal(saved.agreementStatus,"signed_in_person");
  assert.equal(saved.agreementVerifiedBy,"owner@example.com");
  assert.ok(saved.agreementVerifiedAt);
  assert.equal(saved.docusignEnvelopeId,undefined);
  assert.equal(saved.auditTrail.filter(e=>e.action==="in_person_agreement_verified").length,1);
  await assert.rejects(performAdminBookingAction({bookingId:b.id,action:"verify_in_person_agreement" as never,actor:"owner@example.com",note:"Repeated verification"}), /awaiting/i);
});
