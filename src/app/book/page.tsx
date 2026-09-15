import { BookingWizard } from "@/components/booking/BookingWizard";
import { getSession } from "@/lib/auth/session";
import { listBookingsForEmail } from "@/lib/booking/repository";
import { getProfile } from "@/lib/customers/repository";
import { returningDetails } from "@/lib/customers/returning";
export type { BookingFormData } from "@/components/booking/BookingWizard";

export default async function BookPage() {
  const session = await getSession();
  if (!session || session.bookingId) return <BookingWizard />;
  const [profile, bookings] = await Promise.all([
    getProfile(session.email), listBookingsForEmail(session.email),
  ]);
  const details = returningDetails(session.email, profile, bookings);
  return <BookingWizard savedDetails={details.savedDetails} returningCustomer={details.returningCustomer} />;
}
