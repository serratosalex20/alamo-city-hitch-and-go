import assert from "node:assert/strict";
import test from "node:test";
import { checkoutSessionScope, portalSignInDestination, bookingHeading } from "../src/lib/auth/portal-navigation";
test("checkout preserves an existing verified account but never upgrades a guest or another account", () => {
  assert.equal(checkoutSessionScope({ email: "a@example.com" }, "a@example.com", "new"), undefined);
  assert.equal(checkoutSessionScope(null, "a@example.com", "new"), "new");
  assert.equal(checkoutSessionScope({ email: "a@example.com", bookingId: "old" }, "a@example.com", "new"), "new");
  assert.equal(checkoutSessionScope({ email: "other@example.com" }, "a@example.com", "new"), "new");
});
test("booking sign-in links lead to account after approval and retain unfinished document destinations", () => {
  const booking = { id: "booking-a", customerEmail: "a@example.com", status: "active" as const };
  const next = "/booking/booking-a/documents";
  assert.equal(portalSignInDestination(next, booking.customerEmail, booking), "/account");
  assert.equal(portalSignInDestination(next, booking.customerEmail, { ...booking, status: "pending_identity" }), next);
  assert.equal(portalSignInDestination(next, "other@example.com", booking), next);
  assert.equal(portalSignInDestination(undefined, booking.customerEmail, null), "/account");
  assert.equal(portalSignInDestination("/admin", booking.customerEmail, booking), "/admin");
  assert.equal(bookingHeading("active"), "Rental In Progress");
  assert.equal(bookingHeading("completed"), "Rental Completed");
});
