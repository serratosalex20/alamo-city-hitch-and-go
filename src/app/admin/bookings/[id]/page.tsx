import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { AdminBookingActions } from "@/components/admin/AdminBookingActions";
import { getAdminSession } from "@/lib/auth/authorization";
import { getBooking } from "@/lib/booking/repository";
import { formatUsd } from "@/lib/booking/pricing";

export const metadata: Metadata = {
  title: "Review Booking",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  dateStyle: "medium",
  timeStyle: "short",
});

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">{label}</dt>
      <dd className="font-medium break-words">{children}</dd>
    </div>
  );
}

export default async function AdminBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/sign-in?next=/admin");
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();
  const returnedDeadline = booking.returnedAtMs
    ? booking.returnedAtMs + 24 * 60 * 60 * 1000
    : undefined;

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-20 space-y-6">
        <div>
          <Link href="/admin" className="text-sm text-primary">← All bookings</Link>
          <h1 className="font-headline text-4xl md:text-5xl font-bold uppercase mt-3">
            {booking.customer.firstName} {booking.customer.lastName}
          </h1>
          <p className="text-on-surface-variant">{booking.id}</p>
        </div>

        {returnedDeadline && booking.status === "return_inspection" && (
          <div className="border-l-4 border-primary bg-primary/10 p-4">
            Deposit decision due by {dateFormatter.format(new Date(returnedDeadline))}. Release remains manual.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="bg-surface-container-low p-6 ghost-border">
            <h2 className="font-headline text-2xl font-bold uppercase mb-5">Rental & Customer</h2>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Item label="Status">{booking.status.replaceAll("_", " ")}</Item>
              <Item label="Trailer">{booking.trailerName} · {booking.unitId}</Item>
              <Item label="Pickup">{dateFormatter.format(new Date(booking.startTime))}</Item>
              <Item label="Return">{dateFormatter.format(new Date(booking.endTime))}</Item>
              <Item label="Paid">{formatUsd(booking.rentalTotal)} · {booking.paymentStatus}</Item>
              <Item label="Deposit">{formatUsd(booking.depositAmount)} · {booking.depositStatus.replaceAll("_", " ")}</Item>
              <Item label="Email"><a className="text-primary underline" href={`mailto:${booking.customerEmail}`}>{booking.customerEmail}</a></Item>
              <Item label="Phone"><a className="text-primary underline" href={`tel:${booking.customer.phone}`}>{booking.customer.phone}</a></Item>
              <Item label="Address">{booking.customer.address.street}, {booking.customer.address.city}, {booking.customer.address.state} {booking.customer.address.zip}</Item>
              <Item label="Tow vehicle">{booking.towVehicle.year} {booking.towVehicle.make} {booking.towVehicle.model}{booking.towVehicle.plate ? ` · ${booking.towVehicle.plate}` : ""}</Item>
            </dl>
          </section>

          <section className="bg-surface-container-low p-6 ghost-border">
            <h2 className="font-headline text-2xl font-bold uppercase mb-5">Documents</h2>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Item label="Agreement">{booking.agreementStatus}</Item>
              <Item label="Identity">{booking.identityStatus.replaceAll("_", " ")}</Item>
              <Item label="Insurance">{booking.insuranceStatus.replaceAll("_", " ")}</Item>
              <Item label="Expires">{booking.insuranceExpiresAt ?? "—"}</Item>
              <Item label="Carrier">{booking.insuranceCarrier ?? "—"}</Item>
              <Item label="Policyholder">{booking.insurancePolicyholder ?? "—"}</Item>
            </dl>
            {booking.insuranceStoragePath && (
              <a href={`/api/admin/bookings/${booking.id}/insurance`} className="inline-block mt-6 min-h-[44px] px-5 py-3 bg-surface-container-high font-headline uppercase tracking-widest">
                Download Insurance
              </a>
            )}
          </section>
        </div>

        <AdminBookingActions
          bookingId={booking.id}
          status={booking.status}
          depositStatus={booking.depositStatus}
          depositAmount={booking.depositAmount}
          prePhotoCount={booking.preInspectionPhotos.length}
          postPhotoCount={booking.postInspectionPhotos.length}
        />

        <section className="bg-surface-container-low p-6 ghost-border">
          <h2 className="font-headline text-2xl font-bold uppercase mb-5">Audit Trail</h2>
          <ol className="space-y-4">
            {[...booking.auditTrail].reverse().map((event, index) => (
              <li key={`${event.createdAtMs}-${index}`} className="border-l-2 border-white/10 pl-4">
                <div className="text-sm font-bold uppercase tracking-wide">{event.action.replaceAll("_", " ")}</div>
                <div className="text-xs text-on-surface-variant">
                  {dateFormatter.format(new Date(event.createdAt))} · {event.actor}
                  {event.amountCents ? ` · ${formatUsd(event.amountCents)}` : ""}
                </div>
                {event.note && <p className="text-sm mt-1">{event.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Footer />
    </>
  );
}
