import assert from "node:assert/strict";
import test from "node:test";
import { bookingFixture } from "./fixtures/booking";

test("a confirmation email failure preserves the booking and a retry delivers once without charging or refunding", async (t) => {
  process.env.RESEND_API_KEY = "re_local_fixture";
  process.env.PICKUP_ADDRESS = "123 Test Address";
  process.env.STRIPE_SECRET_KEY = "sk_test_local_fixture";
  const { createBookingHold, getBooking } = await import(
    "../src/lib/booking/repository"
  );
  const { completeAgreement, markRentalPaymentSucceeded } = await import(
    "../src/lib/booking/workflow"
  );
  const { getStripe } = await import("../src/lib/stripe/server");
  const stripe = getStripe()!;
  t.mock.method(stripe.refunds, "create", async () => {
    assert.fail("Email failure must not refund payment");
  });
  t.mock.method(stripe.paymentIntents, "create", async () => {
    assert.fail("Confirmation must not charge again");
  });
  let fail = true;
  let sends = 0;
  t.mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      assert.equal(String(input), "https://api.resend.com/emails");
      assert.equal(init?.method, "POST");
      assert.equal(
        new Headers(init?.headers).get("Idempotency-Key"),
        "pickup-ready-email-retry",
      );
      const body = JSON.parse(String(init?.body));
      assert.equal(body.to, "email-retry@example.com");
      assert.match(body.html, /123 Test Address/);
      sends++;
      return fail
        ? Response.json(
            { name: "application_error", message: "Temporary email failure" },
            { status: 503 },
          )
        : Response.json({ id: "email-local" });
    },
  );
  const b = bookingFixture("email-retry");
  Object.assign(b, {
    trailerId: "trailer-004",
    startTime: "2030-12-01T16:00:00.000Z",
    endTime: "2030-12-02T16:00:00.000Z",
    startTimeMs: Date.parse("2030-12-01T16:00:00.000Z"),
    endTimeMs: Date.parse("2030-12-02T16:00:00.000Z"),
    status: "pending_signature",
    paymentStatus: "succeeded",
    rentalPaymentIntentId: "pi_email",
    depositPaymentIntentId: "pi_email",
    depositCollectedAtCheckout: true,
    depositStatus: "charged",
    identityStatus: "verified",
    insuranceStatus: "uploaded",
    insuranceStoragePath: "bookings/test/proof.pdf",
    insuranceCarrier: "Test",
    insurancePolicyNumber: "POL-1",
    insurancePolicyholder: "Test Renter",
    insuranceExpiresAt: "2031-01-01",
  });
  await createBookingHold(b, 1);
  await assert.rejects(
    completeAgreement(b, "renter"),
    /Temporary email failure/,
  );
  assert.equal((await getBooking(b.id))!.status, "ready_for_pickup");
  fail = false;
  const payment = {
    id: "pi_email",
    status: "succeeded",
    currency: "usd",
    amount_received: 36500,
    metadata: { bookingId: b.id, kind: "rental" },
  } as unknown as import("stripe").default.PaymentIntent;
  await markRentalPaymentSucceeded(payment);
  await completeAgreement(b, "renter");
  assert.equal(sends, 2); // failed attempt + successful retry; then persisted deduplication
  const saved = (await getBooking(b.id))!;
  assert.equal(saved.pickupReadyEmailId, "email-local");
  assert.equal(
    saved.auditTrail.filter((e) => e.action === "booking_auto_confirmed")
      .length,
    1,
  );
  assert.equal(
    saved.auditTrail.filter((e) => e.action === "pickup_instructions_emailed")
      .length,
    1,
  );
  assert.equal(saved.paymentStatus, "succeeded");
});
