import { adminEmails, appUrl } from "@/lib/env";
import { trailers } from "@/lib/data/trailers";
import type { PickupRequestRecord, RequestNotification } from "./types";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const format = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  dateStyle: "full",
  timeStyle: "short",
});
export function pickupRequestEmailContent(
  record: PickupRequestRecord,
  kind: RequestNotification["kind"],
) {
  const owner = kind === "owner",
    decision = kind === "decision",
    approved = record.decision?.kind === "approved";
  const subject = owner
    ? "New outside-hours pickup request"
    : decision
      ? approved
        ? "Your pickup time is approved"
        : "Update on your pickup request"
      : "We received your pickup request";
  const path = owner
    ? `/admin/pickup-requests/${record.id}`
    : decision && !approved
      ? "/book"
      : `/pickup-requests/${record.id}`;
  const message = owner
    ? "Review this request and send the renter your decision."
    : decision
      ? approved
        ? "You can continue booking for this pickup time. Availability will be checked again at checkout; your trailer is not reserved yet."
        : "That pickup time could not be approved. You can choose a normal pickup time or submit another request."
      : "We saved your request. We will email you after it is reviewed. No reservation or charge has been made.";
  const note = decision ? record.decision?.note : record.message;
  const trailer =
    trailers.find((t) => t.id === record.trailerId)?.name ?? "Trailer";
  return {
    to: owner ? [...adminEmails] : [record.email],
    subject,
    html: `<div style="font-family:Arial,sans-serif;background:#10141c;color:#f5f5f5;padding:28px"><h1>${escape(subject)}</h1><p>${escape(message)}</p><p>${escape(trailer)}<br>Pickup: ${escape(format.format(record.startTimeMs))} Central Time<br>Return: ${escape(format.format(record.endTimeMs))} Central Time</p>${owner ? `<p>${escape(record.firstName)} ${escape(record.lastName)}<br>${escape(record.email)}<br>${escape(record.phone)}</p>` : ""}${note ? `<p style="white-space:pre-wrap">${escape(note)}</p>` : ""}<p><a style="color:#ffb4ab" href="${escape(appUrl + path)}">${owner ? "Review request" : decision && approved ? "Continue booking" : decision ? "Choose another time" : "View request"}</a></p><p>Alamo City Hitch &amp; Go</p></div>`,
  };
}
