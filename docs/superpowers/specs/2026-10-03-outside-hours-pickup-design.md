# Outside-hours pickup requests and lead capture

Status: design approved October 2, 2026 (Central Time), with the secondary-link refinement below. Implementation approved and completed October 3, 2026 UTC; Preview validation is recorded in docs/verification/outside-hours-pickup.md.

## Intended result

Regular pickup hours are 8:00 AM–6:00 PM daily, Central Time, including a 6:00 PM pickup. Standard bookings continue through the self-service booking flow. A renter who needs another time can submit a request, and the owner can approve or decline it with a note sent to the renter. Every successfully submitted request becomes a saved lead before approval, sign-in, or payment.

Declining a time, failing to finish checkout, or an email delivery failure must not delete the lead. Submission saves the information; simply typing into an unsubmitted form does not.

## Approach

Approved approach: add a quiet secondary link beneath the schedule step's pickup-hours note, opening a separate request dialog, and a Requests area within the existing owner console. Use the existing Firestore persistence, email service, verified-email sign-in, and booking checkout.

An email-only request would be quicker to add but would not provide a dependable lead list, decision history, or booking continuation. Creating a normal booking immediately would confuse a pending request with a reservation and tie up inventory before approval. The recommended design stores a request separately and links it to a booking when checkout starts.

## Renter experience

1. Beneath the pickup-hours note, show one small underlined **Need a different pickup time?** control. It opens a separate request dialog only when clicked. It is not a booking step, banner, prominent button, or automatically opened prompt. The ordinary **Check Availability** button remains the primary action. The request link remains accessible if there are no normal pickup slots for the chosen date.
2. The request form asks for first name, last name, email, phone, trailer, preferred pickup date/time, rental duration, and an optional message. Any information already entered in the booking wizard is prefilled. Address and towing details are collected in the normal booking flow later; they are not required to capture a lead. Closing the dialog preserves the ordinary booking selections and returns keyboard focus to the request link. Keep the renter's unsent request draft in memory while they stay on the schedule step. The dialog has its own close control, accessible title, focus management, and mobile scrolling.
3. The renter submits **Send pickup request** without signing in, uploading documents, or paying. The server saves the request before attempting either notification. A success message displays a request reference and explains that the requested time is awaiting approval and no reservation or charge has been made.
4. The owner receives a notification and the request appears in the owner console. The renter receives an acknowledgement. A failed notification is recorded for retry and does not undo the saved request.
5. An approval email includes the owner's note and **Continue booking**. A denial email includes the owner's note and a link to choose a normal pickup time. Both decisions remain visible to the owner with the lead information.
6. A renter following the approval link verifies their email using the existing sign-in flow. The approved schedule and captured contact details are restored. They enter any remaining rental details, review the price, pay, and complete the existing required documents.

The request form accepts a real future time outside the regular window. It uses the same 30-minute increment and branded controls as the regular picker. It must reject invalid dates and nonexistent or ambiguous daylight-saving local times with a clear explanation. It can save a request even if current inventory is unavailable; it labels availability as needing review and never presents that request as bookable. A request cannot be approved while its full rental interval conflicts with inventory.

## Owner experience

Add **Pickup requests** to the owner console with filters for pending, approved, declined, and booked. Each record includes contact details, requested trailer and schedule in Central Time, message, creation date, email delivery state, and decision history. Approved requests whose pickup time has passed show **Expired** while retaining the lead.

The request detail page offers **Approve time** and **Decline time**, each with a required customer-facing note. Approval authorizes only the requested pickup schedule. If the owner suggests a different time in the note, the renter submits a new request for that time; a note alone cannot silently change the agreement.

The existing customer contacts page also includes request-only leads, marked as **Pickup request**. An unverified request cannot overwrite an existing verified profile or change its email preferences. Capturing a lead permits handling that inquiry; it does not automatically subscribe the person to promotions.

## Availability and checkout rules

- Pending or approved requests do not hold a trailer indefinitely. Approval allows the requested pickup time but does not guarantee inventory until normal checkout secures it. This is stated in the approval message.
- Recheck the full rental interval and existing turnaround buffer when approving and again in the normal atomic checkout hold. A conflict during checkout leaves the lead available for follow-up and asks the renter to choose another schedule.
- The exception is loaded server-side and bound to the verified renter email, trailer, pickup date/time, and duration. A client-supplied flag cannot bypass business hours.
- The request ID alone grants no access. The existing verified-email account session must match the request before viewing private request details or continuing an approved exception.
- Approval expires when its pickup time passes. No arbitrary additional approval deadline is introduced.
- One request may link to one checkout/booking at a time. Retried checkout reuses that booking. If an unpaid hold expires or is canceled, the renter can retry the same approved request after availability is checked again. A successful payment permanently links the request to the paid booking and marks it booked.
- Successful payment alone does not bypass identity, insurance, agreement, or any existing reservation requirements. This feature adds owner review only to an outside-hours pickup exception; automatic confirmation of ordinary rentals remains a separate launch task.

## Persistence and delivery

Store requests in an environment-namespaced Firestore collection separate from bookings. Each contains an opaque ID, normalized contact details, requested local and UTC schedule, duration, trailer ID, message, status, timestamps, decision note/actor/time, linked booking ID, and notification state. Keep a decision audit trail.

The public submission endpoint validates and length-limits input, uses a submission key for idempotent retries, rejects cross-origin browser posts, and applies a honeypot plus a durable rate limit. Start with five submissions per ten minutes per hashed network address and three per hour per normalized email; duplicate retries return the existing receipt without sending another notification. Do not expose other leads or raw email addresses in public responses or logs.

Create the request and pending notification records in one transaction. Send after that transaction using stable per-request/per-decision email idempotency keys. Failed sends stay visible with an owner retry action; do not report that email was sent if it failed. A database write failure shows an error, preserves the filled form, and does not claim the lead was saved.

Owner reads and decisions require the existing full admin session. Decisions are transactional and idempotent so double-clicks or two owner tabs cannot send contradictory outcomes. HTML-escape customer and owner text in pages and emails. Preview uses isolated collections and test configuration.

## Implementation boundaries

- Add request validation, data types, repository operations, and a small service for decisions and notifications.
- Extend the schedule UI with the request form, keeping the normal availability picker intact.
- Add request submission, owner decision/retry routes, owner request pages, and authenticated renter continuation.
- Extend customer contacts to include request leads without overwriting profile data.
- Integrate an approved exception into schedule validation and the existing atomic checkout hold. Preserve all ordinary booking validation.
- Link successful payment to the corresponding request in the existing payment completion path, with idempotent recovery on webhook retry.

No new CRM, text-message provider, extra pickup charge, or payment-before-approval flow is part of this change.

## Acceptance checks before release

1. A signed-out renter can submit a valid request and becomes an owner-visible lead without payment or sign-in.
2. Denial, an abandoned checkout, expired approval, and email failure retain the lead and decision details.
3. Approval and denial each deliver the correct customer-facing note; double submissions and decisions do not duplicate records or messages.
4. Approved continuation requires the correct verified email, prefills saved data, and rejects changed schedules or another renter's request.
5. Busy inventory cannot be approved or double-booked; concurrent checkout and expired-hold retries remain safe.
6. Regular pickups remain limited to 8 AM–6 PM; only a matching approved exception can pass outside-hours checkout validation.
7. Preview and production data remain isolated. Tests use mocked email/payment providers and do not send customer messages or create charges.
8. Mobile and keyboard flows support clear validation, full-width date/time controls, and returning to regular booking without losing entered details. Before the request link is clicked, the form is hidden, the five-step booking flow is unchanged, and only the regular booking action uses primary button styling.
