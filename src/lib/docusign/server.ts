import docusign, {
  type EnvelopeDefinition,
  type RecipientViewRequest,
} from "docusign-esign";
import {
  appUrl,
  docusignAccountId,
  docusignBaseUrl,
  docusignIntegrationKey,
  docusignOauthBaseUrl,
  docusignRsaPrivateKey,
  docusignSignerRole,
  docusignTemplateId,
  docusignUserId,
  hasDocuSign,
} from "@/lib/env";
import type { Booking } from "@/types/models";

let tokenCache: { value: string; expiresAtMs: number } | null = null;

async function getApiClient() {
  if (!hasDocuSign) return null;
  const client = new docusign.ApiClient();
  client.setBasePath(docusignBaseUrl);
  client.setOAuthBasePath(new URL(docusignOauthBaseUrl).host);

  if (!tokenCache || tokenCache.expiresAtMs <= Date.now() + 60_000) {
    const result = await client.requestJWTUserToken(
      docusignIntegrationKey as string,
      docusignUserId as string,
      ["signature", "impersonation"],
      Buffer.from(docusignRsaPrivateKey as string),
      3600,
    );
    tokenCache = {
      value: result.body.access_token,
      expiresAtMs: Date.now() + 55 * 60 * 1000,
    };
  }

  client.addDefaultHeader("Authorization", `Bearer ${tokenCache.value}`);
  return client;
}

function renterName(booking: Booking) {
  return `${booking.customer.firstName} ${booking.customer.lastName}`;
}

export async function createEmbeddedSigningSession(booking: Booking) {
  const client = await getApiClient();
  if (!client || !docusignAccountId || !docusignTemplateId) {
    throw new Error("DocuSign is not configured.");
  }
  const envelopes = new docusign.EnvelopesApi(client);
  let envelopeId = booking.docusignEnvelopeId;

  if (!envelopeId) {
    const definition: EnvelopeDefinition = {
      templateId: docusignTemplateId,
      status: "sent",
      emailSubject: `Trailer rental agreement — ${booking.trailerName}`,
      templateRoles: [
        {
        email: booking.customerEmail,
        name: renterName(booking),
        roleName: docusignSignerRole,
        clientUserId: booking.id,
        },
      ],
      customFields: {
        textCustomFields: [
          { name: "Booking ID", value: booking.id, show: "false" },
          { name: "Trailer", value: booking.trailerName, show: "false" },
          { name: "Rental Start", value: booking.startTime, show: "false" },
          { name: "Rental End", value: booking.endTime, show: "false" },
        ],
      },
    };

    const created = await envelopes.createEnvelope(docusignAccountId, {
      envelopeDefinition: definition,
    });
    envelopeId = created.envelopeId;
  }

  if (!envelopeId) throw new Error("DocuSign did not return an envelope ID.");
  const viewRequest: RecipientViewRequest = {
    returnUrl: `${appUrl}/booking/${booking.id}/documents?agreement=returned`,
    authenticationMethod: "none",
    email: booking.customerEmail,
    userName: renterName(booking),
    recipientId: "1",
    clientUserId: booking.id,
  };

  const view = await envelopes.createRecipientView(docusignAccountId, envelopeId, {
    recipientViewRequest: viewRequest,
  });
  if (!view.url) throw new Error("DocuSign did not return a signing URL.");
  return { envelopeId, url: view.url };
}

export async function getEnvelopeStatus(envelopeId: string) {
  const client = await getApiClient();
  if (!client || !docusignAccountId) throw new Error("DocuSign is not configured.");
  const envelopes = new docusign.EnvelopesApi(client);
  return envelopes.getEnvelope(docusignAccountId, envelopeId);
}

export { hasDocuSign };
