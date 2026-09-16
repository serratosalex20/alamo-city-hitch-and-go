import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/Icon";
import { ActiveRental } from "@/components/dashboard/ActiveRental";
import { DocumentList } from "@/components/dashboard/DocumentList";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { BookingInstructions } from "@/components/account/BookingInstructions";
import { RefreshBookingStatus } from "@/components/account/RefreshBookingStatus";
import { getSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/authorization";
import { listBookingsForEmail } from "@/lib/booking/repository";
import { selectDashboardBooking } from "@/lib/booking/dashboard";
import { pickupAddress, pickupInstructions, supportPhone, supportEmail } from "@/lib/env";

export const metadata: Metadata = { title: "Hauler Command", description: "Your rental, remaining time, documents, and pickup or return instructions.", robots: { index: false, follow: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ booking?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=%2Faccount");
  if (session.bookingId) redirect("/sign-in?next=%2Faccount");
  const bookings = await listBookingsForEmail(session.email);
  const selected = (await searchParams).booking;
  const booking = selectDashboardBooking(session.email, bookings, selected);
  const admin = isAdminEmail(session.email);
  // Dynamic server request time; used for an identical first client render.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const approved = booking && ["confirmed", "deposit_action_required", "ready_for_pickup", "active", "return_inspection", "completed"].includes(booking.status);
  const contact = approved && pickupAddress ? { pickupAddress, pickupInstructions, supportPhone, supportEmail } : null;
  const phone = supportPhone.replace(/[^+\d]/g, "");
  return <>
    <RefreshBookingStatus />
    <header className="bg-background fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-6 py-3 border-b border-white/5 shadow-2xl" role="banner">
      <div className="flex items-center gap-2">
        <details className="relative"><summary aria-label="Open navigation menu" className="min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer list-none"><Icon name="menu" className="text-primary" /></summary>
          <nav aria-label="Hauler Command menu" className="absolute top-full left-0 w-64 bg-surface-container-high p-3 rounded-lg shadow-xl border border-white/10">
            <Link href="/account" className="block p-3 min-h-[44px]">Hauler Command</Link><Link href="/account/bookings" className="block p-3 min-h-[44px]">My Bookings</Link><Link href="/account/bookings#profile" className="block p-3 min-h-[44px]">My Profile</Link><Link href="/book" className="block p-3 min-h-[44px]">Book a Trailer</Link>{admin && <Link href="/admin" className="block p-3 min-h-[44px]">Owner Console</Link>}
          </nav>
        </details>
        <Link href="/account" className="text-2xl md:text-3xl font-bold tracking-widest text-white uppercase font-teko">HAULER_COMMAND</Link>
      </div>
      <Link href="/account/bookings#profile" aria-label="My Profile" className="w-11 h-11 rounded-lg border border-white/10 bg-surface-container-high flex items-center justify-center"><Icon name="person" /></Link>
    </header>
    <main id="main-content" className="pt-24 px-5 space-y-7 max-w-lg mx-auto pb-28">
      <div><p className="text-xs font-bold tracking-[0.15em] text-on-surface-variant uppercase">Alamo City Hitch &amp; Go</p><h1 className="text-3xl font-headline font-bold uppercase mt-1">Hauler Command</h1></div>
      <div className="flex gap-3"><Link href="/book" className="flex-1 min-h-[44px] px-3 py-3 text-center bg-primary-action font-bold uppercase text-sm">Book a Trailer</Link><Link href="/account/bookings" className="flex-1 min-h-[44px] px-3 py-3 text-center bg-surface-container-high font-bold uppercase text-sm">My Bookings</Link></div>
      {booking ? <>
        <ActiveRental key={booking.id} bookingId={booking.id} trailerName={booking.trailerName} unitId={booking.unitId} status={booking.status} startTime={booking.startTime} endTime={booking.endTime} nowMs={nowMs} supportPhone={supportPhone} />
        {bookings.length > 1 && <p className="text-xs text-on-surface-variant">Viewing booking {booking.id.slice(0, 8).toUpperCase()}. <Link href="/account/bookings" className="text-primary underline">Choose another booking</Link></p>}
        {approved && <BookingInstructions key={`instructions-${booking.id}`} status={booking.status} endTime={booking.endTime} contact={contact} nowMs={nowMs} />}
        <DocumentList key={`documents-${booking.id}`} bookingId={booking.id} signedAvailable={booking.agreementStatus === "signed" && !!booking.docusignEnvelopeId} />
      </> : <section className="bg-surface-container-high rounded-lg p-6"><h2 className="text-xl font-bold">Ready for your next rental?</h2><p className="text-on-surface-variant mt-3">Your account stays available between bookings. Choose a trailer above to get started.</p></section>}
      <section className="bg-surface-container-low rounded-lg border border-white/5 p-5" aria-label="Account session">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Signed In As</p><p className="text-sm font-bold break-all">{session.email}</p></div><form action="/api/auth/logout" method="POST"><button className="min-h-[44px] px-4 py-3 bg-surface-container-high text-xs font-bold uppercase">Sign Out</button></form></div>
      </section>
      {contact && <section className="rounded-lg overflow-hidden border border-white/10 bg-surface-container" aria-label="Rental location">
        <iframe title="Pickup and return location map" loading="lazy" referrerPolicy="no-referrer" src={`https://maps.google.com/maps?q=${encodeURIComponent(contact.pickupAddress)}&output=embed`} className="w-full h-48 border-0 grayscale hover:grayscale-0" />
        <div className="p-4 text-sm"><h2 className="font-bold uppercase flex gap-2 items-center"><Icon name="location_on" className="text-primary" />Rental Location</h2><p className="mt-2 text-on-surface-variant">{contact.pickupAddress}</p><a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.pickupAddress)}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 min-h-[44px] py-3 text-primary underline">Get Directions</a></div>
      </section>}
      <section id="support" className="scroll-mt-24 rounded-lg p-5 bg-surface-container-low border border-white/5"><h2 className="font-bold uppercase">Need Help?</h2><div className="flex flex-wrap gap-3 mt-3"><a href={`tel:${phone}`} className="min-h-[44px] p-3 bg-surface-container-high">Call {supportPhone}</a><a href={`mailto:${supportEmail}`} className="min-h-[44px] p-3 bg-surface-container-high">Email Us</a></div></section>
    </main>
    <BottomNav />
  </>;
}
