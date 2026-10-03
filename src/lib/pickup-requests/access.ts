import type { PickupRequestRecord } from "./types";
export function canAccessPickupRequest(
  session: { email: string; bookingId?: string } | null,
  request: PickupRequestRecord,
) {
  return Boolean(
    session &&
      !session.bookingId &&
      session.email.trim().toLowerCase() === request.email,
  );
}
