/* eslint-disable react-hooks/purity -- Authenticated async server page: expiry is evaluated at request time. */
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/authorization";
import { listPickupRequests } from "@/lib/pickup-requests/repository";
import { Navbar } from "@/components/marketing/Navbar";
export const metadata = {
  title: "Pickup requests",
  robots: { index: false, follow: false },
};
const date = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  dateStyle: "medium",
  timeStyle: "short",
});
export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await getAdminSession()))
    redirect("/sign-in?next=/admin/pickup-requests");
  const { status } = await searchParams,
    requests = await listPickupRequests();
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 pt-28 pb-20">
        <Link href="/admin" className="underline">
          ← Owner console
        </Link>
        <h1 className="font-headline text-4xl uppercase my-6">
          Pickup requests
        </h1>
        <nav
          aria-label="Filter pickup requests"
          className="flex flex-wrap gap-4 mb-6"
        >
          {["all", "pending", "approved", "declined", "booked"].map(
            (filter) => (
              <Link
                key={filter}
                href={`/admin/pickup-requests${filter === "all" ? "" : `?status=${filter}`}`}
                className={`underline capitalize min-h-11 ${(!status && filter === "all") || status === filter ? "text-primary font-bold" : ""}`}
              >
                {filter}
              </Link>
            ),
          )}
        </nav>
        <div className="grid gap-4">
          {requests
            .filter((r) => !status || r.status === status)
            .map((r) => (
              <Link
                key={r.id}
                href={`/admin/pickup-requests/${r.id}`}
                className="block p-5 bg-surface-container-low ghost-border"
              >
                <div className="flex justify-between gap-3">
                  <strong>
                    {r.firstName} {r.lastName}
                  </strong>
                  <span className="capitalize text-primary">
                    {r.status === "approved" && r.startTimeMs <= Date.now()
                      ? "Expired"
                      : r.status}
                  </span>
                </div>
                <p className="mt-2">
                  Pickup {date.format(r.startTimeMs)} · Central Time
                </p>
                <p className="text-sm text-on-surface-variant">
                  {r.email} · {r.phone}
                </p>
                {r.notifications.some((n) => n.status !== "sent") && (
                  <p className="text-sm mt-2">Email delivery pending</p>
                )}
              </Link>
            ))}
        </div>
        {!requests.length && <p>No pickup requests yet.</p>}
      </main>
    </>
  );
}
