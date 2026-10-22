import type { Booking } from "@/types/models";

export function selectDashboardBooking(email: string, bookings: Booking[], selectedId?: string) {
  const owned = bookings.filter(booking => booking.customerEmail.toLowerCase() === email.toLowerCase());
  const selected = owned.find(booking => booking.id === selectedId);
  if (selected) return selected;
  const rank = (booking: Booking) => booking.status === "active" ? 0 : ["ready_for_pickup", "confirmed", "deposit_action_required"].includes(booking.status) ? 1 : booking.status === "return_inspection" ? 2 : ["completed", "cancelled", "rejected"].includes(booking.status) ? 4 : 3;
  return owned.sort((a, b) => rank(a) - rank(b) || (rank(a) === 1 ? a.startTimeMs - b.startTimeMs : b.createdAtMs - a.createdAtMs))[0];
}

export function rentalClock(start: number, end: number, now: number) {
  const duration = Math.max(0, end - start);
  return {
    remainingMs: Math.max(0, Math.min(duration, end - now)),
    progress: duration > 0 ? Math.max(0, Math.min(100, (now - start) / duration * 100)) : 100,
    beforePickup: now < start,
    overdue: now >= end,
  };
}
