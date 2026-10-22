import { randomUUID } from "node:crypto";
import { sendPickupRequestEmail } from "@/lib/email/server";
import {
  getPickupRequest,
  mutatePickupRequest,
  PickupRequestError,
} from "./repository";
import type { PickupRequestRecord, RequestNotification } from "./types";
type Sender = (
  record: PickupRequestRecord,
  notification: RequestNotification,
) => Promise<{ sent: boolean; providerId?: string }>;
export async function deliverPickupRequestNotifications(
  id: string,
  send: Sender = sendPickupRequestEmail,
) {
  const initial = await getPickupRequest(id);
  if (!initial) throw new PickupRequestError("Request not found.", 404);
  let sent = 0,
    failed = 0;
  for (const item of initial.notifications) {
    const claimId = randomUUID(),
      now = Date.now();
    const claimed = await mutatePickupRequest(id, (record) => ({
      ...record,
      notifications: record.notifications.map((n) =>
        n.key === item.key && n.status !== "sent" && (n.leaseUntil ?? 0) <= now
          ? {
              ...n,
              status: "sending",
              claimId,
              leaseUntil: now + 120000,
              attempts: n.attempts + 1,
            }
          : n,
      ),
    }));
    const notification = claimed.notifications.find(
      (n) => n.key === item.key && n.claimId === claimId,
    );
    if (!notification) continue;
    let result: { sent: boolean; providerId?: string };
    try {
      result = await send(claimed, notification);
    } catch {
      result = { sent: false };
    }
    await mutatePickupRequest(id, (record) => ({
      ...record,
      notifications: record.notifications.map((n) => {
        if (n.key !== item.key || n.claimId !== claimId) return n;
        const next: RequestNotification = {
          ...n,
          status: result.sent ? "sent" : "failed",
          leaseUntil: 0,
        };
        if (result.providerId) next.providerId = result.providerId;
        if (!result.sent)
          next.error = "Email delivery could not be confirmed. Please retry.";
        else delete next.error;
        return next;
      }),
    }));
    if (result.sent) sent++;
    else failed++;
  }
  const saved = await getPickupRequest(id);
  const outstanding =
    saved?.notifications.filter((n) => n.status !== "sent").length ??
    initial.notifications.length;
  return { sent, failed, outstanding };
}
