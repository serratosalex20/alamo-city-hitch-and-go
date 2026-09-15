import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/authorization";
import { listProfiles } from "@/lib/customers/repository";
import { listAllBookings } from "@/lib/booking/repository";
import { Navbar } from "@/components/marketing/Navbar";

export const metadata = { title: "Customer Contacts", robots: { index: false, follow: false } };
export default async function ContactsPage() {
  if (!await getAdminSession()) redirect("/sign-in?next=/admin/contacts");
  const [profiles, bookings] = await Promise.all([listProfiles(), listAllBookings()]);
  const contacts = new Map(profiles.map((profile) => [profile.email, {
    email: profile.email, name: profile.name, phone: profile.phone,
    preference: profile.emailMarketing ? "Subscribed" : "Not subscribed", date: profile.consentUpdatedAt,
  }]));
  for (const booking of bookings) {
    if (contacts.has(booking.customerEmail)) continue;
    contacts.set(booking.customerEmail, {
      email: booking.customerEmail, name: `${booking.customer.firstName} ${booking.customer.lastName}`, phone: booking.customer.phone,
      preference: booking.emailMarketingOptIn ? "Opt-in requested — verify email in portal" : "Not subscribed", date: booking.emailMarketingConsentAt ?? "",
    });
  }
  return <><Navbar /><main className="max-w-6xl mx-auto px-4 pt-28 pb-20">
    <Link href="/admin" className="text-primary underline">← Bookings</Link>
    <h1 className="font-headline text-4xl uppercase my-6">Customer Contacts</h1>
    <p className="mb-6 text-on-surface-variant">Email campaign eligibility is shown below. Phone numbers are contact details, not SMS marketing consent. GoHighLevel sync is not connected.</p>
    <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{["Name", "Email", "Phone", "Email preference", "Preference recorded"].map((label) => <th key={label} className="p-3 border-b border-white/20">{label}</th>)}</tr></thead><tbody>
      {[...contacts.values()].map((contact) => <tr key={contact.email}>{[contact.name, contact.email, contact.phone, contact.preference, contact.date ? new Date(contact.date).toLocaleString("en-US", { timeZone: "America/Chicago" }) : "—"].map((value, i) => <td key={i} className="p-3 border-b border-white/10">{value}</td>)}</tr>)}
    </tbody></table></div>
    {!contacts.size && <p className="mt-6">No customer contacts yet.</p>}
  </main></>;
}
