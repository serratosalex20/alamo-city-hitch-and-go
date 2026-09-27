import assert from "node:assert/strict";
import test from "node:test";
import { instructionState } from "../src/lib/booking/renter-instructions";
const end = Date.parse("2026-09-25T18:30:00Z");
test("pickup instructions end at pickup and never appear before approval or after return", () => {
  for (const status of ["confirmed", "ready_for_pickup", "deposit_action_required"] as const)
    assert.equal(instructionState(status, end, end - 48 * 3600000).pickup, true);
  for (const status of ["under_review", "active", "return_inspection", "completed", "cancelled", "rejected"] as const)
    assert.equal(instructionState(status, end, end - 3600000).pickup, false);
});
test("return instructions are available only during an active rental, with a precise 24-hour highlight", () => {
  assert.deepEqual(instructionState("active", end, end - 24 * 3600000 - 1), { pickup: false, returns: true, returnDue: false });
  assert.deepEqual(instructionState("active", end, end - 24 * 3600000), { pickup: false, returns: true, returnDue: true });
  assert.equal(instructionState("active", end, end + 3600000).returnDue, true);
  for (const status of ["ready_for_pickup", "under_review", "return_inspection", "completed", "cancelled"] as const)
    assert.equal(instructionState(status, end, end).returns, false);
});
