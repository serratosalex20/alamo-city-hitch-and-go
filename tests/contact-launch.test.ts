import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const configured = {
  FIREBASE_ADMIN_PROJECT_ID: "test-project", FIREBASE_ADMIN_CLIENT_EMAIL: "test@example.com",
  FIREBASE_ADMIN_PRIVATE_KEY: "fixture", FIREBASE_STORAGE_BUCKET: "test-bucket",
  STRIPE_SECRET_KEY: "sk_test_fixture", NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_fixture",
  STRIPE_WEBHOOK_SECRET: "whsec_fixture", DOCUSIGN_INTEGRATION_KEY: "fixture",
  DOCUSIGN_USER_ID: "fixture", DOCUSIGN_ACCOUNT_ID: "fixture", DOCUSIGN_TEMPLATE_ID: "fixture",
  DOCUSIGN_RSA_PRIVATE_KEY: "fixture", RESEND_API_KEY: "re_fixture",
  AUTH_SECRET: "fixture-for-tests-only-at-least-32-characters", ADMIN_EMAILS: "owner@example.com",
  PICKUP_ADDRESS: "Fixture address", PICKUP_INSTRUCTIONS: "By appointment",
};

function run(script: string, overrides: Record<string, string>) {
  return execFileSync(process.execPath, ["--import", "tsx", "-e", script], {
    cwd: process.cwd(), encoding: "utf8",
    env: { ...process.env, ...configured, NODE_ENV: "production", BOOKING_MODE: "", ...overrides },
  }).trim();
}

test("production stays contact-only even with provider keys until explicitly enabled", () => {
  assert.equal(run('console.log(require("./src/lib/env.ts").contactBookingOnly)', { VERCEL_ENV: "production" }), "true");
  assert.equal(run('console.log(require("./src/lib/env.ts").contactBookingOnly)', { VERCEL_ENV: "production", BOOKING_MODE: "online" }), "false");
  assert.equal(run('console.log(require("./src/lib/env.ts").contactBookingOnly)', { VERCEL_ENV: "production", BOOKING_MODE: "online", STRIPE_SECRET_KEY: "" }), "true");
});

test("configured preview keeps the existing online flow", () => {
  assert.equal(run('console.log(require("./src/lib/env.ts").contactBookingOnly)', { VERCEL_ENV: "preview" }), "false");
});

test("contact launch blocks checkout and sign-in before processing customer input, and routes old portal links to contact", () => {
  const result = run(`
    const assert = require("node:assert/strict");
    (async () => {
      const checkout = require("./src/app/api/checkout/route.ts");
      const auth = require("./src/app/api/auth/send-link/route.ts");
      const request = { json() { throw new Error("Customer input must not be processed"); } };
      for (const route of [checkout, auth]) {
        const response = await route.POST(request);
        assert.equal(response.status, 503);
        assert.equal((await response.json()).bookingUrl, "/book");
      }
      const OnlinePortal = require("./src/components/OnlinePortal.tsx").default;
      assert.throws(() => OnlinePortal({ children: null }), error => error.digest === "NEXT_REDIRECT;replace;/book;307;");
      console.log("guarded");
    })().catch(error => { console.error(error); process.exit(1); });
  `, { VERCEL_ENV: "production" });
  assert.equal(result, "guarded");
});
