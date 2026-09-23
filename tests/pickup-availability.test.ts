import assert from "node:assert/strict";
import test from "node:test";
import * as repository from "../src/lib/booking/repository";
import * as route from "../src/app/api/availability/route";
import type { Booking } from "../src/types/models";

const now = Date.parse("2026-09-23T19:00:00Z"); // 2 PM in San Antonio

function fixture(id: string, updates: Partial<Booking> = {}): Booking {
  return {
    id, schemaVersion: 2, checkoutKey: id, customerEmail: "private@example.com",
    customer: { firstName: "Test", lastName: "Renter", phone: "2105550123",
      address: { street: "123 Private St", city: "San Antonio", state: "TX", zip: "78205" }, referralSource: "website" },
    towVehicle: { year: "2022", make: "Ford", model: "F-150" },
    trailerId: id, trailerName: "Test Trailer", unitId: "TEST", status: "confirmed",
    fulfillmentType: "pickup", duration: "fullDay",
    startTime: "2026-09-24T15:00:00Z", endTime: "2026-09-25T15:00:00Z",
    startTimeMs: Date.parse("2026-09-24T15:00:00Z"), endTimeMs: Date.parse("2026-09-25T15:00:00Z"),
    checkoutExpiresAt: "2099-01-01T00:00:00Z", checkoutExpiresAtMs: Date.parse("2099-01-01T00:00:00Z"),
    policiesAcceptedAt: "2026-09-01T00:00:00Z", extensions: [],
    rentalSubtotal: 10000, taxAmount: 1000, rentalTotal: 11000, depositAmount: 20000,
    paymentStatus: "succeeded", depositStatus: "charged", agreementStatus: "signed",
    identityStatus: "verified", insuranceStatus: "approved", preInspectionPhotos: [], postInspectionPhotos: [],
    auditTrail: [], createdAt: "2026-09-01T00:00:00Z", createdAtMs: 1, updatedAt: "2026-09-01T00:00:00Z", updatedAtMs: 1,
    ...updates,
  };
}

test("calendar omits past pickups and permits only operating-hour slots in Central Time", async () => {
  const days = await repository.getPickupAvailability("empty", "2026-09", "fullDay", 1, now);
  assert.equal(days.length, 30);
  assert.deepEqual(days.find(d => d.date === "2026-09-22")?.times, []);
  const today = days.find(d => d.date === "2026-09-23")!;
  assert.equal(today.times[0].value, "14:30");
  assert.equal(today.times.at(-1)?.value, "21:30");
  assert.ok(today.times.every(t => t.startTimeMs > now));
  assert.equal(days.find(d => d.date === "2026-09-24")?.times[0].value, "06:00");

  const afterClosing = await repository.getPickupAvailability("empty", "2026-09", "fullDay", 1, Date.parse("2026-09-24T03:00:00Z"));
  assert.deepEqual(afterClosing.find(d => d.date === "2026-09-23")?.times, []);
});

test("calendar respects the entire rental duration and the same turnaround buffer as checkout", async () => {
  await repository.createBookingHold(fixture("calendar-conflict"), 1);
  const days = await repository.getPickupAvailability("calendar-conflict", "2026-09", "fullDay", 1, now);
  assert.deepEqual(days.find(d => d.date === "2026-09-24")?.times, []);
  assert.equal(days.find(d => d.date === "2026-09-25")?.times[0].value, "10:30");
  // Tomorrow's 10 AM rental conflicts with a full day starting today, but not a 12-hour rental.
  assert.deepEqual(days.find(d => d.date === "2026-09-23")?.times, []);
  const shorter = await repository.getPickupAvailability("calendar-conflict", "2026-09", "halfDay", 1, now);
  assert.equal(shorter.find(d => d.date === "2026-09-23")?.times[0].value, "14:30");
  const week = await repository.getPickupAvailability("calendar-conflict", "2026-09", "oneWeek", 1, Date.parse("2026-09-20T00:00:00Z"));
  assert.deepEqual(week.find(d => d.date === "2026-09-20")?.times, []);
});

test("cancelled/completed rentals and expired holds do not hide slots; unexpired holds do", async () => {
  for (const status of ["cancelled", "completed", "pending_payment"] as const) {
    const id = `calendar-${status}`;
    await repository.createBookingHold(fixture(id, { status, checkoutExpiresAtMs: now - 1 }), 1);
    const days = await repository.getPickupAvailability(id, "2026-09", "fullDay", 1, now);
    assert.equal(days.find(d => d.date === "2026-09-24")?.times[0].value, "06:00");
  }
  await repository.createBookingHold(fixture("calendar-live-hold", { status: "pending_payment" }), 1);
  const blocked = await repository.getPickupAvailability("calendar-live-hold", "2026-09", "fullDay", 1, now);
  assert.deepEqual(blocked.find(d => d.date === "2026-09-24")?.times, []);
  const spareUnit = await repository.getPickupAvailability("calendar-live-hold", "2026-09", "fullDay", 2, now);
  assert.equal(spareUnit.find(d => d.date === "2026-09-24")?.times[0].value, "06:00");
});

test("winter pickups use Central standard time and invalid calendar months are rejected", async () => {
  const days = await repository.getPickupAvailability("empty", "2026-12", "fullDay", 1, now);
  assert.equal(days[0].times[0].startTimeMs, Date.parse("2026-12-01T12:00:00Z"));
  await assert.rejects(() => repository.getPickupAvailability("empty", "2026-13", "fullDay", 1, now), /month/i);
});

test("public calendar exposes only fresh slots, rejects malformed input and unbookable trailers", async () => {
  assert.equal(typeof route.GET, "function", "calendar endpoint must be available before selecting a date");
  const request = (query: string) => route.GET(new Request(`https://booking.example/api/availability?${query}`));
  const response = await request("trailerId=trailer-002&duration=fullDay&month=2099-09");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  const data = await response.json();
  assert.equal(data.ok, true);
  assert.equal(data.days.length, 30);
  assert.equal(typeof data.checkedAtMs, "number");
  assert.doesNotMatch(JSON.stringify(data), /private@example|customerEmail|checkoutKey|Private St/);
  assert.equal((await request("trailerId=trailer-002&duration=invalid&month=2099-09")).status, 400);
  assert.equal((await request("trailerId=trailer-002&duration=fullDay&month=2099-13")).status, 400);
  assert.equal((await request("trailerId=unknown&duration=fullDay&month=2099-09")).status, 400);
});
