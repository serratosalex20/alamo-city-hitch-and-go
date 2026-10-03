import { isIP } from "node:net";
import { hasProductionAuthSecret, isDemoEnvironment } from "@/lib/env";
import { requestInputSchema } from "./validation";
import {
  createPickupRequest,
  PickupRequestError,
  requestRateHash,
} from "./repository";
export function assertSameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    throw new PickupRequestError("Invalid request origin.", 403);
}
export function pickupNetworkHash(
  headers: Headers,
  vercel = process.env.VERCEL === "1",
) {
  // This header is set by Vercel, never trusted on a direct/non-Vercel server.
  const address = vercel
    ? headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : undefined;
  return requestRateHash(
    address && isIP(address) ? address : "unknown-network",
  );
}
export async function readRequestJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new PickupRequestError("Invalid request.");
  const decoder = new TextDecoder();
  let body = "",
    length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 12000) {
      await reader.cancel();
      throw new PickupRequestError("Request is too large.", 413);
    }
    body += decoder.decode(value, { stream: true });
  }
  try {
    return JSON.parse(body + decoder.decode());
  } catch {
    throw new PickupRequestError("Invalid request.");
  }
}
export async function submitPickupRequest(request: Request) {
  assertSameOrigin(request);
  if (!isDemoEnvironment && !hasProductionAuthSecret)
    throw new PickupRequestError("Requests are temporarily unavailable.", 503);
  const body = await readRequestJson(request);
  if (body?.website)
    throw new PickupRequestError("Unable to accept this request.");
  const input = requestInputSchema.parse(body);
  const saved = await createPickupRequest(
    input,
    pickupNetworkHash(request.headers),
  );
  return { requestId: saved.request.id, created: saved.created };
}
