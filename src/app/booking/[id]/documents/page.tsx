import { BookingInstructions } from "@/components/account/BookingInstructions";
import { RefreshBookingStatus } from "@/components/account/RefreshBookingStatus";
import Link from "next/link";
import { bookingHeading } from "@/lib/auth/portal-navigation";
import { bookingCheckoutTotal } from "@/lib/booking/pricing";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PostPaymentChecklist } from "@/components/booking/PostPaymentChecklist";
import { getCustomerBooking } from "@/lib/auth/authorization";
import { DURATION_LABELS, formatUsd } from "@/lib/booking/pricing";
import {
  pickupAddress,
  pickupInstructions,
  supportEmail,
  supportPhone,
} from "@/lib/env";

export const metadata: Metadata = {
  title: "Complete Your Booking",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function BookingDocumentsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ details?: string }> }) {
  const { id } = await params;
  const authorized = await getCustomerBooking(id);
  if (!authorized) redirect(`/sign-in?next=${encodeURIComponent(`/booking/${id}/documents`)}`);
  const { booking, session } = authorized;
  // Request-time server snapshot; authorization reads cookies on every request.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const customerName = `${booking.customer.firstName} ${booking.customer.lastName}`;
  const confirmed = ["confirmed", "deposit_action_required", "ready_for_pickup", "active", "return_inspection", "completed"].includes(booking.status);
  const search = await searchParams;
  if (confirmed && !session.bookingId && search.details !== "1") redirect("/account");
  const operationsContact = pickupAddress
    ? { pickupAddress, pickupInstructions, supportPhone, supportEmail }
    : null;

  return (
    <>
      <Navbar />
      <RefreshBookingStatus enabled={confirmed || booking.status === "under_review"} />
      <main id="main-content" className="min-h-screen max-w-5xl mx-auto px-4 md:px-8 pt-28 pb-20">
        <nav aria-label="Renter navigation" className="flex flex-wrap gap-3 mb-8">
          <Link href={session.bookingId ? "/sign-in?next=%2Faccount" : "/account"} className="min-h-[44px] px-5 py-3 bg-primary-action text-white font-bold uppercase">Go to My Command Center</Link>
          <Link href="/book" className="min-h-[44px] px-5 py-3 bg-surface-container-high font-bold uppercase">Book Another Trailer</Link>
          <form action="/api/auth/logout" method="POST"><button className="min-h-[44px] px-5 py-3 bg-surface-container-high font-bold uppercase">Sign Out</button></form>
        </nav>
        {session.bookingId && <p className="text-sm text-on-surface-variant mb-6">Use your emailed sign-in link to access your full account and booking history.</p>}
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary mb-2">Booking {booking.id.slice(0, 8).toUpperCase()}</div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold uppercase tracking-tight mb-3">
            {bookingHeading(booking.status)}
          </h1>
          <p className="max-w-2xl text-on-surface-variant">
            {booking.status === "active" ? "Your trailer has been picked up. Review your return time and instructions below." : booking.status === "completed" ? "Your rental is complete. Visit your command center to view your bookings or book again." : confirmed ? "Your reservation has been approved. Review your booking details and instructions below." : booking.status === "under_review" ? "Payment and documents received. The owner is reviewing your reservation." : "Payment received. Complete each required item below; your reservation is confirmed after owner approval."}
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3 mb-10" aria-label="Booking summary">
          <div className="bg-surface-container p-5"><div className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Trailer</div><div className="font-bold">{booking.trailerName}</div></div>
          <div className="bg-surface-container p-5"><div className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Pickup</div><div className="font-bold">{dateFormatter.format(new Date(booking.startTime))}</div><div className="text-sm text-on-surface-variant">{DURATION_LABELS[booking.duration]} · Pickup only</div></div>
          <div className="bg-surface-container p-5"><div className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Paid</div><div className="font-bold text-primary">{formatUsd(bookingCheckoutTotal(booking))}</div><div className="text-sm text-on-surface-variant">{booking.depositCollectedAtCheckout ? "Includes refundable security deposit" : "Deposit handled separately near pickup"}</div></div>
        </section>

        {confirmed && <div className="mb-8"><BookingInstructions status={booking.status} endTime={booking.endTime} contact={operationsContact} nowMs={nowMs} /></div>}

        <PostPaymentChecklist
          bookingId={booking.id}
          customerName={customerName}
          agreementStatus={booking.agreementStatus}
          identityStatus={booking.identityStatus}
          insuranceStatus={booking.insuranceStatus}
          defaultPolicyholder={customerName}
          identityExpiresAt={booking.identityExpiresAt}
          insuranceCarrier={booking.insuranceCarrier}
          insurancePolicyNumber={booking.insurancePolicyNumber}
          insuranceExpiresAt={booking.insuranceExpiresAt}
          insurancePolicyholder={booking.insurancePolicyholder}
          hasInsuranceFile={!!booking.insuranceStoragePath && booking.insuranceStatus !== "resubmit_requested"}
          bookingStatus={booking.status}
          depositStatus={booking.depositStatus}
          depositMethod={booking.depositMethod}
          depositAmount={booking.depositAmount}
        />
      </main>
      <Footer />
    </>
  );
}
