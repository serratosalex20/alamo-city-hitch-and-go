import assert from "node:assert/strict";
import test from "node:test";
import { selectDashboardBooking, rentalClock } from "../src/lib/booking/dashboard";
import type { Booking } from "../src/types/models";
const make = (id: string, status: Booking["status"], createdAtMs: number) => ({ id, status, createdAtMs, customerEmail: "a@example.com", startTimeMs: createdAtMs, pickedUpAt: new Date(createdAtMs).toISOString() } as Booking);
test("dashboard selects the renter's active rental ahead of a newer abandoned checkout", () => {
  const bookings = [make("pending", "pending_payment", 20), make("active", "active", 10), make("complete", "completed", 30), { ...make("other", "active", 50), customerEmail: "other@example.com" }];
  assert.equal(selectDashboardBooking("a@example.com", bookings)?.id, "active");
  assert.equal(selectDashboardBooking("a@example.com", bookings, "complete")?.id, "complete");
  assert.equal(selectDashboardBooking("a@example.com", bookings, "other")?.id, "active");
  assert.equal(selectDashboardBooking("nobody@example.com", bookings), undefined);
});
test("countdown uses actual return time, clamps progress, and distinguishes future pickup and overdue", () => {
  assert.deepEqual(rentalClock(1000, 5000, 3000), { remainingMs: 2000, progress: 50, beforePickup: false, overdue: false });
  assert.deepEqual(rentalClock(1000, 5000, 0), { remainingMs: 4000, progress: 0, beforePickup: true, overdue: false });
  assert.deepEqual(rentalClock(1000, 5000, 6000), { remainingMs: 0, progress: 100, beforePickup: false, overdue: true });
});
