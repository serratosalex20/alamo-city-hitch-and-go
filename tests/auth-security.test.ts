import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { newCheckoutProof, hashCheckoutProof, matchesCheckoutProof } from "../src/lib/auth/checkout-proof";
import { canAccessBooking } from "../src/lib/auth/authorization";
import { createToken, verifyToken, safeNextPath } from "../src/lib/auth/session";
import { authSecret } from "../src/lib/env";

test("booking ID and another browser's token cannot authorize checkout", () => {
  const proof = newCheckoutProof();
  const digest = hashCheckoutProof(proof);
  assert.equal(matchesCheckoutProof(digest, proof), true);
  assert.equal(matchesCheckoutProof(digest, undefined), false);
  assert.equal(matchesCheckoutProof(digest, newCheckoutProof()), false);
  assert.equal(matchesCheckoutProof(undefined, proof), false);
  assert.equal(matchesCheckoutProof(digest, "00000000-0000-4000-8000-000000000000"), false);
});

test("checkout session grants only its booking, even when another booking uses the same email", () => {
  const session = verifyToken(createToken("owner@example.com", "session", undefined, "booking-a"), "session")!;
  assert.equal(session.bookingId, "booking-a");
  assert.equal(canAccessBooking(session, { id: "booking-a", customerEmail: session.email }), true);
  assert.equal(canAccessBooking(session, { id: "booking-b", customerEmail: session.email }), false);
  assert.equal(canAccessBooking(session, { id: "booking-a", customerEmail: "someone@example.com" }), false);
  const verifiedEmailSession = verifyToken(createToken("owner@example.com", "session"), "session")!;
  assert.equal(canAccessBooking(verifiedEmailSession, { id: "booking-b", customerEmail: session.email }), true);
});

test("previous session format, altered scope and wrong token kind are rejected", () => {
  const body = Buffer.from(JSON.stringify({email:"owner@example.com",kind:"session",exp:9999999999})).toString("base64url");
  const signature = createHmac("sha256", authSecret).update(body).digest("base64url");
  assert.equal(verifyToken(`${body}.${signature}`, "session"), null);
  const token = createToken("owner@example.com", "session", undefined, "booking-a");
  const [payload, sig] = token.split(".");
  const changed = JSON.parse(Buffer.from(payload, "base64url").toString());
  delete changed.bookingId;
  assert.equal(verifyToken(`${Buffer.from(JSON.stringify(changed)).toString("base64url")}.${sig}`, "session"), null);
  assert.equal(verifyToken(createToken("owner@example.com", "link"), "session"), null);
});

test("redirects reject external origins, backslashes and control characters", () => {
  for (const next of ["https://example.com", "//example.com", "/\\example.com", "/\t/example.com", "/\n/example.com"]) {
    assert.equal(safeNextPath(next), undefined);
  }
  assert.equal(safeNextPath("/account?tab=bookings"), "/account?tab=bookings");
});

test("production never signs or trusts sessions using missing or short secrets", () => {
  for (const secret of ["", "short"]) {
    execFileSync(process.execPath, ["--import", "tsx", "-e", `
      const assert = require('node:assert/strict');
      const { createToken, verifyToken } = require('./src/lib/auth/session.ts');
      assert.throws(() => createToken('owner@example.com', 'session'), /not configured/);
      assert.equal(verifyToken('a.b', 'session'), null);
    `], { cwd: process.cwd(), env: { ...process.env, NODE_ENV: "production", AUTH_SECRET: secret }, stdio: "pipe" });
  }
});
