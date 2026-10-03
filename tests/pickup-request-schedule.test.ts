import assert from "node:assert/strict";
import test from "node:test";
import { localPickupToUtc } from "../src/lib/booking/schedule";
const now = Date.UTC(2026, 9, 1);
test("outside-hours requests validate Central time without weakening ordinary pickups", async () => {
  const api = await import("../src/lib/pickup-requests/schedule").catch(
    () => null,
  );
  assert.ok(api, "request schedule validation must exist");
  const { buildRequestedSchedule } = api;
  for (const [date, time, want] of [
    ["2026-10-10", "07:30", "2026-10-10T12:30:00.000Z"],
    ["2026-12-10", "18:30", "2026-12-11T00:30:00.000Z"],
  ])
    assert.equal(
      buildRequestedSchedule(date, time, "fullDay", now).startTime,
      want,
    );
  for (const [date, time] of [
    ["2026-11-01", "01:30"],
    ["2027-03-14", "02:30"],
    ["2026-02-30", "07:30"],
    ["2026-10-10", "24:00"],
    ["2026-10-10", "07:15"],
    ["2026-10-10", "08:00"],
    ["2026-10-10", "18:00"],
    ["2026-09-01", "07:30"],
  ]) {
    assert.throws(
      () => buildRequestedSchedule(date, time, "fullDay", now),
      `${date} ${time} must fail`,
    );
  }
  assert.throws(() => localPickupToUtc("2026-10-10", "07:30"));
  assert.throws(() => localPickupToUtc("2026-10-10", "18:30"));
});
test("request contact validation normalizes email and rejects incomplete or oversized leads", async () => {
  const api = await import("../src/lib/pickup-requests/validation").catch(
    () => null,
  );
  assert.ok(api, "request input validation must exist");
  const input = {
    submissionKey: "83170935-a599-4eb9-a603-c4018c10e02b",
    firstName: "Alex",
    lastName: "Test",
    email: " Renter@Example.com ",
    phone: "210-555-0100",
    trailerId: "trailer-004",
    date: "2026-10-10",
    time: "07:30",
    duration: "fullDay",
    message: "",
  };
  assert.equal(api.requestInputSchema.parse(input).email, "renter@example.com");
  for (const bad of [
    { phone: "123" },
    { firstName: "" },
    { email: "bad" },
    { message: "x".repeat(1001) },
    { submissionKey: "guess" },
  ])
    assert.equal(
      api.requestInputSchema.safeParse({ ...input, ...bad }).success,
      false,
    );
});
