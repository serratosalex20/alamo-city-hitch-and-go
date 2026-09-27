import assert from "node:assert/strict";
import test from "node:test";
import { nextDocumentStatus } from "../src/lib/customers/returning";
import { insuranceTabUpdates } from "../src/lib/docusign/insurance-tabs";
import type { Booking } from "../src/types/models";

test("document order requires identity, insurance including policy number, then a new signature", () => {
  const state = { identityStatus: "not_started", insuranceStatus: "not_uploaded", agreementStatus: "not_started" } as const;
  assert.equal(nextDocumentStatus(state), "pending_identity");
  assert.equal(nextDocumentStatus({ ...state, identityStatus: "verified" }), "pending_insurance");
  assert.equal(nextDocumentStatus({ ...state, identityStatus: "verified", insuranceStatus: "uploaded" }), "pending_insurance");
  const insured = { ...state, identityStatus: "verified", insuranceStatus: "uploaded", insurancePolicyNumber: "POL-123" } as const;
  assert.equal(nextDocumentStatus(insured), "pending_signature");
  assert.equal(nextDocumentStatus({ ...insured, agreementStatus: "signed" }), "under_review");
  assert.equal(nextDocumentStatus({ ...insured, agreementStatus: "signed", insuranceStatus: "resubmit_requested" }), "pending_insurance");
});

test("DocuSign uses the actual insurance tabs and does not change unrelated fields", () => {
  const booking = { insuranceCarrier: "Carrier A", insurancePolicyNumber: "POL-123", insuranceExpiresAt: "2027-10-10" } as Booking;
  const tabs = [{ tabId: "carrier", tabLabel: "insurance_carrier" }, { tabId: "number", tabLabel: "insurance_policy_number" }, { tabId: "expiry", tabLabel: "insurance_expiration_date" }, { tabId: "other", tabLabel: "drivers_license_number" }];
  assert.deepEqual(insuranceTabUpdates(booking, tabs), [
    { tabId: "carrier", value: "Carrier A", locked: "true" },
    { tabId: "number", value: "POL-123", locked: "true" },
    { tabId: "expiry", value: "2027-10-10", locked: "true" },
  ]);
  assert.throws(() => insuranceTabUpdates(booking, tabs.slice(0, 2)), /insurance fields/);
});
