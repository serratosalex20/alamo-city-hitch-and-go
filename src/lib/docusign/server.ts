import { bookingCheckoutTotal } from "@/lib/booking/pricing";
import { createSign } from "node:crypto";
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
import { DURATION_LABELS, formatUsd } from "@/lib/booking/pricing";
import { trailers } from "@/lib/data/trailers";
import type { Booking } from "@/types/models";

let tokenCache: { value: string; expiresAtMs: number } | null = null;

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function jwtAssertion() {
  if (!docusignIntegrationKey || !docusignUserId || !docusignRsaPrivateKey) {
    throw new Error("DocuSign is not configured.");
  }
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "RS256", typ: "JWT" });
  const payload = encode({
    iss: docusignIntegrationKey,
    sub: docusignUserId,
    aud: new URL(docusignOauthBaseUrl).host,
    iat: now,
    exp: now + 3600,
    scope: "signature impersonation",
  });
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${signer.sign(docusignRsaPrivateKey).toString("base64url")}`;
}

async function accessToken() {
  if (!hasDocuSign) throw new Error("DocuSign is not configured.");
  if (tokenCache && tokenCache.expiresAtMs > Date.now() + 60_000) return tokenCache.value;
  const response = await fetch(`${docusignOauthBaseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtAssertion(),
    }),
  });
  const body = (await response.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description ?? body.error ?? "DocuSign authentication failed.");
  }
  tokenCache = {
    value: body.access_token,
    expiresAtMs: Date.now() + Math.min(body.expires_in ?? 3600, 3600) * 1000,
  };
  return tokenCache.value;
}

async function requestDocuSign<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await accessToken();
  const response = await fetch(`${docusignBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) as T & { message?: string; errorCode?: string } : {} as T;
  if (!response.ok) {
    const error = body as T & { message?: string; errorCode?: string };
    throw new Error(error.message ?? error.errorCode ?? "DocuSign request failed.");
  }
  return body;
}

function renterName(booking: Booking) {
  return `${booking.customer.firstName} ${booking.customer.lastName}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  dateStyle: "long",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  dateStyle: "long",
});

export function agreementTextTabs(booking: Booking) {
  const trailer = trailers.find((item) => item.id === booking.trailerId);
  const customerAddress = [
    booking.customer.address.street,
    booking.customer.address.city,
    `${booking.customer.address.state} ${booking.customer.address.zip}`,
  ].join(", ");
  const values: Record<string, string> = {
    booking_id: booking.id,
    agreement_date: dateFormatter.format(new Date()),
    business_legal_name: "Alamo City Hitch & Go Co LLC",
    business_address: "San Antonio, Texas — private pickup location provided after confirmation",
    customer_full_name: renterName(booking),
    customer_address: customerAddress,
    customer_phone: booking.customer.phone,
    customer_email: booking.customerEmail,
    trailer_class: booking.trailerName,
    trailer_id: booking.unitId,
    trailer_vin: trailer?.vin ?? "To be confirmed at pickup",
    trailer_plate: trailer?.licensePlate ?? "To be confirmed at pickup",
    trailer_odometer_in: "Not applicable",
    trailer_accessories: "Supplied trailer lock and key; unit-specific accessories documented at pickup",
    pickup_datetime: dateTimeFormatter.format(new Date(booking.startTime)),
    return_datetime: dateTimeFormatter.format(new Date(booking.endTime)),
    rental_block: DURATION_LABELS[booking.duration],
    rental_fee_amount: formatUsd(booking.rentalSubtotal),
    tax_amount: formatUsd(booking.taxAmount),
    total_charge: formatUsd(bookingCheckoutTotal(booking)),
    abandonment_threshold_hours: "24",
  };
  return Object.entries(values).map(([tabLabel, value]) => ({ tabLabel, value }));
}

export async function createEmbeddedSigningSession(booking: Booking) {
  if (!hasDocuSign || !docusignAccountId || !docusignTemplateId) {
    throw new Error("DocuSign is not configured.");
  }
  let envelopeId = booking.docusignEnvelopeId;
  if (!envelopeId) {
    const created = await requestDocuSign<{ envelopeId?: string }>(
      `/v2.1/accounts/${encodeURIComponent(docusignAccountId)}/envelopes`,
      {
        method: "POST",
        body: JSON.stringify({
          templateId: docusignTemplateId,
          status: "sent",
          emailSubject: `Trailer rental agreement — ${booking.trailerName}`,
          templateRoles: [{
            email: booking.customerEmail,
            name: renterName(booking),
            roleName: docusignSignerRole,
            clientUserId: booking.id,
            tabs: { textTabs: agreementTextTabs(booking) },
          }],
          customFields: {
            textCustomFields: [
              { name: "Booking ID", value: booking.id, show: "false" },
              { name: "Trailer", value: booking.trailerName, show: "false" },
              { name: "Rental Start", value: booking.startTime, show: "false" },
              { name: "Rental End", value: booking.endTime, show: "false" },
            ],
          },
        }),
      },
    );
    envelopeId = created.envelopeId;
  }
  if (!envelopeId) throw new Error("DocuSign did not return an envelope ID.");
  const view = await requestDocuSign<{ url?: string }>(
    `/v2.1/accounts/${encodeURIComponent(docusignAccountId)}/envelopes/${encodeURIComponent(envelopeId)}/views/recipient`,
    {
      method: "POST",
      body: JSON.stringify({
        returnUrl: `${appUrl}/booking/${booking.id}/documents?agreement=returned`,
        authenticationMethod: "none",
        email: booking.customerEmail,
        userName: renterName(booking),
        recipientId: "1",
        clientUserId: booking.id,
      }),
    },
  );
  if (!view.url) throw new Error("DocuSign did not return a signing URL.");
  return { envelopeId, url: view.url };
}

export async function getEnvelopeStatus(envelopeId: string) {
  if (!docusignAccountId) throw new Error("DocuSign is not configured.");
  return requestDocuSign<{ status?: string; completedDateTime?: string }>(
    `/v2.1/accounts/${encodeURIComponent(docusignAccountId)}/envelopes/${encodeURIComponent(envelopeId)}`,
  );
}

export { hasDocuSign };
