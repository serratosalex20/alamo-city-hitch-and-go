import { BookingWizard } from "@/components/booking/BookingWizard";
import { getSession } from "@/lib/auth/session";
import { listBookingsForEmail } from "@/lib/booking/repository";
import { getProfile } from "@/lib/customers/repository";
import { returningDetails } from "@/lib/customers/returning";
import { contactBookingOnly } from "@/lib/env";
import { ContactBooking } from "@/components/marketing/ContactBooking";
import type { Metadata } from "next";
export type { BookingFormData } from "@/components/booking/BookingWizard";

export const metadata: Metadata = { title: "Book a Trailer", alternates: { canonical: "/book" } };

export default async function BookPage({ searchParams }: { searchParams: Promise<{ trailer?: string }> }) {
  if (contactBookingOnly) return <ContactBooking trailerSlug={(await searchParams).trailer} />;
  const session = await getSession();
  if (!session || session.bookingId) return <BookingWizard />;
  const [profile, bookings] = await Promise.all([
    getProfile(session.email), listBookingsForEmail(session.email),
  ]);
  const details = returningDetails(session.email, profile, bookings);
  return <BookingWizard savedDetails={details.savedDetails} returningCustomer={details.returningCustomer} />;
}
