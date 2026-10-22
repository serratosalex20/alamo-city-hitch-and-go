import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync } from "node:crypto";
import { bookingFixture } from "./fixtures/booking";

test("a delayed signing start cannot overwrite a different completed envelope", async (t) => {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  Object.assign(process.env, {
    DOCUSIGN_INTEGRATION_KEY: "integration_fixture",
    DOCUSIGN_USER_ID: "user_fixture",
    DOCUSIGN_ACCOUNT_ID: "account_fixture",
    DOCUSIGN_TEMPLATE_ID: "template_fixture",
    DOCUSIGN_RSA_PRIVATE_KEY: keys.privateKey
      .export({ type: "pkcs8", format: "pem" })
      .toString(),
    DOCUSIGN_OAUTH_BASE_URL: "https://account-d.docusign.com",
    DOCUSIGN_BASE_URL: "https://demo.docusign.net/restapi",
  });
  const { createEmbeddedSigningSession } = await import(
    "../src/lib/docusign/server"
  );
  const { createBookingHold, getBooking, updateBooking } = await import(
    "../src/lib/booking/repository"
  );
  const b = bookingFixture("delayed-envelope");
  Object.assign(b, {
    paymentStatus: "succeeded",
    status: "pending_signature",
    identityStatus: "verified",
    insuranceStatus: "uploaded",
    insuranceCarrier: "Test",
    insurancePolicyNumber: "POL-1",
    insurancePolicyholder: "Test Renter",
    insuranceExpiresAt: "2031-01-01",
    insuranceStoragePath: "test/proof.pdf",
  });
  await createBookingHold(b, 1);
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith("/oauth/token"))
      return Response.json({ access_token: "fixture", expires_in: 3600 });
    if (url.endsWith("/envelopes")) {
      // A second tab finishes signing while the first envelope-creation request is delayed.
      await updateBooking(b.id, {
        docusignEnvelopeId: "completed-B",
        agreementStatus: "signed",
        status: "ready_for_pickup",
      });
      return Response.json({ envelopeId: "unsigned-A" });
    }
    throw new Error("Provider request must stop after booking changes");
  });
  await assert.rejects(createEmbeddedSigningSession(b));
  const saved = (await getBooking(b.id))!;
  assert.equal(saved.status, "ready_for_pickup");
  assert.equal(saved.agreementStatus, "signed");
  assert.equal(saved.docusignEnvelopeId, "completed-B");
});
