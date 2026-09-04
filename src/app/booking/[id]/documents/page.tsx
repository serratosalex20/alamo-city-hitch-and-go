import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PostPaymentChecklist } from "@/components/booking/PostPaymentChecklist";
import { getCustomerBooking } from "@/lib/auth/authorization";
import { DURATION_LABELS, formatUsd } from "@/lib/booking/pricing";

export const metadata: Metadata = {
  title: "Complete Your Booking",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function BookingDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorized = await getCustomerBooking(id);
  if (!authorized) redirect(`/sign-in?next=${encodeURIComponent(`/booking/${id}/documents`)}`);
  const { booking } = authorized;
  const customerName = `${booking.customer.firstName} ${booking.customer.lastName}`;
  const confirmed = ["confirmed", "deposit_action_required", "ready_for_pickup", "active", "return_inspection", "completed"].includes(booking.status);

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen max-w-5xl mx-auto px-4 md:px-8 pt-28 pb-20">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary mb-2">Booking {booking.id.slice(0, 8).toUpperCase()}</div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold uppercase tracking-tight mb-3">
            {confirmed ? "Reservation Confirmed" : booking.status === "under_review" ? "Under Owner Review" : "Complete Your Booking"}
          </h1>
          <p className="max-w-2xl text-on-surface-variant">
            Payment received. Complete each required item below; your reservation is confirmed after owner approval.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3 mb-10" aria-label="Booking summary">
          <div className="bg-surface-container p-5"><div className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Trailer</div><div className="font-bold">{booking.trailerName}</div></div>
          <div className="bg-surface-container p-5"><div className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Pickup</div><div className="font-bold">{dateFormatter.format(new Date(booking.startTime))}</div><div className="text-sm text-on-surface-variant">{DURATION_LABELS[booking.duration]} · Pickup only</div></div>
          <div className="bg-surface-container p-5"><div className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Paid</div><div className="font-bold text-primary">{formatUsd(booking.rentalTotal)}</div><div className="text-sm text-on-surface-variant">$200 deposit handled near pickup</div></div>
        </section>

        {confirmed && (
          <section className="mb-8 border-l-4 border-green-500 bg-green-500/10 p-6">
            <h2 className="font-headline text-xl font-bold uppercase mb-2">Pickup Instructions</h2>
            <p className="text-sm text-on-surface-variant">Arrive at your confirmed time with the approved tow vehicle, your physical driver&apos;s license, and current insurance. We&apos;ll verify the hitch, document trailer condition, and complete the security deposit authorization before release. Exact pickup details are provided directly after approval.</p>
          </section>
        )}

        <PostPaymentChecklist
          bookingId={booking.id}
          customerName={customerName}
          agreementStatus={booking.agreementStatus}
          identityStatus={booking.identityStatus}
          insuranceStatus={booking.insuranceStatus}
          defaultPolicyholder={customerName}
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
