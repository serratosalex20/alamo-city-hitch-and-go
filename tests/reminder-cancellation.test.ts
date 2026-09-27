import assert from "node:assert/strict";
import test from "node:test";
import type { Booking } from "../src/types/models";
import type { AdminBookingAction } from "../src/lib/booking/admin-actions";

test("owners can retry a failed reminder cancellation without reopening or settling a rental", async (t) => {
  process.env.RESEND_API_KEY = "re_local_fixture";
  const { createBookingHold, getBooking } = await import("../src/lib/booking/repository");
  const { performAdminBookingAction } = await import("../src/lib/booking/admin-actions");
  let rejectCancellation = false;
  const requests: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    requests.push(url);
    assert.match(url, /^https:\/\/api\.resend\.com\/emails\/reminder-[a-z-]+\/cancel$/);
    assert.equal(init?.method, "POST");
    return rejectCancellation
      ? Response.json({ name: "restricted_api_key", message: "Sending-only key cannot cancel email" }, { status: 403 })
      : Response.json({ object: "email", id: url.split("/").at(-2) });
  });
  const retry = (id: string) => performAdminBookingAction({
    bookingId: id, actor: "owner@example.com",
    action: "retry_return_reminder_cancel" as AdminBookingAction,
  });
  const seed = async (id: string, status: Booking["status"], reminderStatus: Booking["returnReminderStatus"] = "cancel_failed") => {
    const now = new Date().toISOString();
    const booking: Booking = {
      id, schemaVersion: 2, checkoutKey: id, customerEmail: "renter@example.com",
      customer: { firstName: "Test", lastName: "Renter", phone: "2105550123", referralSource: "website",
        address: { street: "123 Test St", city: "San Antonio", state: "TX", zip: "78205" } },
      towVehicle: { year: "2022", make: "Ford", model: "F-150" },
      trailerId: id, trailerName: "Test Trailer", unitId: "TEST", status,
      fulfillmentType: "pickup", duration: "fullDay", startTime: now, endTime: now,
      startTimeMs: Date.now(), endTimeMs: Date.now() + 86400000,
      checkoutExpiresAt: now, checkoutExpiresAtMs: Date.now() + 900000,
      policiesAcceptedAt: now, extensions: [], rentalSubtotal: 10000, taxAmount: 1000,
      rentalTotal: 11000, depositAmount: 20000, paymentStatus: "succeeded",
      depositStatus: "partially_captured", depositAmountRetained: 3750, depositResolvedAt: now,
      agreementStatus: "signed", identityStatus: "verified", insuranceStatus: "approved",
      preInspectionPhotos: ["pre.jpg"], postInspectionPhotos: ["post.jpg"], auditTrail: [],
      createdAt: now, createdAtMs: Date.now(), updatedAt: now, updatedAtMs: Date.now(),
      returnReminderEmailId: `reminder-${id}`, returnReminderStatus: reminderStatus,
    };
    await createBookingHold(booking, 1);
    return booking;
  };

  await t.test("retry cancels the original email on completed and returned bookings, then becomes a no-op", async () => {
    for (const status of ["completed", "return_inspection"] as const) {
      const original = await seed(status.replaceAll("_", "-"), status);
      const result = await retry(original.id);
      assert.equal(result?.returnReminderStatus, "cancelled");
      assert.ok(result?.returnReminderCancelledAt);
      const stored = (await getBooking(original.id))!;
      assert.equal(stored.status, original.status);
      assert.equal(stored.depositAmountRetained, 3750);
      assert.equal(stored.depositResolvedAt, original.depositResolvedAt);
      assert.equal(stored.depositStatus, "partially_captured");
      assert.equal(stored.auditTrail.filter(e => e.action === "return_reminder_cancelled").length, 1);
      const count = requests.length;
      await retry(original.id);
      assert.equal(requests.length, count);
    }
  });
  await t.test("active bookings cannot have their reminder cancelled by the retry action", async () => {
    await seed("active", "active", "scheduled");
    const count = requests.length;
    await assert.rejects(retry("active"), /not available/);
    assert.equal(requests.length, count);
  });
  await t.test("a provider rejection remains failed and is recorded without changing the settlement", async () => {
    await seed("provider-failure", "completed");
    rejectCancellation = true;
    t.mock.method(console, "error", () => {});
    const result = await retry("provider-failure");
    assert.equal(result?.returnReminderStatus, "cancel_failed");
    assert.equal(result?.returnReminderCancelledAt, undefined);
    assert.equal(result?.status, "completed");
    assert.equal(result?.depositAmountRetained, 3750);
    assert.equal(result?.auditTrail.at(-1)?.action, "return_reminder_cancel_failed");
  });
});
