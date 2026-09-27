import assert from "node:assert/strict";
import test from "node:test";
import { returningDetails, reusableInsurance, sameRenter, validThrough, nextDocumentStatus } from "../src/lib/customers/returning";
import type { Booking } from "../src/types/models";
const prior = {
  id: "prior", customerEmail: "a@example.com", paymentStatus: "succeeded", status: "completed", createdAtMs: 1,
  customer: { firstName: "Alex", lastName: "Test", phone: "2105550100", address: { street: "123 Main", city: "Austin", state: "TX", zip: "78701" } },
  towVehicle: { year: "2018", make: "Ford", model: "F-150", plate: "ABC" },
  insuranceStatus: "approved", insuranceExpiresAt: "2026-10-01", insuranceStoragePath: "private/policy.png",
} as Booking;
test("prefill uses only this customer's paid bookings, not other customers or abandoned attempts", () => {
  const result = returningDetails("a@example.com", null, [{ ...prior, customerEmail: "other@example.com", createdAtMs: 3 }, { ...prior, paymentStatus: "pending", createdAtMs: 2 }, prior]);
  assert.equal(result.returningCustomer, true);
  assert.equal(result.savedDetails.firstName, "Alex");
  assert.equal(result.savedDetails.referralSource, "previous_customer");
  assert.equal(returningDetails("nobody@example.com", null, [prior]).returningCustomer, false);
});
test("insurance reuse requires approval, document, matching person/vehicle, and coverage through return", () => {
  assert.equal(reusableInsurance(prior, prior, "2026-10-01"), true);
  assert.equal(reusableInsurance(prior, prior, "2026-10-02"), false);
  assert.equal(reusableInsurance({ ...prior, insuranceStatus: "uploaded" }, prior, "2026-09-20"), false);
  assert.equal(reusableInsurance(prior, { ...prior, towVehicle: { ...prior.towVehicle!, model: "Other" } }, "2026-09-20"), false);
  assert.equal(sameRenter(prior, { ...prior, customerEmail: "other@example.com" }), false);
  assert.equal(sameRenter(prior, { ...prior, customer: { ...prior.customer, firstName: "Other" } }), false);
});
test("missing or invalid expiration cannot count as current; reused docs advance to owner review", () => {
  assert.equal(validThrough(undefined, "2026-09-20"), false);
  assert.equal(validThrough("2026-02-30", "2026-02-01"), false);
  assert.equal(validThrough("2026-09-20", "2026-09-20"), true);
  assert.equal(nextDocumentStatus({ identityStatus: "verified", insuranceStatus: "uploaded", agreementStatus: "signed" }), "under_review");
  assert.equal(nextDocumentStatus({ identityStatus: "not_started", insuranceStatus: "uploaded", agreementStatus: "not_started" }), "pending_identity");
});

test("provider-confirmed current ID and approved insurance are reused without reusing the old agreement", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_local_fixture";
  const { mock } = await import("node:test");
  const { getStripe } = await import("../src/lib/stripe/server");
  const { reuseDocuments } = await import("../src/lib/customers/reuse-documents");
  const stripe = getStripe()!;
  const sessionMock = mock.method(stripe.identity.verificationSessions, "retrieve", async () => ({ status: "verified", last_verification_report: "vr_fixture", redaction: null }));
  const reportMock = mock.method(stripe.identity.verificationReports, "retrieve", async (): Promise<{ document: { status: string; expiration_date: { year: number; month: number; day: number } | null } }> => ({ document: { status: "verified", expiration_date: { year: 2099, month: 1, day: 1 } } }));
  const source = { ...prior, insuranceExpiresAt: "2099-01-01", stripeIdentitySessionId: "vs_fixture", identityStatus: "verified" as const };
  const fresh = () => ({ ...prior, id: "new", endTimeMs: Date.parse("2098-01-01T18:00:00Z"), identityStatus: "not_started", insuranceStatus: "not_uploaded", agreementStatus: "not_started", auditTrail: [], createdAt: "2026-09-15T00:00:00Z" } as Booking);
  try {
    const reused = await reuseDocuments(fresh(), [source]);
    assert.equal(reused.identityStatus, "verified");
    assert.equal(reused.identityExpiresAt, "2099-01-01");
    assert.equal(reused.insuranceStatus, "uploaded");
    assert.equal(reused.insuranceSourceBookingId, "prior");
    assert.equal(reused.stripeIdentitySessionId, undefined);
    assert.equal(reused.agreementStatus, "not_started");
    assert.equal(reused.auditTrail.length, 2);
    reportMock.mock.mockImplementation(async () => ({ document: { status: "verified", expiration_date: null } }));
    assert.equal((await reuseDocuments(fresh(), [source])).identityStatus, "not_started");
    sessionMock.mock.mockImplementation(async () => ({ status: "canceled", last_verification_report: "vr_fixture", redaction: null }));
    assert.equal((await reuseDocuments(fresh(), [source])).identityStatus, "not_started");
    assert.equal((await reuseDocuments({ ...fresh(), customerEmail: "other@example.com" }, [source])).insuranceStatus, "not_uploaded");
  } finally { mock.restoreAll(); }
});
