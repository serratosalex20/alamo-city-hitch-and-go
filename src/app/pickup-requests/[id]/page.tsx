/* eslint-disable react-hooks/purity -- Authenticated async server page: expiry is evaluated at request time. */
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getPickupRequest } from "@/lib/pickup-requests/repository";
import { canAccessPickupRequest } from "@/lib/pickup-requests/access";
import { Navbar } from "@/components/marketing/Navbar";
import { trailers } from "@/lib/data/trailers";
export const metadata = {
  title: "Your pickup request",
  robots: { index: false, follow: false },
};
const date = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  dateStyle: "full",
  timeStyle: "short",
});
export default async function RequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    session = await getSession();
  if (!session || session.bookingId)
    redirect(`/sign-in?next=${encodeURIComponent(`/pickup-requests/${id}`)}`);
  const r = await getPickupRequest(id);
  if (!r || !canAccessPickupRequest(session, r)) notFound();
  const expired = r.status === "approved" && r.startTimeMs <= Date.now();
  const heading =
    r.status === "pending"
      ? "Request received"
      : r.status === "booked"
        ? "Booking started"
        : expired
          ? "Pickup request expired"
          : r.status === "approved"
            ? "Pickup time approved"
            : "Pickup request update";
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <h1 className="font-headline text-4xl uppercase mb-6">{heading}</h1>
        <section className="p-6 bg-surface-container-low space-y-4">
          <p>{trailers.find((t) => t.id === r.trailerId)?.name}</p>
          <p>Pickup: {date.format(r.startTimeMs)} Central Time</p>
          <p>Return: {date.format(r.endTimeMs)} Central Time</p>
          {r.decision && (
            <p className="whitespace-pre-wrap">{r.decision.note}</p>
          )}
          {r.status === "pending" && (
            <p>
              We saved your details and will email you after review. No
              reservation or charge has been made.
            </p>
          )}
          {r.status === "approved" && !expired && (
            <>
              <p>
                Your requested pickup time is approved. Trailer availability
                will be checked again when you continue booking.
              </p>
              <Link
                href={`/book?pickupRequest=${r.id}`}
                className="inline-block px-5 py-3 bg-primary-action text-white font-bold"
              >
                Continue booking
              </Link>
            </>
          )}
          {r.status === "booked" && r.bookingId && (
            <Link
              href={`/booking/${r.bookingId}/documents`}
              className="inline-block underline min-h-11"
            >
              View booking
            </Link>
          )}
          {(expired || r.status === "declined") && (
            <p>
              This request is not a confirmed reservation. You can choose a
              regular pickup time or send a new request.
            </p>
          )}
        </section>
        <div className="mt-6 flex gap-6">
          <Link href="/book" className="underline min-h-11">
            Choose another time
          </Link>
          <Link href="/account" className="underline min-h-11">
            My account
          </Link>
        </div>
      </main>
    </>
  );
}
