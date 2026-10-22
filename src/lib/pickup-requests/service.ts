import { isAdminEmail } from "@/lib/auth/authorization";
import {
  mutatePickupRequestWithInventory,
  currentlyBlocksInventory,
} from "@/lib/booking/repository";
import { hasInventoryCapacity } from "@/lib/booking/availability";
import { trailers } from "@/lib/data/trailers";
import { PickupRequestError } from "./repository";
import { decisionSchema } from "./validation";
import { deliverPickupRequestNotifications } from "./notifications";
import type { RequestDecision } from "./types";
export async function decidePickupRequest(
  id: string,
  decision: RequestDecision,
  note: string,
  actor: string,
  nowMs = Date.now(),
) {
  if (!isAdminEmail(actor))
    throw new PickupRequestError("Owner access is required.", 403);
  const input = decisionSchema.parse({ action: decision, note });
  return mutatePickupRequestWithInventory(id, (record, inventory) => {
    if (record.decision) {
      if (
        record.decision.kind === decision &&
        record.decision.note === input.note
      )
        return record;
      throw new PickupRequestError(
        "This request already has a decision. Refresh to view it.",
        409,
      );
    }
    if (record.status !== "pending")
      throw new PickupRequestError("This request cannot be changed.", 409);
    if (decision === "approved") {
      if (record.startTimeMs <= nowMs)
        throw new PickupRequestError(
          "The requested pickup time has passed.",
          409,
        );
      const trailer = trailers.find((t) => t.id === record.trailerId);
      const intervals = inventory
        .filter(
          (b) =>
            b.trailerId === record.trailerId &&
            currentlyBlocksInventory(b, nowMs),
        )
        .map((b) => ({ startMs: b.startTimeMs, endMs: b.endTimeMs }));
      if (
        !trailer ||
        trailer.status !== "available" ||
        !hasInventoryCapacity(
          { startMs: record.startTimeMs, endMs: record.endTimeMs },
          intervals,
          trailer.inventoryCount + trailer.virtualBoost,
        )
      )
        throw new PickupRequestError(
          "The trailer is not available for the full requested rental.",
          409,
        );
    }
    return {
      ...record,
      status: decision,
      decision: { kind: decision, note: input.note, actor, at: nowMs },
      updatedAtMs: nowMs,
      audit: [...record.audit, { action: decision, actor, at: nowMs }],
      notifications: [
        ...record.notifications,
        {
          kind: "decision",
          status: "pending",
          key: `pickup-${id}-decision`,
          attempts: 0,
        },
      ],
    };
  });
}
export async function handlePickupRequestAction(
  id: string,
  input: unknown,
  session: { email: string; bookingId?: string } | null,
) {
  if (!session || session.bookingId || !isAdminEmail(session.email))
    throw new PickupRequestError("Owner access is required.", 403);
  if (
    typeof input === "object" &&
    input !== null &&
    "action" in input &&
    input.action === "retry_notifications"
  )
    return deliverPickupRequestNotifications(id);
  const parsed = decisionSchema.parse(input);
  await decidePickupRequest(id, parsed.action, parsed.note, session.email);
  return deliverPickupRequestNotifications(id);
}
