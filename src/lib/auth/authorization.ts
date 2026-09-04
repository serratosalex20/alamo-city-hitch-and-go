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
  if (!session || !booking || session.email !== booking.customerEmail) return null;
  return { session, booking };
}

export async function getAdminSession() {
  const session = await getSession();
  return session && isAdminEmail(session.email) ? session : null;
}
