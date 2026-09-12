import { bookingCheckoutTotal } from "@/lib/booking/pricing";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { getAdminSession } from "@/lib/auth/authorization";
import { listAllBookings } from "@/lib/booking/repository";
import { formatUsd } from "@/lib/booking/pricing";

export const metadata: Metadata = { title: "Owner Bookings", robots: { index: false, follow: false } };
const dateFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" });

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/sign-in?next=/admin");
  const bookings = await listAllBookings();
  return <><Navbar /><main id="main-content" className="min-h-screen max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-20"><div className="mb-8"><div className="text-xs font-bold uppercase tracking-[0.24em] text-primary mb-2">Owner Console</div><h1 className="font-headline text-5xl font-bold uppercase">Bookings</h1></div>{bookings.length === 0 ? <p className="text-on-surface-variant">No bookings yet.</p> : <div className="grid gap-4">{bookings.map((booking) => <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="grid gap-3 bg-surface-container-low p-5 ghost-border hover:border-primary md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center"><div><div className="font-bold">{booking.customer.firstName} {booking.customer.lastName}</div><div className="text-sm text-on-surface-variant">{booking.trailerName}</div></div><div className="text-sm"><div>{dateFormatter.format(new Date(booking.startTime))}</div><div className="text-on-surface-variant">{formatUsd(bookingCheckoutTotal(booking))}</div></div><div className="text-sm uppercase tracking-widest text-primary">{booking.status.replaceAll("_", " ")}</div><span className="font-headline uppercase tracking-widest">Review →</span></Link>)}</div>}</main><Footer /></>;
}
