import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { generateKeyPairSync } from "node:crypto";
import type { Booking } from "../src/types/models";

test("agreement download uses only the saved completed envelope and preserves original PDF bytes", async () => {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  Object.assign(process.env, {
    DOCUSIGN_INTEGRATION_KEY: "integration_fixture", DOCUSIGN_USER_ID: "user_fixture",
    DOCUSIGN_ACCOUNT_ID: "account_fixture", DOCUSIGN_TEMPLATE_ID: "template_fixture",
    DOCUSIGN_RSA_PRIVATE_KEY: keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    DOCUSIGN_OAUTH_BASE_URL: "https://account-d.docusign.com", DOCUSIGN_BASE_URL: "https://demo.docusign.net/restapi",
  });
  const calls: string[] = [];
  let providerStatus = "completed";
  let pdfResponse = true;
  const original = Buffer.from("%PDF-1.7\noriginal signed bytes\n%%EOF");
  mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith("/oauth/token")) return Response.json({ access_token: "fixture_token", expires_in: 3600 });
    if (url.includes("/documents/combined")) return pdfResponse ? new Response(original, { headers: { "Content-Type": "application/pdf" } }) : new Response("provider unavailable", { status: 503 });
    return Response.json({ status: providerStatus });
  });
  try {
    const { getSignedAgreementPdf } = await import("../src/lib/docusign/server");
    const booking = { id: "booking_fixture", agreementStatus: "signed", docusignEnvelopeId: "envelope_fixture" } as Booking;
    assert.deepEqual(Buffer.from(await getSignedAgreementPdf(booking)), original);
    assert.ok(calls.some(url => url.endsWith("/envelopes/envelope_fixture/documents/combined?certificate=true")));
    calls.length = 0;
    await assert.rejects(() => getSignedAgreementPdf({ ...booking, agreementStatus: "sent" }));
    assert.equal(calls.length, 0);
    await assert.rejects(() => getSignedAgreementPdf({ ...booking, docusignEnvelopeId: undefined }));
    assert.equal(calls.length, 0);
    providerStatus = "sent";
    await assert.rejects(() => getSignedAgreementPdf(booking), /not yet complete/i);
    assert.equal(calls.some(url => url.includes("/documents/combined")), false);
    providerStatus = "completed";
    pdfResponse = false;
    await assert.rejects(() => getSignedAgreementPdf(booking), /retrieve/i);
  } finally { mock.restoreAll(); }
});
