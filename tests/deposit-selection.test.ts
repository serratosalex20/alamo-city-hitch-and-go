import assert from "node:assert/strict";
import test from "node:test";
import { depositSelection } from "../src/lib/booking/deposit-selection";

test("zero returns full deposit without sending zero to the positive retention API", () => {
  const selected = depositSelection("0", 20000)!;
  assert.equal(selected.action, "release_deposit");
  assert.equal(selected.returnedCents, 20000);
  assert.equal(Object.hasOwn(JSON.parse(JSON.stringify(selected)), "amountCents"), false);
});
test("partial and full retention match the displayed refund", () => {
  assert.deepEqual(depositSelection("100", 20000), {
    action: "retain_deposit", amountCents: 10000, retainedCents: 10000, returnedCents: 10000,
  });
  assert.equal(depositSelection("200", 20000)?.returnedCents, 0);
  assert.equal(depositSelection("0.01", 20000)?.amountCents, 1);
});
test("invalid amounts cannot submit", () => {
  for (const value of ["", " ", "-1", "200.01", "1.001", "NaN", "Infinity", "1e2"]) {
    assert.equal(depositSelection(value, 20000), null, value);
  }
});
