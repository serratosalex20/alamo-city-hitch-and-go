import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getApprovedPickupRequest,
  getResumablePickupCheckout,
} from "@/lib/pickup-requests/checkout";
import { trailers } from "@/lib/data/trailers";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { getSession } from "@/lib/auth/session";
import { listBookingsForEmail } from "@/lib/booking/repository";
import { getProfile } from "@/lib/customers/repository";
import { returningDetails } from "@/lib/customers/returning";
export type { BookingFormData } from "@/components/booking/BookingWizard";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ pickupRequest?: string }>;
}) {
  const session = await getSession();
  const requestId = (await searchParams).pickupRequest;
  if (requestId) {
    if (!session || session.bookingId)
      redirect(
        `/sign-in?next=${encodeURIComponent(`/book?pickupRequest=${requestId}`)}`,
      );
    let request;
    try {
      request = await getApprovedPickupRequest(requestId, session);
    } catch {
      return (
        <main className="max-w-3xl mx-auto px-4 pt-28">
          <h1 className="font-headline text-3xl uppercase">
            Pickup request unavailable
          </h1>
          <p className="my-4">
            Use the email associated with your request, or check its current
            status.
          </p>
          <Link
            href={`/pickup-requests/${encodeURIComponent(requestId)}`}
            className="underline"
          >
            View request status
          </Link>
          <p className="mt-4">
            <Link href="/book" className="underline">
              Choose a regular pickup
            </Link>
          </p>
        </main>
      );
    }
    const [profile, bookings] = await Promise.all([
      getProfile(session.email),
      listBookingsForEmail(session.email),
    ]);
    const details = returningDetails(session.email, profile, bookings);
    const resume = await getResumablePickupCheckout(requestId, session);
    return (
      <BookingWizard
        resumeCheckoutKey={resume?.checkoutKey}
        returningCustomer={details.returningCustomer}
        savedDetails={{
          ...details.savedDetails,
          pickupRequestId: request.id,
          trailerId: request.trailerId,
          trailerSlug:
            trailers.find((t) => t.id === request.trailerId)?.slug ?? "",
          date: request.date,
          time: request.time,
          duration: request.duration,
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.email,
          phone: request.phone,
          ...resume?.savedDetails,
        }}
      />
    );
  }
  if (!session || session.bookingId) return <BookingWizard />;
  const [profile, bookings] = await Promise.all([
    getProfile(session.email),
    listBookingsForEmail(session.email),
  ]);
  const details = returningDetails(session.email, profile, bookings);
  return (
    <BookingWizard
      savedDetails={details.savedDetails}
      returningCustomer={details.returningCustomer}
    />
  );
}
