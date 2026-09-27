import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { hasLiveProviderConfiguration } from "../src/lib/booking/provider-mode";

// Synthetic fixtures only. These tests never make provider requests.
const live = {
  stripeSecretKey: "rk_live_local_fixture",
  stripePublishableKey: "pk_live_local_fixture",
  docusignOauthBaseUrl: "https://account.docusign.com",
  docusignBaseUrl: "https://na4.docusign.net/restapi",
};

test("live checkout rejects test or mixed Stripe keys and demo signing endpoints", () => {
  assert.equal(hasLiveProviderConfiguration(live), true);
  assert.equal(hasLiveProviderConfiguration({ ...live, stripeSecretKey: "sk_live_local_fixture" }), true);
  for (const override of [
    { stripeSecretKey: "sk_test_local_fixture" },
    { stripeSecretKey: "rk_test_local_fixture" },
    { stripeSecretKey: undefined },
    { stripePublishableKey: "pk_test_local_fixture" },
    { docusignOauthBaseUrl: "https://account-d.docusign.com" },
    { docusignBaseUrl: "https://demo.docusign.net/restapi" },
    { docusignBaseUrl: "https://na4.docusign.net.example.com/restapi" },
    { docusignBaseUrl: "http://na4.docusign.net/restapi" },
    { docusignBaseUrl: "invalid" },
  ]) assert.equal(hasLiveProviderConfiguration({ ...live, ...override }), false);
});

const configured = {
  NODE_ENV: "production" as const,
  FIREBASE_ADMIN_PROJECT_ID: "fixture",
  FIREBASE_ADMIN_CLIENT_EMAIL: "fixture@example.com",
  FIREBASE_ADMIN_PRIVATE_KEY: "fixture",
  FIREBASE_STORAGE_BUCKET: "fixture",
  STRIPE_SECRET_KEY: live.stripeSecretKey,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: live.stripePublishableKey,
  STRIPE_WEBHOOK_SECRET: "whsec_local_fixture",
  DOCUSIGN_INTEGRATION_KEY: "fixture",
  DOCUSIGN_ACCOUNT_ID: "fixture",
  DOCUSIGN_USER_ID: "fixture",
  DOCUSIGN_TEMPLATE_ID: "fixture",
  DOCUSIGN_RSA_PRIVATE_KEY: "fixture",
  DOCUSIGN_OAUTH_BASE_URL: live.docusignOauthBaseUrl,
  DOCUSIGN_BASE_URL: live.docusignBaseUrl,
  RESEND_API_KEY: "fixture",
  AUTH_SECRET: "local-fixture-secret-at-least-32-characters",
  ADMIN_EMAILS: "owner@example.com",
  PICKUP_ADDRESS: "Fixture address",
  PICKUP_INSTRUCTIONS: "Fixture instructions",
};

function isolated(script: string, overrides: Record<string, string>) {
  return execFileSync(process.execPath, ["--import", "tsx", "-e", script], {
    cwd: process.cwd(), env: { ...process.env, ...configured, ...overrides }, encoding: "utf8",
  });
}

test("deployment readiness preserves sandbox Preview and enforces complete live configuration", () => {
  const ready = (overrides: Record<string, string>) => isolated(
    "process.stdout.write(String(require('./src/lib/env.ts').isProductionBookingReady))", overrides,
  );
  const demo = { STRIPE_SECRET_KEY: "sk_test_local_fixture", NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_local_fixture",
    DOCUSIGN_OAUTH_BASE_URL: "https://account-d.docusign.com", DOCUSIGN_BASE_URL: "https://demo.docusign.net/restapi" };
  assert.equal(ready({ VERCEL_ENV: "preview", ...demo }), "true");
  assert.equal(ready({ VERCEL_ENV: "production", ...demo }), "false");
  assert.equal(ready({ VERCEL_ENV: "production" }), "true");
  assert.equal(ready({ VERCEL_ENV: "production", DOCUSIGN_TEMPLATE_ID: "" }), "false");
  assert.equal(ready({ VERCEL_ENV: "production", STRIPE_WEBHOOK_SECRET: "" }), "false");
});

test("a signed test webhook cannot update production even when its signature is valid", () => {
  isolated(`
    const assert = require('node:assert/strict');
    const { getStripe } = require('./src/lib/stripe/server.ts');
    const { POST } = require('./src/app/api/webhooks/stripe/route.ts');
    (async () => {
      for (const livemode of [false, true]) {
        const payload = JSON.stringify({ id: 'evt_fixture', object: 'event', type: 'unhandled.fixture', livemode, data: { object: {} } });
        const signature = getStripe().webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
        const response = await POST(new Request('https://example.com/api/webhooks/stripe', {
          method: 'POST', body: payload, headers: { 'stripe-signature': signature },
        }));
        assert.equal(response.status, livemode ? 200 : 400);
      }
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `, { VERCEL_ENV: "production" });
});
