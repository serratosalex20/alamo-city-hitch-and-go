import assert from "node:assert/strict";
import test from "node:test";
import { buildProfile, profileInput } from "../src/lib/customers/profile";
import { saveProfile, getProfile } from "../src/lib/customers/repository";

test("profiles work without a booking and stay isolated by verified email", async () => {
  await saveProfile("profile-a@example.com", { name: "Alex", phone: "210-555-0100", emailMarketing: false });
  assert.equal((await getProfile("PROFILE-A@example.com"))?.name, "Alex");
  assert.equal(await getProfile("profile-b@example.com"), null);
});
test("profile edits preserve consent timestamp; opting out updates it", () => {
  const input = { name: "Alex", phone: "210-555-0100", emailMarketing: true };
  const first = buildProfile("A@example.com", input, null, "2026-09-15T10:00:00Z");
  const edited = buildProfile(first.email, { ...input, name: "Alex S" }, first, "2026-09-15T11:00:00Z");
  assert.equal(edited.consentUpdatedAt, first.consentUpdatedAt);
  const optedOut = buildProfile(first.email, { ...input, emailMarketing: false }, edited, "2026-09-15T12:00:00Z");
  assert.equal(optedOut.emailMarketing, false);
  assert.equal(optedOut.consentUpdatedAt, "2026-09-15T12:00:00Z");
});
test("profile payload cannot change verified email or silently imply marketing consent", () => {
  assert.equal(profileInput.safeParse({ name: "A", phone: "2105550100" }).success, false);
  assert.equal(profileInput.safeParse({ name: "A", phone: "2105550100", emailMarketing: false, email: "other@example.com" }).success, false);
  assert.equal(profileInput.safeParse({ name: "A", phone: "123", emailMarketing: true }).success, false);
});
