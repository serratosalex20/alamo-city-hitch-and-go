import { getSession } from "@/lib/auth/session";
import { adminEmails, isDemoEnvironment } from "@/lib/env";
import { getBooking } from "@/lib/booking/repository";

export function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    adminEmails.has(normalized) ||
    (isDemoEnvironment && normalized === "owner@alamocityhitchandgo.test")
  );
}

export async function getCustomerBooking(id: string) {
  const [session, booking] = await Promise.all([getSession(), getBooking(id)]);
  if (!session || !booking || !canAccessBooking(session, booking)) return null;
  return { session, booking };
}

export async function getAdminSession() {
  const session = await getSession();
  return session && !session.bookingId && isAdminEmail(session.email) ? session : null;
}

export function canAccessBooking(session: { email: string; bookingId?: string }, booking: { id: string; customerEmail: string }) {
  return session.email === booking.customerEmail && (!session.bookingId || session.bookingId === booking.id);
}
