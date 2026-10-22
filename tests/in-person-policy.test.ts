import assert from "node:assert/strict";
import test from "node:test";
import {bookingFixture} from "./fixtures/booking";
import {automaticConfirmationIssue, hasVerifiedAgreement} from "../src/lib/booking/confirmation-policy";
import { agreementUpdatesForInsuranceChange } from "../src/lib/booking/agreement-policy";
test("awaiting physical agreement explains the outstanding signature",()=>{
const b=bookingFixture("awaiting");Object.assign(b,{paymentStatus:"succeeded",rentalPaymentIntentId:"pi_test",identityStatus:"verified",agreementStatus:"awaiting_in_person"});
assert.match(automaticConfirmationIssue(b,null)!,/in.person/i);
});

test("changed insurance invalidates paper verification and supersedes electronic envelopes", () => {
  const b = bookingFixture("changed-policy");
  Object.assign(b, { agreementStatus: "signed_in_person", agreementSignedAt: "2030-01-01T00:00:00Z", agreementVerifiedAt: "2030-01-01T00:00:00Z", agreementVerifiedBy: "owner", docusignEnvelopeId: "prior-envelope" });
  const reset = agreementUpdatesForInsuranceChange(b, true, "in_person");
  assert.equal(reset.agreementStatus, "awaiting_in_person");
  assert.equal(reset.agreementSignedAt, undefined);
  assert.equal(reset.agreementVerifiedAt, undefined);
  assert.equal(reset.agreementVerifiedBy, undefined);
  assert.equal(reset.docusignEnvelopeId, undefined);
  assert.deepEqual(reset.supersededAgreementEnvelopeIds, ["prior-envelope"]);
  assert.equal(hasVerifiedAgreement({ ...b, ...reset }), false);
  assert.deepEqual(agreementUpdatesForInsuranceChange(b, false, "in_person"), {});
  assert.equal(agreementUpdatesForInsuranceChange(b, true, "docusign").agreementStatus, "not_started");
});

test("physical signature status without owner audit evidence cannot release",()=>{
 const b=bookingFixture("forged"); Object.assign(b,{agreementStatus:"signed_in_person",agreementSignedAt:"2030-01-01T00:00:00Z",agreementVerifiedAt:"2030-01-01T00:00:00Z",agreementVerifiedBy:"owner@example.com"});
 assert.equal(hasVerifiedAgreement(b),false);
 b.auditTrail.push({action:"in_person_agreement_verified",actor:"owner@example.com",note:"Witnessed signature; original retained",createdAt:"2030-01-01T00:00:00Z",createdAtMs:Date.parse("2030-01-01T00:00:00Z")});
 assert.equal(hasVerifiedAgreement(b),true);
});

test("verified physical signature at scheduled pickup permits remaining confirmation checks",()=>{
 const b=bookingFixture("at-pickup"); const start=Date.parse("2030-01-02T16:00:00Z"); const verified=new Date(start).toISOString();
 Object.assign(b,{paymentStatus:"succeeded",rentalPaymentIntentId:"pi_test",identityStatus:"verified",agreementStatus:"signed_in_person",agreementSignedAt:verified,agreementVerifiedAt:verified,agreementVerifiedBy:"owner@example.com",insuranceStatus:"uploaded",insuranceStoragePath:"proof.pdf",insuranceCarrier:"Test",insurancePolicyholder:"Test Renter",insurancePolicyNumber:"POL",insuranceExpiresAt:"2031-01-01",startTimeMs:start,endTimeMs:start+86400000,startTime:verified,endTime:new Date(start+86400000).toISOString(),depositStatus:"charged",depositPaymentIntentId:"pi_deposit"});
 b.auditTrail.push({action:"in_person_agreement_verified",actor:"owner@example.com",note:"Signed paper retained",createdAt:verified,createdAtMs:start});
 assert.equal(automaticConfirmationIssue(b,null,start+60000),null);
 assert.match(automaticConfirmationIssue(b,null,start+86400000)!,/schedule/);
 b.agreementStatus="signed";
 assert.match(automaticConfirmationIssue(b,null,start+60000)!,/schedule/);
});
