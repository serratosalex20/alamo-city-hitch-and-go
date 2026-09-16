import type { Booking, BookingStatus } from "@/types/models";

export function checkoutSessionScope(session: { email: string; bookingId?: string } | null, email: string, bookingId: string) {
  return session && !session.bookingId && session.email.toLowerCase() === email.toLowerCase() ? undefined : bookingId;
}
const portalStatuses: BookingStatus[] = ["confirmed", "deposit_action_required", "ready_for_pickup", "active", "return_inspection", "completed", "cancelled", "rejected"];
export function portalSignInDestination(next: string | undefined, email: string, booking: Pick<Booking, "id" | "customerEmail" | "status"> | null) {
  if (!next) return "/account";
  if (/^\/booking\/[^/]+\/documents(?:\?.*)?$/.test(next) && booking &&
    next.split("/")[2] === booking.id && booking.customerEmail.toLowerCase() === email.toLowerCase() && portalStatuses.includes(booking.status)) return "/account";
  return next;
}
export function bookingHeading(status: BookingStatus) {
  if (status === "active") return "Rental In Progress";
  if (status === "return_inspection") return "Return Inspection";
  if (status === "completed") return "Rental Completed";
  if (status === "cancelled") return "Booking Cancelled";
  if (status === "rejected") return "Booking Not Approved";
  if (portalStatuses.includes(status)) return "Reservation Confirmed";
  return status === "under_review" ? "Under Owner Review" : "Complete Your Booking";
}
