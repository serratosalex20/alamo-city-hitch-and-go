/* eslint-disable react-hooks/purity -- Authenticated async server page: expiry is evaluated at request time. */
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getAdminSession } from "@/lib/auth/authorization";
import { getPickupRequest } from "@/lib/pickup-requests/repository";
import { trailers } from "@/lib/data/trailers";
import { Navbar } from "@/components/marketing/Navbar";
import { PickupRequestActions } from "@/components/admin/PickupRequestActions";
export const metadata = {
  title: "Review pickup request",
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
  const { id } = await params;
  if (!(await getAdminSession()))
    redirect(
      `/sign-in?next=${encodeURIComponent(`/admin/pickup-requests/${id}`)}`,
    );
  const r = await getPickupRequest(id);
  if (!r) notFound();
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-28 pb-20">
        <Link href="/admin/pickup-requests" className="underline">
          ← Pickup requests
        </Link>
        <h1 className="font-headline text-4xl uppercase my-6">
          {r.firstName} {r.lastName}
        </h1>
        <section className="bg-surface-container-low p-6 space-y-3">
          <p className="capitalize text-primary font-bold">
            {r.status === "approved" && r.startTimeMs <= Date.now()
              ? "Expired"
              : r.status}
          </p>
          <p>{trailers.find((t) => t.id === r.trailerId)?.name}</p>
          <p>Pickup: {date.format(r.startTimeMs)} Central Time</p>
          <p>Return: {date.format(r.endTimeMs)} Central Time</p>
          <p>
            <a className="underline" href={`mailto:${r.email}`}>
              {r.email}
            </a>{" "}
            ·{" "}
            <a className="underline" href={`tel:${r.phone}`}>
              {r.phone}
            </a>
          </p>
          <p className="whitespace-pre-wrap">
            {r.message || "No additional message."}
          </p>
          {r.decision && (
            <div className="border-t border-outline-variant pt-3">
              <strong>Decision note</strong>
              <p className="whitespace-pre-wrap">{r.decision.note}</p>
            </div>
          )}
          {r.bookingId && (
            <Link href={`/admin/bookings/${r.bookingId}`} className="underline">
              View linked booking
            </Link>
          )}
        </section>
        <PickupRequestActions
          id={r.id}
          pending={r.status === "pending"}
          retryNeeded={r.notifications.some((n) => n.status !== "sent")}
        />
        <section className="mt-8">
          <h2 className="font-headline text-2xl uppercase">Email delivery</h2>
          {r.notifications.map((n) => (
            <p key={n.key} className="mt-2 text-sm">
              {
                {
                  received: "Renter acknowledgement",
                  owner: "Owner alert",
                  decision: "Decision to renter",
                }[n.kind]
              }
              : {n.status}
              {n.error && n.status !== "sent" ? ` — ${n.error}` : ""}
            </p>
          ))}
        </section>
        <section className="mt-8">
          <h2 className="font-headline text-2xl uppercase">History</h2>
          {r.audit.map((entry, i) => (
            <p key={i} className="mt-2 text-sm">
              {date.format(entry.at)} · {entry.action} · {entry.actor}
            </p>
          ))}
        </section>
      </main>
    </>
  );
}
