import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { generateKeyPairSync } from "node:crypto";
import type { Booking } from "../src/types/models";

test("embedded signing fills insurer fields before sending and scopes framing to this website", async () => {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  Object.assign(process.env, {
    DOCUSIGN_INTEGRATION_KEY: "integration_fixture", DOCUSIGN_USER_ID: "user_fixture",
    DOCUSIGN_ACCOUNT_ID: "account_fixture", DOCUSIGN_TEMPLATE_ID: "template_fixture",
    DOCUSIGN_RSA_PRIVATE_KEY: keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    DOCUSIGN_OAUTH_BASE_URL: "https://account-d.docusign.com",
    DOCUSIGN_BASE_URL: "https://demo.docusign.net/restapi",
  });
  const calls: { url: string; method: string; body: Record<string, unknown> }[] = [];
  mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    if (url.endsWith("/oauth/token")) return Response.json({ access_token: "fixture_token", expires_in: 3600 });
    calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : {} });
    if (url.endsWith("/recipients")) return Response.json({ signers: [{ recipientId: "1", clientUserId: "booking_fixture", email: "renter@example.com" }] });
    if (url.endsWith("/tabs") && method === "GET") return Response.json({ textTabs: [
      { tabId: "carrier", tabLabel: "insurance_carrier" }, { tabId: "policy", tabLabel: "insurance_policy_number" }, { tabId: "expires", tabLabel: "insurance_expiration_date" },
    ] });
    if (url.endsWith("/views/recipient")) return Response.json({ url: "https://demo.docusign.net/signing/fixture" });
    return Response.json({ status: "created" });
  });
  try {
    const { createEmbeddedSigningSession } = await import("../src/lib/docusign/server");
    const result = await createEmbeddedSigningSession({ id: "booking_fixture", docusignEnvelopeId: "envelope_fixture", customerEmail: "renter@example.com", customer: { firstName: "Test", lastName: "Renter" }, insuranceCarrier: "Carrier", insurancePolicyNumber: "POL-123", insuranceExpiresAt: "2099-01-01" } as Booking, "https://preview.example.com");
    const tabIndex = calls.findIndex(call => call.url.endsWith("/tabs") && call.method === "PUT");
    const sendIndex = calls.findIndex(call => call.body.status === "sent");
    assert.ok(tabIndex >= 0 && sendIndex > tabIndex);
    const view = calls.find(call => call.url.endsWith("/views/recipient"))!;
    assert.deepEqual(view.body.frameAncestors, ["https://preview.example.com", "https://apps-d.docusign.com"]);
    assert.deepEqual(view.body.messageOrigins, ["https://apps-d.docusign.com"]);
    assert.equal(view.body.returnUrl, "https://preview.example.com/booking/booking_fixture/signing-return");
    assert.equal(result.integrationKey, "integration_fixture");
  } finally { mock.restoreAll(); }
});
