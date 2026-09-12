import { bookingCheckoutTotal } from "@/lib/booking/pricing";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { getSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/authorization";
import { listBookingsForEmail } from "@/lib/booking/repository";
import { formatUsd } from "@/lib/booking/pricing";

export const metadata: Metadata = {
  title: "My Bookings",
  description: "View your trailer bookings and required next steps.",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?error=invalid-or-expired");
  const bookings = await listBookingsForEmail(session.email);
  const admin = isAdminEmail(session.email);

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen max-w-5xl mx-auto px-4 md:px-8 pt-28 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary mb-2">Signed in as {session.email}</div>
            <h1 className="font-headline text-5xl font-bold uppercase">My Bookings</h1>
          </div>
          <div className="flex gap-3">
            {admin && <Link href="/admin" className="min-h-[44px] px-5 py-3 bg-primary-action font-headline uppercase tracking-widest">Owner Console</Link>}
            <form action="/api/auth/logout" method="POST"><button className="min-h-[44px] px-5 py-3 bg-surface-container-high font-headline uppercase tracking-widest">Sign Out</button></form>
          </div>
        </div>

        {bookings.length === 0 ? (
          <section className="bg-surface-container-low p-8 ghost-border">
            <p className="text-on-surface-variant mb-5">No bookings are connected to this email.</p>
            <Link href="/book" className="text-primary font-bold uppercase tracking-widest">Book a trailer →</Link>
          </section>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <article key={booking.id} className="bg-surface-container-low p-6 ghost-border">
                <div className="flex flex-wrap justify-between gap-5">
                  <div><div className="text-xs uppercase tracking-widest text-primary mb-2">{booking.status.replaceAll("_", " ")}</div><h2 className="font-headline text-2xl font-bold uppercase">{booking.trailerName}</h2><p className="text-sm text-on-surface-variant">Pickup {dateFormatter.format(new Date(booking.startTime))}</p></div>
                  <div className="text-right"><div className="font-bold">{formatUsd(bookingCheckoutTotal(booking))} · {booking.paymentStatus}</div><div className="text-sm text-on-surface-variant">Deposit: {booking.depositStatus.replaceAll("_", " ")}</div></div>
                </div>
                <Link href={`/booking/${booking.id}/documents`} className="inline-block mt-5 min-h-[44px] px-5 py-3 bg-primary-action font-headline font-bold uppercase tracking-widest">View Booking & Next Steps</Link>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
