/**
 * Booking conflict detection — buffer policy.
 *
 * Shared by the calendar, availability check, and atomic checkout hold.
 *
 * Default: 30 minutes. Industrial Architect math:
 *   - 15 min for the customer to load/unload after pickup
 *   - 10 min for the operator to inspect post-return
 *   - 5 min slack for parking, paperwork, etc.
 *
 * Owner can override by editing MIN_BUFFER_MIN here. No code elsewhere
 * should encode buffer minutes as a literal — always import from here.
 */

export const MIN_BUFFER_MIN = 30;

export interface Interval {
  startMs: number;
  endMs: number;
}

/**
 * Returns true if the proposed booking conflicts with any existing
 * booking on the same trailer, accounting for the minimum buffer.
 *
 * Pure function — no Firestore reads. Caller fetches existing bookings
 * and passes them in.
 */
export function hasConflict(
  proposed: Interval,
  existing: Interval[],
  bufferMinutes: number = MIN_BUFFER_MIN,
): boolean {
  const bufferMs = bufferMinutes * 60 * 1000;
  return existing.some(
    (b) =>
      proposed.startMs < b.endMs + bufferMs &&
      proposed.endMs + bufferMs > b.startMs,
  );
}

export function hasInventoryCapacity(proposed: Interval, existing: Interval[], capacity: number): boolean {
  return existing.filter(interval => hasConflict(proposed, [interval])).length < capacity;
}
